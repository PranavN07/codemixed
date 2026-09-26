"use client";

import { ArrowRight, Check, Copy, Languages, Loader2, RotateCcw, Scissors, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { HistoryPanel } from "@/components/history-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { clearHistory, loadHistory, saveHistoryEntry } from "@/lib/history";
import { badgeClassFor, dotClassFor } from "@/lib/lang-colors";
import { SUPPORTED_LANGUAGES } from "@/lib/languages";
import type { HistoryEntry, SegregateResponse, UnifyResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

const SAMPLES: { label: string; text: string }[] = [
  {
    label: "Hindi + English",
    text: "Hello friends, kaise ho aap sab? I hope you are doing well. Aaj hum ek naye project par kaam karenge. This will be very exciting for everyone. Bahut maza aayega, trust me!",
  },
  {
    label: "EN + HI + ES",
    text: "Good morning everyone. Aaj mausam bahut achha hai. Hola amigos, ¿cómo están hoy? I am learning new languages every day. Dhanyavad for joining this session!",
  },
  {
    label: "EN + FR + DE + HI",
    text: "Bonjour tout le monde, welcome to our demo. Guten Morgen, wie geht es Ihnen heute? Main aasha karta hoon aap sab theek hain. This paragraph mixes four languages on purpose.",
  },
];

export function TranslatorWorkbench(): React.JSX.Element {
  const [input, setInput] = useState("");
  const [segments, setSegments] = useState<SegregateResponse["segments"]>([]);
  const [detected, setDetected] = useState<SegregateResponse["detectedLanguages"]>([]);
  const [demoMode, setDemoMode] = useState(false);
  const [targetLang, setTargetLang] = useState("en");
  const [unified, setUnified] = useState<UnifyResponse | null>(null);
  const [segLoading, setSegLoading] = useState(false);
  const [unifyLoading, setUnifyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Load client-only localStorage history after mount (avoids SSR hydration mismatch).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory(loadHistory());
  }, []);

  const handleSegregate = useCallback(async () => {
    setError(null);
    setUnified(null);
    if (!input.trim()) {
      setError("Please paste a paragraph first.");
      return;
    }
    setSegLoading(true);
    try {
      const res = await fetch("/api/segregate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });
      const data = (await res.json()) as SegregateResponse & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Segregation failed");
      setSegments(data.segments);
      setDetected(data.detectedLanguages);
      setDemoMode(data.demoMode);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Segregation failed");
    } finally {
      setSegLoading(false);
    }
  }, [input]);

  const handleUnify = useCallback(async () => {
    setError(null);
    if (segments.length === 0) {
      setError("Segregate the paragraph first, then convert.");
      return;
    }
    setUnifyLoading(true);
    try {
      const res = await fetch("/api/unify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segments: segments.map((s) => ({ id: s.id, text: s.text, langCode: s.langCode })),
          targetLang,
        }),
      });
      const data = (await res.json()) as UnifyResponse & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Conversion failed");
      setUnified(data);
      setDemoMode((prev) => prev || data.demoMode);
      const targetName = data.targetLangName;
      const entry: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
        inputPreview: input.slice(0, 160),
        inputLength: input.length,
        targetLang: data.targetLang,
        targetLangName: targetName,
        segmentCount: data.translations.length,
        detectedLanguages: detected.map((d) => d.name),
        unifiedPreview: data.unifiedText.slice(0, 160),
        unifiedText: data.unifiedText,
      };
      setHistory(saveHistoryEntry(entry));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed");
    } finally {
      setUnifyLoading(false);
    }
  }, [segments, targetLang, input, detected]);

  const handleCopy = useCallback(async () => {
    if (!unified) return;
    try {
      await navigator.clipboard.writeText(unified.unifiedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Copy failed — select the text manually.");
    }
  }, [unified]);

  const handleReset = useCallback(() => {
    setInput("");
    setSegments([]);
    setDetected([]);
    setUnified(null);
    setError(null);
  }, []);

  return (
    <div className="space-y-6">
      {demoMode && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <strong>Demo mode:</strong> no translation key is set, so detection uses a built-in
          heuristic and conversion passes text through. Add <code>GEMINI_API_KEY</code> to{" "}
          <code>.env.local</code> and restart for full AI-powered accuracy.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Step 1 — input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                1
              </span>
              Input paragraph
            </CardTitle>
            <CardDescription>Paste a paragraph mixing multiple languages.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Hello dosto! Aaj ka din kaisa hai? Hola, ¿cómo estás? Bonjour, tout va bien ?"
              rows={9}
              maxLength={20000}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{input.length.toLocaleString()} / 20,000 chars</span>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLES.map((s) => (
                  <Button key={s.label} variant="outline" size="sm" onClick={() => setInput(s.text)}>
                    <Sparkles className="size-3" /> {s.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSegregate} disabled={segLoading || !input.trim()} className="flex-1">
                {segLoading ? <Loader2 className="size-4 animate-spin" /> : <Scissors className="size-4" />}
                Segregate by language
              </Button>
              <Button variant="ghost" size="icon" onClick={handleReset} aria-label="Clear all">
                <RotateCcw className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Step 2 — segregated view */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                2
              </span>
              Segregated sentences
            </CardTitle>
            <CardDescription>
              {segments.length > 0
                ? `${segments.length} sentence(s) in ${detected.length} language(s)`
                : "Per-sentence language detection appears here."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {detected.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {detected.map((d) => (
                  <Badge key={d.code} variant="outline" className={cn("gap-1.5", badgeClassFor(d.code))}>
                    <span className={cn("size-2 rounded-full", dotClassFor(d.code))} />
                    {d.name} × {d.count}
                  </Badge>
                ))}
              </div>
            )}
            {segments.length === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Nothing segregated yet.
              </p>
            ) : (
              <ul className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                {segments.map((s) => (
                  <li key={s.id} className="rounded-lg border p-3">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <Badge variant="outline" className={cn(badgeClassFor(s.langCode))}>
                        #{s.id} · {s.langName}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {(s.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{s.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Step 3 — unify */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              3
            </span>
            Convert to one language
          </CardTitle>
          <CardDescription>Pick the desired output language and unify the paragraph.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex items-center gap-2 sm:w-72">
              <Languages className="size-4 shrink-0 text-muted-foreground" />
              <Select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} aria-label="Target language">
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name} ({l.nativeName})
                  </option>
                ))}
              </Select>
            </div>
            <Button onClick={handleUnify} disabled={unifyLoading || segments.length === 0} className="sm:w-auto">
              {unifyLoading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
              Convert to {SUPPORTED_LANGUAGES.find((l) => l.code === targetLang)?.name ?? targetLang}
            </Button>
            {unified && (
              <Button variant="outline" onClick={handleCopy}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "Copied!" : "Copy result"}
              </Button>
            )}
          </div>

          {unified ? (
            <div className="space-y-3">
              <Separator />
              <div className="rounded-lg bg-muted p-4">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Unified paragraph · {unified.targetLangName}
                </p>
                <p className="text-[15px] leading-relaxed">{unified.unifiedText}</p>
              </div>
              <details className="text-sm">
                <summary className="cursor-pointer font-medium">Per-sentence translation details</summary>
                <ul className="mt-2 space-y-2">
                  {unified.translations.map((t) => (
                    <li key={t.id} className="rounded-lg border p-3">
                      <div className="mb-1 flex flex-wrap items-center gap-1.5 text-xs">
                        <Badge variant="outline" className={badgeClassFor(t.sourceLang)}>
                          #{t.id} {t.sourceLangName}
                        </Badge>
                        <ArrowRight className="size-3 text-muted-foreground" />
                        <Badge variant="secondary">{unified.targetLangName}</Badge>
                        {!t.wasTranslated && <span className="text-muted-foreground">(kept as-is)</span>}
                      </div>
                      <p className="text-muted-foreground">{t.originalText}</p>
                      {t.wasTranslated && <p className="mt-1 font-medium">{t.translatedText}</p>}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Unified output will appear here.
            </p>
          )}
        </CardContent>
      </Card>

      <HistoryPanel
        entries={history}
        onClear={() => {
          clearHistory();
          setHistory([]);
        }}
        onRestore={(entry) => {
          setUnified({
            unifiedText: entry.unifiedText,
            targetLang: entry.targetLang,
            targetLangName: entry.targetLangName,
            translations: [],
            demoMode,
          });
          setInput(entry.inputPreview);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </div>
  );
}
