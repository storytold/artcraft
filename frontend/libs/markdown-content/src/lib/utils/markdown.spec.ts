import { describe, expect, it } from "vitest";
import { markdownToHtml, parseFrontmatter, pathToFilename, slugify } from "./markdown";

// Spec for the small Markdown renderer that turns the bundled news posts into HTML for the news page and the help menu,
// plus the front-matter, slug and filename helpers that load those posts.

describe("markdownToHtml: text blocks", () => {
  it("joins consecutive lines into one paragraph and splits paragraphs on a blank line", () => {
    expect(markdownToHtml("one\ntwo\n\nthree")).toBe("<p>one two</p>\n\n<p>three</p>");
  });

  it("renders headings from level 1 to 6, with or without a space after the hashes", () => {
    expect(markdownToHtml("# A")).toBe("<h1>A</h1>");
    expect(markdownToHtml("###### F")).toBe("<h6>F</h6>");
    expect(markdownToHtml("##NoSpace")).toBe("<h2>NoSpace</h2>");
  });

  it("renders a dash list and closes it at the next block", () => {
    expect(markdownToHtml("- a\n- b\n\ntext")).toBe("<ul>\n<li>a</li>\n<li>b</li>\n</ul>\n\n<p>text</p>");
  });

  it("closes a list that is followed directly by a paragraph line", () => {
    expect(markdownToHtml("- a\ntext")).toBe("<ul>\n<li>a</li>\n</ul>\n<p>text</p>");
  });

  it("joins consecutive blockquote lines into one blockquote", () => {
    expect(markdownToHtml("> one\n> two")).toBe("<blockquote>one two</blockquote>");
  });

  it("ends a blockquote at the first line that is not quoted", () => {
    expect(markdownToHtml("> quote\nafter")).toBe("<blockquote>quote</blockquote>\n<p>after</p>");
  });

  it("accepts Windows line endings", () => {
    expect(markdownToHtml("a\r\n\r\nb")).toBe("<p>a</p>\n\n<p>b</p>");
  });

  it("returns an empty string for empty input", () => {
    expect(markdownToHtml("")).toBe("");
  });
});

describe("markdownToHtml: inline formatting", () => {
  it("renders bold, italic and bold inside italic", () => {
    expect(markdownToHtml("**b** and *i*")).toBe("<p><strong>b</strong> and <em>i</em></p>");
  });

  it("renders a link", () => {
    expect(markdownToHtml("[docs](https://example.com/a)")).toBe(
      '<p><a href="https://example.com/a" class="underline hover:opacity-90">docs</a></p>',
    );
  });

  it("renders inline formatting inside headings and list items", () => {
    expect(markdownToHtml("# **Big**")).toBe("<h1><strong>Big</strong></h1>");
    expect(markdownToHtml("- *x*")).toBe("<ul>\n<li><em>x</em></li>\n</ul>");
  });
});

describe("markdownToHtml: base path for relative links", () => {
  const link = (url: string, base: string) => markdownToHtml(`[x](${url})`, base);

  it("prefixes a plain relative link and a ./ link", () => {
    expect(link("page.md", "/docs/")).toContain('href="/docs/page.md"');
    expect(link("./page.md", "/docs/")).toContain('href="/docs/page.md"');
  });

  it("drops the ../ of a parent link before prefixing", () => {
    expect(link("../page.md", "/docs/")).toContain('href="/docs/page.md"');
  });

  it("leaves anchors, root-relative and absolute links alone", () => {
    expect(link("#top", "/docs/")).toContain('href="#top"');
    expect(link("/abs", "/docs/")).toContain('href="/abs"');
    expect(link("https://example.com", "/docs/")).toContain('href="https://example.com"');
    expect(link("//cdn.example.com/x", "/docs/")).toContain('href="//cdn.example.com/x"');
  });

  it("leaves every link alone when there is no base path", () => {
    expect(link("page.md", "")).toContain('href="page.md"');
  });
});

