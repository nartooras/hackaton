import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { roles } = await request.json()

    // Validate roles array
    if (!Array.isArray(roles)) {
      return new NextResponse('Invalid roles format', { status: 400 })
    }

    // Get the target user
    const targetUser = await prisma.user.findUnique({
      where: { id: params.userId },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    })

    if (!targetUser) {
      return new NextResponse('User not found', { status: 404 })
    }

    // Get all available roles
    const availableRoles = await prisma.role.findMany()
    const validRoles = availableRoles.map(r => r.name)

    // Validate that all requested roles exist
    if (!roles.every(role => validRoles.includes(role))) {
      return new NextResponse('Invalid role specified', { status: 400 })
    }

    // Update user roles
    await prisma.$transaction([
      // Remove all existing roles
      prisma.userRole.deleteMany({
        where: { userId: params.userId }
      }),
      // Add new roles
      ...roles.map(roleName => 
        prisma.userRole.create({
          data: {
            userId: params.userId,
            roleId: availableRoles.find(r => r.name === roleName)?.id || ''
          }
        })
      )
    ])

    return new NextResponse('Roles updated successfully', { status: 200 })
  } catch (error) {
    console.error('Error updating user roles:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 