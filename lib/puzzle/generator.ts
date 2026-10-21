// Crossword grid generator (greedy, pattern-indexed)
// Produces a Tiled-Words-style dense grid with black cells.
import { THEMES, seededRandom, shuffle } from "./words";
import { Puzzle, GridCell, Clue, Tile, Direction } from "./types";
import { loadWords } from "./words";
import { FILL_WORDS } from "./fill-words";

const ROWS = 6;
const COLS = 8;
const TARGET_WORDS = 11; // ~6 across + 5 down like the original

// module-level cached index (words never change at runtime)
let cachedIndex: PatternIndex | null = null;
function getIndex(): PatternIndex {
  if (cachedIndex) return cachedIndex;
  // index = fill words + all theme words (so themed matches work)
  const fill = Object.keys(FILL_WORDS);
  const themed = THEMES.flatMap((t) => t.words.map((w) => w.word)).filter(
    (w, i, a) => a.indexOf(w) === i
  );
  cachedIndex = buildIndex([...new Set([...fill, ...themed])]);
  return cachedIndex;
}

interface PatternIndex {
  map: Map<string, number[]>; // `${len}:${pos}:${char}` -> word indices
  words: string[];
}

function buildIndex(words: string[]): PatternIndex {
  const map = new Map<string, number[]>();
  words.forEach((w, i) => {
    for (let p = 0; p < w.length; p++) {
      const key = `${w.length}:${p}:${w[p]}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(i);
    }
  });
  return { map, words };
}

function matchesAt(index: PatternIndex, pattern: (string | null)[], pos: number, char: string): string[] {
  const cands = index.map.get(`${pattern.length}:${pos}:${char}`) ?? [];
  const res: string[] = [];
  outer: for (const wi of cands) {
    const w = index.words[wi];
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i] !== null && pattern[i] !== w[i]) continue outer;
    }
    res.push(w);
  }
  return res;
}

function cellKey(r: number, c: number) {
  return `${r},${c}`;
}

interface Placed {
  word: string;
  row: number;
  col: number;
  direction: Direction;
  clueId: number;
}

/** Generate a deterministic daily puzzle for a date string (YYYY-MM-DD). */
export function generatePuzzle(date: string, themeId?: string): Puzzle {
  const rnd = seededRandom(date);
  const index = getIndex();

  const theme = themeId ? THEMES.find((t) => t.id === themeId)! : THEMES[Math.floor(rnd() * THEMES.length)];
  const themeWords = shuffle(
    theme.words.filter((w) => w.word.length >= 4 && w.word.length <= 8 && /^[a-z]+$/.test(w.word)),
    rnd
  );

  const grid: (GridCell | null)[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  const gridLetters = new Map<string, string>(); // "r,c" -> letter
  const cellDirs = new Map<string, Set<Direction>>(); // "r,c" -> directions occupying this cell
  const placedWords: Placed[] = [];
  const usedWords = new Set<string>();
  let clueSeq = 1;

  const place = (word: string, r: number, c: number, dir: Direction): number => {
    const id = clueSeq++;
    const dr = dir === "across" ? 0 : 1;
    const dc = dir === "across" ? 1 : 0;
    for (let i = 0; i < word.length; i++) {
      const rr = r + dr * i;
      const cc = c + dc * i;
      const key = cellKey(rr, cc);
      gridLetters.set(key, word[i]);
      if (!cellDirs.has(key)) cellDirs.set(key, new Set());
      cellDirs.get(key)!.add(dir);
      let cell = grid[rr][cc];
      if (!cell) {
        cell = { row: rr, col: cc, letter: word[i], wordIds: [], number: undefined };
        grid[rr][cc] = cell;
      }
      cell.wordIds.push(id);
      if (i === 0 && cell.number === undefined) cell.number = id;
    }
    placedWords.push({ word, row: r, col: c, direction: dir, clueId: id });
    usedWords.add(word);
    return id;
  };

  // ---- 1) anchor: a theme word across the middle ----
  const startWord =
    themeWords.find((tw) => tw.word.length >= 4 && tw.word.length <= 6 && index.words.includes(tw.word))?.word ?? "table";
  const sr = Math.floor((ROWS - 1) / 2);
  const sc = Math.max(0, Math.floor((COLS - startWord.length) / 2));
  place(startWord, sr, sc, "across");

  // ---- 2) fill: Phase A theme words, Phase B fill words ----
  const allCands = shuffle(Object.keys(FILL_WORDS), rnd);
  let guard = 0;
  let placedThemeCount = 1; // start word counts as one
  const MAX_GUARD = 800;

  const tryPlace = (dir: Direction, filter: ((w: string) => boolean) | null): boolean => {
    const anchors = placedWords.filter((w) => w.direction !== dir);
    if (anchors.length === 0) return false;

    for (let attempt = 0; attempt < 25; attempt++) {
      const anchor = anchors[Math.floor(rnd() * anchors.length)];
      const crossIdx = Math.floor(rnd() * anchor.word.length);
      const ar = anchor.row + (anchor.direction === "across" ? 0 : crossIdx);
      const ac = anchor.col + (anchor.direction === "across" ? crossIdx : 0);
      const anchorLetter = anchor.word[crossIdx];

      // enumerate every legal slot of this direction passing through (ar, ac)
      const slots: { start: number; len: number; pattern: (string | null)[]; pos: number }[] = [];
      if (dir === "down") {
        for (let start = Math.max(0, ar - 7); start <= ar; start++) {
          for (let len = 3; len <= 8; len++) {
            const end = start + len - 1;
            if (end >= ROWS || end < ar) continue;
            let ok = true;
            for (let i = 0; i < len; i++) {
              const dirs = cellDirs.get(cellKey(start + i, ac));
              if (dirs && dirs.has(dir)) { ok = false; break; }
            }
            if (!ok) continue;
            const pattern: (string | null)[] = [];
            for (let i = 0; i < len; i++) pattern.push(gridLetters.get(cellKey(start + i, ac)) ?? null);
            slots.push({ start, len, pattern, pos: ar - start });
          }
        }
      } else {
        for (let start = Math.max(0, ac - 7); start <= ac; start++) {
          for (let len = 3; len <= 8; len++) {
            const end = start + len - 1;
            if (end >= COLS || end < ac) continue;
            let ok = true;
            for (let i = 0; i < len; i++) {
              const dirs = cellDirs.get(cellKey(ar, start + i));
              if (dirs && dirs.has(dir)) { ok = false; break; }
            }
            if (!ok) continue;
            const pattern: (string | null)[] = [];
            for (let i = 0; i < len; i++) pattern.push(gridLetters.get(cellKey(ar, start + i)) ?? null);
            slots.push({ start, len, pattern, pos: ac - start });
          }
        }
      }

      shuffle(slots, rnd);
      for (const slot of slots) {
        let cands = matchesAt(index, slot.pattern, slot.pos, anchorLetter);
        if (filter) cands = cands.filter(filter);
        cands = cands.filter((w) => w !== anchor.word && !usedWords.has(w));
        if (cands.length === 0) continue;
        // bias toward common words when not themed
        let pick = cands;
        if (!filter && cands.length > 8) pick = cands.slice(0, 8); // ranked order = frequency order
        const w = pick[Math.floor(rnd() * pick.length)];
        if (dir === "down") place(w, slot.start, ac, dir);
        else place(w, ar, slot.start, dir);
        return true;
      }
    }
    return false;
  };

  // ---- 2b) Phase A: place as many theme words as possible ----
  const MAX_THEME_WORDS = 5;

  for (const tw of themeWords) {
    if (placedThemeCount >= MAX_THEME_WORDS) break;
    if (usedWords.has(tw.word)) continue;
    const dirs: Direction[] = placedThemeCount % 2 === 0 ? ["down", "across"] : ["across", "down"];
    for (const d of dirs) {
      if (tryPlace(d, (w) => w === tw.word)) {
        placedThemeCount++;
        break;
      }
    }
  }

  // ---- 2c) Phase B: fill remaining words ----
  while (placedWords.length < TARGET_WORDS && guard++ < MAX_GUARD) {
    const dir: Direction = placedWords.length % 2 === 1 ? "down" : "across";
    const ok = tryPlace(dir, null);
    if (placedWords.length >= 4) {
      const aCnt = placedWords.filter((w) => w.direction === "across").length;
      const dCnt = placedWords.filter((w) => w.direction === "down").length;
      if (aCnt >= 6 && dCnt >= 4) break;
    }
    if (ok === false && guard > 60) break;
  }

  // ---- 3) clues with standard numbering (by grid scan order, shared per cell) ----
  const numByClue = new Map<number, number>();
  const numByCell = new Map<string, number>();
  let nextNum = 1;
  placedWords
    .slice()
    .sort((a, b) => a.row - b.row || a.col - b.col)
    .forEach((pw) => {
      const key = `${pw.row},${pw.col}`;
      if (!numByCell.has(key)) numByCell.set(key, nextNum++);
      numByClue.set(pw.clueId, numByCell.get(key)!);
    });

  const hintMap = new Map<string, string>();
  THEMES.flatMap((t) => t.words).forEach((tw) => {
    if (tw.hint && !hintMap.has(tw.word)) hintMap.set(tw.word, tw.hint);
  });
  Object.entries(FILL_WORDS).forEach(([w, clue]) => {
    if (!hintMap.has(w)) hintMap.set(w, clue);
  });

  const clues: Clue[] = placedWords
    .slice()
    .sort((a, b) => a.clueId - b.clueId)
    .map((pw) => ({
      id: pw.clueId,
      direction: pw.direction,
      word: pw.word,
      clue: hintMap.get(pw.word) ?? "",
      number: numByClue.get(pw.clueId)!,
      row: pw.row,
      col: pw.col,
    }));

  // grid cell numbers: assign from start cells
  const finalGrid: GridCell[][] = grid.map((row, rr) =>
    row.map((cell, cc) => {
      if (!cell) return null as unknown as GridCell;
      return {
        ...cell,
        number: numByCell.get(`${rr},${cc}`),
      };
    })
  );

  // ---- 4) tiles: shuffled letters with random rotations ----
  const allLetters: string[] = [];
  placedWords.forEach((pw) => allLetters.push(...pw.word.split("")));
  const tiles: Tile[] = shuffle(
    allLetters.map((letter, i) => ({
      id: i,
      letter,
      rotation: [0, 90, 180, 270][Math.floor(rnd() * 4)],
      placed: false,
    })),
    rnd
  );

  return {
    date,
    theme: theme.name,
    title: theme.name,
    rows: ROWS,
    cols: COLS,
    grid: finalGrid,
    clues,
    tiles,
  };
}