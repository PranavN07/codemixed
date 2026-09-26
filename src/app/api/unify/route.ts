import { geminiDetect, geminiTranslate, getGeminiKey } from "@/lib/gemini";
import { getApiKey, googleDetect, googleTranslate } from "@/lib/google";
import { heuristicDetect } from "@/lib/heuristic";
import { getLangName, isSupportedTarget, resolveGoogleTarget } from "@/lib/languages";
import { checkApiRateLimit } from "@/lib/rate-limit";
import { splitIntoSentences } from "@/lib/segment";
import { devanagariToLatin } from "@/lib/transliterate";
import type { UnifyRequest, UnifyResponse } from "@/lib/types";

function sameLanguage(source: string, target: string): boolean {
  if (source === target) return true;
  // Hinglish (Latin) vs Hindi (Devanagari) still needs translation
  return false;
}

export async function POST(request: Request): Promise<Response> {
  const rateLimitResponse = await checkApiRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  let body: UnifyRequest;
  try {
    body = (await request.json()) as UnifyRequest;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const targetLang = body?.targetLang?.trim() ?? "";
  if (!isSupportedTarget(targetLang)) {
    return Response.json(
      { error: "Field 'targetLang' must be one of: en, hi, hinglish, es, fr, de" },
      { status: 400 },
    );
  }

  // Build working segment list
  const geminiKey = getGeminiKey();
  const googleKey = getApiKey();
  const demoMode = !geminiKey && !googleKey;
  let working: { id: number; text: string; langCode: string }[] = [];
  if (Array.isArray(body.segments) && body.segments.length > 0) {
    if (body.segments.length > 200) {
      return Response.json({ error: "Too many segments (max 200)" }, { status: 400 });
    }
    if (body.segments.some((segment) => typeof segment?.text !== "string")) {
      return Response.json({ error: "Each segment must include text as a string" }, { status: 400 });
    }
    const totalLength = body.segments.reduce((total, segment) => total + segment.text.length, 0);
    if (totalLength > 20000) {
      return Response.json({ error: "Text too long (max 20,000 characters)" }, { status: 400 });
    }
    working = body.segments.map((s, i) => ({
      id: s.id ?? i + 1,
      text: (s.text ?? "").trim(),
      langCode: (s.langCode ?? "").toLowerCase() || heuristicDetect(s.text ?? "").language,
    }));
  } else if (typeof body.text === "string" && body.text.trim()) {
    if (body.text.length > 20000) {
      return Response.json({ error: "Text too long (max 20,000 characters)" }, { status: 400 });
    }
    const sentences = splitIntoSentences(body.text);
    let detected: { language: string }[] | null = null;
    if (geminiKey) {
      try {
        detected = await geminiDetect(sentences);
      } catch (err) {
        console.error("Gemini detect failed in /api/unify, trying next engine:", err);
      }
    }
    if (!detected && googleKey) {
      try {
        detected = await googleDetect(sentences);
      } catch (err) {
        console.error("Google detect failed in /api/unify, falling back to heuristic:", err);
      }
    }
    working = sentences.map((t, i) => ({
      id: i + 1,
      text: t,
      langCode: detected?.[i]?.language ?? heuristicDetect(t).language,
    }));
  } else {
    return Response.json(
      { error: "Provide either 'segments' (from /api/segregate) or 'text'" },
      { status: 400 },
    );
  }

  working = working.filter((s) => s.text.length > 0);
  if (working.length === 0) {
    return Response.json({ error: "No translatable text found" }, { status: 400 });
  }

  const googleTarget = resolveGoogleTarget(targetLang);
  const wantHinglish = targetLang === "hinglish";

  // Decide which segments actually need translation
  const needsTranslation = working.map((s) => !sameLanguage(s.langCode, wantHinglish ? "hinglish" : googleTarget));
  const toTranslateIdx: number[] = [];
  working.forEach((_, i) => {
    if (needsTranslation[i]) toTranslateIdx.push(i);
  });

  const translatedMap = new Map<number, string>();

  if (toTranslateIdx.length > 0) {
    const texts = toTranslateIdx.map((i) => working[i].text);
    // Engine precedence: Gemini → Google Translate → demo passthrough.
    if (geminiKey) {
      try {
        const results = await geminiTranslate(texts, targetLang);
        results.forEach((out, k) => {
          translatedMap.set(toTranslateIdx[k], wantHinglish ? devanagariToLatin(out) : out);
        });
      } catch (err) {
        console.error("Gemini translate failed:", err);
        return Response.json(
          { error: "Translation is temporarily unavailable. Please try again." },
          { status: 502 },
        );
      }
    } else if (googleKey) {
      try {
        const results = await googleTranslate(texts, googleTarget);
        results.forEach((r, k) => {
          let out = r.translatedText;
          if (wantHinglish) out = devanagariToLatin(out);
          translatedMap.set(toTranslateIdx[k], out);
        });
      } catch (err) {
        console.error("Google translate failed:", err);
        return Response.json(
          { error: "Translation is temporarily unavailable. Please try again." },
          { status: 502 },
        );
      }
    } else {
      // Demo mode without API key: pass through + mark clearly.
      // For Hinglish demo, romanize any Devanagari so the effect is visible.
      toTranslateIdx.forEach((i) => {
        const src = working[i].text;
        translatedMap.set(i, wantHinglish ? devanagariToLatin(src) : src);
      });
    }
  }

  const translations = working.map((s, i) => {
    const wasTranslated = needsTranslation[i];
    return {
      id: s.id,
      originalText: s.text,
      sourceLang: s.langCode,
      sourceLangName: getLangName(s.langCode),
      translatedText: wasTranslated ? (translatedMap.get(i) ?? s.text) : s.text,
      wasTranslated,
    };
  });

  const unifiedText = translations.map((t) => t.translatedText).join(" ");

  const payload: UnifyResponse = {
    unifiedText,
    targetLang,
    targetLangName: getLangName(targetLang),
    translations,
    demoMode,
  };
  return Response.json(payload);
}
