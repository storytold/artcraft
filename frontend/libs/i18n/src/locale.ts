import zhTW from "./zh-TW.json";

export type InterfaceLanguage = "en" | "zh-TW";
export const LANGUAGE_STORAGE_KEY = "artcraft.interfaceLanguage";
const listeners = new Set<() => void>();
let preference: InterfaceLanguage | undefined;
const catalog: Readonly<Record<string, string>> = zhTW;

export function languageFromTag(tag: string): InterfaceLanguage {
  const parts = tag.toLowerCase().replaceAll("_", "-").split("-");
  return parts[0] === "zh" &&
    (parts.includes("hant") ||
      (!parts.includes("hans") && parts.some((p) => ["tw", "hk", "mo"].includes(p))))
    ? "zh-TW" : "en";
}

export function getLanguage(): InterfaceLanguage {
  if (preference) return preference;
  if (typeof window === "undefined") return "en";
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === "en" || stored === "zh-TW") return stored;
  } catch { /* Storage can be unavailable in private or embedded contexts. */ }
  return languageFromTag(window.navigator.language);
}

export function setLanguage(language: InterfaceLanguage): void {
  // Preferences are also accepted from JS callers: ignore invalid input.
  if (language !== "en" && language !== "zh-TW") return;
  preference = language;
  if (typeof document !== "undefined") document.documentElement.lang = language;
  try { window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language); }
  catch { /* The in-memory preference still works. */ }
  listeners.forEach((notify) => notify());
}

export function subscribeLanguage(notify: () => void): () => void {
  listeners.add(notify);
  return () => { listeners.delete(notify); };
}

export function translate(language: InterfaceLanguage, source: string): string {
  // Own properties only: user labels such as "constructor" must remain unchanged.
  return language === "zh-TW" && Object.hasOwn(catalog, source) && catalog[source]
    ? catalog[source] : source;
}
