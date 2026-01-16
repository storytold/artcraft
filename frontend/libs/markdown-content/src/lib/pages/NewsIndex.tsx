import { Link } from "react-router-dom";
import { getNewsPosts } from "../data/content";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/pro-solid-svg-icons";

interface NewsIndexProps {
  basePath: string; // e.g. "/news" or "/blog"
}

export const NewsIndex = ({ basePath }: NewsIndexProps) => {
  const items = getNewsPosts();
  const title = "News & Updates";
  const description =
    "Latest updates, features, and announcements from the ArtCraft team.";

  // Note: SEO/Head handling should be done by the consumer app if needed (e.g. Helmet)
  // But we can check if we want to include it here or let the parent handle it.
  // For now, we return the UI structure.

  return (
    <div className="relative min-h-screen bg-[#101014] text-white overflow-hidden bg-dots">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="w-[900px] h-[900px] rounded-full bg-gradient-to-br from-blue-700 via-blue-500 to-[#00AABA] opacity-20 blur-[120px]"></div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-4xl px-4 sm:px-8 pt-28 sm:pt-36 pb-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-6xl font-bold mb-3">
            {title}
          </h1>
          <p className="text-white/70 text-base sm:text-lg">
            {description}
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {items.map((item) => (
            <Link
              key={item.slug}
              to={`${basePath}/${item.slug}`}
              className="group block rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 p-6 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-2">
                <h2 className="text-2xl font-semibold group-hover:text-blue-400 transition-colors flex items-center gap-3">
                  {item.title}
                  <FontAwesomeIcon icon={faArrowRight} className="text-xl opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                </h2>
                {item.date && (
                   <span className="text-white/50 text-sm font-mono shrink-0">{item.date}</span>
                )}
              </div>
              <p className="text-white/70 text-base leading-relaxed">{item.description}</p>
            </Link>
          ))}
          {items.length === 0 && (
            <div className="text-center py-10 opacity-50">
                No updates yet. Check back soon!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
