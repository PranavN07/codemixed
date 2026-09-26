export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  /** ISO code sent to Google Translate. `null` means handled client-side (e.g. Hinglish). */
  googleCode: string | null;
  note?: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: "en", name: "English", nativeName: "English", googleCode: "en" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", googleCode: "hi" },
  {
    code: "hinglish",
    name: "Hinglish",
    nativeName: "Hinglish",
    googleCode: null,
    note: "Hindi in Latin script (translated to Hindi, then romanized)",
  },
  { code: "es", name: "Spanish", nativeName: "Español", googleCode: "es" },
  { code: "fr", name: "French", nativeName: "Français", googleCode: "fr" },
  { code: "de", name: "German", nativeName: "Deutsch", googleCode: "de" },
];

export const SUPPORTED_CODES = new Set(SUPPORTED_LANGUAGES.map((l) => l.code));

/** Map Google ISO-639-1 codes (plus our virtual codes) to display names. */
const GOOGLE_TO_NAME: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  es: "Spanish",
  fr: "French",
  de: "German",
  hinglish: "Hinglish",
  und: "Undetermined",
};

export function getLangName(code: string): string {
  const direct = SUPPORTED_LANGUAGES.find((l) => l.code === code);
  if (direct) return direct.name;
  if (GOOGLE_TO_NAME[code]) return GOOGLE_TO_NAME[code];
  return code.toUpperCase();
}

export function resolveGoogleTarget(target: string): string {
  if (target === "hinglish") return "hi";
  return target;
}

export function isSupportedTarget(code: string): boolean {
  return SUPPORTED_CODES.has(code);
}
