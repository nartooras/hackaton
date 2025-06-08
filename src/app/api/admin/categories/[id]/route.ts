import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const category = await prisma.category.findUnique({
      where: {
        id: params.id,
      },
      include: {
        categoryEmployees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!category) {
      return new NextResponse("Category not found", { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("[CATEGORY_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { name, description, employeeIds } = body;

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    // Start a transaction to create category and its employees
    const category = await prisma.$transaction(async (tx) => {
      // Create the category
      const newCategory = await tx.category.create({
        data: {
          name,
          description,
        },
      });

      // Create employee assignments if any are provided
      if (employeeIds && employeeIds.length > 0) {
        await tx.categoryEmployee.createMany({
          data: employeeIds.map((userId: string) => ({
            categoryId: newCategory.id,
            userId,
          })),
        });
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
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("[CATEGORY_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { name, description, employeeIds } = body;

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    // Start a transaction to update category and its employees
    const category = await prisma.$transaction(async (tx) => {
      // Update the category
      const updatedCategory = await tx.category.update({
        where: {
          id: params.id,
        },
        data: {
          name,
          description,
        },
      });

      // Delete existing employee assignments
      await tx.categoryEmployee.deleteMany({
        where: {
          categoryId: params.id,
        },
      });

      // Create new employee assignments if any are provided
      if (employeeIds && employeeIds.length > 0) {
        await tx.categoryEmployee.createMany({
          data: employeeIds.map((userId: string) => ({
            categoryId: params.id,
            userId,
          })),
        });
      }

      // Return the updated category with its employees
      return tx.category.findUnique({
        where: {
          id: params.id,
        },
        include: {
          categoryEmployees: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("[CATEGORY_PUT]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Delete category employees first
    await prisma.categoryEmployee.deleteMany({
      where: {
        categoryId: params.id,
      },
    });

    // Then delete the category
    await prisma.category.delete({
      where: {
        id: params.id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[CATEGORY_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 