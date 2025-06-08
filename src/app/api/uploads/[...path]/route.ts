import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const path = params.path;
    if (!path || path.length === 0) {
      return NextResponse.json({ error: 'No file specified' }, { status: 400 });
    }

    // Only allow access to files in the user's own upload directory
    if (!path[0].startsWith(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const filePath = join(process.cwd(), 'public', 'uploads', ...path);
    
    try {
      const file = await readFile(filePath);
      const contentType = getContentType(filePath);
      
      return new NextResponse(file, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': 'inline',
        },
      });
    } catch (error) {
      console.error('Error reading file:', error);
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json(
      { error: 'Error serving file' },
      { status: 500 }
    );
  }
}

function getContentType(filePath: string): string {
  const extension = filePath.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf':
      return 'application/pdf';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    default:
      return 'application/octet-stream';
  }
} 