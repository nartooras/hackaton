import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const categories = await prisma.category.findMany({
      include: {
        categoryEmployees: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error("[CATEGORIES_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    const { name, description, employeeIds } = body

    if (!name) {
      return new NextResponse("Name is required", { status: 400 })
    }

    // Start a transaction to create category and its employees
    const category = await prisma.$transaction(async (tx) => {
      // Create the category
      const newCategory = await tx.category.create({
        data: {
          name,
          description,
        },
      })

      // Create employee assignments if any are provided
      if (employeeIds && employeeIds.length > 0) {
        await tx.categoryEmployee.createMany({
          data: employeeIds.map((userId: string) => ({
            categoryId: newCategory.id,
            userId,
          })),
        })
      }

      // Return the created category with its employees
      return tx.category.findUnique({
        where: {
          id: newCategory.id,
        },
        include: {
          categoryEmployees: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          },
        },
      })
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error("[CATEGORIES_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 