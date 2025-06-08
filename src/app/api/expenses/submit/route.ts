import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Validation schema for the request body
const SubmitInvoiceSchema = z.object({
  invoiceData: z.object({
    invoice_id: z.object({
      value: z.string(),
      confidentiality: z.number(),
    }),
    company_name: z.object({
      value: z.string(),
      confidentiality: z.number(),
    }),
    total_amount: z.object({
      value: z.string().transform((val) => parseFloat(val)),
      confidentiality: z.number(),
    }),
    total_amount_curr: z.object({
      value: z.string(),
      confidentiality: z.number(),
    }),
  }),
  fileUrl: z.string().refine(
    (url) => {
      // Allow both relative paths starting with / and absolute URLs
      return url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://');
    },
    {
      message: 'File URL must be a relative path starting with / or an absolute URL',
    }
  ),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = SubmitInvoiceSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.format()
        },
        { status: 422 }
      );
    }

    const { invoiceData, fileUrl } = validationResult.data;

    // Check if the category exists
    const category = await prisma.category.findUnique({
      where: { name: 'Other' },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Default category not found' },
        { status: 422 }
      );
    }

    // Create the expense record
    const expense = await prisma.expense.create({
      data: {
        title: `Invoice ${invoiceData.invoice_id.value}`,
        description: `Invoice from ${invoiceData.company_name.value}`,
        amount: invoiceData.total_amount.value,
        currency: invoiceData.total_amount_curr.value,
        status: 'PENDING',
        billingType: 'INTERNAL',
        submittedBy: {
          connect: {
            email: session.user.email,
          },
        },
        category: {
          connect: {
            id: category.id,
          },
        },
        attachments: {
          create: {
            filename: fileUrl.split('/').pop() || 'invoice',
            fileType: 'application/pdf',
            fileSize: 0, // You might want to get this from the file
            url: fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl, // Remove leading slash if present
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Invoice submitted successfully',
      expense,
    });
  } catch (error) {
    console.error('Error submitting invoice:', error);
    
    // Handle Prisma validation errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'A record with this data already exists' },
          { status: 422 }
        );
      }
      
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Referenced record not found' },
          { status: 422 }
        );
      }
    }

    // Handle other errors
    return NextResponse.json(
      { error: 'Error submitting invoice' },
      { status: 500 }
    );
  }
} 