import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import { Company } from "@/models/Company";

export const runtime = "nodejs";

// Escape regex metacharacters so user input can't break or inject a pattern.
function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = req.nextUrl.searchParams.get("name")?.trim() ?? "";
  if (!raw) {
    return NextResponse.json({ companies: [] });
  }

  try {
    await connectDB();

    let companies;

    if (raw.includes("*")) {
      // Smart search: split on *, keep the letters, match them in order
      // with anything allowed in between.
      const letters = raw
        .split("*")
        .map((s) => s.trim())
        .filter(Boolean)
        .map(escapeRegex);

      if (letters.length === 0) {
        return NextResponse.json({ companies: [] });
      }

      const pattern = letters.join(".*");
      const regex = new RegExp(pattern, "i");

      companies = await Company.find({ name: regex })
        .collation({ locale: "en", strength: 2 })
        .limit(50)
        .lean();
    } else {
      // Plain text: exact name match (case-insensitive).
      companies = await Company.find({ name: raw })
        .collation({ locale: "en", strength: 2 })
        .lean();
    }

    return NextResponse.json({ companies });
  } catch (err) {
    console.error("Search route error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
