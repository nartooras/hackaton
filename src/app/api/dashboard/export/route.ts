import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO } from 'date-fns'
import ExcelJS from 'exceljs'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'monthly'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let dateFilter = {}
    if (period === 'monthly') {
      const now = new Date()
      dateFilter = {
        date: {
          gte: startOfMonth(now),
          lte: endOfMonth(now),
        },
      }
    } else if (period === 'yearly') {
      const now = new Date()
      dateFilter = {
        date: {
          gte: startOfYear(now),
          lte: endOfYear(now),
        },
      }
    } else if (period === 'custom' && startDate && endDate) {
      dateFilter = {
        date: {
          gte: parseISO(startDate),
          lte: parseISO(endDate),
        },
      }
    }

    // Fetch expenses with related data
    const expenses = await prisma.expense.findMany({
      where: {
        ...dateFilter,
        status: 'APPROVED',
      },
      include: {
        category: true,
        user: true,
      },
      orderBy: {
        date: 'desc',
      },
    })

    // Create a new workbook
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Expense Management System'
    workbook.created = new Date()

    // Add a worksheet for expenses
    const worksheet = workbook.addWorksheet('Expenses')
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'User', key: 'user', width: 20 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Currency', key: 'currency', width: 10 },
    ]

    // Add data rows
    expenses.forEach(expense => {
      worksheet.addRow({
        date: expense.date.toLocaleDateString(),
        description: expense.description,
        category: expense.category.name,
        user: expense.user.name,
        amount: expense.amount,
        currency: expense.currency,
      })
    })

    // Style the header row
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    }

    // Add a summary worksheet
    const summarySheet = workbook.addWorksheet('Summary')
    summarySheet.columns = [
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Total Amount', key: 'total', width: 15 },
      { header: 'Number of Expenses', key: 'count', width: 15 },
    ]

    // Calculate category totals
    const categoryTotals = expenses.reduce((acc, expense) => {
      const category = expense.category.name
      if (!acc[category]) {
        acc[category] = { total: 0, count: 0 }
      }
      acc[category].total += expense.amount
      acc[category].count += 1
      return acc
    }, {} as Record<string, { total: number; count: number }>)

    // Add category summary rows
    Object.entries(categoryTotals).forEach(([category, { total, count }]) => {
      summarySheet.addRow({
        category,
        total,
        count,
      })
    })

    // Style the summary header
    summarySheet.getRow(1).font = { bold: true }
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    }

    // Generate the Excel file
    const buffer = await workbook.xlsx.writeBuffer()

    // Return the file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="expense-report-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Error generating export:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 