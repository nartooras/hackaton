import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import { ExpenseStatus, Category } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ACCOUNTANT', 'ADMIN'].includes(session.user.role)) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const period = searchParams.get('period') || 'month'
    const month = parseInt(searchParams.get('month') || '1')
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const category = searchParams.get('category') as Category | null
    const status = searchParams.get('status') as ExpenseStatus | null

    // Calculate date range based on period
    let startDate: Date
    let endDate: Date

    if (period === 'month') {
      startDate = startOfMonth(new Date(year, month - 1))
      endDate = endOfMonth(new Date(year, month - 1))
    } else {
      startDate = startOfYear(new Date(year, 0))
      endDate = endOfYear(new Date(year, 0))
    }

    // Build where clause
    const where = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(userId && { submittedById: userId }),
      ...(category && { category: category as Category }),
      ...(status && { status: status as ExpenseStatus }),
    }

    // Get all expenses for export
    const expenses = await prisma.expense.findMany({
      where,
      include: {
        submittedBy: {
          select: {
            name: true,
          },
        },
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Convert to CSV
    const headers = ['Date', 'User', 'Description', 'Category', 'Amount', 'Status']
    const rows = expenses.map(expense => [
      new Date(expense.createdAt).toLocaleDateString(),
      expense.submittedBy.name,
      expense.description,
      expense.category.name,
      expense.amount.toFixed(2),
      expense.status
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="expenses-${new Date().toISOString()}.csv"`
      }
    })
  } catch (error) {
    console.error('Error exporting expenses:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 