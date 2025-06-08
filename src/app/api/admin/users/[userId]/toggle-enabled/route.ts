import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: { userId: string } }) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.userId },
      data: { enabled: !user.enabled },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error toggling user enabled status:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 