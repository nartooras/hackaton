import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    // Return a generic success message to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message:
          "If an account with that email exists, a password reset link will be sent.",
      });
    }

    // Generate a unique token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600 * 1000); // Token expires in 1 hour

    // Invalidate any existing tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { email: email.toLowerCase() },
    });

    // Store the new token
    await prisma.passwordResetToken.create({
      data: {
        email: email.toLowerCase(),
        token,
        expiresAt,
      },
    });

    // Configure Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: parseInt(process.env.EMAIL_SERVER_PORT || "587", 10), // Default to 587 if not set
      secure: process.env.EMAIL_SERVER_PORT === "465", // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    // Construct reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

    // Send the email
    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@yourdomain.com", // Sender address
      to: email.toLowerCase(), // List of recipients
      subject: "Password Reset Request", // Subject line
      text: `You requested a password reset. Click the link to reset your password: ${resetUrl}\n\nIf you did not request a password reset, please ignore this email.`, // Plain text body
      html: `<p>You requested a password reset.</p><p>Click the link to reset your password: <a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request a password reset, please ignore this email.</p>`, // HTML body
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      message:
        "If an account with that email exists, a password reset link will be sent.",
    });
  } catch (error) {
    console.error("Error requesting password reset:", error);
    return NextResponse.json({ error: "An error occurred." }, { status: 500 });
  }
}
