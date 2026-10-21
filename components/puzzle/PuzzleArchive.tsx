"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadSaved, loadStreak } from "@/lib/game/storage";
import { THEME_EMOJI, DEFAULT_EMOJI } from "@/lib/puzzle/themeEmoji";

export interface ArchiveDay {
  date: string; // YYYY-MM-DD
  day: number; // day of month
  theme: string;
  themeId: string;
}

export interface ArchiveMonth {
  year: number;
  month: number; // 0-11
  days: (ArchiveDay | null)[]; // null = leading blanks, aligned Monday-first
}

function todayStr() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" });
}

export default function PuzzleArchive({ months }: { months: ArchiveMonth[] }) {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [best, setBest] = useState(0);
  const [total, setTotal] = useState(0);
  const today = todayStr();

  useEffect(() => {
    const saved = loadSaved();
    const set = new Set<string>();
    let n = 0;
    for (const date of Object.keys(saved)) {
      if (saved[date].completed) {
        set.add(date);
        n++;
      }
    }
    setCompleted(set);
    setTotal(n);
    setBest(loadStreak().best);
  }, []);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const weekdayHeaders = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-12">
      {/* hero + stats */}
      <div className="mb-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-2xl font-black text-white shadow-lg">
          T
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Past Puzzles</h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Every daily puzzle, ever. Pick any day to play it.
        </p>
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <div className="rounded-full bg-white/80 px-4 py-1.5 font-bold shadow-sm dark:bg-white/10">
            ✅ {total} solved
          </div>
          <div className="rounded-full bg-white/80 px-4 py-1.5 font-bold shadow-sm dark:bg-white/10">
            🔥 {best} day streak
          </div>
          <div className="rounded-full bg-white/80 px-4 py-1.5 font-bold shadow-sm dark:bg-white/10">
            📅 {months.length} months
          </div>
        </div>
      </div>

      {/* month cards */}
      <div className="space-y-6">
        {months.map((m) => {
          const weeks = Math.ceil(m.days.length / 7);
          return (
            <div
              key={`${m.year}-${m.month}`}
              className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-stone-200/60 dark:bg-stone-800/80 dark:ring-stone-700"
            >
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-bold text-stone-700 dark:text-stone-200">
                  {monthNames[m.month]} {m.year}
                </h2>
                <span className="text-xs font-medium text-stone-400 dark:text-stone-500">
                  {m.days.filter(Boolean).length} puzzles
                </span>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {weekdayHeaders.map((w) => (
                  <div key={w} className="pb-1 text-[10px] font-bold uppercase tracking-wide text-stone-400 dark:text-stone-500">
                    {w}
                  </div>
                ))}
                {Array.from({ length: weeks * 7 }).map((_, i) => {
                  const d = m.days[i];
                  if (!d) return <div key={`blank-${i}`} />;
                  const isToday = d.date === today;
                  const done = completed.has(d.date);
                  return (
                    <Link
                      key={d.date}
                      href={`/?date=${d.date}`}
                      title={`${d.theme}${done ? " · solved" : ""}`}
                      className={`group relative grid aspect-square place-items-center rounded-lg text-sm font-semibold transition-all hover:scale-110 ${
                        isToday
                          ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md"
                          : done
                            ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:ring-emerald-500/40"
                            : "bg-stone-100 text-stone-600 ring-1 ring-stone-200 hover:bg-amber-100 dark:bg-white/5 dark:text-stone-300 dark:ring-white/10 dark:hover:bg-amber-500/20"
                      }`}
                    >
                      <span className="text-sm">{done && !isToday ? "✓" : d.day}</span>
                      <span className="absolute bottom-0.5 text-[11px] opacity-60">
                        {THEME_EMOJI[d.themeId] ?? DEFAULT_EMOJI}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* footer note */}
      <p className="mt-8 text-center text-xs text-stone-400 dark:text-stone-500">
        Every puzzle is generated deterministically from its date — so old puzzles
        always look exactly the way they did when they first ran.
      </p>
    </div>
  );
}