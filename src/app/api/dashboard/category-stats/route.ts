import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO } from 'date-fns'

interface CategoryStat {
  categoryId: string
  _sum: {
    amount: number | null
  }
  _count: {
    id: number
  }
}

interface Category {
  id: string
  name: string
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

    // Get total amount for percentage calculation
    const totalAmount = await prisma.expense.aggregate({
      where: {
        ...dateFilter,
        status: 'APPROVED',
      },
      _sum: {
        amount: true,
      },
    })

    const total = totalAmount._sum.amount || 0

    // Get category statistics
    const categoryStats = await prisma.expense.groupBy({
      by: ['categoryId'],
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

    // Get category names
    const categories = await prisma.category.findMany({
      where: {
        id: {
          in: categoryStats.map(stat => stat.categoryId),
        },
      },
      select: {
        id: true,
        name: true,
      },
    })

    const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]))

    const stats = categoryStats.map(stat => ({
      categoryId: stat.categoryId,
      categoryName: categoryMap.get(stat.categoryId) || 'Unknown',
      totalAmount: stat._sum.amount || 0,
      expenseCount: stat._count.id,
      percentage: total > 0 ? ((stat._sum.amount || 0) / total) * 100 : 0,
    }))

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching category stats:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 