import { createInstance } from "i18next";
import { initReactI18next, useTranslation as useReactTranslation } from "react-i18next";
import en from "./locales/en.json";
import zhCN from "./locales/zh-CN.json";

export const LOCALE_STORAGE_KEY = "artcraft-locale";
export const SUPPORTED_LOCALES = ["en", "zh-CN"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "zh-CN";
}

export function readLocale(): Locale {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(stored) ? stored : "en";
  } catch {
    // Storage can be unavailable in a restricted webview. English is the default.
    return "en";
  }
}

export const i18n = createInstance();
void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, "zh-CN": { translation: zhCN } },
  lng: readLocale(),
  fallbackLng: "en",
  supportedLngs: [...SUPPORTED_LOCALES],
  load: "currentOnly",
  // English source messages are the keys, including punctuation and periods.
  keySeparator: false,
  nsSeparator: false,
  initAsync: false,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

i18n.on("languageChanged", updateDocumentLanguage);
updateDocumentLanguage(i18n.language);

export function useTranslation() {
  return useReactTranslation(undefined, { i18n });
}

export async function setLocale(locale: Locale): Promise<void> {
  if (!isLocale(locale)) return;
  await i18n.changeLanguage(locale);
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Switching still works for the current session when persistence is blocked.
  }
}

function updateDocumentLanguage(language: string) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = isLocale(language) ? language : "en";
  }
}

export { Trans } from "react-i18next";
