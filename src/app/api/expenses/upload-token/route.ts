import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate a temporary token
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Store the token in the database
    await prisma.uploadToken.create({
      data: {
        token,
        email: session.user.email,
        expiresAt,
      },
    })

    return NextResponse.json({ token })
  } catch (error) {
    console.error('Error generating upload token:', error)
    return NextResponse.json(
      { error: 'Error generating upload token' },
      { status: 500 }
    )
  }
} 