import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO } from 'date-fns'

interface UserStat {
  userId: string
  _sum: {
    amount: number | null
  }
  _count: {
    id: number
  }
}

interface CategoryStat {
  categoryId: string
  categoryName: string
  amount: number
}

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

    // Get user statistics
    const userStats = await prisma.expense.groupBy({
      by: ['submittedById'],
      where: {
        ...dateFilter,
        status: 'APPROVED',
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    })

    // Get user names
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userStats.map(stat => stat.submittedById),
        },
      },
      select: {
        id: true,
        name: true,
      },
    })

    const userMap = new Map(users.map(user => [user.id, user.name]))

    // Get category statistics for each user
    const stats = await Promise.all(
      userStats.map(async (stat) => {
        const categoryStats = await prisma.expense.groupBy({
          by: ['categoryId'],
          where: {
            ...dateFilter,
            submittedById: stat.submittedById,
            status: 'APPROVED',
          },
          _sum: {
            amount: true,
          },
        })

        const categories = await prisma.category.findMany({
          where: {
            id: {
              in: categoryStats.map(cat => cat.categoryId),
            },
          },
          select: {
            id: true,
            name: true,
          },
        })

        const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]))

        const categoryStatsList: CategoryStat[] = categoryStats.map(cat => ({
          categoryId: cat.categoryId,
          categoryName: categoryMap.get(cat.categoryId) || 'Unknown',
          amount: cat._sum.amount || 0,
        }))

        return {
          userId: stat.submittedById,
          userName: userMap.get(stat.submittedById) || 'Unknown',
          totalAmount: stat._sum.amount || 0,
          expenseCount: stat._count.id,
          averageAmount: stat._count.id > 0 ? (stat._sum.amount || 0) / stat._count.id : 0,
          categories: categoryStatsList,
        }
      })
    )

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 