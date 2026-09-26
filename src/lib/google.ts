/**
 * Google Cloud Translation v2 wrapper (TypeScript-only backend).
 * Uses REST + fetch so no extra SDK is required.
 * Docs: https://cloud.google.com/translate/docs/reference/rest/v2/translate
 */

const DETECT_URL = "https://translation.googleapis.com/language/translate/v2/detect";
const TRANSLATE_URL = "https://translation.googleapis.com/language/translate/v2";

export function getApiKey(): string | null {
  const key = process.env.GOOGLE_TRANSLATE_API_KEY;
  return key && key.trim().length > 0 ? key.trim() : null;
}

interface DetectApiResponse {
  data?: { detections?: { language: string; confidence?: number; isReliable?: boolean }[][] };
  error?: { message?: string };
}

interface TranslateApiResponse {
  data?: { translations?: { translatedText: string; detectedSourceLanguage?: string }[] };
  error?: { message?: string };
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export async function googleDetect(texts: string[]): Promise<{ language: string; confidence: number }[]> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("GOOGLE_TRANSLATE_API_KEY is not configured");
  const res = await fetch(`${DETECT_URL}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: texts }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google detect failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as DetectApiResponse;
  if (json.error) throw new Error(`Google detect error: ${json.error.message ?? "unknown"}`);
  const groups = json.data?.detections ?? [];
  return texts.map((_, i) => {
    const best = groups[i]?.[0];
    return {
      language: (best?.language ?? "und").toLowerCase(),
      confidence: typeof best?.confidence === "number" ? best.confidence : 0.8,
    };
  });
}

export async function googleTranslate(
  texts: string[],
  target: string,
): Promise<{ translatedText: string; detectedSourceLanguage?: string }[]> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("GOOGLE_TRANSLATE_API_KEY is not configured");
  const res = await fetch(`${TRANSLATE_URL}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: texts, target, format: "text" }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google translate failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as TranslateApiResponse;
  if (json.error) throw new Error(`Google translate error: ${json.error.message ?? "unknown"}`);
  const list = json.data?.translations ?? [];
  return texts.map((_, i) => ({
    translatedText: decodeHtmlEntities(list[i]?.translatedText ?? texts[i]),
    detectedSourceLanguage: list[i]?.detectedSourceLanguage,
  }));
}
