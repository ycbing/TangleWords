import Link from "next/link";
import { generatePuzzle } from "@/lib/puzzle/generator";
import PuzzleArchive, { type ArchiveMonth } from "@/components/puzzle/PuzzleArchive";

export const revalidate = 3600; // refresh once an hour

function todayStr() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" });
}

const ARCHIVE_DAYS = 365; // one full year of daily puzzles

export default function ArchivePage() {
  const today = todayStr();

  // month cards keyed by YYYY-MM, oldest first
  const byMonth = new Map<string, ArchiveMonth>();
  for (let back = ARCHIVE_DAYS - 1; back >= 0; back--) {
    const d = new Date(today + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() - back);
    const key = d.toISOString().slice(0, 7);
    if (!byMonth.has(key)) {
      const m: ArchiveMonth = {
        year: d.getUTCFullYear(),
        month: d.getUTCMonth(),
        days: [],
      };
      // pad Monday-first
      const lead = (new Date(Date.UTC(m.year, m.month, 1)).getUTCDay() + 6) % 7;
      for (let i = 0; i < lead; i++) m.days.push(null);
      byMonth.set(key, m);
    }
  }

  // fill day cells in chronological order
  for (let back = ARCHIVE_DAYS - 1; back >= 0; back--) {
    const d = new Date(today + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() - back);
    const date = d.toISOString().slice(0, 10);
    const key = date.slice(0, 7);
    const m = byMonth.get(key)!;
    const puzzle = generatePuzzle(date);
    m.days.push({
      date,
      day: d.getUTCDate(),
      theme: puzzle.theme,
      themeId: puzzle.themeId,
    });
  }

  const months = [...byMonth.values()];

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-amber-50 to-orange-100 text-stone-800 dark:from-stone-900 dark:to-stone-950 dark:text-stone-100">
      <header className="flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-sm text-white shadow">
            T
          </span>
          <span className="text-lg">Tangle Words</span>
        </Link>
        <Link
          href="/"
          className="rounded-full bg-white/80 px-4 py-1.5 text-sm font-semibold text-stone-600 shadow-sm hover:bg-white dark:bg-white/10 dark:text-stone-300"
        >
          ← Today&apos;s puzzle
        </Link>
      </header>
      <PuzzleArchive months={months} />
    </main>
  );
}