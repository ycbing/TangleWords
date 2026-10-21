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
  revealedIds: number[];
  activeClue: number | null;
  revealsLeft: number;
  onSelectClue: (id: number) => void;
  onReveal: (id: number) => void;
}

export default function CluePanel({
  puzzle,
  board,
  revealedIds,
  activeClue,
  revealsLeft,
  onSelectClue,
  onReveal,
}: Props) {
  const tileById = (id: number) => puzzle.tiles.find((t) => t.id === id);

  const wordSolved = (clueId: number) => {
    const clue = puzzle.clues.find((c) => c.id === clueId);
    if (!clue) return false;
    const dr = clue.direction === "across" ? 0 : 1;
    const dc = clue.direction === "across" ? 1 : 0;
    for (let i = 0; i < clue.word.length; i++) {
      const tile = board[clue.row + dr * i]?.[clue.col + dc * i];
      if (tile === null || tile === undefined) return false;
      const t = tileById(tile);
      if (!t || t.letter !== clue.word[i]) return false;
    }
    return true;
  };

  const across = puzzle.clues.filter((c) => c.direction === "across");
  const down = puzzle.clues.filter((c) => c.direction === "down");

  const renderClue = (clue: (typeof across)[number]) => {
    const solved = wordSolved(clue.id);
    const revealed = revealedIds.includes(clue.id);
    const active = activeClue === clue.id;
    const canReveal = revealsLeft > 0 && !revealed && !solved;
    return (
      <div
        key={clue.id}
        onClick={() => onSelectClue(active ? -1 : clue.id)}
        className={`group flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 transition-colors ${
          active
            ? "bg-amber-200/70 dark:bg-amber-400/20"
            : solved
              ? "text-emerald-700 dark:text-emerald-400"
              : "hover:bg-stone-100 dark:hover:bg-white/5"
        }`}
      >
        <span className="mt-0.5 min-w-5 text-right font-bold text-stone-400">{clue.number}</span>
        <span className={`flex-1 text-sm leading-snug ${revealed ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
          {clue.clue || <span className="italic text-stone-400">(clue coming soon)</span>}
          <span className="ml-1 text-xs text-stone-400">({clue.word.length})</span>
        </span>
        {canReveal && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReveal(clue.id);
            }}
            className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-bold text-stone-600 opacity-0 transition-opacity hover:bg-stone-300 group-hover:opacity-100 dark:bg-white/10 dark:text-stone-300"
            title="Reveal this word"
          >
            !
          </button>
        )}
        {revealed && <span className="text-xs font-bold text-emerald-500">✓</span>}
      </div>
    );
  };

  return (
    <aside className="w-full shrink-0 rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur dark:bg-white/5 lg:w-80">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400">
          Clues
        </h2>
        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-bold text-orange-700 dark:bg-orange-500/20 dark:text-orange-300">
          {revealsLeft} reveals left
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <div>
          <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Across</h3>
          <div className="space-y-0.5">{across.map(renderClue)}</div>
        </div>
        <div>
          <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Down</h3>
          <div className="space-y-0.5">{down.map(renderClue)}</div>
        </div>
      </div>

      <p className="mt-3 border-t border-stone-200 pt-2 text-[11px] leading-relaxed text-stone-400 dark:border-stone-700 dark:text-stone-500">
        Tap a clue to highlight its letters in the grid. Tap a tile, then a cell to place it — tap the tile again to
        spin it.
      </p>
    </aside>
  );
}