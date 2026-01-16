export const markdownToHtml = (
  markdown: string,
  basePath: string = ""
): string => {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const htmlParts: string[] = [];
  let inList = false;

  const closeListIfOpen = () => {
    if (inList) {
      htmlParts.push("</ul>");
      inList = false;
    }
  };

  const isAbsolute = (url: string): boolean => /^(?:[a-z]+:)?\/\//i.test(url);
  const normalizeLink = (url: string): string => {
    if (!basePath) return url;
    if (!url) return url;
    if (url.startsWith("#")) return url;
    if (url.startsWith("/")) return url;
    if (isAbsolute(url)) return url;
    if (url.startsWith("../")) return basePath + url.replace(/^\.\.\//, "");
    if (url.startsWith("./")) return basePath + url.replace(/^\.\//, "");
    return basePath + url;
  };

  const renderInline = (text: string): string => {
    // bold: **text**
    let out = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    // italic: *text*
    out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");

    // images: ![alt](url)
    out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, url) => {
      const safeAlt = String(alt || "").replace(/"/g, "&quot;");
      const safeUrl = String(url || "");
      return `<img src="${safeUrl}" alt="${safeAlt}" />`;
    });
    // links: [text](url)
    out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, url) => {
      const safeLabel = String(label || "").replace(/"/g, "&quot;");
      const safeUrl = normalizeLink(String(url || ""));
      return `<a href="${safeUrl}" class="underline hover:opacity-90">${safeLabel}</a>`;
    });
    return out;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const ltrim = line.replace(/^\s+/, "");
    // ATX headings: support #..###### with optional space after hashes
    const heading = ltrim.match(/^(#{1,6})\s*(.*)$/);
    if (heading) {
      closeListIfOpen();
      const level = Math.min(heading[1].length, 6);
      const text = renderInline(heading[2] || "");
      htmlParts.push(`<h${level}>${text}</h${level}>`);
      continue;
    }
    // Standalone image line
    const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/);
    if (imgMatch) {
      closeListIfOpen();
      const alt = String(imgMatch[1] || "").replace(/"/g, "&quot;");
      const url = normalizeLink(String(imgMatch[2] || ""));
      htmlParts.push(`<p><img src="${url}" alt="${alt}" /></p>`);
      continue;
    }
    if (line.startsWith("- ")) {
      if (!inList) {
        inList = true;
        htmlParts.push("<ul>");
      }
      htmlParts.push(`<li>${renderInline(line.slice(2))}</li>`);
      continue;
    }
    if (line.trim() === "") {
      closeListIfOpen();
      htmlParts.push("");
      continue;
    }
    closeListIfOpen();
    htmlParts.push(`<p>${renderInline(line)}</p>`);
  }

  closeListIfOpen();
  return htmlParts.join("\n");
};

export type FrontmatterResult = {
  frontmatter: Record<string, string>;
  body: string;
};

export const parseFrontmatter = (raw: string): FrontmatterResult => {
  const text = raw.replace(/\r\n/g, "\n");
  if (!text.startsWith("---\n")) {
    return { frontmatter: {}, body: text };
  }
  const end = text.indexOf("\n---\n", 4);
  if (end === -1) return { frontmatter: {}, body: text };
  const header = text.slice(4, end);
  const body = text.slice(end + 5);
  const fm: Record<string, string> = {};
  for (const line of header.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line
      .slice(idx + 1)
      .trim()
      .replace(/^"|^'|"$|'$/g, "");
    if (key) fm[key] = value;
  }
  return { frontmatter: fm, body };
};

export const slugify = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");

export const pathToFilename = (path: string): string => {
  const parts = path.split("/");
  const filename = parts[parts.length - 1] || "";
  return filename.replace(/\.md$/, "");
};
