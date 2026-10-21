"use client";

import { useRef, useState } from "react";

interface TrayTile {
  id: number;
  letter: string;
  rotation: number;
}

interface Props {
  tiles: TrayTile[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onRotate: (id: number) => void;
  onShuffle: () => void;
  onReset: () => void;
  onDrop: (tileId: number, r: number, c: number) => void;
}

// drag state (pointer events, works for mouse + touch)
interface DragState {
  tileId: number;
  startX: number;
  startY: number;
  dragging: boolean;
  x: number;
  y: number;
}

export default function TileTray({ tiles, selectedId, onSelect, onRotate, onShuffle, onReset, onDrop }: Props) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const longPressRef = useRef<{ x: number; y: number; id: number } | null>(null);

  const beginDrag = (e: React.PointerEvent, tile: TrayTile) => {
    dragRef.current = {
      tileId: tile.id,
      startX: e.clientX,
      startY: e.clientY,
      dragging: false,
      x: e.clientX,
      y: e.clientY,
    };
    longPressRef.current = { x: e.clientX, y: e.clientY, id: tile.id };
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* synthetic events may not support capture */
    }
    setDrag(dragRef.current);
  };

  const moveDrag = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.dragging && Math.hypot(dx, dy) > 7) {
      d.dragging = true; // threshold: becomes a drag
      longPressRef.current = null;
    }
    if (d.dragging) {
      d.x = e.clientX;
      d.y = e.clientY;
      setDrag({ ...d });
    }
  };

  const endDrag = (e: React.PointerEvent) => {
    const d = dragRef.current;
    dragRef.current = null;
    longPressRef.current = null;
    if (!d) return;

    if (d.dragging) {
      // drop: hit test the cell under the pointer
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const cell = el?.closest?.("[data-cell]") as HTMLElement | null;
      if (cell) {
        const r = Number(cell.dataset.r);
        const c = Number(cell.dataset.c);
        onDrop(d.tileId, r, c);
      }
      setDrag(null);
      return;
    }

    // it was a tap, not a drag
    setDrag(null);
    const tapped = (e.target as HTMLElement).closest?.("[data-tile]") as HTMLElement | null;
    if (tapped && Number(tapped.dataset.tile) === d.tileId) {
      if (selectedId === d.tileId) {
        onRotate(d.tileId); // tap again on selected tile = rotate
      } else {
        onSelect(d.tileId);
      }
    }
    if (tapped && longPressRef.current && Number(tapped.dataset.tile) !== d.tileId) {
      onSelect(d.tileId);
    }
  };

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
          Tiles ({tiles.length} left)
        </span>
        <div className="flex gap-2">
          <button
            onClick={onShuffle}
            className="rounded-lg bg-white/80 px-3 py-1.5 text-xs font-semibold text-stone-600 shadow hover:bg-white dark:bg-white/10 dark:text-stone-300 dark:hover:bg-white/20"
            title="Shuffle tiles"
          >
            🔀 Shuffle
          </button>
          <button
            onClick={onReset}
            className="rounded-lg bg-white/80 px-3 py-1.5 text-xs font-semibold text-stone-600 shadow hover:bg-white dark:bg-white/10 dark:text-stone-300 dark:hover:bg-white/20"
            title="Reset puzzle"
          >
            ↺ Reset
          </button>
        </div>
      </div>

      <div className="flex min-h-[72px] flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed border-stone-300 bg-white/40 p-3 dark:border-stone-700 dark:bg-white/5">
        {tiles.length === 0 && (
          <span className="text-sm italic text-stone-400 dark:text-stone-500">All tiles placed — nice!</span>
        )}
        {tiles.map((tile) => {
          const isSelected = selectedId === tile.id;
          return (
            <button
              key={tile.id}
              data-tile={tile.id}
              onPointerDown={(e) => beginDrag(e, tile)}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              className={`relative grid h-12 w-12 select-none place-items-center rounded-lg text-xl font-bold uppercase shadow transition-shadow sm:h-14 sm:w-14 sm:text-2xl ${
                isSelected
                  ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white ring-2 ring-amber-500 ring-offset-2"
                  : "bg-gradient-to-br from-amber-200 to-orange-200 text-stone-800 hover:shadow-md dark:from-amber-500/80 dark:to-orange-600/80 dark:text-white"
              }`}
              style={{
                transform: `rotate(${tile.rotation}deg)`,
                transition: "transform 200ms ease, background 150ms ease",
                touchAction: "none",
              }}
            >
              {tile.letter}
            </button>
          );
        })}
      </div>

      {drag?.dragging && (
        <div
          className="pointer-events-none fixed z-50 grid h-14 w-14 place-items-center rounded-lg bg-gradient-to-br from-amber-300 to-orange-400 text-2xl font-bold uppercase text-white shadow-2xl"
          style={{ left: drag.x - 28, top: drag.y - 28 }}
        >
          {tiles.find((t) => t.id === drag.tileId)?.letter}
        </div>
      )}
    </div>
  );
}