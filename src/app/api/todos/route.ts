import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const todos = await prisma.todo.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })
    return NextResponse.json(todos)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching todos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const todo = await prisma.todo.create({
      data: {
        title: json.title,
        description: json.description,
      },
    })
    return NextResponse.json(todo)
  } catch (error) {
    return NextResponse.json({ error: 'Error creating todo' }, { status: 500 })
  }
} 