/**
 * Offline heuristic detector used when GOOGLE_TRANSLATE_API_KEY is missing
 * (demo mode) or Google detect fails for a segment.
 * Per-sentence granularity, tuned for the 6 launch languages.
 */

const DEVANAGARI = /[\u0900-\u097F]/;

const WORDLISTS: { code: string; words: string[] }[] = [
  {
    code: "es",
    words: ["hola", "gracias", "por favor", "que", "esta", "está", "para", "con", "muy", "bueno", "buenos", "dias", "días", "mundo", "amigo", "donde", "cómo", "como"],
  },
  {
    code: "fr",
    words: ["bonjour", "merci", "oui", "non", "je", "tu", "vous", "avec", "pour", "monde", "amour", "toujours", "comment", "s'il", "être"],
  },
  {
    code: "de",
    words: ["hallo", "danke", "bitte", "und", "ich", "du", "der", "die", "das", "welt", "nicht", "ein", "eine", "mit", "für"],
  },
  {
    code: "hinglish",
    words: ["main", "tum", "aap", "kya", "hai", "ho", "hun", "hoon", "ka", "ki", "ke", "mein", "bahut", "acha", "achha", "namaste", "dhanyavad", "kaise", "nahi", "nahin", "yaar", "chal", "theek"],
  },
  {
    code: "hi",
    words: ["है", "हैं", "का", "की", "के", "में", "और", "यह", "वह", "नमस्ते", "धन्यवाद", "कैसे", "आप", "मैं"],
  },
];

function countMatches(lower: string, words: string[]): number {
  let n = 0;
  for (const w of words) {
    if (lower.includes(w)) n += 1;
  }
  return n;
}

export function heuristicDetect(text: string): { language: string; confidence: number } {
  const t = text.trim();
  if (!t) return { language: "und", confidence: 0 };
  if (DEVANAGARI.test(t)) {
    // Devanagari script → Hindi with high confidence
    return { language: "hi", confidence: 0.95 };
  }
  const lower = ` ${t.toLowerCase()} `;
  let best = { code: "en", score: 0 };
  for (const { code, words } of WORDLISTS) {
    const score = countMatches(lower, words.map((w) => ` ${w.toLowerCase()} `));
    if (score > best.score) best = { code, score };
  }
  if (best.score === 0) {
    // Pure Latin, no keywords → English (moderate confidence)
    return { language: "en", confidence: 0.6 };
  }
  return { language: best.code, confidence: Math.min(0.5 + best.score * 0.15, 0.9) };
}
