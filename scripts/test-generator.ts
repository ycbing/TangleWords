// Quick sanity test for the puzzle generator
import { generatePuzzle } from "../lib/puzzle/generator";

function renderGrid(p: ReturnType<typeof generatePuzzle>) {
  const out: string[] = [];
  for (let r = 0; r < p.rows; r++) {
    let line = "";
    for (let c = 0; c < p.cols; c++) {
      const cell = p.grid[r][c];
      line += cell ? ` ${cell.letter} ` : "###";
    }
    out.push(line);
  }
  return out.join("\n");
}

for (const date of ["2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25"]) {
  const p = generatePuzzle(date);
  const across = p.clues.filter((c) => c.direction === "across");
  const down = p.clues.filter((c) => c.direction === "down");

  // validation: every clue's word must appear in grid along its direction from its numbered cell
  let wordsOk = true;
  const clueById = new Map(p.clues.map((c) => [c.id, c]));
  for (const clue of p.clues) {
    // find start cell by scanning grid for a cell with this clue's number and wordId
    let found = false;
    outer: for (let r = 0; r < p.rows; r++) {
      for (let c = 0; c < p.cols; c++) {
        const g = p.grid[r][c];
        if (g && g.wordIds.includes(clue.id) && g.number === clue.number) {
          const dr = clue.direction === "across" ? 0 : 1;
          const dc = clue.direction === "across" ? 1 : 0;
          let s = "";
          for (let i = 0; i < clue.word.length; i++) {
            const gg = p.grid[r + dr * i]?.[c + dc * i];
            if (!gg) { wordsOk = false; break outer; }
            s += gg.letter;
          }
          if (s !== clue.word) { wordsOk = false; console.log("MISMATCH", clue.number, clue.direction, clue.word, s); }
          found = true;
          break outer;
        }
      }
    }
    if (!found) { wordsOk = false; console.log("NOT FOUND", clue.number, clue.direction, clue.word); }
  }

  // check every grid cell belongs to at least one clue and letters consistent
  let cellsOk = true;
  for (let r = 0; r < p.rows; r++) {
    for (let c = 0; c < p.cols; c++) {
      const g = p.grid[r][c];
      if (!g) continue;
      if (g.wordIds.length === 0) { cellsOk = false; continue; }
      for (const wid of g.wordIds) {
        const cl = clueById.get(wid);
        if (!cl) { cellsOk = false; continue; }
        const dr = cl.direction === "across" ? 0 : 1;
        const dc = cl.direction === "across" ? 1 : 0;
        const dist = cl.direction === "across" ? c - cl.col : r - cl.row;
        if (dist < 0 || dist >= cl.word.length || cl.word[dist] !== g.letter) {
          cellsOk = false;
        }
      }
    }
  }

  const dupes = p.clues.map((c) => c.word).filter((w, i, a) => a.indexOf(w) !== i);
  const lettersInGrid = p.grid.flat().filter(Boolean).length;
  console.log(
    `\n=== ${date} | theme: ${p.theme} | words: ${p.clues.length} (${across.length}A/${down.length}D) | cells: ${lettersInGrid} | tiles: ${p.tiles.length} | wordsOk: ${wordsOk} | cellsOk: ${cellsOk} | dupes: ${dupes.join(",") || "none"} ===`
  );
  console.log(renderGrid(p));
  const themeHints = p.clues.filter((c) => c.clue).length;
  console.log(`Themed hints: ${themeHints}/${p.clues.length}`);
  p.clues.forEach((c) => console.log(`  ${c.number}${c.direction === "across" ? "A" : "D"} [${c.word}] (${c.clue || "no-hint"})`));
}