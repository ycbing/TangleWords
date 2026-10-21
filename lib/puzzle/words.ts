// Word library loading + themed word lists
import fs from "fs";
import path from "path";

let cache: { words: Set<string>; byLen: Map<number, string[]>; ranked: string[] } | null = null;

function loadWords() {
  if (cache) return cache;
  const raw = fs.readFileSync(path.join(process.cwd(), "data", "google-10000.txt"), "utf8");
  const all = raw
    .split("\n")
    .map((w) => w.trim().toLowerCase())
    .filter((w) => /^[a-z]{3,8}$/.test(w));

  const words = new Set(all);
  const byLen = new Map<number, string[]>();
  for (const w of all) {
    const l = w.length;
    if (!byLen.has(l)) byLen.set(l, []);
    byLen.get(l)!.push(w);
  }
  cache = { words, byLen, ranked: all };
  return cache;
}

// Themed word lists (answer candidates for daily puzzles)
// Each theme: id, name, words (lowercase, with an optional short gloss)
export interface ThemeWord {
  word: string;
  hint: string;
  tag?: string;
}

export interface Theme {
  id: string;
  name: string;
  words: ThemeWord[];
}

export const THEMES: Theme[] = [
  {
    id: "us-states",
    name: "US States",
    words: [
      { word: "alaska", hint: "Largest state by area" },
      { word: "texas", hint: "Lone Star State" },
      { word: "maine", hint: "Vacationland, in the northeast" },
      { word: "idaho", hint: "Famous for potatoes" },
      { word: "ohio", hint: "Buckeye State" },
      { word: "nevada", hint: "Silver State, home to Las Vegas" },
      { word: "florida", hint: "Sunshine State" },
      { word: "oregon", hint: "Beaver State, by the Pacific" },
      { word: "kansas", hint: "Sunflower State" },
      { word: "arizona", hint: "Grand Canyon State" },
      { word: "alabama", hint: "Yellowhammer State" },
      { word: "indiana", hint: "Hoosier State" },
      { word: "montana", hint: "Big Sky Country" },
      { word: "wyoming", hint: "Cowboy State, fewest people" },
      { word: "vermont", hint: "Green Mountain State" },
      { word: "georgia", hint: "Peach State" },
      { word: "hawaii", hint: "Aloha State" },
      { word: "missouri", hint: "Show-Me State" },
      { word: "utah", hint: "Beehive State" },
    ],
  },
  {
    id: "elements",
    name: "Periodic Table",
    words: [
      { word: "carbon", hint: "Element 6, basis of life" },
      { word: "oxygen", hint: "Element 8, we breathe it" },
      { word: "helium", hint: "Fills party balloons" },
      { word: "sodium", hint: "Element 11, in table salt" },
      { word: "silver", hint: "Element 47, Ag" },
      { word: "copper", hint: "Element 29, Cu" },
      { word: "iron", hint: "Element 26, Fe" },
      { word: "gold", hint: "Element 79, Au" },
      { word: "radon", hint: "Radioactive noble gas" },
      { word: "boron", hint: "Element 5, B" },
      { word: "argon", hint: "Inert gas in light bulbs" },
      { word: "cobalt", hint: "Element 27, Co" },
      { word: "nickel", hint: "Element 28, Ni, in coins" },
      { word: "zinc", hint: "Element 30, galvanizes steel" },
      { word: "krypton", hint: "Superman's home planet, also an element" },
      { word: "xenon", hint: "Noble gas, Xe" },
      { word: "radium", hint: "Discovered by Marie Curie" },
      { word: "sulfur", hint: "Element 16, S" },
    ],
  },
  {
    id: "food",
    name: "Food & Drink",
    words: [
      { word: "pizza", hint: "Slice of Italy, often with pepperoni" },
      { word: "sushi", hint: "Japan's raw deal" },
      { word: "tacos", hint: "Mexican fold-tastic dinner" },
      { word: "pasta", hint: "Italian staple, al dente please" },
      { word: "bagel", hint: "Breakfast ring with a hole" },
      { word: "pretzel", hint: "Twisted snack with salt" },
      { word: "waffle", hint: "Breakfast with syrup pockets" },
      { word: "ramen", hint: "Noodle soup in a bowl" },
      { word: "curry", hint: "Spicy Indian stew" },
      { word: "bacon", hint: "Cured breakfast strips" },
      { word: "salmon", hint: "Pink fish that swims upstream" },
      { word: "avocado", hint: "Green toast-topper" },
      { word: "muffin", hint: "Cupcake's less-sweet cousin" },
      { word: "cookie", hint: "Dough baked into a classic treat" },
      { word: "pickle", hint: "Cucumber in brine" },
      { word: "salsa", hint: "Chip's dance partner" },
    ],
  },
  {
    id: "animals",
    name: "Animals",
    words: [
      { word: "tiger", hint: "Striped big cat" },
      { word: "panda", hint: "Bamboo-munching bear from China" },
      { word: "eagle", hint: "American national bird" },
      { word: "otter", hint: "Playful river swimmer" },
      { word: "giraffe", hint: "Tallest mammal" },
      { word: "zebra", hint: "Horse with stripes" },
      { word: "rabbit", hint: "Hoppy pet with long ears" },
      { word: "dolphin", hint: "Smart ocean acrobat" },
      { word: "penguin", hint: "Tuxedo-wearing bird" },
      { word: "falcon", hint: "Fast-flying bird of prey" },
      { word: "lizard", hint: "Sunbathing reptile" },
      { word: "monkey", hint: "Tree-swinging primate" },
      { word: "beaver", hint: "Dam-building rodent" },
      { word: "cheetah", hint: "Fastest land animal" },
      { word: "raccoon", hint: "Masked nighttime trash inspector" },
      { word: "walrus", hint: "Whiskered Arctic tusker" },
    ],
  },
  {
    id: "sports",
    name: "Sports",
    words: [
      { word: "soccer", hint: "The beautiful game" },
      { word: "tennis", hint: "Love means nothing here" },
      { word: "golf", hint: "18 holes, fewer strokes win" },
      { word: "boxing", hint: "The sweet science" },
      { word: "bowling", hint: "Knock down ten pins" },
      { word: "hockey", hint: "Ice sport with a puck" },
      { word: "cricket", hint: "England's summer sport, bat and ball" },
      { word: "rugby", hint: "Oval-ball contact sport" },
      { word: "karate", hint: "Martial art from Okinawa" },
      { word: "rowing", hint: "Sport of oars" },
      { word: "archery", hint: "Bow and arrow sport" },
      { word: "diving", hint: "Graceful plunge from a board" },
    ],
  },
  {
    id: "tech",
    name: "Tech & Internet",
    words: [
      { word: "server", hint: "Computer that serves others" },
      { word: "router", hint: "Directs your Wi-Fi traffic" },
      { word: "crypto", hint: "Digital currency tech" },
      { word: "python", hint: "Snake, also a programming language" },
      { word: "google", hint: "Search engine giant" },
      { word: "iphone", hint: "Apple's smartphone" },
      { word: "pixel", hint: "Tiny screen square" },
      { word: "botnet", hint: "Zombie computer network" },
      { word: "phish", hint: "Fake email to steal data" },
      { word: "cache", hint: "Speedy data storage" },
      { word: "cloud", hint: "Remote computing resource" },
      { word: "linux", hint: "Open-source OS" },
      { word: "docker", hint: "Container platform" },
      { word: "github", hint: "Code hosting home" },
    ],
  },
];

export function getTheme(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[Math.floor(Math.random() * THEMES.length)];
}

// deterministic pseudo-random based on date string
export function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

export function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export { loadWords };