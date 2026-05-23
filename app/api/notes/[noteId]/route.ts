import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import { Note } from "@/models/Note";

export const runtime = "nodejs";

async function getUserName(): Promise<string> {
  const user = await currentUser();
  return (
    user?.fullName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress ||
    "Unknown user"
  );
}

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

  // --- Text-only edit ---
  if (typeof body?.text === "string" && body.text.trim()) {
    note.text = body.text.trim();
  }

  // --- Amount adjustment (+/-), logged ---
  if (typeof body?.delta === "number" && body.delta !== 0) {
    const prevAmount = note.amount;
    const newAmount = Math.max(prevAmount + body.delta, 0);
    if (newAmount !== prevAmount) {
      note.amountHistory.push({
        previousAmount: prevAmount,
        newAmount,
        previousPaid: note.amountPaid,
        newPaid: note.amountPaid,
        userId,
        userName: await getUserName(),
        changedAt: new Date(),
      });
      note.amount = newAmount;
      note.markModified("amountHistory");
    }
  }

  // --- Mark as paid: clear outstanding (amount -> 0), logged ---
  if (body?.markPaid === true && note.amount > 0) {
    note.amountHistory.push({
      previousAmount: note.amount,
      newAmount: 0,
      previousPaid: note.amountPaid,
      newPaid: note.amountPaid,
      userId,
      userName: await getUserName(),
      changedAt: new Date(),
    });
    note.amount = 0;
    note.markModified("amountHistory");
  }

  await note.save();

  return NextResponse.json({ ok: true, note });
}

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
