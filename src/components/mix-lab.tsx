"use client";

import { useMemo, useState } from "react";
import { analyzeMix, type MixAnalysis, type MixLang } from "@/lib/mix-analyze";
import { cn } from "@/lib/utils";

const LANG_LABEL: Record<MixLang, string> = {
  "hi-deva": "Hindi, Devanagari script",
  "hi-roman": "Hindi, Roman script",
  en: "English",
};

const TOKEN_UNDERLINE: Record<MixLang, string> = {
  "hi-deva": "border-sindoor-bright",
  "hi-roman": "border-marigold-bright",
  en: "border-peacock-bright",
};

const STRIP_FILL: Record<MixLang, string> = {
  "hi-deva": "bg-sindoor-bright",
  "hi-roman": "bg-marigold-bright",
  en: "bg-peacock-bright",
};

const STRIP_ORDER: MixLang[] = ["hi-deva", "hi-roman", "en"];

const PRESETS: { label: string; text: string }[] = [
  {
    label: "Cricket commentary",
    text: "yaar kal match dekha? last over mein pure six runs chahiye the, unreal finish tha",
  },
  {
    label: "Rickshaw bargaining",
    text: "bhaiya station chalogey? meter se chalo, itna zyada mat maango, paise ped par nahi ugte",
  },
  {
    label: "Group chat",
    text: "kal party hai mere ghar par, sab log aa rahe ho na? bring your own drinks, khana main banaungi",
  },
];

const DEFAULT_TEXT = PRESETS[0]!.text;

function summarize(analysis: MixAnalysis): string {
  const total = analysis.tokens.length;
  if (total === 0) return "Kuch nahi likha — type a sentence and press Decode.";
  const parts = STRIP_ORDER.filter((lang) => analysis.counts[lang]).map(
    (lang) => `${analysis.counts[lang]} ${LANG_LABEL[lang]}`,
  );
  return `${total} shabdon mein se: ${parts.join(", ")}.`;
}

export function MixLab(): React.JSX.Element {
  const [input, setInput] = useState(DEFAULT_TEXT);
  const [analysis, setAnalysis] = useState<MixAnalysis>(() => analyzeMix(DEFAULT_TEXT));
  const [pass, setPass] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const summary = useMemo(() => summarize(analysis), [analysis]);
  const scripts = useMemo(() => {
    const set = new Set<string>();
    for (const token of analysis.tokens) {
      set.add(token.lang === "en" || token.lang === "hi-roman" ? "Roman" : "Devanagari");
    }
    return [...set];
  }, [analysis]);

  function decode(text: string): void {
    if (!text.trim()) {
      setError("Pehle kuch likho — the lab needs a sentence to decode.");
      return;
    }
    setError(null);
    setAnalysis(analyzeMix(text));
    setPass((p) => p + 1);
  }

  const total = analysis.tokens.length;

  return (
    <section aria-labelledby="mix-lab-heading" className="bg-ink text-[#f4f1e8]">
      <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
        <h2
          id="mix-lab-heading"
          className="max-w-3xl font-display text-4xl leading-[1.05] font-semibold text-balance sm:text-6xl"
        >
          Tumhara sentence, <span className="font-deva font-normal">यहाँ</span> decode karo.
        </h2>
        <p className="mt-4 max-w-xl font-lab text-base leading-relaxed text-[#c9c9d6] sm:text-lg">
          Paste a Hinglish sentence the way you would actually type it. The lab reads it back word
          by word and shows where the Hindi ends and the English begins.
        </p>

        <div className="mt-8">
          <label
            htmlFor="mix-input"
            className="font-lab text-sm font-medium text-[#c9c9d6]"
          >
            Type or paste your sentence
          </label>
          <textarea
            id="mix-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
            spellCheck={false}
            className="mt-2 w-full resize-y border-0 border-b-2 border-[#4a4a72] bg-transparent font-lab text-2xl leading-snug text-[#f4f1e8] placeholder:text-[#6d6d8c] focus:border-marigold-bright focus:ring-0 focus:outline-none sm:text-3xl"
            placeholder="yaar aaj dinner plan karein? I am starving"
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => decode(input)}
            className="bg-marigold px-6 py-2.5 font-lab text-base font-semibold text-ink-deep hover:bg-marigold-bright focus-visible:ring-2 focus-visible:ring-marigold-bright focus-visible:ring-offset-2 focus-visible:ring-offset-ink focus-visible:outline-none"
          >
            Decode
          </button>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Try a sample">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setInput(preset.text);
                  decode(preset.text);
                }}
                className="border border-[#4a4a72] px-3 py-1.5 font-lab text-sm text-[#c9c9d6] hover:border-marigold-bright hover:text-[#f4f1e8] focus-visible:ring-2 focus-visible:ring-marigold-bright focus-visible:ring-offset-2 focus-visible:ring-offset-ink focus-visible:outline-none"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {error !== null && (
          <p role="alert" className="mt-4 font-lab text-sm text-marigold-bright">
            {error}
          </p>
        )}

        <div aria-live="polite" className="mt-10">
          <p className="font-lab text-3xl leading-relaxed font-medium text-balance sm:text-4xl">
            {analysis.tokens.map((token, i) => (
              <span
                key={`${pass}-${i}`}
                className="mr-[0.26em] inline-block last:mr-0"
              >
                <span
                  // Remounted on every decode (outer key includes pass), so the
                  // cascade replays in reading order.
                  title={LANG_LABEL[token.lang]}
                  style={{ animationDelay: `${Math.min(i * 45, 1500)}ms` }}
                  className={cn(
                    "decode-token border-b-[3px] pb-0.5",
                    TOKEN_UNDERLINE[token.lang],
                  )}
                >
                  {token.text}
                </span>
              </span>
            ))}
          </p>

          {total > 0 && (
            <div className="mt-8 max-w-2xl">
              <div
                className="flex h-2.5 w-full overflow-hidden bg-ink-deep"
                role="img"
                aria-label={summary}
              >
                {STRIP_ORDER.filter((lang) => analysis.counts[lang]).map((lang) => (
                  <div
                    key={lang}
                    style={{ width: `${((analysis.counts[lang] ?? 0) / total) * 100}%` }}
                    className={STRIP_FILL[lang]}
                  />
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
                {STRIP_ORDER.filter((lang) => analysis.counts[lang]).map((lang) => (
                  <span key={lang} className="font-lab text-sm text-[#c9c9d6]">
                    <span
                      aria-hidden="true"
                      className={cn("mr-1.5 inline-block size-2.5", STRIP_FILL[lang])}
                    />
                    {LANG_LABEL[lang]}, {Math.round(((analysis.counts[lang] ?? 0) / total) * 100)}%
                  </span>
                ))}
              </div>
              <p className="mt-4 font-lab text-sm text-[#c9c9d6]">
                {total} shabd, {scripts.join(" plus ")} script{scripts.length > 1 ? "s" : ""}.
                Devanagari spellings are read straight from the script, Roman Hindi from everyday
                vocabulary, everything else counts as English.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
