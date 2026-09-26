/** Color per language code for segregation view (light/dark safe via Tailwind classes). */
export const LANG_BADGE_CLASSES: Record<string, string> = {
  en: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800",
  hi: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-200 dark:border-orange-800",
  hinglish:
    "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800",
  es: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-800",
  fr: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-800",
  de: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-800",
};

export const LANG_DOT_CLASSES: Record<string, string> = {
  en: "bg-blue-500",
  hi: "bg-orange-500",
  hinglish: "bg-amber-500",
  es: "bg-red-500",
  fr: "bg-purple-500",
  de: "bg-green-500",
};

export function badgeClassFor(code: string): string {
  return LANG_BADGE_CLASSES[code] ?? "bg-muted text-muted-foreground";
}

export function dotClassFor(code: string): string {
  return LANG_DOT_CLASSES[code] ?? "bg-gray-400";
}
