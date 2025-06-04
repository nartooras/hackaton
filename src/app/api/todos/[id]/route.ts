import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const json = await request.json();
    const updated = await prisma.todo.update({
      where: { id: parseInt(params.id) },
      data: {
        title: json.title,
        description: json.description,
        completed: json.completed,
      },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Error updating todo" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    await prisma.todo.delete({
      where: { id: parseInt(params.id) },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error deleting todo" }, { status: 500 });
  }
}
