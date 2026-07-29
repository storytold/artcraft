import { useEffect } from "react";
import { DEFAULT_OG_IMAGE, SITE_ORIGIN, toAbsoluteUrl } from "../config/page-meta";

type SeoProps = {
  title: string;
  description?: string;
  /** Share-card title (og:/twitter:). Defaults to `title` when omitted. */
  ogTitle?: string;
  /** Site-root-relative or absolute share image. Defaults to DEFAULT_OG_IMAGE. */
  ogImage?: string;
  jsonLd?: object | object[];
};

// Keeps the document's title + social-share meta tags in sync as the user
// navigates the SPA client-side. NOTE: crawlers don't run this — they read the
// prerendered static HTML (scripts/prerender-meta.mjs). Both pull from the same
// config/page-meta source so the user-visible and crawler-visible tags agree.
const Seo = ({ title, description, ogTitle, ogImage, jsonLd }: SeoProps) => {
  useEffect(() => {
    document.title = title;

    const shareTitle = ogTitle ?? title;
    const image = toAbsoluteUrl(ogImage ?? DEFAULT_OG_IMAGE);
    const url = SITE_ORIGIN + window.location.pathname;

    setMetaByName("description", description);
    setMetaByProperty("og:title", shareTitle);
    setMetaByProperty("og:description", description);
    setMetaByProperty("og:type", "website");
    setMetaByProperty("og:url", url);
    setMetaByProperty("og:image", image);
    setMetaByName("twitter:card", "summary_large_image");
    setMetaByName("twitter:title", shareTitle);
    setMetaByName("twitter:description", description);
    setMetaByName("twitter:image", image);

    let script: HTMLScriptElement | null = null;
    if (jsonLd) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      if (script && script.parentNode) script.parentNode.removeChild(script);
    };
  }, [title, description, ogTitle, ogImage, jsonLd]);

  return null;
};

export default Seo;

// Upsert a <meta name="..."> tag. Skips no-op when content is undefined so we
// don't clobber an existing tag with an empty value.
function setMetaByName(name: string, content: string | undefined) {
  if (content === undefined) return;
  upsertMeta("name", name, content);
}

// Upsert a <meta property="..."> tag (Open Graph uses `property`, not `name`).
function setMetaByProperty(property: string, content: string | undefined) {
  if (content === undefined) return;
  upsertMeta("property", property, content);
}

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let meta = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${key}"]`,
  );
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attr, key);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
}
