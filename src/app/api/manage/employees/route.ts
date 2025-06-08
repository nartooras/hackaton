import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the current user with their roles
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!currentUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Check if user has any employees assigned
    const hasEmployees = await prisma.user.findFirst({
      where: {
        managerId: currentUser.id,
      },
    });

    if (!hasEmployees) {
      return new NextResponse("No employees assigned", { status: 403 });
    }

    // Fetch all employees assigned to this user
    const employees = await prisma.user.findMany({
      where: {
        managerId: currentUser.id,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error("[EMPLOYEES_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 