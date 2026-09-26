/**
 * Minimal Devanagari → Latin (romanized Hindi → Hinglish) transliterator.
 * Not a full ISO 15919 implementation — covers common chars for MVP readability.
 * Unknown chars pass through unchanged.
 * All non-ASCII keys use Unicode escapes to avoid combining-mark parse issues.
 */

const INDEPENDENT_VOWELS: Record<string, string> = {
  "अ": "a",
  "आ": "aa",
  "इ": "i",
  "ई": "ee",
  "उ": "u",
  "ऊ": "oo",
  "ए": "e",
  "ऐ": "ai",
  "ओ": "o",
  "औ": "au",
  "अं": "an",
  "अः": "ah",
};

const CONSONANTS: Record<string, string> = {
  "क": "k",
  "ख": "kh",
  "ग": "g",
  "घ": "gh",
  "ङ": "ng",
  "च": "ch",
  "छ": "chh",
  "ज": "j",
  "झ": "jh",
  "ञ": "ny",
  "ट": "t",
  "ठ": "th",
  "ड": "d",
  "ढ": "dh",
  "ण": "n",
  "त": "t",
  "थ": "th",
  "द": "d",
  "ध": "dh",
  "न": "n",
  "प": "p",
  "फ": "ph",
  "ब": "b",
  "भ": "bh",
  "म": "m",
  "य": "y",
  "र": "r",
  "ल": "l",
  "व": "v",
  "श": "sh",
  "ष": "sh",
  "स": "s",
  "ह": "h",
  "क्ष": "ksh",
  "त्र": "tra",
  "ज्ञ": "gya",
  "ड़": "r",
  "ढ़": "rh",
};

const VOWEL_SIGNS: Record<string, string> = {
  "ा": "aa", // U+093E
  "ि": "i", // U+093F
  "ी": "ee", // U+0940
  "ु": "u", // U+0941
  "ू": "oo", // U+0942
  "े": "e", // U+0947
  "ै": "ai", // U+0948
  "ो": "o", // U+094B
  "ौ": "au", // U+094C
  "ं": "n", // U+0902 anusvara
  "ँ": "n", // U+0901 chandrabindu
  "ः": "h", // U+0903 visarga
  "ॉ": "o", // U+0949
  "ॅ": "e", // U+0945
};

const DIGITS: Record<string, string> = {
  "०": "0",
  "१": "1",
  "२": "2",
  "३": "3",
  "४": "4",
  "५": "5",
  "६": "6",
  "७": "7",
  "८": "8",
  "९": "9",
};

const HALANT = "्"; // U+094D
const NUKTA = "़"; // U+093C

export function devanagariToLatin(input: string): string {
  let out = "";
  const chars = Array.from(input);
  let i = 0;
  while (i < chars.length) {
    const ch = chars[i];
    const next = chars[i + 1];

    if (DIGITS[ch]) {
      out += DIGITS[ch];
      i += 1;
      continue;
    }
    if (INDEPENDENT_VOWELS[ch]) {
      out += INDEPENDENT_VOWELS[ch];
      i += 1;
      continue;
    }
    // Consonant (+ optional nukta) handling
    const withNukta = next === NUKTA ? ch + NUKTA : ch;
    const baseKey = CONSONANTS[withNukta] !== undefined ? withNukta : ch;
    if (CONSONANTS[baseKey] !== undefined) {
      const lookahead = withNukta !== ch ? i + 2 : i + 1;
      const after = chars[lookahead];
      if (after === HALANT) {
        // conjunct: consonant without inherent 'a'
        out += CONSONANTS[baseKey];
        i = lookahead + 1;
        continue;
      }
      if (after && VOWEL_SIGNS[after] !== undefined) {
        out += CONSONANTS[baseKey] + VOWEL_SIGNS[after];
        i = lookahead + 1;
        continue;
      }
      // inherent 'a' — drop it before whitespace/punctuation (schwa deletion, simplified)
      const inherent =
        /[\s.,!?;:…"“”‘’'()\-।–—]/.test(after ?? " ") || lookahead >= chars.length
          ? ""
          : "a";
      out += CONSONANTS[baseKey] + inherent;
      i = lookahead;
      continue;
    }
    if (VOWEL_SIGNS[ch] !== undefined) {
      out += VOWEL_SIGNS[ch];
      i += 1;
      continue;
    }
    if (ch === HALANT || ch === NUKTA) {
      i += 1;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}
