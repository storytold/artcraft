// Public surface for the fonts subsystem. Ported verbatim from
// opencut-classic apps/web/src/fonts/. Hosts that mount the FontPicker
// (e.g. text/text-mask params) get the full atlas-backed picker for
// free; the loadFullFont helper is exposed for hosts that need to
// preload a Google font before rendering a frame.

export { SYSTEM_FONTS } from "./system-fonts";
export {
  loadFontAtlas,
  getCachedFontAtlas,
  clearFontAtlasCache,
  loadFullFont,
  loadFonts,
} from "./google-fonts";
export { useFontAtlas } from "./use-font-atlas";
export type {
  FontOption,
  GoogleFontMeta,
  FontAtlas,
  FontAtlasEntry,
} from "./types";
