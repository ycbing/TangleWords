// Tangle Words - puzzle types

export type Direction = "across" | "down";

export interface Clue {
  id: number;
  direction: Direction;
  word: string; // the answer word (lowercase)
  clue: string; // the clue text
  number: number; // clue number in the grid
  row: number; // start cell of the word
  col: number;
}

export interface PlacedWord {
  clueIndex: number;
  word: string;
  row: number; // starting cell (top-left of the word)
  col: number;
  direction: Direction;
}

export interface GridCell {
  row: number;
  col: number;
  letter: string; // answer letter
  wordIds: number[]; // clue ids passing through this cell
  number?: number; // clue number label if this cell starts a word
}

export interface Tile {
  id: number;
  letter: string;
  rotation: number; // 0 | 90 | 180 | 270
  // placement state
  placed: boolean;
  row?: number;
  col?: number;
}

export interface Puzzle {
  date: string; // YYYY-MM-DD
  theme: string;
  themeId: string; // theme id (e.g. "sports")
  title: string;
  rows: number;
  cols: number;
  grid: GridCell[][]; // rows x cols; null where no cell
  clues: Clue[]; // sorted across then down
  tiles: Tile[]; // shuffled, unplaced
  author?: string;
}

export interface PuzzleState {
  // per-player state for a puzzle
  placedTiles: Record<string, string>; // "row,col" -> tileId (placed cells)
  revealed: number[]; // clue ids revealed
  completed: boolean;
  seconds: number;
  moves: number;
}