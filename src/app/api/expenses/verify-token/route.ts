import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const uploadToken = await prisma.uploadToken.findUnique({
      where: { token },
    })

    if (!uploadToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    if (uploadToken.expiresAt < new Date()) {
      // Delete expired token
      await prisma.uploadToken.delete({
        where: { id: uploadToken.id },
      })
      return NextResponse.json({ error: 'Token expired' }, { status: 401 })
    }

    return NextResponse.json({ email: uploadToken.email })
  } catch (error) {
    console.error('Error verifying token:', error)
    return NextResponse.json(
      { error: 'Error verifying token' },
      { status: 500 }
    )
  }
} 