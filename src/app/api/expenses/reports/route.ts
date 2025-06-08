import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import { ExpenseStatus, Category } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Check if user has admin or accountant role
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email! },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    })

    const isAdminOrAccountant = user?.roles.some(
      (userRole) => userRole.role.name === 'ADMIN' || userRole.role.name === 'ACCOUNTANT'
    )

    if (!isAdminOrAccountant) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('perPage') || '10')
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

    // Get total count
    const total = await prisma.expense.count({ where })

    // Get paginated expenses
    const expenses = await prisma.expense.findMany({
      where,
      include: {
        submittedBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * perPage,
      take: perPage,
    })

    return NextResponse.json({
      expenses,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    })
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 