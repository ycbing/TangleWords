"use client";

// localStorage helpers for puzzle progress + streaks
import type { Puzzle } from "@/lib/puzzle/types";

export interface SavedState {
  [date: string]: {
    board: (number | null)[][]; // tile id per grid cell
    tray: { id: number; letter: string; rotation: number }[];
    revealedIds: number[];
    completed: boolean;
    seconds: number;
    moves: number;
    revealsLeft: number;
    rotations?: Record<number, number>; // tile id -> rotation (tracks tiles on the board)
  };
}

const KEY = "tangle-words-state-v1";
const STREAK_KEY = "tangle-words-streak-v1";
const SETTINGS_KEY = "tangle-words-settings-v1";

export function loadSaved(): SavedState {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedState) : {};
  } catch {
    return {};
  }
}

export function saveSaved(state: SavedState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore quota errors */
  }
}

export function loadSettings(): { dark: boolean; sound: boolean } {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : { dark: false, sound: true };
  } catch {
    return { dark: false, sound: true };
  }
}

export function saveSettings(s: { dark: boolean; sound: boolean }) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {}
}

export interface StreakInfo {
  current: number;
  best: number;
  lastCompleted: string | null; // YYYY-MM-DD
  history: string[]; // completed dates
}

export function loadStreak(): StreakInfo {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    return raw
      ? JSON.parse(raw)
      : { current: 0, best: 0, lastCompleted: null, history: [] };
  } catch {
    return { current: 0, best: 0, lastCompleted: null, history: [] };
  }
}

export function saveStreak(s: StreakInfo) {
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(s));
  } catch {}
}

/** Record a completion for `date`. Returns updated streak. */
export function recordCompletion(date: string, now = new Date()): StreakInfo {
  const s = loadStreak();
  if (s.history.includes(date)) return s; // already counted

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" });

  const newHistory = [...s.history, date].sort();
  let current = s.lastCompleted === yStr ? s.current + 1 : 1;
  // if the same date as lastCompleted (shouldn't happen), keep
  if (s.lastCompleted === date) current = s.current;

  const next: StreakInfo = {
    current,
    best: Math.max(s.best, current),
    lastCompleted: date,
    history: newHistory,
  };
  saveStreak(next);
  return next;
}

/** fresh board state for a puzzle (empty) */
export function emptyBoard(rows: number, cols: number): (number | null)[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(null));
}

/** initial tray from puzzle tiles */
export function initialTray(p: Puzzle) {
  return p.tiles.map((t) => ({
    id: t.id,
    letter: t.letter,
    rotation: t.rotation,
  }));
}