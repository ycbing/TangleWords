"use client";

import { useEffect, useRef, useState } from "react";
import type { Puzzle } from "@/lib/puzzle/types";

const canShare = typeof navigator !== "undefined" && "share" in navigator;

interface Props {
  puzzle: Puzzle;
  board: (number | null)[][];
  seconds: number;
  moves: number;
  streak: number;
  onClose: () => void;
}

function drawShareCard(
  canvas: HTMLCanvasElement,
  puzzle: Puzzle,
  board: (number | null)[][],
  seconds: number,
  moves: number,
  streak: number
) {
  const scale = 2; // retina
  const W = 420;
  const H = 620;
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);

  // background
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#fbbf24");
  grad.addColorStop(1, "#f97316");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // decorative circles
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(360, 80, 90, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(30, 540, 70, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // header
  ctx.fillStyle = "#fff";
  ctx.font = "bold 34px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Tangle Words", W / 2, 64);
  ctx.font = "16px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText(
    new Date(puzzle.date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    W / 2,
    92
  );

  // stats
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  const mins = Math.floor(seconds / 60);
  const secs = String(seconds % 60).padStart(2, "0");
  ctx.font = "bold 20px sans-serif";
  ctx.fillText(`⏱ ${mins}:${secs} · ${moves} moves · 🔥 ${streak} day streak`, W / 2, 134);

  // mini grid
  const cell = 40;
  const gw = puzzle.cols * cell;
  const gh = puzzle.rows * cell;
  const ox = (W - gw) / 2;
  const oy = 170;
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  // board bg
  roundRect(ctx, ox - 10, oy - 10, gw + 20, gh + 20, 16);
  ctx.fill();
  for (let r = 0; r < puzzle.rows; r++) {
    for (let c = 0; c < puzzle.cols; c++) {
      const cellP = puzzle.grid[r][c];
      const x = ox + c * cell;
      const y = oy + r * cell;
      if (!cellP) {
        ctx.fillStyle = "rgba(0,0,0,0.18)";
        roundRect(ctx, x, y, cell, cell, 6);
        ctx.fill();
        continue;
      }
      const tile = board[r][c];
      let placed = false;
      if (tile !== null) placed = true;
      if (placed) {
        ctx.fillStyle = "#fff";
        roundRect(ctx, x + 2, y + 2, cell - 4, cell - 4, 8);
        ctx.fill();
        ctx.fillStyle = "#c2410c";
        ctx.font = "bold 22px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const tileObj = null; // letter from board id not available here; draw block only
        void tileObj;
        ctx.fillText("", x + cell / 2, y + cell / 2 + 2);
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.strokeStyle = "rgba(255,255,255,0.65)";
        ctx.lineWidth = 2;
        roundRect(ctx, x + 4, y + 4, cell - 8, cell - 8, 8);
        ctx.stroke();
      }
    }
  }

  // footer
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "15px sans-serif";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(`Theme: ${puzzle.theme}`, W / 2, oy + gh + 40);
  ctx.font = "bold 17px sans-serif";
  ctx.fillText("Play today's puzzle at tangle.words", W / 2, oy + gh + 70);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export default function ShareModal({ puzzle, board, seconds, moves, streak, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawShareCard(canvas, puzzle, board, seconds, moves, streak);
    setImgUrl(canvas.toDataURL("image/png"));
  }, [puzzle, board, seconds, moves, streak]);

  const shareText = `Tangle Words ${puzzle.date} · ${puzzle.theme}\nSolved in ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")} with ${moves} moves 🔥 Streak ${streak}\nPlay at tangle.words`;

  const doDownload = () => {
    if (!imgUrl) return;
    const a = document.createElement("a");
    a.href = imgUrl;
    a.download = `tangle-words-${puzzle.date}.png`;
    a.click();
  };

  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const doNativeShare = async () => {
    if (navigator.share && imgUrl) {
      try {
        const blob = await (await fetch(imgUrl)).blob();
        const file = new File([blob], `tangle-${puzzle.date}.png`, { type: "image/png" });
        await navigator.share({ text: shareText, files: [file] });
      } catch {
        /* user cancelled */
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-sm overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl dark:bg-stone-800">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold">Share your result</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-stone-100 dark:hover:bg-white/10">
            ✕
          </button>
        </div>

        <canvas ref={canvasRef} className="mt-3 hidden" />
        {imgUrl && <img src={imgUrl} alt="Share card" className="mt-3 w-full rounded-2xl shadow" />}

        <div className="mt-4 flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={doDownload}
              className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-sm font-bold text-white hover:opacity-90"
            >
              ⬇ Download image
            </button>
            <button
              onClick={doCopy}
              className="flex-1 rounded-xl bg-stone-100 py-2.5 text-sm font-bold text-stone-700 hover:bg-stone-200 dark:bg-white/10 dark:text-stone-200"
            >
              {copied ? "✓ Copied!" : "⧉ Copy text"}
            </button>
          </div>
          {canShare && (
            <button
              onClick={doNativeShare}
              className="rounded-xl bg-stone-800 py-2.5 text-sm font-bold text-white hover:bg-stone-900 dark:bg-white dark:text-stone-900"
            >
              📤 Share…
            </button>
          )}
        </div>
      </div>
    </div>
  );
}