import { generatePuzzle } from "@/lib/puzzle/generator";
import PuzzleGame from "@/components/puzzle/PuzzleGame";

export const dynamic = "force-dynamic";

function todayStr() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" });
}

export default function HomePage() {
  const date = todayStr();
  const puzzle = generatePuzzle(date);
  return <PuzzleGame puzzle={puzzle} />;
}