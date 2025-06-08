import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import { extractInvoiceDataFromImage, InvoiceData } from '@/app/services/invoiceExtractor';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const uploadDir = join(process.cwd(), 'public', 'uploads', session.user?.email || 'anonymous')
    
    const savedFiles = await Promise.all(
      files.map(async (file) => {
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        
        // Create a unique filename
        const timestamp = Date.now()
        const filename = `${timestamp}-${file.name}`
        const filepath = join(uploadDir, filename)
        
        console.log("Writing file to:", filepath);
        await mkdir(dirname(filepath), { recursive: true });
        // Save the file
        await writeFile(filepath, buffer)

        let extracted: InvoiceData | null = null;
        try {
          extracted = await extractInvoiceDataFromImage(filepath);
        } catch (e) {
          console.error(`Failed to extract entities from ${filename}:`, e);
        }

        return {
          filename,
          originalName: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
          extracted,
          url: `${session.user?.email}/${filename}`
        }
      })
    )

    return NextResponse.json({ 
      message: 'Files uploaded successfully',
      files: savedFiles 
    })
  } catch (error) {
    console.error('Error uploading files:', error)
    return NextResponse.json(
      { error: 'Error uploading files' },
      { status: 500 }
    )
  }
} 