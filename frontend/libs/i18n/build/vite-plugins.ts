// Build-time inputs from two optional checkouts, as craft-i18n's and craft-fonts'
// docs/integration.md describe for the Rust apps:
//   CRAFT_I18N_DIR    a craft-i18n checkout: its catalogs are built in (src/embedded.ts).
//   CRAFT_FONTS_DIR   a craft-fonts checkout: its Noto faces are served beside the app and used as
//                     fallbacks for the scripts they cover.
// Unset, the app builds in English with the system fonts. CRAFT_I18N_REQUIRED=1 and
// CRAFT_FONTS_REQUIRED=1 turn a missing or broken checkout into a build error.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import * as path from "node:path";
import { normalizePath, type Plugin } from "vite";

const APP = "artcraft";
const EMBEDDED_MODULE = normalizePath(path.resolve(__dirname, "../src/embedded.ts"));
const CATALOG_PREFIX = "virtual:craft-i18n/";
const FONTS_PATH = "craft-fonts/";

/** Builds the craft-i18n catalogs into the app when `CRAFT_I18N_DIR` names a checkout. */
export function craftI18n(dir = process.env.CRAFT_I18N_DIR): Plugin {
  const required = process.env.CRAFT_I18N_REQUIRED === "1";
  let locales: CatalogLocale[] = [];
  return {
    name: "craft-i18n",
    enforce: "pre",
    buildStart() {
      if (!dir && required) this.error("CRAFT_I18N_REQUIRED=1 but CRAFT_I18N_DIR is unset");
      locales = dir ? findLocales(dir, required, (message) => this.warn(message)) : [];
      for (const locale of locales) {
        this.addWatchFile(locale.common);
        this.addWatchFile(locale.app);
      }
    },
    resolveId(id) {
      return id.startsWith(CATALOG_PREFIX) ? `\0${id}` : null;
    },
    load(id) {
      if (id.split("?")[0] === EMBEDDED_MODULE) return embeddedModule(locales);
      if (!id.startsWith(`\0${CATALOG_PREFIX}`)) return null;
      const locale = locales.find((l) => `\0${CATALOG_PREFIX}${l.code}` === id);
      if (!locale) return null;
      const read = (file: string) => (existsSync(file) ? readFileSync(file, "utf8") : "");
      return `export default ${JSON.stringify({ common: read(locale.common), app: read(locale.app) })};`;
    },
  };
}

/** Serves craft-fonts' Noto faces when `CRAFT_FONTS_DIR` names a checkout. */
export function craftFonts(dir = process.env.CRAFT_FONTS_DIR): Plugin {
  const required = process.env.CRAFT_FONTS_REQUIRED === "1";
  let faces: CraftFace[] = [];
  let base = "/";
  return {
    name: "craft-fonts",
    configResolved(config) {
      base = config.base;
      const warn = (message: string) => config.logger.warn(`[craft-fonts] ${message}`);
      if (!dir) {
        if (required) throw new Error("CRAFT_FONTS_REQUIRED=1 but CRAFT_FONTS_DIR is unset");
        return;
      }
      faces = findFaces(dir, required, warn);
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? "").split("?")[0];
        const file = servedFiles(faces).find((f) => `${base}${FONTS_PATH}${f.name}` === url);
        if (!file) return next();
        res.setHeader("Content-Type", contentType(file.name));
        res.end(readFileSync(file.path));
      });
    },
    generateBundle() {
      for (const file of servedFiles(faces)) {
        this.emitFile({ type: "asset", fileName: FONTS_PATH + file.name, source: readFileSync(file.path) });
      }
    },
    transformIndexHtml() {
      if (faces.length === 0) return [];
      return [{ tag: "style", attrs: { "data-craft-fonts": "" }, children: fontFaceCss(faces, base), injectTo: "head" }];
    },
  };
}

// craft-i18n

interface CatalogLocale {
  code: string;
  name: string;
  common: string;
  app: string;
}

/**
 * The locales with ArtCraft's own catalog: a locale with only shared strings is left out, so the
 * app never offers a language it has barely been translated into.
 */
export function findLocales(dir: string, required: boolean, warn: (message: string) => void): CatalogLocale[] {
  const root = path.resolve(dir, "locales");
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    const message = `CRAFT_I18N_DIR=${dir} has no locales/ directory; building in English`;
    if (required) throw new Error(message);
    warn(message);
    return [];
  }
  return readdirSync(root)
    .filter((code) => !code.startsWith(".") && existsSync(path.join(root, code, `${APP}.tsv`)))
    .sort()
    .map((code) => {
      const common = path.join(root, code, "common.tsv");
      return { code, name: languageName(common) ?? code, common, app: path.join(root, code, `${APP}.tsv`) };
    });
}

