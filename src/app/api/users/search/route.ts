import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')

    if (!query) {
      return NextResponse.json([])
    }

    const users = await prisma.user.findMany({
      where: {
        name: {
          contains: query,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      take: 10,
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error searching users:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 