describe("markdownToHtml: images and video", () => {
  it("renders an image line with its alt text", () => {
    const html = markdownToHtml("![a cat](cat.png)");
    expect(html).toContain('<img src="cat.png" alt="a cat"');
    expect(html).toContain("width: 100%");
  });

  it("applies a width, and a width and height, from the size suffix", () => {
    const wide = markdownToHtml("![x](a.png|300)");
    expect(wide).toContain("width: 300px;");
    expect(wide).toContain('width="300"');
    expect(wide).toContain("margin-left: auto");
    const both = markdownToHtml("![x](a.png|40%x20px)");
    expect(both).toContain("width: 40%;");
    expect(both).toContain("height: 20px;");
    expect(both).toContain('height="20"');
  });

  it("accepts a single width written in px", () => {
    const html = markdownToHtml("@image(a.png, 300px)");
    expect(html).toContain("width: 300px;");
    expect(html).not.toContain("ppx");
    expect(html).toContain('width="300"');
  });

  it("accepts a width and height that both end in px", () => {
    const html = markdownToHtml("![x](a.png|300pxx200px)");
    expect(html).toContain("width: 300px;");
    expect(html).toContain("height: 200px;");
  });

  it("does not centre an image whose width is 100%", () => {
    expect(markdownToHtml("![x](a.png|100%)")).not.toContain("margin-left: auto");
  });

  it("renders an @image line, with or without a size", () => {
    expect(markdownToHtml("@image(a.png)")).toContain('<img src="a.png" alt=""');
    expect(markdownToHtml("@gif(a.gif, 200x100)")).toContain("height: 100px;");
  });

  it("renders a video file as a video element with the right type", () => {
    expect(markdownToHtml("![clip](a.webm)")).toContain('<source src="a.webm" type="video/webm">');
    expect(markdownToHtml("![clip](a.mov?x=1)")).toContain('type="video/mp4"');
    expect(markdownToHtml("@video(a.mp4)")).toContain("<video controls>");
  });

  it("renders @loop_autoplay as a muted looping video", () => {
    expect(markdownToHtml("@loop_autoplay(a.mp4)")).toContain("<video autoplay loop muted playsinline>");
  });

  it("renders an inline image in the middle of a sentence", () => {
    expect(markdownToHtml("see ![x](a.png) here")).toContain('<p>see <img src="a.png"');
  });
});

describe("markdownToHtml: YouTube", () => {
  const embed = (id: string) => `https://www.youtube.com/embed/${id}`;

  it.each([
    ["@youtube(dQw4w9WgXcQ)"],
    ["@youtube(https://www.youtube.com/watch?v=dQw4w9WgXcQ)"],
    ["@youtube(https://youtu.be/dQw4w9WgXcQ)"],
    ["@youtube(https://www.youtube.com/embed/dQw4w9WgXcQ)"],
    ["@youtube(https://www.youtube.com/shorts/dQw4w9WgXcQ)"],
  ])("embeds %s", (line) => {
    expect(markdownToHtml(line)).toContain(`src="${embed("dQw4w9WgXcQ")}"`);
  });

  it("reports a value that is not a video", () => {
    expect(markdownToHtml("@youtube(nope)")).toBe("<p>Invalid YouTube video: nope</p>");
  });
});

describe("parseFrontmatter", () => {
  it("reads key/value pairs and strips quotes", () => {
    const { frontmatter, body } = parseFrontmatter('---\ntitle: "Hello"\ndate: 2025-01-02\nabstract: It\'s: fine\n---\nBody text');
    expect(frontmatter).toEqual({ title: "Hello", date: "2025-01-02", abstract: "It's: fine" });
    expect(body).toBe("Body text");
  });

  it("returns the whole text as the body when there is no front matter", () => {
    expect(parseFrontmatter("just text")).toEqual({ frontmatter: {}, body: "just text" });
  });

  it("returns the whole text as the body when the front matter is never closed", () => {
    const raw = "---\ntitle: x\nno end";
    expect(parseFrontmatter(raw)).toEqual({ frontmatter: {}, body: raw });
  });

  it("skips lines without a colon and accepts Windows line endings", () => {
    expect(parseFrontmatter("---\r\nnote\r\ntitle: T\r\n---\r\nB").frontmatter).toEqual({ title: "T" });
  });
});

describe("slugify and pathToFilename", () => {
  it("lowercases, joins words with dashes and drops punctuation", () => {
    expect(slugify("Hello, World! It_works")).toBe("hello-world-it-works");
  });

  it("collapses repeated dashes and trims them from the ends", () => {
    expect(slugify("--a -- b--")).toBe("a-b");
  });

  it("takes the file name off a path and drops .md", () => {
    expect(pathToFilename("../content/news/launch-day.md")).toBe("launch-day");
    expect(pathToFilename("plain")).toBe("plain");
    expect(pathToFilename("dir/")).toBe("");
  });
});
