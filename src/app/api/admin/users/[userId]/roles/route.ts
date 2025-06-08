import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: { userId: string } }
) {
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

    const { roleIds } = await request.json()
    const userId = params.userId

    // Filter out any null or undefined roleIds
    const validRoleIds = roleIds.filter((id: string | null) => id != null)

    // Update user roles
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          deleteMany: {},
          create: validRoleIds.map((roleId: string) => ({
            roleId
          }))
        }
      },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user roles:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 