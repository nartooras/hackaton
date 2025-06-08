import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if user has admin role from session
    const isAdmin = session.user.roles?.some(
      (userRole: any) => userRole.role.name === "ADMIN"
    );

    if (!isAdmin) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Fetch the requested user with their roles
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        managedUsers: {
          select: {
            id: true,
            name: true,
            email: true,
            roles: {
              select: {
                role: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("[USER_GET] Error:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if user has admin role from session
    const isAdmin = session.user.roles?.some(
      (userRole: any) => userRole.role.name === "ADMIN"
    );

    if (!isAdmin) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, roleId, managedUserIds } = body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      name,
      email,
    };

    // Only update password if provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...updateData,
        // Update managed users
        managedUsers: {
          set: managedUserIds?.map((userId: string) => ({ id: userId })) || []
        }
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        managedUsers: {
          select: {
            id: true,
            name: true,
            email: true,
            roles: {
              select: {
                role: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Update role if provided
    if (roleId) {
      // Remove existing roles
      await prisma.userRole.deleteMany({
        where: { userId: id },
      });

      // Add new role
      await prisma.userRole.create({
        data: {
          userId: id,
          roleId,
        },
      });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[USER_PUT]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 