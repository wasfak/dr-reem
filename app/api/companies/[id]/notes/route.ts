import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import { Company } from "@/models/Company";
import { Note } from "@/models/Note";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);

  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json(
      { error: "Note text is required." },
      { status: 400 },
    );
  }

  const amount =
    typeof body?.amount === "number" && body.amount > 0 ? body.amount : 0;

  await connectDB();

  const company = await Company.findById(id).lean();
  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const user = await currentUser();
  const userName =
    user?.fullName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress ||
    "Unknown user";

  const note = await Note.create({
    companyId: id,
    text,
    amount,
    amountPaid: 0,
    userId,
    userName,
  });

  return NextResponse.json({ ok: true, note }, { status: 201 });
}
