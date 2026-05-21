import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import { Note } from "@/models/Note";

export const runtime = "nodejs";

// EDIT a note (text and/or amount)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ noteId: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { noteId } = await params;
  const body = await req.json().catch(() => null);

  await connectDB();

  const note = await Note.findById(noteId);
  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  if (typeof body?.text === "string" && body.text.trim()) {
    note.text = body.text.trim();
  }
  if (typeof body?.amount === "number" && body.amount >= 0) {
    note.amount = body.amount;
  }
  if (typeof body?.amountPaid === "number" && body.amountPaid >= 0) {
    note.amountPaid = body.amountPaid;
  }
  if (body?.markPaid === true) {
    note.amountPaid = note.amount; // fully paid
  }

  await note.save(); // pre-save hook recomputes status

  return NextResponse.json({ ok: true, note });
}

// DELETE a note
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ noteId: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { noteId } = await params;

  await connectDB();

  const deleted = await Note.findByIdAndDelete(noteId);
  if (!deleted) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
