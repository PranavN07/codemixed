import { Languages } from "lucide-react";
import { MixLab } from "@/components/mix-lab";
import { ThemeToggle } from "@/components/theme-toggle";
import { TranslatorWorkbench } from "@/components/translator-workbench";

export default function Home(): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Languages className="size-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">CodeMixed</h1>
              <p className="text-xs text-muted-foreground">
                Segregate mixed-language paragraphs, then unify into one language
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <MixLab />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6 space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Multilingual paragraph segregator</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Powered by Next.js + TypeScript API routes and Gemini. Paste code-mixed text, see each
            sentence&apos;s language, then convert everything into English, Hindi, Hinglish, Spanish, French,
            or German.
          </p>
        </div>
        <TranslatorWorkbench />
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-1 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>Backend: TypeScript-only Next.js Route Handlers · No Python</span>
          <span>
            Get a key at{" "}
            <a
              className="underline underline-offset-2"
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
            >
              Google AI Studio
            </a>{" "}
            → set <code>GEMINI_API_KEY</code> in <code>.env.local</code>
          </span>
        </div>
      </footer>
    </div>
  );
}
