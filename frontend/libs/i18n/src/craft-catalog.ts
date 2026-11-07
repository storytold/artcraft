// Reading craft-i18n's TSV catalogs into i18next resources. The format is craft-i18n's
// docs/catalog-format.md, and the checks follow craft-libs' `craft-i18n` crate: a row that breaks
// a rule is skipped and reported, so the app still runs against a newer catalog, with that string
// in English.

/** A row that passed, with its columns unescaped. */
export interface CatalogRow {
  context: string;
  source: string;
  translation: string;
}

/** i18next resources for one locale, and one problem (`common: line N: …`) per row skipped. */
export interface CatalogResources {
  resources: Record<string, string>;
  problems: string[];
}

const RESERVED = ["@plural", "@id", "@msg"];
const PLURAL_ORDER = ["zero", "one", "two", "few", "many", "other"] as const;
const INVISIBLE = /[\p{Cc}\uFEFF]/u;

/**
 * The rows of a catalog whose locale has `forms` plural forms, and one problem (`line N: …`) per
 * row skipped. Of a row defined twice, the first is kept.
 */
export function parseCatalog(text: string, forms: number): { rows: CatalogRow[]; problems: string[] } {
  const rows: CatalogRow[] = [];
  const problems: string[] = [];
  const seen = new Set<string>();
  const lines = text.replace(/^\uFEFF/, "").split("\n");
  lines.forEach((raw, i) => {
    const line = raw.endsWith("\r") ? raw.slice(0, -1) : raw;
    if (line === "" || line.startsWith("#")) return;
    try {
      const row = parseRow(line, forms);
      const key = `${row.context}\t${row.source}`;
      if (seen.has(key)) {
        problems.push(`line ${i + 1}: defined twice (same context and source text); the first is kept`);
        return;
      }
      seen.add(key);
      rows.push(row);
    } catch (error) {
      problems.push(`line ${i + 1}: ${(error as Error).message}`);
    }
  });
  return { rows, problems };
}

/**
 * The CLDR plural categories whole numbers 0 to 1000 reach in `code`, in the order `@plural`
 * forms list them; undefined when the runtime has no rules for the language. CLDR's `pt` is
 * Brazilian (0 is singular), so Portuguese other than `pt-br` takes `pt-PT`'s rules.
 */
export function pluralCategories(code: string): string[] | undefined {
  const lower = code.toLowerCase();
  const tag = lower === "pt" || (lower.startsWith("pt-") && lower !== "pt-br") ? "pt-PT" : code;
  let rules: Intl.PluralRules;
  try {
    rules = new Intl.PluralRules(tag);
  } catch {
    return undefined;
  }
  // Intl falls back to the default locale's rules for a language it doesn't know.
  const language = (locale: string) => locale.toLowerCase().split("-")[0];
  if (language(rules.resolvedOptions().locale) !== language(tag)) return undefined;
  const reached = new Set<string>();
  for (let n = 0; n <= 1000; n++) reached.add(rules.select(n));
  return PLURAL_ORDER.filter((category) => reached.has(category));
}

/**
 * i18next resources for `code` from its shared catalog and ArtCraft's own (`""` for a missing
 * file); an ArtCraft row wins over the shared one.
 *
 * Keys are the English source text with `{name}` written as i18next's `{{name}}`. A row with a
 * context is stored as `<source>_<context>`, i18next's context key, so `t(source, { context })`
 * falls back to the plain row. An `@plural` row `one|other` becomes `one|other_<category>` keys
 * for the plural suffixes i18next looks up; see `tn` in index.ts.
 */
export function catalogResources(code: string, common: string, app: string): CatalogResources {
  const problems: string[] = [];
  const categories = pluralCategories(code);
  if (!categories) problems.push("no plural rules; plurals show in English");
  const resources: Record<string, string> = {};
  for (const [name, text] of [["common", common], ["app", app]] as const) {
    const parsed = parseCatalog(text, categories?.length ?? 1);
    problems.push(...parsed.problems.map((problem) => `${name}: ${problem}`));
    for (const row of parsed.rows) {
      if (row.context === "@plural") {
        if (categories) addPlural(resources, row, categories);
        continue;
      }
      const suffix = row.context ? `_${row.context}` : "";
      resources[i18nextText(row.source) + suffix] = i18nextText(row.translation);
      // English that shows braces literally (`{model}_{date}.{ext}`) is looked up as written.
      if (row.source.includes("{")) resources[row.source + suffix] = row.translation;
    }
  }
  return { resources, problems };
}

/** `{name}` placeholders written as i18next's `{{name}}`. */
export function i18nextText(text: string): string {
  return text.replace(/\{([^{}]*)\}/g, "{{$1}}");
}

function addPlural(resources: Record<string, string>, row: CatalogRow, categories: string[]) {
  const base = row.source.split("|").map(i18nextText).join("|");
  const forms = row.translation.split("|").map(i18nextText);
  for (const category of PLURAL_ORDER) {
    const index = categories.indexOf(category);
    // A category whole numbers up to 1000 never reach (French `many` for a million) takes the last
    // form. `zero` is left out then, since i18next tries `_zero` first for every count of 0.
    if (index < 0 && category === "zero") continue;
    resources[`${base}_${category}`] = forms[index < 0 ? forms.length - 1 : index];
  }
}

function parseRow(text: string, forms: number): CatalogRow {
  const columns = text.split("\t");
  if (columns.length !== 3) throw new Error(`${columns.length} columns; expected 3`);
  if (INVISIBLE.test(columns.join(""))) throw new Error("invisible character in the row");
  const [context, source, translation] = columns.map(unescape);
  if (!source || !translation) throw new Error("empty source text or translation");
  if (context === "@plural") {
    checkPlural(source, translation, forms);
  } else if (context.startsWith("@") && !RESERVED.includes(context)) {
    throw new Error(`unknown reserved context ${JSON.stringify(context)}`);
  } else if (context !== "@id") {
    if (!samePlaceholders(source, translation)) throw new Error("placeholders differ from the source text");
    if (source.endsWith("…") !== translation.endsWith("…")) {
      throw new Error("trailing … differs from the source text");
    }
  }
  return { context, source, translation };
}

function checkPlural(source: string, translation: string, forms: number) {
  const english = source.split("|");
  if (english.length !== 2) throw new Error("plural source text must be one|other");
  const [one, other] = english;
  if (!one || !other || !samePlaceholders(one, other)) {
    throw new Error("plural source forms must be nonempty with the same placeholders");
  }
  const translated = translation.split("|");
  if (translated.length !== forms || translated.some((form) => !form)) {
    throw new Error(`expected ${forms} nonempty plural forms`);
  }
  if (translated.some((form) => !samePlaceholders(form, other))) {
    throw new Error("plural form placeholders differ from the source text");
  }
}

function unescape(text: string): string {
  return text.replace(/\\(.?)/g, (_, escaped: string) => {
    if (escaped === "n") return "\n";
    if (escaped === "t") return "\t";
    if (escaped === "\\") return "\\";
    throw new Error(escaped ? `unknown escape \\${escaped}` : "trailing backslash");
  });
}

/** Whether both texts have the same `{name}` placeholders; translations may reorder them. */
function samePlaceholders(a: string, b: string): boolean {
  const names = (text: string) => [...text.matchAll(/\{([^}]*)\}/g)].map((match) => match[1]).sort();
  return names(a).join("\0") === names(b).join("\0");
}
