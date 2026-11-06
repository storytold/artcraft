// Whether a language is written right to left, by the same rules as
// craft-libs' `direction()` (crates/i18n/src/scripts.rs), so ArtCraft agrees
// with the other Craft apps: a script subtag wins, then a region that implies a
// script (`pa-PK` is written in Arabic script), then the language's usual
// script.

const RIGHT_TO_LEFT_SCRIPTS = new Set(["arab", "hebr", "syrc", "thaa"]);

const RIGHT_TO_LEFT_LANGUAGES = new Set([
  "ar",
  "ckb",
  "fa",
  "ks",
  "ps",
  "sd",
  "ug",
  "ur",
  "he",
  "yi",
  "syr",
  "dv",
]);

// Regions where a language is written in another script than usual, copied
// from craft-libs' `region_script()`. Only the rows that change the direction
// are needed.
const RIGHT_TO_LEFT_REGIONS: Record<string, string[]> = {
  az: ["iq", "ir"],
  ha: ["cm", "sd"],
  kk: ["af", "cn", "ir", "mn"],
  ku: ["iq", "ir", "lb"],
  ky: ["cn"],
  ms: ["cc"],
  pa: ["pk"],
  tg: ["pk"],
  uz: ["af"],
};
const LEFT_TO_RIGHT_REGIONS: Record<string, string[]> = {
  sd: ["in"],
  ug: ["kz", "mn"],
};

const GLIBC_SCRIPT_MODIFIERS: Record<string, string> = {
  latin: "latn",
  cyrillic: "cyrl",
};

/**
 * Whether `languageTag` (`ar-EG`, `pa-Arab-PK`, `fa_IR.UTF-8`) is written right
 * to left. An empty or unknown tag is left to right.
 */
export function isRightToLeft(languageTag: string): boolean {
  const { language, script, region } = parseLanguageTag(languageTag);
  if (script) {
    return RIGHT_TO_LEFT_SCRIPTS.has(script);
  }
  if (region && RIGHT_TO_LEFT_REGIONS[language]?.includes(region)) {
    return true;
  }
  if (region && LEFT_TO_RIGHT_REGIONS[language]?.includes(region)) {
    return false;
  }
  return RIGHT_TO_LEFT_LANGUAGES.has(language);
}

function parseLanguageTag(tag: string): {
  language: string;
  script?: string;
  region?: string;
} {
  const lower = tag.trim().toLowerCase();
  const base = lower.split(/[.@]/)[0].replace(/_/g, "-");
  const [language = "", ...rest] = base.split("-").filter(Boolean);
  // glibc names a script as a modifier: `sr_RS@latin`.
  const modifier = lower.split("@")[1];
  const script =
    GLIBC_SCRIPT_MODIFIERS[modifier ?? ""] ??
    rest.find((part) => /^[a-z]{4}$/.test(part));
  const region = rest.find((part) => /^([a-z]{2}|\d{3})$/.test(part));
  return { language, script, region };
}
