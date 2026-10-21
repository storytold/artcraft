import { createInstance, type TFunction } from "i18next";
import { initReactI18next, useTranslation as useReactTranslation } from "react-i18next";
import { setDocumentLanguage } from "@storyteller/common";
import { canonicalCode, craftCatalogBackend, fallbackChain } from "./craft-backend";
import { CRAFT_CATALOGS } from "./embedded";
import en from "./locales/en.json";
import zhCN from "./locales/zh-CN.json";

export const LOCALE_STORAGE_KEY = "artcraft-locale";

/** A language the interface offers: its code and its name in itself, for the picker. */
export interface Language {
  code: string;
  name: string;
}

// craft-i18n catalogs that fill in for a bundled language instead of being offered beside it.
const BACKING_CATALOGS: Record<string, string> = { "zh-CN": "zh-hans" };

const BUNDLED: readonly Language[] = [
  { code: "en", name: "English" },
  { code: "zh-CN", name: "简体中文" },
];

/** English first, then the bundled languages, then the embedded craft-i18n locales by code. */
export const LANGUAGES: readonly Language[] = [
  ...BUNDLED,
  ...CRAFT_CATALOGS.filter((catalog) => !Object.values(BACKING_CATALOGS).includes(catalog.code))
    .map((catalog) => ({ code: canonicalCode(catalog.code), name: catalog.name }))
    .filter((language) => !BUNDLED.some((bundled) => bundled.code === language.code))
    .sort((a, b) => a.code.localeCompare(b.code)),
];

export const SUPPORTED_LOCALES: readonly string[] = LANGUAGES.map((language) => language.code);
export type Locale = string;

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && SUPPORTED_LOCALES.includes(value);
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
void i18n
  .use(craftCatalogBackend(CRAFT_CATALOGS))
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, "zh-CN": { translation: zhCN } },
    // The bundled languages come from `resources`, the others from the craft-i18n backend.
    partialBundledLanguages: true,
    lng: readLocale(),
    fallbackLng: (code) => fallbackChain(code, CRAFT_CATALOGS, BACKING_CATALOGS),
    // i18next loads only supported languages, fallback-only catalogs included.
    supportedLngs: [...new Set([...SUPPORTED_LOCALES, ...CRAFT_CATALOGS.map((c) => canonicalCode(c.code))])],
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

/**
 * A count's wording, `{{n}}` filled in. `one` and `other` are the English forms; together
 * (`one|other`) they are the key of craft-i18n's `@plural` row, and they are the fallback.
 */
export function tn(t: TFunction, n: number, one: string, other: string, values: Record<string, unknown> = {}): string {
  return t(`${one}|${other}`, { ...values, count: n, n, defaultValue: n === 1 ? one : other }) as string;
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
    setDocumentLanguage(isLocale(language) ? language : "en");
  }
}

export { Trans } from "react-i18next";
