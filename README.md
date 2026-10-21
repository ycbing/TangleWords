<div align="center">

# 🧩 Tangle Words

**A daily word puzzle with a twist**

Rebuild a broken crossword — rotate scrambled letter tiles, drag them into place, and solve the grid before the clock runs out.

[**▶ Play now**](https://craftmind.cn/tangle/) · [Past Puzzles](https://craftmind.cn/tangle/puzzles/)

![Next.js](https://img.shields.io/badge/Next.js%2016-black?logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-blue?logo=typescript) ![Tailwind](https://img.shields.io/badge/Tailwind%20v4-38bdf8?logo=tailwindcss) ![License](https://img.shields.io/badge/License-MIT-green)

</div>

---

## ✨ What is it?

Every day brings a **new themed crossword** whose letters have been scrambled into loose tiles — some of them upside-down or sideways. Your job:

1. **Rotate** each tile the right way up
2. **Drag / tap** it into the correct cell of the grid
3. Use the clues (Across & Down) to figure out where everything goes

Fill the whole grid and you win — then share a **Wordle-style score card** with your friends.

## 🎮 How to Play

| Action | How |
|---|---|
| **Select a tile** | Tap it (it glows orange) — every valid empty cell lights up green so you know where it can go |
| **Place a tile** | Tap the highlighted cell, or just **drag** it there |
| **Rotate a tile** | Tap the selected tile again — spins 90° |
| **Get help** | Tap a clue to highlight its cells, or hit **`!`** to auto-reveal a word (3 per puzzle) |
| **Un-stick yourself** | 🔀 Shuffle rescrambles the tray · ↺ Reset restarts the puzzle |

## 🌟 Features

- **Daily themed puzzles** — US States, Periodic Table, Sports, Food, Animals, Tech & Internet
- **A full year of history** — every past puzzle is replayable via the [archive calendar](https://craftmind.cn/tangle/puzzles/), generated deterministically so it always looks exactly as it did on its day
- **Streaks & stats** — daily streak tracking, moves counter, timer
- **Wordle-style share card** — auto-generated canvas image (download / copy / system share)
- **Zero sign-up** — progress, streaks and theme preference live in `localStorage`
- **Dark mode** — one tap, remembered across visits
- **Mobile-first** — pointer events make drag-and-drop work with mouse *and* touch

## 🧱 Tech Stack

- **Next.js 16** (App Router, `basePath` deployment under `/tangle`)
- **TypeScript** · **Tailwind CSS v4**
- **No database** — all state is client-side (`localStorage`), the puzzle itself is derived purely from the date
- **Zero runtime dependencies for generation** — the crossword engine is self-contained

## 🚀 Run Locally

```bash
git clone git@github.com:ycbing/TangleWords.git
cd TangleWords
npm install
npm run dev     # http://localhost:3000
```

Production build:

```bash
npm run build
npm start       # serves on :3000 (override with PORT=3012)
```

> Serving under a sub-path? Set `basePath` in `next.config.ts` (the live deployment uses `/tangle`).

## 📁 Project Structure

```
app/
  page.tsx              # daily puzzle (accepts ?date=YYYY-MM-DD)
  puzzles/page.tsx      # past-puzzles archive calendar (365 days)
  api/puzzle/route.ts   # deterministic puzzle API (?date=&theme=)
components/puzzle/
  PuzzleGame.tsx        # game state machine (board/tray/streak/persist)
  GameBoard.tsx         # grid rendering, drop-target hints, wrong-cell feedback
  TileTray.tsx          # drag & drop tray (pointer events)
  CluePanel.tsx         # across/down clues, reveal
  ShareModal.tsx        # canvas share-card generator
  TutorialModal.tsx     # first-visit onboarding
lib/puzzle/
  generator.ts          # seeded crossword generator (deterministic per date)
  fill-words.ts         # 350+ classic fill words with hand-written clues
  words.ts              # themed word lists (6 themes)
  types.ts              # Puzzle / Clue / Tile types
lib/game/storage.ts     # localStorage persistence + streak logic
```

## 🧠 How the Generator Works

The crossword engine is **fully deterministic** — a given date always produces the identical puzzle, which is what makes the whole archive replayable for free:

1. `seededRandom(date)` derives an RNG from the date string
2. A theme is picked (or forced via `?theme=`)
3. An 8×6 grid is filled greedily: the anchor is a themed word, then crossing words are matched against a **pattern index** of ~7,300 common words
4. Theme words are prioritized; remaining slots are filled from a curated set of **350+ crossword fill words with real clues** (never a clueless cell)
5. Letters are emitted as tiles with random rotations — the "twist"

## 🗺 Roadmap

- [ ] Player-created puzzles (UGC, author attribution)
- [ ] LLM-generated punny clues (like the classics: *"a hot one may be controversial"* → POTATO)
- [ ] More themes + difficulty tiers
- [ ] Daily-theme preview / "tomorrow" teaser
- [ ] X/Twitter share copy

## 🙏 Credits

Inspired by [Tiled Words](https://tiledwords.com) — the daily crossword-rebuild format Paul & Lisa built (and which we admire). This is an independent implementation with its own engine, word lists, and design.

## 📄 License

[MIT](LICENSE)