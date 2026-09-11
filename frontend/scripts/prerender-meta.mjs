// Build-time per-route social-share prerendering.
//
// WHY: artcraft-website is a Vite SPA. The single dist/index.html that every
// route falls back to carries only homepage <title>/<description> and no Open
// Graph tags, so when any URL (e.g. /seedance-2) is shared on Discord/Slack/X,
// the crawler — which does NOT run JS — sees the homepage preview.
//
// WHAT: after `nx build`, this reads dist/index.html and, for every route in
// src/config/page-meta.ts, writes dist/<route>/index.html with that route's
// <title>, <meta description>, Open Graph and Twitter Card tags injected into
// <head>. It also rewrites the root dist/index.html with the default OG tags.
// _redirects then points each route at its prerendered file so the crawler
// gets the right tags; the SPA still boots from that HTML and React Router
// takes over for users.
//
// HOW IT STAYS DRY: page metadata lives only in page-meta.ts. This script
// transpiles that TS module on the fly (via the installed `typescript`
// compiler — no extra dependency) and imports it, so titles/descriptions are
// never duplicated here.

import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_DIR = path.resolve(__dirname, "../apps/artcraft-website");
const DIST_DIR = path.join(APP_DIR, "dist");
const ROOT_HTML = path.join(DIST_DIR, "index.html");
const META_TS = path.join(APP_DIR, "src/config/page-meta.ts");

const main = async () => {
  if (!fs.existsSync(ROOT_HTML)) {
    console.error(`prerender-meta: ${ROOT_HTML} not found — run the build first.`);
    process.exit(1);
  }

  const { PAGE_META, DEFAULT_META, DEFAULT_OG_IMAGE, getPageMeta, toAbsoluteUrl } =
    await importTsModule(META_TS);

  const baseHtml = fs.readFileSync(ROOT_HTML, "utf8");

  // Rewrite the root index.html (the "/" route and SPA fallback) so the
  // homepage and any non-prerendered route at least carry default OG tags.
  const homeMeta = getPageMeta("/");
  fs.writeFileSync(ROOT_HTML, injectMeta(baseHtml, homeMeta, "/", toAbsoluteUrl, DEFAULT_OG_IMAGE), "utf8");
  console.log("prerender-meta: rewrote / (root index.html)");

  // Emit dist/<route>/index.html for every configured route except "/".
  for (const route of Object.keys(PAGE_META)) {
    if (route === "/") continue;
    const meta = getPageMeta(route);
    const outDir = path.join(DIST_DIR, route.replace(/^\//, ""));
    fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, "index.html");
    fs.writeFileSync(outFile, injectMeta(baseHtml, meta, route, toAbsoluteUrl, DEFAULT_OG_IMAGE), "utf8");
    console.log(`prerender-meta: wrote ${route} -> ${path.relative(DIST_DIR, outFile)}`);
  }

  // Sanity: DEFAULT_META.title should still be the value baked into root.
  if (!DEFAULT_META.title) {
    console.warn("prerender-meta: DEFAULT_META.title is empty — check page-meta.ts");
  }
};

// Replace the homepage <title>/<meta description> in the source HTML and inject
// a full Open Graph + Twitter Card block for the given route. Idempotent: an
// existing injected block (between the marker comments) is replaced, so running
// twice doesn't stack duplicate tags.
const injectMeta = (html, meta, route, toAbsoluteUrl, defaultImage) => {
  const url = toAbsoluteUrl(route === "/" ? "/" : route);
  const image = toAbsoluteUrl(meta.ogImage ?? defaultImage);
  // Share card title may be a shorter override; <title> stays the full SEO one.
  const ogTitle = meta.ogTitle ?? meta.title;

  let out = html;

  // Swap the existing <title> and <meta name="description">.
  out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(meta.title)}</title>`);
  out = out.replace(
    /<meta\s+name="description"\s+content="[\s\S]*?"\s*\/?>/i,
    `<meta name="description" content="${esc(meta.description)}" />`,
  );

  const block = [
    "<!-- prerender-meta:start -->",
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="ArtCraft" />`,
    `<meta property="og:title" content="${esc(ogTitle)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(ogTitle)}" />`,
    `<meta name="twitter:description" content="${esc(meta.description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
    "<!-- prerender-meta:end -->",
  ].join("\n    ");

  // Replace a previously-injected block if present (idempotent), else insert
  // right before </head>.
  const existing = /<!-- prerender-meta:start -->[\s\S]*?<!-- prerender-meta:end -->/;
  if (existing.test(out)) {
    out = out.replace(existing, block);
  } else {
    out = out.replace(/<\/head>/i, `    ${block}\n  </head>`);
  }
  return out;
};

// Minimal HTML-attribute escaping for values placed inside double-quoted
// attributes / element text.
const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Transpile a TS module to ESM via the installed `typescript` compiler and
// dynamic-import it. Avoids adding tsx/esbuild just for the build step.
const importTsModule = async (tsPath) => {
  const source = fs.readFileSync(tsPath, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: tsPath,
  });
  const tmpFile = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), "prerender-meta-")),
    "page-meta.mjs",
  );
  fs.writeFileSync(tmpFile, outputText, "utf8");
  try {
    return await import(pathToFileURL(tmpFile).href);
  } finally {
    fs.rmSync(path.dirname(tmpFile), { recursive: true, force: true });
  }
};

main().catch((err) => {
  console.error("prerender-meta failed:", err);
  process.exit(1);
});
