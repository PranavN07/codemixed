/**
 * Gemini (Google AI Studio) wrapper — server-only, TypeScript + fetch only.
 * Key MUST come from `GEMINI_API_KEY` (never a NEXT_PUBLIC_ variable, which
 * would ship the key to the browser). The key is only ever sent to Google's
 * API from Route Handlers; it is never logged or returned to the client.
 *
 * Docs: https://ai.google.dev/api/generate-content
 */

export function getGeminiKey(): string | null {
  const key = process.env.GEMINI_API_KEY;
  return key && key.trim().length > 0 ? key.trim() : null;
}

export function getGeminiModel(): string {
  const model = process.env.GEMINI_MODEL;
  return model && model.trim().length > 0 ? model.trim() : "gemini-2.0-flash";
}

interface GenerateContentResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
  error?: { message?: string };
}

async function generateJson(prompt: string): Promise<unknown> {
  const apiKey = getGeminiKey();
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
  const model = getGeminiModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  let res: Response;
  try {
    res = await fetch(`${url}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(20_000),
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0, responseMimeType: "application/json" },
      }),
    });
  } catch (err) {
    throw new Error(`Gemini request failed: ${(err as Error).message}`);
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini request failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as GenerateContentResponse;
  if (json.error) throw new Error(`Gemini error: ${json.error.message ?? "unknown"}`);
  const text = (json.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("");
  if (!text.trim()) throw new Error("Gemini returned an empty response");
  return parseJsonLenient(text);
}

/** Parse model output, tolerating fences / leading prose around the JSON. */
function parseJsonLenient(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.search(/[[{]/);
    const endBrace = cleaned.lastIndexOf("}");
    const endBracket = cleaned.lastIndexOf("]");
    const end = Math.max(endBrace, endBracket);
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("Gemini returned non-JSON output");
  }
}

const KNOWN_CODES = new Set(["en", "hi", "hinglish", "es", "fr", "de"]);

function normalizeCode(code: unknown): string {
  const c = String(code ?? "").trim().toLowerCase();
  if (KNOWN_CODES.has(c)) return c;
  // Accept common variants the model may emit
  if (c === "hindi") return "hi";
  if (c === "spanish" || c === "español") return "es";
  if (c === "french" || c === "français") return "fr";
  if (c === "german" || c === "deutsch") return "de";
  if (c === "english") return "en";
  if (c === "romanized hindi" || c === "romanised hindi") return "hinglish";
  return "und";
}

export async function geminiDetect(
  texts: string[],
): Promise<{ language: string; confidence: number }[]> {
  const prompt = [
    "You are a language detector for code-mixed South Asian + European text.",
    "Given the JSON array of sentences below, detect the language of EACH sentence.",
    'Use ISO-639-1 codes: "en" (English), "hi" (Hindi in Devanagari script), "es" (Spanish), "fr" (French), "de" (German).',
    'Use the special code "hinglish" for Hindi written in Latin/Roman script (e.g. "kaise ho aap").',
    'Use "und" only if truly undeterminable.',
    "Respond with ONLY a JSON array of the same length and order, each item: {\"language\": <code>, \"confidence\": <0..1>}.",
    `Sentences: ${JSON.stringify(texts)}`,
  ].join("\n");

  const parsed = (await generateJson(prompt)) as unknown;
  if (!Array.isArray(parsed) || parsed.length !== texts.length) {
    throw new Error("Gemini detection returned an unexpected shape");
  }
  return parsed.map((item) => {
    const entry = item as { language?: unknown; confidence?: unknown };
    const confidence =
      typeof entry.confidence === "number" && Number.isFinite(entry.confidence)
        ? Math.min(1, Math.max(0, entry.confidence))
        : 0.85;
    return { language: normalizeCode(entry.language), confidence };
  });
}

const TARGET_DESCRIPTIONS: Record<string, string> = {
  en: "English",
  hi: "Hindi in Devanagari script",
  hinglish: "Hinglish, i.e. Hindi written ONLY in Latin/Roman script (no Devanagari characters)",
  es: "Spanish",
  fr: "French",
  de: "German",
};

export async function geminiTranslate(texts: string[], targetLang: string): Promise<string[]> {
  const targetDesc = TARGET_DESCRIPTIONS[targetLang] ?? targetLang;
  const prompt = [
    `Translate EACH sentence below into ${targetDesc}.`,
    "Rules: preserve meaning and tone; keep proper nouns as-is; do not add explanations.",
    "Respond with ONLY a JSON array of translated strings, same length and order as the input.",
    `Sentences: ${JSON.stringify(texts)}`,
  ].join("\n");

  const parsed = (await generateJson(prompt)) as unknown;
  if (!Array.isArray(parsed) || parsed.length !== texts.length) {
    throw new Error("Gemini translation returned an unexpected shape");
  }
  return parsed.map((item, i) => (typeof item === "string" ? item : texts[i]));
}
