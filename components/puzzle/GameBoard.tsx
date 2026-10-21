"use client";

import type { Puzzle } from "@/lib/puzzle/types";

interface TrayTile {
  id: number;
  letter: string;
  rotation: number;
}

interface Props {
  puzzle: Puzzle;
  board: (number | null)[][];
  rotations: Record<number, number>;
  revealedIds: number[];
  activeClue: number | null;
  shake: { key: number; tile: TrayTile } | null;
  wrongCell: { r: number; c: number; key: number } | null;
  selectedTile?: { id: number; letter: string };
  onCellClick: (r: number, c: number) => void;
}

export default function GameBoard({
  puzzle,
  board,
  rotations,
  revealedIds,
  activeClue,
  shake,
  wrongCell,
  selectedTile,
  onCellClick,
}: Props) {
  const tileById = (id: number) => puzzle.tiles.find((t) => t.id === id);

  // cells highlighted by active clue
  const activeCells = new Set<string>();
  if (activeClue !== null) {
    const clue = puzzle.clues.find((c) => c.id === activeClue);
    if (clue) {
      const dr = clue.direction === "across" ? 0 : 1;
      const dc = clue.direction === "across" ? 1 : 0;
      for (let i = 0; i < clue.word.length; i++) {
        activeCells.add(`${clue.row + dr * i},${clue.col + dc * i}`);
      }
    }
  }

  // valid drop targets for the currently selected tile
  const dropTargets = new Set<string>();
  if (selectedTile) {
    for (let r = 0; r < puzzle.rows; r++) {
      for (let c = 0; c < puzzle.cols; c++) {
        const cell = puzzle.grid[r][c];
        if (cell && cell.letter === selectedTile.letter && board[r][c] === null) {
          dropTargets.add(`${r},${c}`);
        }
      }
    }
  }

  const isRevealed = (r: number, c: number) => {
    const cell = puzzle.grid[r][c];
    if (!cell) return false;
    return cell.wordIds.some((wid) => revealedIds.includes(wid));
  };

  return (
    <div
      className="mx-auto grid w-fit gap-1 rounded-2xl bg-stone-200/80 p-2 shadow-inner dark:bg-stone-800/80"
      style={{ gridTemplateColumns: `repeat(${puzzle.cols}, minmax(0, 1fr))` }}
    >
      {puzzle.grid.map((row, r) =>
        row.map((cell, c) => {
          if (!cell) {
            return <div key={`${r}-${c}`} className="h-11 w-11 rounded-md bg-stone-400/40 dark:bg-stone-900 sm:h-14 sm:w-14" />;
          }
          const tileId = board[r][c];
          const tile = tileId !== null ? tileById(tileId) : undefined;
          const highlighted = activeCells.has(`${r},${c}`);
          const revealed = isRevealed(r, c);
          const isTarget = dropTargets.has(`${r},${c}`);
          const isWrong = wrongCell ? wrongCell.r === r && wrongCell.c === c : false;
          const isShaking = shake && tile && shake.tile.id === tile.id;

          // base styles by state
          let bg = "bg-white/90 ring-1 ring-stone-300 dark:bg-stone-700/70 dark:ring-stone-600";
          if (tile) {
            bg = revealed
              ? "bg-emerald-400/90 text-white shadow dark:bg-emerald-500/80"
              : highlighted
                ? "bg-amber-300 text-amber-950 shadow-md ring-2 ring-amber-400 dark:bg-amber-400/80 dark:text-amber-950"
                : "bg-gradient-to-br from-amber-200 to-orange-200 text-stone-800 shadow dark:from-amber-500/70 dark:to-orange-600/70 dark:text-white";
          } else if (isTarget) {
            bg = "bg-emerald-100 ring-2 ring-emerald-400 ring-dashed dark:bg-emerald-500/15 dark:ring-emerald-400/60";
          } else if (highlighted) {
            bg = "bg-amber-100 ring-2 ring-amber-300 dark:bg-amber-400/20 dark:ring-amber-400/50";
          }

          return (
            <button
              key={`${r}-${c}`}
              data-cell="1"
              data-r={r}
              data-c={c}
              onClick={() => onCellClick(r, c)}
              className={`relative grid h-11 w-11 place-items-center rounded-md text-xl font-bold uppercase transition-all sm:h-14 sm:w-14 sm:text-2xl ${bg} ${
                isWrong ? "animate-shake bg-red-400 text-white ring-2 ring-red-500" : ""
              } ${isShaking ? "animate-shake" : ""}`}
              style={{
                transform: tile && (rotations[tile.id] ?? 0) !== 0 ? `rotate(${rotations[tile.id] ?? 0}deg)` : undefined,
                transition: "transform 150ms ease, background 150ms ease",
              }}
            >
              {cell.number !== undefined && (
                <span className="absolute left-0.5 top-0 text-[9px] font-bold text-stone-500 dark:text-stone-300">
                  {cell.number}
                </span>
              )}
              {tile ? (
                tile.letter
              ) : isTarget ? (
                <span className="text-emerald-500/60 dark:text-emerald-300/60">{selectedTile!.letter}</span>
              ) : (
                ""
              )}
            </button>
          );
        })
      )}
    </div>
  );
}