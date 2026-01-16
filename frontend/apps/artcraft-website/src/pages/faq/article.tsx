import { Link, useParams } from "react-router-dom";
import Seo from "../../components/seo";
import { getFaqItemBySlug, markdownToHtml } from "@storyteller/markdown-content";
import { faChevronLeft } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMemo } from "react";

const FaqArticle = () => {
  const { slug } = useParams();
  const item = slug ? getFaqItemBySlug(slug) : null;

  const html = useMemo(() => 
    item ? markdownToHtml(item.body, "/faq/") : ""
  , [item]);

  if (!item) {
    return (
      <div className="relative min-h-screen bg-[#101014] text-white overflow-hidden bg-dots">
        <div className="relative z-10 mx-auto w-full max-w-[1200px] px-4 sm:px-8 pt-28 sm:pt-36 pb-12">
          <h1 className="text-3xl font-bold">Not found</h1>
          <p className="text-white/70">We couldn't find this FAQ article.</p>
        </div>
      </div>
    );
  }

  const title = `${item.title} - ArtCraft`;
  const description = item.description || "";
  const thumbnail = item.thumbnail || "";
  
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: item.title,
    description: description,
    articleBody: item.body,
  };

  return (
    <div className="relative min-h-screen bg-[#101014] text-white overflow-hidden bg-dots">
      <Seo title={title} description={description} jsonLd={jsonLd} />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="w-[900px] h-[900px] rounded-full bg-gradient-to-br from-blue-700 via-blue-500 to-[#00AABA] opacity-25 blur-[120px]"></div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 sm:px-6 pt-24 sm:pt-32 pb-32">
        <div className="mb-6">
          <Link
            to="/faq"
            className="rounded-lg px-4 py-2 text-sm border border-white/10 bg-white/5 hover:bg-white/10 inline-flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faChevronLeft} />
            Back to FAQ
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-4 !leading-tight">
          {item.title || slug}
        </h1>
        {description && <p className="text-white/70 mb-8">{description}</p>}

        {thumbnail && (
          <div className="w-full overflow-hidden rounded-lg border border-white/10 bg-black mb-10">
            <img
              src={thumbnail}
              alt={item.title || slug}
              className="w-full h-auto object-cover"
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

export default FaqArticle;
