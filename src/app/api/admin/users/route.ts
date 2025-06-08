import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Fetch all users with their roles
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        roles: {
          select: {
            role: {
              select: {
                name: true,
                description: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 