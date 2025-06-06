import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: {
        token,
      },
    });

    if (!resetToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const now = new Date();
    if (resetToken.expiresAt < now) {
      // Optionally delete expired tokens here or in a cleanup job
      // await prisma.passwordResetToken.delete({ where: { token } });
      return NextResponse.json({ error: 'Token has expired' }, { status: 400 });
    }

    // Token is valid and not expired
    return NextResponse.json({ message: 'Token is valid' });

  } catch (error) {
    console.error('Error validating reset token:', error);
    return NextResponse.json({ error: 'An error occurred during token validation.' }, { status: 500 });
  }
}

// POST handler for password reset
export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 });
    }

    // Find and validate the token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: {
        token,
      },
    });

    if (!resetToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const now = new Date();
    if (resetToken.expiresAt < now) {
      // Delete expired token and return error
      await prisma.passwordResetToken.delete({ where: { token } });
      return NextResponse.json({ error: 'Token has expired' }, { status: 400 });
    }

    // Find the user by the email in the token
    const user = await prisma.user.findUnique({
      where: {
        email: resetToken.email,
      },
    });

    if (!user) {
      // This case should ideally not happen if token email is valid
      await prisma.passwordResetToken.delete({ where: { token } }); // Invalidate token
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password and delete the token
    await prisma.$transaction([
      prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          password: hashedPassword,
        },
      }),
      prisma.passwordResetToken.delete({
        where: {
          token,
        },
      }),
    ]);

    return NextResponse.json({ message: 'Password reset successfully' });

  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json({ error: 'An error occurred during password reset.' }, { status: 500 });
  }
}

// POST handler will be added next for password reset 