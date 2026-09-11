// Client-side link metadata — no proxy, no network beyond the favicon <img>.

// Bare display host: strips the scheme and a leading "www.".
export const hostnameOf = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

// The site's own favicon, served from its origin (no third-party proxy). Falls
// back to a link glyph at the render site when the <img> errors.
export const faviconOf = (url: string): string | null => {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.hostname}/favicon.ico`;
  } catch {
    return null;
  }
};
