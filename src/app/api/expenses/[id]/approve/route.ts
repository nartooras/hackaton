import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const expense = await prisma.expense.update({
      where: {
        id: params.id,
      },
      data: {
        status: 'APPROVED',
      },
    })

    return NextResponse.json(expense)
  } catch (error) {
    console.error('Error approving expense:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 