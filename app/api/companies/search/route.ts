import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import { Company } from "@/models/Company";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const name = req.nextUrl.searchParams.get("name")?.trim() ?? "";
  if (!name) {
    return NextResponse.json({ companies: [] });
  }

  await connectDB();

  // Exact name match, case-insensitive (collation matches the schema index).
  const companies = await Company.find({ name })
    .collation({ locale: "en", strength: 2 })
    .lean({ virtuals: true });

  return NextResponse.json({ companies });
}
