import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const now = new Date()
    const currentMonthStart = startOfMonth(now)
    const currentMonthEnd = endOfMonth(now)
    const lastMonthStart = startOfMonth(subMonths(now, 1))
    const lastMonthEnd = endOfMonth(subMonths(now, 1))

    // Get current month's approved expenses
    const currentMonthExpenses = await prisma.expense.aggregate({
      where: {
        status: 'APPROVED',
        createdAt: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
      },
      _sum: {
        amount: true,
      },
    })

    // Get last month's approved expenses
    const lastMonthExpenses = await prisma.expense.aggregate({
      where: {
        status: 'APPROVED',
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
      _sum: {
        amount: true,
      },
    })

    const currentMonthTotal = currentMonthExpenses._sum.amount || 0
    const lastMonthTotal = lastMonthExpenses._sum.amount || 0
    const difference = currentMonthTotal - lastMonthTotal

    return NextResponse.json({
      currentMonth: currentMonthTotal,
      lastMonth: lastMonthTotal,
      difference,
    })
  } catch (error) {
    console.error('Error fetching monthly stats:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 