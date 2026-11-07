export type TextDirection = "ltr" | "rtl";

export const DEFAULT_UI_LANGUAGE = "en";

// Fallback for webviews without Intl.Locale text info. Languages whose usual
// script is written right to left, and scripts that are.
const RTL_LANGUAGES = new Set([
  "ar", "arc", "ckb", "dv", "fa", "he", "iw", "ks", "lrc", "mzn", "nqo",
  "ps", "sd", "syr", "ug", "ur", "yi",
]);
const RTL_SCRIPTS = new Set([
  "adlm", "arab", "hebr", "mand", "nkoo", "rohg", "syrc", "thaa",
]);

/** Writing direction of a BCP 47 language tag such as `ar`, `he-IL` or `pa-Arab`. */
export function directionOfLanguage(tag: string): TextDirection {
  try {
    const locale = new Intl.Locale(tag) as Intl.Locale & {
      getTextInfo?: () => { direction?: string };
      textInfo?: { direction?: string };
    };
    const info = locale.getTextInfo?.() ?? locale.textInfo;
    if (info?.direction === "rtl" || info?.direction === "ltr") {
      return info.direction;
    }
  } catch {
    return "ltr";
  }
  const [language, ...subtags] = tag.toLowerCase().split(/[-_]/);
  const script = subtags.find((subtag) => subtag.length === 4);
  if (script) {
    return RTL_SCRIPTS.has(script) ? "rtl" : "ltr";
  }
  return RTL_LANGUAGES.has(language) ? "rtl" : "ltr";
}

/**
 * Sets `lang` and `dir` on the document root from the UI language. Tailwind's
 * `rtl:` variant and the logical (start/end) classes follow `dir`.
 */
export function setDocumentLanguage(
  tag: string = DEFAULT_UI_LANGUAGE,
  dir: TextDirection = directionOfLanguage(tag),
  root: HTMLElement = document.documentElement,
): void {
  root.lang = tag;
  root.dir = dir;
}
