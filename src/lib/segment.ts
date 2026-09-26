/**
 * Sentence splitter (TypeScript-only, no native deps).
 * Uses Intl.Segmenter when available, falls back to a regex splitter.
 */
export function splitIntoSentences(text: string): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];

  try {
    const Segmenter =
      Intl.Segmenter as unknown as
        | (new (
            locale: string,
            opts: { granularity: string },
          ) => { segment(input: string): Iterable<{ segment: string }> })
        | undefined;
    if (typeof Segmenter === "function") {
      const segmenter = new Segmenter("en", { granularity: "sentence" });
      const out: string[] = [];
      for (const { segment } of segmenter.segment(cleaned)) {
        const s = segment.trim();
        if (s) out.push(s);
      }
      if (out.length > 0) return out;
    }
  } catch {
    // fall through to regex
  }

  const parts = cleaned.match(/[^.!?…।\n]+[.!?…।]*["'”’)]?|[^.!?…।\n]+$/g);
  if (!parts) return [cleaned];
  return parts.map((p) => p.trim()).filter(Boolean);
}
