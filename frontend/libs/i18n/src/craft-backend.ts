import type { BackendModule, ReadCallback } from "i18next";
import { catalogResources } from "./craft-catalog";
import type { EmbeddedCatalog } from "./embedded";

/** `code` in canonical BCP 47 casing (`pt-BR`, `zh-Hans`), as i18next writes language codes. */
export function canonicalCode(code: string): string {
  try {
    return Intl.getCanonicalLocales(code)[0] ?? code;
  } catch {
    return code;
  }
}

/** The embedded catalog for an i18next language code, matched in any case. */
export function findCatalog(catalogs: readonly EmbeddedCatalog[], code: string): EmbeddedCatalog | undefined {
  const lower = code.toLowerCase();
  return catalogs.find((catalog) => catalog.code.toLowerCase() === lower);
}

/**
 * An i18next backend that serves the embedded craft-i18n catalogs. A language with no catalog
 * gets no rows, so its strings come from the bundled resources or show in English. Skipped rows
 * go to `warn`.
 */
export function craftCatalogBackend(
  catalogs: readonly EmbeddedCatalog[],
  warn: (message: string) => void = console.warn,
): BackendModule {
  return {
    type: "backend",
    init() {},
    read(language: string, namespace: string, callback: ReadCallback) {
      const catalog = namespace === "translation" ? findCatalog(catalogs, language) : undefined;
      if (!catalog) {
        callback(null, {});
        return;
      }
      catalog.load().then(
        ({ common, app }) => {
          const { resources, problems } = catalogResources(catalog.code, common, app);
          for (const problem of problems) warn(`craft-i18n ${catalog.code}/${problem}`);
          callback(null, resources);
        },
        (error: Error) => callback(error, false),
      );
    },
  };
}

/**
 * The languages i18next tries after `code`, ending with English. Only a region falls back to its
 * language (`pt-BR` → `pt`), and only when that is embedded too; a script doesn't, since
 * `sr-Latn` → `sr` would show Cyrillic. `backing` names a catalog that fills in for a bundled
 * language (`zh-CN` → `zh-Hans`).
 */
export function fallbackChain(
  code: string,
  catalogs: readonly EmbeddedCatalog[],
  backing: Readonly<Record<string, string>> = {},
): string[] {
  const chain: string[] = [];
  const backed = backing[code];
  if (backed && findCatalog(catalogs, backed)) chain.push(canonicalCode(backed));
  const dash = code.lastIndexOf("-");
  const region = code.slice(dash + 1);
  if (dash > 0 && /^([A-Za-z]{2}|\d{3})$/.test(region)) {
    const parent = code.slice(0, dash);
    if (findCatalog(catalogs, parent)) chain.push(canonicalCode(parent));
  }
  if (code !== "en") chain.push("en");
  return chain;
}
