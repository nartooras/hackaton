import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
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
    const { roleIds } = body;

    if (!Array.isArray(roleIds)) {
      return new NextResponse("Invalid role IDs", { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!existingUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Remove existing roles
    await prisma.userRole.deleteMany({
      where: { userId: params.id },
    });

    // Add new roles
    await Promise.all(
      roleIds.map((roleId) =>
        prisma.userRole.create({
          data: {
            userId: params.id,
            roleId,
          },
        })
      )
    );

    // Fetch updated user with roles
    const updatedUser = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[USER_ROLES_PUT]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 