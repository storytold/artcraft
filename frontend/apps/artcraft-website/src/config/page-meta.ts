// Single source of truth for per-page SEO + social-share metadata.
//
// This is consumed in TWO places, so it must stay framework-agnostic (no
// React, no Vite `import.meta`, no DOM access):
//   1. Runtime — the <Seo> component reads it to set document.title and meta
//      tags after the SPA hydrates (good for users navigating client-side).
//   2. Build time — scripts/prerender-meta.mjs reads it to bake a static
//      index.html per route with real <title>/<meta>/og:/twitter: tags, so
//      social crawlers (Discord, Slack, X, iMessage…) that DON'T run JS still
//      get the correct preview for each page.
//
// To give a new marketing route its own share preview: add an entry to
// PAGE_META keyed by its pathname, then make sure scripts/prerender-meta.mjs
// emits it (it iterates PAGE_META) and _redirects points the route at the
// prerendered file.

// Canonical production origin (no trailing slash). Used to build absolute
// og:url / og:image URLs, which crawlers require — relative paths are ignored.
export const SITE_ORIGIN = "https://getartcraft.com";

// Default share image, served from /public. Pages may override per-route.
export const DEFAULT_OG_IMAGE = "/images/3d-interface-preview.jpg";

export interface PageMeta {
  title: string;
  description: string;
  /**
   * Short title used for the social share card (og:title / twitter:title) when
   * it should differ from the full, SEO-oriented <title>. Defaults to `title`.
   */
  ogTitle?: string;
  /** Absolute or site-root-relative image path. Defaults to DEFAULT_OG_IMAGE. */
  ogImage?: string;
}

// Homepage / fallback metadata. Used for "/" and as the base any page meta is
// merged onto, so partial overrides still produce a complete tag set.
export const DEFAULT_META: PageMeta = {
  title: "ArtCraft. AI Video and Images. Fast and Open Desktop App.",
  description:
    "ArtCraft is an Open Desktop app for generating AI Video and Images. You own ArtCraft!",
  ogImage: DEFAULT_OG_IMAGE,
};

// Keyed by pathname (leading slash, no trailing slash). Only marketing pages
// that benefit from a tailored social preview need an entry — everything else
// falls back to DEFAULT_META.
export const PAGE_META: Record<string, PageMeta> = {
  "/": DEFAULT_META,
  "/seedance-2": {
    title:
      "Seedance 2.0 in ArtCraft. AI Video Generation. Fast and Open Desktop App.",
    description:
      "Seedance 2.0 is available now in ArtCraft. Generate jaw-dropping AI videos with the fastest open desktop app for artists.",
  },
  "/seedance2-5": {
    title:
      "Seedance 2.5 in ArtCraft. AI Video Generation. Fast and Open Desktop App.",
    ogTitle: "Seedance 2.5",
    description:
      "Seedance 2.5 is ByteDance's anticipated next-generation AI video model — reports point to 4K, real-time generation, longer clips, and persistent characters. See what's expected, and create with Seedance in ArtCraft today.",
  },
  "/pricing": {
    title: "Pricing - ArtCraft. AI Video and Images.",
    description:
      "Simple pricing for ArtCraft. Generate AI video and images with every model in one open desktop app. No subscriptions needed — you own ArtCraft.",
  },
};

// Resolve full metadata for a pathname, filling any missing fields from the
// defaults. Trailing slashes are normalized so "/pricing" and "/pricing/" match.
export function getPageMeta(pathname: string): PageMeta {
  const normalized =
    pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const entry = PAGE_META[normalized];
  const title = entry?.title ?? DEFAULT_META.title;
  return {
    title,
    description: entry?.description ?? DEFAULT_META.description,
    ogTitle: entry?.ogTitle ?? title,
    ogImage: entry?.ogImage ?? DEFAULT_META.ogImage,
  };
}

// Build an absolute URL from a site-root-relative path (or pass through an
// already-absolute URL). Crawlers need absolute og:image / og:url values.
export function toAbsoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE_ORIGIN}${path}`;
}
