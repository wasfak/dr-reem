import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import * as XLSX from "xlsx";
import { connectDB } from "@/lib/db";
import { Company } from "@/models/Company";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "No file uploaded. Send it as form field 'file'." },
      { status: 400 }
    );
  }

  const isXlsx =
    file.name.endsWith(".xlsx") ||
    file.name.endsWith(".xls") ||
    file.type.includes("spreadsheet");

  if (!isXlsx) {
    return NextResponse.json(
      { error: "Please upload an .xlsx or .xls file." },
      { status: 400 }
    );
  }

  let rows: unknown[][];
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      blankrows: false,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not read that file. Is it a valid Excel sheet?" },
      { status: 400 }
    );
  }

  const names: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    const cell = rows[i]?.[0];
    if (cell == null) continue;
    const name = String(cell).trim();
    if (!name) continue;
    if (i === 0 && /^(name|company|companies|company name)$/i.test(name)) continue;
    names.push(name);
  }

  if (names.length === 0) {
    return NextResponse.json(
      { error: "No company names found in the first column." },
      { status: 400 }
    );
  }

  const seen = new Set<string>();
  const uniqueNames = names.filter((n) => {
    const key = n.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  await connectDB();

  const result = await Company.bulkWrite(
    uniqueNames.map((name) => ({
      updateOne: {
        filter: { name },
        update: { $setOnInsert: { name, notes: "", debts: [] } },
        upsert: true,
      },
    })),
    { collation: { locale: "en", strength: 2 } }
  );

  const inserted = result.upsertedCount ?? 0;
  const skipped = uniqueNames.length - inserted;

  return NextResponse.json({
    ok: true,
    totalRows: names.length,
    uniqueInFile: uniqueNames.length,
    inserted,
    skipped,
  });
}