import { geminiDetect, getGeminiKey } from "@/lib/gemini";
import { getApiKey, googleDetect } from "@/lib/google";
import { heuristicDetect } from "@/lib/heuristic";
import { getLangName } from "@/lib/languages";
import { checkApiRateLimit } from "@/lib/rate-limit";
import { splitIntoSentences } from "@/lib/segment";
import type { SegregateResponse, TextSegment } from "@/lib/types";

export async function POST(request: Request): Promise<Response> {
  const rateLimitResponse = await checkApiRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = typeof (body as { text?: unknown }).text === "string" ? ((body as { text: string }).text ?? "") : "";

  if (!text.trim()) {
    return Response.json({ error: "Field 'text' is required and must be non-empty" }, { status: 400 });
  }
  if (text.length > 20000) {
    return Response.json({ error: "Text too long (max 20,000 characters)" }, { status: 400 });
  }

  const sentences = splitIntoSentences(text);
  if (sentences.length === 0) {
    return Response.json({ error: "No sentences found in text" }, { status: 400 });
  }

  const geminiKey = getGeminiKey();
  const googleKey = getApiKey();
  const demoMode = !geminiKey && !googleKey;

  // Engine precedence: Gemini → Google Translate → offline heuristic.
  let detections: { language: string; confidence: number }[] | null = null;
  if (geminiKey) {
    try {
      detections = await geminiDetect(sentences);
    } catch (err) {
      console.error("Gemini detect failed, trying next engine:", err);
    }
  }
  if (!detections && googleKey) {
    try {
      detections = await googleDetect(sentences);
    } catch (err) {
      console.error("Google detect failed, falling back to heuristic:", err);
    }
  }
  if (!detections) {
    detections = sentences.map((s) => heuristicDetect(s));
  }

  const segments: TextSegment[] = sentences.map((sentence, i) => {
    const d = detections[i] ?? { language: "und", confidence: 0 };
    return {
      id: i + 1,
      text: sentence,
      langCode: d.language,
      langName: getLangName(d.language),
      confidence: Math.round((d.confidence ?? 0) * 100) / 100,
    };
  });

  const counts = new Map<string, number>();
  for (const s of segments) counts.set(s.langCode, (counts.get(s.langCode) ?? 0) + 1);
  const detectedLanguages = [...counts.entries()].map(([code, count]) => ({
    code,
    name: getLangName(code),
    count,
  }));

  const payload: SegregateResponse = { segments, detectedLanguages, demoMode };
  return Response.json(payload);
}
