import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Check if user is admin
    const isAdmin = session.user.roles?.map((role: any) => role.role.name).some((roleName: string) => roleName.toLowerCase() === 'admin')
    if (!isAdmin) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const roles = await prisma.role.findMany({
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(roles)
  } catch (error) {
    console.error('Error fetching roles:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 