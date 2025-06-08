import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import { join } from 'path';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const expenseId = params.id;

    // Find the expense and verify ownership and status
    const expense = await prisma.expense.findFirst({
      where: {
        id: expenseId,
        submittedBy: {
          email: session.user.email,
        },
        status: 'PENDING',
      },
      include: {
        attachments: true,
      },
    });

    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found or cannot be deleted' },
        { status: 404 }
      );
    }

    // Delete attachments first
    await prisma.attachment.deleteMany({
      where: {
        expenseId: expenseId,
      },
    });

    // Delete the physical files
    for (const attachment of expense.attachments) {
      try {
        const filePath = join(process.cwd(), 'public', 'uploads', attachment.url);
        await unlink(filePath);
      } catch (error) {
        console.error('Error deleting file:', error);
        // Continue even if file deletion fails
      }
    }

    // Now delete the expense
    await prisma.expense.delete({
      where: {
        id: expenseId,
      },
    });

    return NextResponse.json({
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      { error: 'Error deleting expense' },
      { status: 500 }
    );
  }
} 