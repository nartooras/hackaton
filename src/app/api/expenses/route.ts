import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ExpenseStatus } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '10')

    const expenses = await prisma.expense.findMany({
      where: {
        status: status?.toUpperCase() as ExpenseStatus,
      },
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