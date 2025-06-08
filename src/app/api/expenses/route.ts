import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ExpenseStatus } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get user with roles
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Check if user is admin or accounting
    const isAdminOrAccounting = user.roles.some(
      (userRole) => userRole.role.name === 'ADMIN' || userRole.role.name === 'ACCOUNTING'
    )

    // Build where clause
    const where = {
      ...(status && { status: status.toUpperCase() as ExpenseStatus }),
      // If not admin or accounting, only show user's own expenses
      ...(!isAdminOrAccounting && { submittedById: user.id }),
    }

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
        attachments: {
          select: {
            filename: true,
            url: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 