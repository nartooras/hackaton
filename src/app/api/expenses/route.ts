import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const expenses = await prisma.expense.findMany({
      where: {
        submittedBy: {
          email: session.user.email,
        },
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
        attachments: {
          select: {
            filename: true,
            url: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      expenses: expenses.map(expense => ({
        ...expense,
        submittedAt: expense.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: 'Error fetching expenses' },
      { status: 500 }
    );
  }
} 