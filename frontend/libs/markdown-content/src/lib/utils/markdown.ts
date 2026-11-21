export const markdownToHtml = (
  markdown: string,
  basePath: string = "",
): string => {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const htmlParts: string[] = [];
  let inList = false;
  let blockquoteLines: string[] = [];

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

  // Check if a URL points to a video file
  const isVideoUrl = (url: string): boolean => {
    const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".m4v", ".avi"];
    const lowerUrl = url.toLowerCase().split("?")[0]; // Remove query params for extension check
    return videoExtensions.some((ext) => lowerUrl.endsWith(ext));
  };

  // Extract YouTube video ID from various URL formats
  const extractYouTubeId = (input: string): string | null => {
    // If it's already just a video ID (11 characters, alphanumeric with - and _)
    if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) {
      return input.trim();
    }

    // YouTube URL patterns
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) return match[1];
    }

    return null;
  };

  // Render a YouTube embed
  const renderYouTubeEmbed = (videoId: string): string => {
    return `<div class="video-embed youtube-embed"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
  };

  // Render a regular video embed
  const renderVideoEmbed = (url: string): string => {
    const safeUrl = normalizeLink(url);
    return `<div class="video-embed"><video controls><source src="${safeUrl}" type="video/${getVideoMimeType(url)}">Your browser does not support the video tag.</video></div>`;
  };

  // Render a looping autoplay video embed (muted required for autoplay)
  const renderLoopAutoplayVideoEmbed = (url: string): string => {
    const safeUrl = normalizeLink(url);
    return `<div class="video-embed"><video autoplay loop muted playsinline><source src="${safeUrl}" type="video/${getVideoMimeType(url)}">Your browser does not support the video tag.</video></div>`;
  };

  // Get video MIME type from URL
  const getVideoMimeType = (url: string): string => {
    const lowerUrl = url.toLowerCase().split("?")[0];
    if (lowerUrl.endsWith(".webm")) return "webm";
    if (lowerUrl.endsWith(".ogg")) return "ogg";
    if (lowerUrl.endsWith(".mov") || lowerUrl.endsWith(".m4v")) return "mp4";
    return "mp4"; // Default to mp4
  };

  // Parse size string like "300" or "400x300"
  const parseSize = (sizeStr: string): { width?: string; height?: string } => {
    if (!sizeStr) return {};
    const parts = sizeStr.toLowerCase().split("x");
    if (parts.length === 2) {
      return { width: parts[0], height: parts[1] };
    }
    return { width: parts[0] };
  };

  // Render an image with optional size
  const renderImage = (
    url: string,
    alt: string = "",
    sizeStr: string = "",
  ): string => {
    const safeUrl = normalizeLink(url);
    const safeAlt = alt.replace(/"/g, "&quot;");
    const { width, height } = parseSize(sizeStr);

    let style =
      "width: 100%; max-width: 100%; border-radius: 0.75rem; border: 1px solid rgba(255,255,255,0.1); margin: 2rem 0; display: block;";
    let attrs = "";

    if (width) {
      const w =
        width.endsWith("%") || width.endsWith("px") ? width : `${width}px`;
      style += ` width: ${w};`;
      attrs += ` width="${width.replace("px", "")}"`;
    }
    if (height) {
      const h =
        height.endsWith("%") || height.endsWith("px") ? height : `${height}px`;
      style += ` height: ${h};`;
      attrs += ` height="${height.replace("px", "")}"`;
    }

    // Centering if not full width
    if (width && width !== "100%") {
      style += " margin-left: auto; margin-right: auto;";
    }

    return `<img src="${safeUrl}" alt="${safeAlt}" style="${style}"${attrs} />`;
  };

  const renderInline = (text: string): string => {
    // bold: **text**
    let out = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    // italic: *text*
    out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");

    // images/videos: ![alt](url|size) - detect video files and render as video
    out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, urlAndSize) => {
      const [url, size] = urlAndSize.split("|");
      const safeUrl = String(url || "").trim();

      if (isVideoUrl(safeUrl)) {
        return renderVideoEmbed(safeUrl);
      }

      return renderImage(safeUrl, alt, size);
    });
    // links: [text](url)
    out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, url) => {
      const safeLabel = String(label || "").replace(/"/g, "&quot;");
      const safeUrl = normalizeLink(String(url || ""));
      return `<a href="${safeUrl}" class="underline hover:opacity-90">${safeLabel}</a>`;
    });
    return out;
  };

  // Accumulate paragraph lines - consecutive non-blank, non-block lines form a single paragraph
  let paragraphLines: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length > 0) {
      const text = paragraphLines.map(renderInline).join(" ");
      htmlParts.push(`<p>${text}</p>`);
      paragraphLines = [];
    }
  };

  const flushBlockquote = () => {
    if (blockquoteLines.length > 0) {
      const content = blockquoteLines.join(" ");
      htmlParts.push(`<blockquote>${renderInline(content)}</blockquote>`);
      blockquoteLines = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const ltrim = line.replace(/^\s+/, "");

    // Blockquote: > text
    const blockquoteMatch = line.match(/^>\s?(.*)$/);
    if (blockquoteMatch) {
      flushParagraph();
      closeListIfOpen();
      blockquoteLines.push(blockquoteMatch[1]);
      continue;
    }

    // If we were in a blockquote but this line isn't, flush it
    flushBlockquote();

    // YouTube embed: @youtube(VIDEO_ID or URL)
    const youtubeMatch = ltrim.match(/^@youtube\(([^)]+)\)\s*$/);
    if (youtubeMatch) {
      flushParagraph();
      closeListIfOpen();
      const videoId = extractYouTubeId(youtubeMatch[1]);
      if (videoId) {
        htmlParts.push(renderYouTubeEmbed(videoId));
      } else {
        htmlParts.push(`<p>Invalid YouTube video: ${youtubeMatch[1]}</p>`);
      }
      continue;
    }

    // Video embed: @video(url)
    const videoMatch = ltrim.match(/^@video\(([^)]+)\)\s*$/);
    if (videoMatch) {
      flushParagraph();
      closeListIfOpen();
      htmlParts.push(renderVideoEmbed(videoMatch[1]));
      continue;
    }

    // Looping autoplay video embed: @loop_autoplay(url)
    const loopAutoplayMatch = ltrim.match(/^@loop_autoplay\(([^)]+)\)\s*$/);
    if (loopAutoplayMatch) {
      flushParagraph();
      closeListIfOpen();
      htmlParts.push(renderLoopAutoplayVideoEmbed(loopAutoplayMatch[1]));
      continue;
    }

    // Image/GIF embed: @image(url, size) or @gif(url, size)
    const imageMatch = ltrim.match(
      /^@(image|gif)\(([^,)]+)(?:,\s*([^)]+))?\)\s*$/,
    );
    if (imageMatch) {
      flushParagraph();
      closeListIfOpen();
      const url = imageMatch[2].trim();
      const size = imageMatch[3]?.trim() || "";
      htmlParts.push(renderImage(url, "", size));
      continue;
    }

    // ATX headings: support #..###### with optional space after hashes
    const heading = ltrim.match(/^(#{1,6})\s*(.*)$/);
    if (heading) {
      flushParagraph();
      closeListIfOpen();
      const level = Math.min(heading[1].length, 6);
      const text = renderInline(heading[2] || "");
      htmlParts.push(`<h${level}>${text}</h${level}>`);
      continue;
    }
    // Standalone image/video line: ![alt](url|size)
    const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/);
    if (imgMatch) {
      flushParagraph();
      closeListIfOpen();
      const alt = String(imgMatch[1] || "").replace(/"/g, "&quot;");
      const [url, size] = imgMatch[2].split("|");
      const safeUrl = normalizeLink(String(url || "").trim());

      // Check if it's a video file
      if (isVideoUrl(safeUrl)) {
        htmlParts.push(renderVideoEmbed(safeUrl));
      } else {
        htmlParts.push(renderImage(safeUrl, alt, size));
      }
      continue;
    }
    if (line.startsWith("- ")) {
      flushParagraph();
      if (!inList) {
        inList = true;
        htmlParts.push("<ul>");
      }
      htmlParts.push(`<li>${renderInline(line.slice(2))}</li>`);
      continue;
    }
    if (line.trim() === "") {
      flushParagraph();
      closeListIfOpen();
      htmlParts.push("");
      continue;
    }
    // Regular text line - accumulate for paragraph
    closeListIfOpen();
    paragraphLines.push(line);
  }

  flushParagraph();
  flushBlockquote();
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
