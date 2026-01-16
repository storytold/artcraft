import { Link } from "react-router-dom";
import Seo from "../../components/seo";
import { getFaqItems } from "@storyteller/markdown-content";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/pro-solid-svg-icons";

const FaqIndex = () => {
  const title = "Frequently Asked Questions - ArtCraft";
  const description =
    "Explore ArtCraft FAQs: guides on AI image generation, editing, and workflows.";

  const items = getFaqItems();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.title,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.description,
      },
    })),
  };

  return (
    <div className="relative min-h-screen bg-[#101014] text-white overflow-hidden bg-dots">
      <Seo title={title} description={description} jsonLd={jsonLd} />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="w-[900px] h-[900px] rounded-full bg-gradient-to-br from-blue-700 via-blue-500 to-[#00AABA] opacity-25 blur-[120px]"></div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-4xl px-4 sm:px-8 pt-28 sm:pt-36 pb-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-6xl font-bold mb-3">
            Frequently Asked Questions
          </h1>
          <p className="text-white/70 text-base sm:text-lg">
            Deep-dive guides and answers about ArtCraft.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <Link
              key={item.slug}
              to={`/faq/${item.slug}`}
              className="group block rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 p-5 transition-all"
            >
              <h2 className="text-xl font-semibold mb-2 group-hover:text-blue-400 transition-colors flex items-center gap-2">
                {item.title}
                <FontAwesomeIcon icon={faArrowRight} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              </h2>
              <p className="text-white/70 text-sm">{item.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FaqIndex;