function languageName(common: string): string | undefined {
  if (!existsSync(common)) return undefined;
  const row = readFileSync(common, "utf8")
    .split("\n")
    .find((line) => line.startsWith("@id\tlanguage.name\t"));
  return row?.split("\t")[2]?.trim() || undefined;
}

export function embeddedModule(locales: readonly CatalogLocale[]): string {
  const entries = locales.map(
    ({ code, name }) =>
      `  { code: ${JSON.stringify(code)}, name: ${JSON.stringify(name)}, ` +
      `load: () => import(${JSON.stringify(CATALOG_PREFIX + code)}).then((m) => m.default) },`,
  );
  return `export const CRAFT_CATALOGS = [\n${entries.join("\n")}\n];\n`;
}

// craft-fonts

interface CraftFace {
  family: string;
  style: string;
  path: string;
  name: string;
  licence: string;
  ranges: string;
  variable: boolean;
}

// The ranges of the scripts craft-fonts' Noto faces cover. A face downloads only when the page
// shows a character in its range that no earlier font in the stack has.
const SCRIPT_RANGES: Record<string, string> = {
  Arab: "U+0600-06FF, U+0750-077F, U+0870-08FF, U+FB50-FDFF, U+FE70-FEFF, U+10E60-10E7F, U+1EE00-1EEFF",
  Thai: "U+0E00-0E7F",
  // Noto Sans CJK also covers kana and Hangul, so it backs Japanese and Korean text too.
  Hans:
    "U+1100-11FF, U+2E80-2FDF, U+2FF0-303F, U+3040-30FF, U+3100-31FF, U+3200-33FF, U+3400-4DBF, " +
    "U+4E00-9FFF, U+A960-A97F, U+AC00-D7FF, U+F900-FAFF, U+FE30-FE4F, U+FF00-FFEF, U+20000-3134F",
};

export function findFaces(dir: string, required: boolean, warn: (message: string) => void): CraftFace[] {
  const manifest = path.resolve(dir, "fonts/manifest.txt");
  if (!existsSync(manifest)) {
    const message = `CRAFT_FONTS_DIR=${dir} has no fonts/manifest.txt; using the system fonts`;
    if (required) throw new Error(message);
    warn(message);
    return [];
  }
  const faces: CraftFace[] = [];
  for (const line of readFileSync(manifest, "utf8").split("\n")) {
    if (!line.trim() || line.startsWith("#")) continue;
    const [family, style, file, scripts, , licence] = line.split(" | ").map((field) => field.trim());
    const ranges = (scripts ?? "").split(",").map((script) => SCRIPT_RANGES[script]).filter(Boolean);
    if (!family?.startsWith("Noto ") || ranges.length === 0) continue;
    const fontPath = path.resolve(dir, file);
    if (!existsSync(fontPath)) {
      const message = `${file} is missing`;
      if (required) throw new Error(message);
      warn(message);
      continue;
    }
    faces.push({
      family,
      style,
      path: fontPath,
      name: path.basename(file),
      licence: path.resolve(dir, licence),
      ranges: ranges.join(", "),
      variable: hasTable(fontPath, "fvar"),
    });
  }
  return faces;
}

export function fontFaceCss(faces: readonly CraftFace[], base: string): string {
  const rules = faces.map((face) => {
    const weight = face.variable ? "100 900" : face.style === "Bold" ? "700" : "400";
    return (
      `@font-face { font-family: ${JSON.stringify(face.family)}; font-weight: ${weight}; ` +
      `font-display: swap; src: local(${JSON.stringify(face.family)}), ` +
      `url(${JSON.stringify(`${base}${FONTS_PATH}${face.name}`)}); unicode-range: ${face.ranges}; }`
    );
  });
  // The app's font stacks end in var(--craft-fonts, sans-serif).
  const families = [...new Set(faces.map((face) => JSON.stringify(face.family)))];
  return `${rules.join("\n")}\n:root { --craft-fonts: ${[...families, "sans-serif"].join(", ")}; }`;
}

/** The font files and their licences, by served name. */
function servedFiles(faces: readonly CraftFace[]): { name: string; path: string }[] {
  const files = new Map<string, string>();
  for (const face of faces) {
    files.set(face.name, face.path);
    files.set(`${path.parse(face.name).name}.OFL.txt`, face.licence);
  }
  return [...files].map(([name, file]) => ({ name, path: file }));
}

/** Whether an OpenType file has the table `tag` (`fvar` for a variable font). */
function hasTable(file: string, tag: string): boolean {
  const data = readFileSync(file);
  const count = data.readUInt16BE(4);
  for (let i = 0; i < count; i++) {
    if (data.toString("latin1", 12 + i * 16, 16 + i * 16) === tag) return true;
  }
  return false;
}

function contentType(name: string): string {
  if (name.endsWith(".otf")) return "font/otf";
  if (name.endsWith(".ttf")) return "font/ttf";
  return "text/plain; charset=utf-8";
}
