import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface UserRole {
  role: {
    name: string;
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if user has ADMIN or ACCOUNTING role
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email! },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    const hasAccess = user?.roles.some(
      (userRole: UserRole) => 
        userRole.role.name === "ADMIN" || 
        userRole.role.name === "ACCOUNTING"
    );

    if (!hasAccess) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Fetch dashboard statistics
    const [
      totalExpenses,
      pendingExpenses,
      approvedExpenses,
      rejectedExpenses,
      totalAmount,
    ] = await Promise.all([
      prisma.expense.count(),
      prisma.expense.count({ where: { status: "PENDING" } }),
      prisma.expense.count({ where: { status: "APPROVED" } }),
      prisma.expense.count({ where: { status: "REJECTED" } }),
      prisma.expense.aggregate({
        where: { status: "APPROVED" },
        _sum: { amount: true },
      }),
    ]);

    return NextResponse.json({
      totalExpenses,
      pendingExpenses,
      approvedExpenses,
      rejectedExpenses,
      totalAmount: totalAmount._sum.amount || 0,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 