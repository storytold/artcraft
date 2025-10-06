import { useMemo } from "react";
import { useParams } from "react-router-dom";
import Seo from "../../components/seo";
import { parseFrontmatter, markdownToHtml } from "../../utils/markdown";
import { Button } from "@storyteller/ui-button";
import { faChevronLeft } from "@fortawesome/pro-solid-svg-icons";

const tutorialFiles = import.meta.glob("./content/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

const TutorialsArticle = () => {
  const { slug } = useParams();

  const entries = Object.entries(tutorialFiles);
  const markdown = (() => {
    // 1) filename match
    const byFilename = entries.find(([path]) =>
      path.endsWith(`/content/${slug}.md`)
    );
    if (byFilename) return byFilename[1] as string;
    // 2) frontmatter slug match
    const wanted = (slug || "").toLowerCase();
    for (const [_, raw] of entries) {
      const { frontmatter } = parseFrontmatter(raw as string);
      const fmSlug = (frontmatter.slug || "").trim().toLowerCase();
      if (fmSlug && fmSlug === wanted) return raw as string;
      const aliasesRaw = (frontmatter.aliases || "").toString();
      if (aliasesRaw) {
        const candidateList = aliasesRaw
          .split(/[\s,]+/)
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);
        if (candidateList.includes(wanted)) return raw as string;
      }
    }
    return null;
  })();
  const { frontmatter, body } = useMemo(
    () =>
      markdown ? parseFrontmatter(markdown) : { frontmatter: {}, body: "" },
    [markdown]
  );

  if (!markdown) {
    return (
      <div className="relative min-h-screen bg-[#101014] text-white overflow-hidden bg-dots">
        <div className="relative z-10 mx-auto w-full max-w-[1200px] px-4 sm:px-8 pt-28 sm:pt-36 pb-12">
          <h1 className="text-3xl font-bold">Not found</h1>
          <p className="text-white/70">We couldn't find this tutorial.</p>
        </div>
      </div>
    );
  }

  const title = `${frontmatter.title || slug} - ArtCraft`;
  const description = frontmatter.abstract || "";
  const toEmbed = (url: string): string => {
    if (!url) return url;
    if (url.includes("youtu.be/"))
      return url.replace("youtu.be/", "www.youtube.com/embed/");
    if (url.includes("watch?v=")) return url.replace("watch?v=", "embed/");
    return url;
  };
  const frontmatterVideo =
    (frontmatter.videoUrl as string) ||
    (frontmatter.youtubeId
      ? `https://www.youtube.com/embed/${frontmatter.youtubeId}`
      : "");
  const videoUrl = toEmbed(frontmatterVideo);
  const html = markdownToHtml(body);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: frontmatter.title || slug,
    description: description,
    articleBody: body,
  };

  return (
    <div className="relative min-h-screen bg-[#101014] text-white overflow-hidden bg-dots">
      <Seo title={title} description={description} jsonLd={jsonLd} />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="w-[900px] h-[900px] rounded-full bg-gradient-to-br from-blue-700 via-blue-500 to-[#00AABA] opacity-25 blur-[120px]"></div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-4xl px-4 sm:px-6 pt-24 sm:pt-32 pb-32">
        <div className="mb-6">
          <Button
            as="link"
            href="/tutorials"
            icon={faChevronLeft}
            className="rounded-lg px-4 py-2 text-sm border border-white/10 bg-white/5 hover:bg-white/10"
          >
            Back to Tutorials
          </Button>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold mb-4 !leading-tight">
          {frontmatter.title || slug}
        </h1>
        {description && <p className="text-white/70 mb-8">{description}</p>}

        {videoUrl && (
          <div className="aspect-video w-full overflow-hidden rounded-lg border border-white/10 bg-black mb-10">
            <iframe
              title={frontmatter.title || slug}
              src={videoUrl}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        <article
          className="article-content max-w-none text-white/90 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <style>{`
          .article-content h1 { font-size: 2rem; font-weight: 700; margin: 1.25rem 0; }
          .article-content h2 { font-size: 1.5rem; font-weight: 700; margin: 1rem 0; }
          .article-content h3 { font-size: 1.25rem; font-weight: 600; margin: 0.75rem 0; }
          .article-content h4 { font-size: 1.125rem; font-weight: 600; margin: 0.5rem 0; }
          .article-content p { margin: 0.75rem 0; }
          .article-content ul { list-style: disc; padding-left: 1.25rem; margin: 0.75rem 0; }
          .article-content img { display: block; max-width: 100%; height: auto; border-radius: 0.5rem; }
        `}</style>
      </div>
    </div>
  );
};

export default TutorialsArticle;
