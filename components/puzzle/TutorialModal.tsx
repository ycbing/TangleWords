"use client";

import { useEffect, useState } from "react";

const SEEN_KEY = "tangle-words-tutorial-v1";

export default function TutorialModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(SEEN_KEY)) setShow(true);
    } catch {
      /* ignore */
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl dark:bg-stone-800">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-2xl font-black text-white shadow-lg">
            T
          </div>
          <h2 className="mt-3 text-2xl font-extrabold">Welcome to Tangle Words!</h2>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Rebuild a broken crossword — one tile at a time.
          </p>
        </div>

        <div className="mt-5 space-y-4">
          <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-3 dark:bg-amber-500/10">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-amber-200 to-orange-200 text-lg font-bold text-stone-800 dark:from-amber-500/70 dark:to-orange-600/70 dark:text-white">
              B
            </div>
            <div className="text-sm">
              <b>Tap a tile, then tap a cell</b> — or drag it straight into the grid.
              <br />
              <span className="text-stone-500 dark:text-stone-400">
                Tap a selected tile again to <b>spin</b> it the right way up.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-3 dark:bg-amber-500/10">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-stone-200 text-base font-bold text-stone-600 dark:bg-white/10 dark:text-stone-300">
              ?
            </div>
            <div className="text-sm">
              <b>The clues are your guide</b> — tap one to highlight its letters.
              <br />
              <span className="text-stone-500 dark:text-stone-400">
                Stuck? Hit the <b>!</b> button to reveal a word (3 per puzzle).
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-3 dark:bg-amber-500/10">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-stone-200 text-base dark:bg-white/10">
              🔀
            </div>
            <div className="text-sm">
              <b>Shuffle</b> rescrambles your tray when things get crowded.
              <br />
              <span className="text-stone-500 dark:text-stone-400">
                When the grid is full, you win — then <b>share your score</b>!
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={dismiss}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 font-bold text-white shadow-lg hover:opacity-90"
        >
          Let's play! 🧩
        </button>
      </div>
    </div>
  );
}