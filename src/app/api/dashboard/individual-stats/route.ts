import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO } from 'date-fns'

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
        expenseDate: {
          gte: startOfMonth(now),
          lte: endOfMonth(now),
        },
      }
    } else if (period === 'yearly') {
      const now = new Date()
      dateFilter = {
        expenseDate: {
          gte: startOfYear(now),
          lte: endOfYear(now),
        },
      }
    } else if (period === 'custom' && startDate && endDate) {
      dateFilter = {
        expenseDate: {
          gte: parseISO(startDate),
          lte: parseISO(endDate),
        },
      }
    }

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
      },
    })

    // Get expense statistics for each user
    const userStats = await Promise.all(
      users.map(async (user) => {
        const expenses = await prisma.expense.findMany({
          where: {
            ...dateFilter,
            submittedById: user.id,
            status: 'APPROVED',
          },
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })

        const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0)
        const categoryBreakdown = expenses.reduce((acc, expense) => {
          const category = expense.category.name
          acc[category] = (acc[category] || 0) + expense.amount
          return acc
        }, {} as Record<string, number>)

        return {
          userId: user.id,
          userName: user.name,
          totalAmount,
          expenseCount: expenses.length,
          averageAmount: expenses.length > 0 ? totalAmount / expenses.length : 0,
          categoryBreakdown,
        }
      })
    )

    return NextResponse.json(userStats)
  } catch (error) {
    console.error('Error fetching individual stats:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 