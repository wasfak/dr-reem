import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import { Company } from "@/models/Company";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const notes = typeof body?.notes === "string" ? body.notes.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Company name is required." }, { status: 400 });
  }

  await connectDB();

  const existing = await Company.findOne({ name }).collation({
    locale: "en",
    strength: 2,
  });

  if (existing) {
    return NextResponse.json(
      { error: "A company with that name already exists." },
      { status: 409 }
    );
  }

  const company = await Company.create({ name, notes, debts: [] });
  return NextResponse.json({ ok: true, company }, { status: 201 });
}