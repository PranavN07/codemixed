/**
 * Word-level Hinglish mix analyzer (client-safe, zero dependencies).
 * Devanagari script → hi-deva · Roman Hindi vocabulary → hi-roman · else → en.
 */

export type MixLang = "hi-deva" | "hi-roman" | "en";

export interface MixToken {
  text: string;
  lang: MixLang;
}

export interface MixAnalysis {
  tokens: MixToken[];
  counts: Partial<Record<MixLang, number>>;
  ratio: Partial<Record<MixLang, number>>;
}

const DEVANAGARI = /[\u0900-\u097F]/;

const ROMAN_HINDI = new Set(
  [
    "main", "mein", "tum", "aap", "aapne", "tumne", "maine", "hum", "yeh", "yah",
    "woh", "voh", "kya", "kyun", "kaise", "kab", "kahan", "kaun", "kitna", "kitne",
    "hai", "hain", "ho", "hun", "hoon", "tha", "thi", "hoga", "hogi",
    "ka", "ki", "ke", "ko", "se", "par", "tak", "ne", "aur", "ya", "lekin",
    "nahi", "nahin", "na", "bahut", "bahot", "bohot", "zyada", "kam", "sab",
    "kuch", "koi", "har", "acha", "achha", "accha", "theek", "sahi", "galat",
    "bura", "naya", "purana", "bada", "chhota", "yaar", "arre", "chal", "chalo",
    "dekho", "dekha", "suno", "bolo", "kaho", "karo", "kar", "rahe", "raha", "rahi",
    "gaya", "gayi", "aaya", "aayi", "liya", "diya", "hua", "hui", "hue", "wala",
    "wali", "wale", "bhai", "dost", "ghar", "kaam", "baat", "cheez", "din", "raat",
    "kal", "aaj", "abhi", "phir", "wapas", "saath", "liye", "bilkul", "shayad",
    "namaste", "dhanyavad", "shukriya", "bas", "sirf", "khud",
    "mujhe", "tujhe", "chahiye", "chahie",
  ].map((w) => w.toLowerCase()),
);

function classify(raw: string): MixLang {
  if (DEVANAGARI.test(raw)) return "hi-deva";
  const word = raw.toLowerCase().replace(/^[^a-z\u0900-\u097F']+|[^a-z\u0900-\u097F']+$/g, "");
  if (word && ROMAN_HINDI.has(word)) return "hi-roman";
  return "en";
}

export function analyzeMix(text: string): MixAnalysis {
  const tokens: MixToken[] = [];
  for (const part of text.split(/\s+/)) {
    if (!part) continue;
    tokens.push({ text: part, lang: classify(part) });
  }
  const counts: Partial<Record<MixLang, number>> = {};
  for (const token of tokens) {
    counts[token.lang] = (counts[token.lang] ?? 0) + 1;
  }
  const ratio: Partial<Record<MixLang, number>> = {};
  if (tokens.length > 0) {
    for (const [lang, count] of Object.entries(counts) as [MixLang, number][]) {
      ratio[lang] = count / tokens.length;
    }
  }
  return { tokens, counts, ratio };
}
