import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import { Company } from "@/models/Company";
import { Note } from "@/models/Note";
import { History } from "@/models/History";
import type { FeedItem, FeedNote, FeedEvent } from "@/types";

export const runtime = "nodejs";

interface LeanNote {
  _id: unknown;
  text: string;
  amount: number;
  amountPaid: number;
  status: FeedNote["status"];
  userName: string;
  createdAt: Date;
}

interface LeanHistory {
  _id: unknown;
  message: string;
  userName: string;
  createdAt: Date;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await connectDB();

  const company = await Company.findById(id).lean();
  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const notes = (await Note.find({ companyId: id })
    .sort({ createdAt: -1 })
    .lean()) as unknown as LeanNote[];

  const history = (await History.find({ companyId: id })
    .sort({ createdAt: -1 })
    .lean()) as unknown as LeanHistory[];

  const noteItems: FeedNote[] = notes.map((n) => ({
    kind: "note",
    id: String(n._id),
    text: n.text,
    amount: n.amount,
    amountPaid: n.amountPaid,
    status: n.status,
    userName: n.userName,
    createdAt: new Date(n.createdAt).toISOString(),
  }));

  const eventItems: FeedEvent[] = history.map((h) => ({
    kind: "event",
    id: String(h._id),
    text: h.message,
    userName: h.userName,
    createdAt: new Date(h.createdAt).toISOString(),
  }));

  const feed: FeedItem[] = [...noteItems, ...eventItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return NextResponse.json({ company, feed });
}
