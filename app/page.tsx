import { generatePuzzle } from "@/lib/puzzle/generator";
import PuzzleGame from "@/components/puzzle/PuzzleGame";

export const dynamic = "force-dynamic";

function todayStr() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" });
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const date =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayStr();
  const puzzle = generatePuzzle(date);
  return <PuzzleGame puzzle={puzzle} />;
}