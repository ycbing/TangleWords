import { NextRequest, NextResponse } from "next/server";
import { generatePuzzle } from "@/lib/puzzle/generator";

export async function GET(req: NextRequest) {
  const date =
    req.nextUrl.searchParams.get("date") ??
    new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" });

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "invalid date" }, { status: 400 });
  }

  const themeId = req.nextUrl.searchParams.get("theme") ?? undefined;
  const puzzle = generatePuzzle(date, themeId);

  return NextResponse.json(puzzle, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}