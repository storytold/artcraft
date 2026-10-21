/** One craft-i18n locale built into the app. */
export interface EmbeddedCatalog {
  /** Lowercase BCP 47, as craft-i18n names its directories (`pt-br`, `zh-hans`). */
  code: string;
  /** The language's name in itself, from `@id language.name`; the code when there is none. */
  name: string;
  /** The locale's shared catalog and ArtCraft's own. */
  load: () => Promise<{ common: string; app: string }>;
}

/**
 * The craft-i18n catalogs built into the app. Empty here: the `craftI18n` Vite plugin
 * (build/vite-plugins.ts) replaces this module when `CRAFT_I18N_DIR` is set.
 */
export const CRAFT_CATALOGS: readonly EmbeddedCatalog[] = [];
