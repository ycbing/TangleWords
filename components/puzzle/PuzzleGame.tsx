"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Puzzle } from "@/lib/puzzle/types";
import {
  emptyBoard,
  initialTray,
  loadSaved,
  loadSettings,
  loadStreak,
  recordCompletion,
  saveSaved,
  saveSettings,
  saveStreak,
  type StreakInfo,
} from "@/lib/game/storage";
import GameBoard from "./GameBoard";
import TileTray from "./TileTray";
import CluePanel from "./CluePanel";
import ShareModal from "./ShareModal";
import TutorialModal from "./TutorialModal";

interface TrayTile {
  id: number;
  letter: string;
  rotation: number;
}

const REVEALS = 3;

/** add days to a YYYY-MM-DD string (UTC-safe, no timezone drift) */
function addDays(dateStr: string, delta: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

function todayStr() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" });
}

export default function PuzzleGame({ puzzle }: { puzzle: Puzzle }) {
  const rows = puzzle.rows;
  const cols = puzzle.cols;
  const date = puzzle.date;

  // board: tileId per cell
  const [board, setBoard] = useState<(number | null)[][]>(() => {
    const saved = loadSaved()[date];
    if (saved) return saved.board;
    return emptyBoard(rows, cols);
  });
  const [tray, setTray] = useState<TrayTile[]>(() => {
    const saved = loadSaved()[date];
    if (saved) return saved.tray as TrayTile[];
    return initialTray(puzzle);
  });
  const [revealedIds, setRevealedIds] = useState<number[]>(() => {
    const saved = loadSaved()[date];
    return saved ? saved.revealedIds : [];
  });
  const [revealsLeft, setRevealsLeft] = useState<number>(() => {
    const saved = loadSaved()[date];
    return saved ? saved.revealsLeft : REVEALS;
  });
  const [moves, setMoves] = useState<number>(() => {
    const saved = loadSaved()[date];
    return saved ? saved.moves : 0;
  });
  const [completed, setCompleted] = useState<boolean>(() => {
    const saved = loadSaved()[date];
    return saved ? saved.completed : false;
  });
  const [seconds, setSeconds] = useState<number>(() => {
    const saved = loadSaved()[date];
    return saved ? saved.seconds : 0;
  });

  const [selected, setSelected] = useState<number | null>(null);
  const [activeClue, setActiveClue] = useState<number | null>(null);
  const [shake, setShake] = useState<{ key: number; tile: TrayTile } | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [dismissed, setDismissed] = useState(false); // completion modal dismissed
  const [streak, setStreak] = useState<StreakInfo>(() => loadStreak());
  const [settings, setSettings] = useState(() => loadSettings());

  // rotation lives with the tile itself, whether in tray or on the board.
  // (old saves only stored rotation inside tray entries)
  const [rotations, setRotations] = useState<Record<number, number>>(() => {
    const map: Record<number, number> = {};
    for (const t of puzzle.tiles) map[t.id] = t.rotation;
    const saved = loadSaved()[date];
    if (saved) {
      for (const t of saved.tray) map[t.id] = t.rotation;
      if (saved.rotations) Object.assign(map, saved.rotations);
    }
    return map;
  });
  const rotationsRef = useRef(rotations);
  rotationsRef.current = rotations;

  // timer
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (completed) return;
    const start = Date.now() - seconds * 1000;
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [completed, seconds]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.dark);
    saveSettings(settings);
  }, [settings]);

  const persist = useCallback(
    (b: (number | null)[][], t: TrayTile[], r: number[], c: boolean, s: number, m: number, rl: number) => {
      const all = loadSaved();
      all[date] = { board: b, tray: t, revealedIds: r, completed: c, seconds: s, moves: m, revealsLeft: rl, rotations: rotationsRef.current };
      saveSaved(all);
    },
    [date]
  );

  // keep the rotation map persisted even when no board change happens
  useEffect(() => {
    const all = loadSaved();
    if (all[date]) {
      all[date].rotations = rotations;
      saveSaved(all);
    }
  }, [rotations, date]);

  // ---------- helpers ----------
  const tileById = useCallback(
    (id: number): TrayTile | undefined => tray.find((t) => t.id === id),
    [tray]
  );

  /** letter expected at board cell */
  const expectedLetter = useCallback(
    (r: number, c: number): string | null => puzzle.grid[r]?.[c]?.letter ?? null,
    [puzzle]
  );

  const isCorrectBoard = useCallback(
    (b: (number | null)[][]) => {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = puzzle.grid[r][c];
          if (!cell) continue;
          // tiles are only ever placed when their letter matches the cell
          // (wrong placements get rejected), so non-null === correct
          if (b[r][c] === null) return false;
        }
      }
      return true;
    },
    [puzzle, rows, cols]
  );

  // ---------- actions ----------
  const applyState = useCallback(
    (b: (number | null)[][], t: TrayTile[], r: number[], m: number, rl: number, s: number) => {
      setBoard(b);
      setTray(t);
      setRevealedIds(r);
      setMoves(m);
      setRevealsLeft(rl);
      setSeconds(s);
      const done = isCorrectBoard(b);
      persist(b, t, r, done, s, m, rl);
      if (done && !completed) {
        setCompleted(true);
        setDismissed(false);
        const st = recordCompletion(date);
        setStreak(st);
        setElapsed(s);
        setTimeout(() => setShowShare(true), 1200);
      }
    },
    [isCorrectBoard, persist, completed, date, elapsed]
  );

  /** place tile into a board cell */
  const placeTile = useCallback(
    (tileId: number, r: number, c: number) => {
      const cell = puzzle.grid[r]?.[c];
      if (!cell) return;
      const current = board[r][c];
      if (current === tileId) return;

      const tile = tray.find((t) => t.id === tileId);
      if (!tile) return;

      const nextBoard = board.map((row) => [...row]);
      const nextTray = [...tray];

      // if cell occupied, return occupant to tray
      if (current !== null) {
        const occ = tray.find((t) => t.id === current);
        if (occ) {
          nextTray.push({ ...occ });
          nextBoard[r][c] = null;
        }
      }
      // remove tile from tray
      const ti = nextTray.findIndex((t) => t.id === tileId);
      if (ti >= 0) nextTray.splice(ti, 1);
      nextBoard[r][c] = tileId;

      const correct = tile.letter === cell.letter;
      if (!correct) {
        // wrong: shake + bounce back
        setShake({ key: Date.now(), tile: { ...tile } });
        return; // keep board unchanged
      }
      setSelected(null);
      applyState(nextBoard, nextTray, revealedIds, moves + 1, revealsLeft, seconds);
    },
    [board, tray, puzzle, revealedIds, moves, revealsLeft, seconds, applyState]
  );

  /** remove placed tile back to tray */
  const pickupTile = useCallback(
    (r: number, c: number) => {
      const tileId = board[r][c];
      if (tileId === null) return;
      const tile = puzzle.tiles.find((t) => t.id === tileId);
      if (!tile) return;
      const nextBoard = board.map((row) => [...row]);
      nextBoard[r][c] = null;
      const nextTray = [
        ...tray,
        { id: tile.id, letter: tile.letter, rotation: rotations[tileId] ?? 0 },
      ];
      applyState(nextBoard, nextTray, revealedIds, moves + 1, revealsLeft, seconds);
    },
    [board, tray, puzzle, rotations, revealedIds, moves, revealsLeft, seconds, applyState]
  );

  /** rotate a tray tile (visual) */
  const rotateTile = useCallback(
    (tileId: number) => {
      setTray((prev) =>
        prev.map((t) => (t.id === tileId ? { ...t, rotation: (t.rotation + 90) % 360 } : t))
      );
      setRotations((prev) => ({ ...prev, [tileId]: ((prev[tileId] ?? 0) + 90) % 360 }));
    },
    []
  );

  /** reveal a whole word: auto-place correct tiles */
  const revealWord = useCallback(
    (clueId: number) => {
      if (revealsLeft <= 0 || completed) return;
      const clue = puzzle.clues.find((c) => c.id === clueId);
      if (!clue || revealedIds.includes(clueId)) return;

      const nextBoard = board.map((row) => [...row]);
      const nextTray = [...tray];
      const dr = clue.direction === "across" ? 0 : 1;
      const dc = clue.direction === "across" ? 1 : 0;

      for (let i = 0; i < clue.word.length; i++) {
        const r = clue.row + dr * i;
        const c = clue.col + dc * i;
        const letter = clue.word[i];
        // return any existing tile in this cell to tray
        const cur = nextBoard[r][c];
        if (cur !== null) {
          const occ = tray.find((t) => t.id === cur);
          if (occ) nextTray.push({ ...occ });
          nextBoard[r][c] = null;
        }
        // find matching tile in tray (prefer unrotated); else create revealed tile
        let ti = nextTray.findIndex((t) => t.letter === letter);
        if (ti >= 0) {
          const t = nextTray.splice(ti, 1)[0];
          nextBoard[r][c] = t.id;
        } else {
          // tile not in tray (shouldn't happen unless already used elsewhere)
          // leave empty; skipped
        }
      }
      const nextRevealed = [...revealedIds, clueId];
      applyState(nextBoard, nextTray, nextRevealed, moves + 1, revealsLeft - 1, seconds);
    },
    [revealsLeft, completed, puzzle, revealedIds, board, tray, moves, seconds, applyState]
  );

  /** shuffle tray order */
  const shuffleTray = useCallback(() => {
    setTray((prev) => {
      const a = [...prev];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    });
  }, []);

  const handleReset = useCallback(() => {
    setBoard(emptyBoard(rows, cols));
    setTray(initialTray(puzzle));
    setRotations(() => {
      const map: Record<number, number> = {};
      for (const t of puzzle.tiles) map[t.id] = t.rotation;
      return map;
    });
    setRevealedIds([]);
    setRevealsLeft(REVEALS);
    setMoves(0);
    setSeconds(0);
    setElapsed(0);
    setCompleted(false);
    setSelected(null);
    const all = loadSaved();
    delete all[date];
    saveSaved(all);
  }, [rows, cols, puzzle, date]);

  const selectedTile = selected !== null ? tileById(selected) : undefined;
  const isToday = date === todayStr();
  const prevDate = addDays(date, -1);
  const nextDate = addDays(date, 1);
  const solvedCount = useMemo(() => {
    let n = 0;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const cell = puzzle.grid[r][c];
        if (cell && board[r][c] !== null) n++;
      }
    return n;
  }, [board, puzzle, rows, cols]);
  const totalCells = useMemo(() => puzzle.grid.flat().filter(Boolean).length, [puzzle]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-amber-50 to-orange-100 text-stone-800 dark:from-stone-900 dark:to-stone-950 dark:text-stone-100">
      {/* top bar */}
      <header className="flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-sm text-white shadow">
            T
          </span>
          <span className="text-lg">Tangle Words</span>
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <Link
            href="/puzzles"
            className="grid h-9 w-9 place-items-center rounded-full bg-white/70 hover:bg-white dark:bg-white/10 dark:hover:bg-white/20"
            title="Past puzzles"
          >
            📚
          </Link>
          <div className="rounded-full bg-white/70 px-3 py-1 font-semibold dark:bg-white/10" title="Daily streak">
            🔥 {streak.current}
          </div>
          <div className="rounded-full bg-white/70 px-3 py-1 font-mono tabular-nums dark:bg-white/10" title="Time">
            ⏱ {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
          </div>
          <button
            onClick={() => setSettings((s) => ({ ...s, dark: !s.dark }))}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/70 hover:bg-white dark:bg-white/10 dark:hover:bg-white/20"
            title="Toggle theme"
          >
            {settings.dark ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 pb-8 lg:flex-row lg:items-start">
        {/* left: board */}
        <div className="flex-1">
          <div className="mb-3 flex items-center justify-center gap-3 text-center">
            <Link
              href={`/?date=${prevDate}`}
              className="grid h-8 w-8 place-items-center rounded-full bg-white/80 text-stone-600 shadow-sm hover:bg-white dark:bg-white/10 dark:text-stone-300 dark:hover:bg-white/20"
              title="Previous puzzle"
            >
              ‹
            </Link>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">
                {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
                {isToday && (
                  <span className="ml-2 rounded-full bg-amber-500 px-2 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide text-white">
                    Today
                  </span>
                )}
              </h1>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                Theme: {puzzle.theme}
              </p>
            </div>
            {!isToday && (
              <Link
                href={`/?date=${nextDate}`}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/80 text-stone-600 shadow-sm hover:bg-white dark:bg-white/10 dark:text-stone-300 dark:hover:bg-white/20"
                title="Next puzzle"
              >
                ›
              </Link>
            )}
            {isToday && <div className="h-8 w-8" />}
          </div>

          <GameBoard
            puzzle={puzzle}
            board={board}
            rotations={rotations}
            revealedIds={revealedIds}
            activeClue={activeClue}
            shake={shake}
            onCellClick={(r, c) => {
              if (board[r][c] !== null && selected === null) {
                // click a placed tile: pick up
                pickupTile(r, c);
              } else if (selected !== null) {
                placeTile(selected, r, c);
              }
            }}
          />

          <TileTray
            tiles={tray}
            selectedId={selected}
            onSelect={(id) => setSelected((s) => (s === id ? null : id))}
            onRotate={rotateTile}
            onShuffle={shuffleTray}
            onReset={handleReset}
            onDrop={(tileId, r, c) => placeTile(tileId, r, c)}
          />

          {/* progress */}
          <div className="mt-3 text-center text-xs font-medium text-stone-500 dark:text-stone-400">
            {solvedCount}/{totalCells} letters placed · {revealsLeft} reveals left
          </div>
        </div>

        {/* right: clues */}
        <CluePanel
          puzzle={puzzle}
          board={board}
          revealedIds={revealedIds}
          activeClue={activeClue}
          revealsLeft={revealsLeft}
          onSelectClue={(id) => setActiveClue((a) => (a === id ? null : id))}
          onReveal={revealWord}
        />
      </main>

      {completed && !dismissed && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="pointer-events-auto mx-4 w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl dark:bg-stone-800">
            <div className="text-5xl">🎉</div>
            <h2 className="mt-2 text-2xl font-extrabold">Puzzle Complete!</h2>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              {puzzle.theme} · {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")} · {moves} moves
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-1.5 font-bold text-orange-700 dark:bg-orange-500/20 dark:text-orange-300">
              🔥 Streak: {streak.current} day{streak.current > 1 ? "s" : ""}
            </div>
            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={() => {
                  setDismissed(true);
                  setShowShare(true);
                }}
                className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 font-bold text-white shadow hover:opacity-90"
              >
                Share your result
              </button>
              <Link
                href={`/?date=${prevDate}`}
                className="rounded-xl bg-stone-100 py-2.5 text-center font-semibold text-stone-600 hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-300"
              >
                Play another puzzle
              </Link>
              <button
                onClick={() => setDismissed(true)}
                className="rounded-xl bg-stone-100 py-2.5 font-semibold text-stone-600 hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-300"
              >
                Keep playing
              </button>
            </div>
          </div>
        </div>
      )}

      {showShare && (
        <ShareModal
          puzzle={puzzle}
          board={board}
          seconds={elapsed}
          moves={moves}
          streak={streak.current}
          onClose={() => setShowShare(false)}
        />
      )}

      <TutorialModal />
    </div>
  );
}