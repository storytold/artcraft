import { useMemo, useState } from "react";
import Seo from "../../components/seo";
import { Link } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay } from "@fortawesome/pro-solid-svg-icons";
import { getTutorialItems, TutorialItem } from "@storyteller/markdown-content";

const websiteThumb = (url: string): string => {
  // Map shared modal thumbnail paths to website public path
  return url.startsWith("/resources/images/")
    ? url.replace("/resources/images/", "/images/")
    : url;
};

export const TutorialsPage = () => {
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const items = useMemo<TutorialItem[]>(() => {
    return getTutorialItems();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const t of items) if (t.category) set.add(t.category);
    return ["All", ...Array.from(set)];
  }, [items]);

  const visible = useMemo(() => {
    if (activeCategory === "All") return items;
    return items.filter((t) => t.category === activeCategory);
  }, [activeCategory, items]);

  const pageTitle =
    activeCategory === "All"
      ? "Tutorials - ArtCraft"
      : `${activeCategory} Tutorials - ArtCraft`;
  const pageDescription = "Learn tips, tricks, and workflows for ArtCraft.";

  return (
    <div className="relative min-h-screen bg-[#101014] text-white overflow-hidden bg-dots">
      <Seo title={pageTitle} description={pageDescription} />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="w-[900px] h-[900px] rounded-full bg-gradient-to-br from-blue-700 via-blue-500 to-[#00AABA] opacity-25 blur-[120px]"></div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-4 sm:px-8 pt-28 sm:pt-36 pb-12">
        {/* Hero */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-4xl sm:text-6xl font-bold mb-3">Tutorials</h1>
          <p className="text-white/70 text-base sm:text-lg">
            Learn tips, tricks, and workflows for ArtCraft.
          </p>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={twMerge(
                "px-4 py-2 rounded-xl border",
                activeCategory === cat
                  ? "bg-primary/30 border-primary/90"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item) => {
            const href = `/tutorials/${item.slug}`;
            return (
              <Link
                key={item.slug}
                to={href}
                className="group block overflow-hidden rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-left"
              >
                <div className="aspect-video w-full overflow-hidden relative">
                  <img
                    src={
                      item.thumbnail
                        ? websiteThumb(item.thumbnail)
                        : "/images/tutorial-thumbnails/2D_Editor_Basics.jpg"
                    }
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="inline-flex items-center gap-2 text-white/90 text-sm font-medium">
                      <FontAwesomeIcon icon={faPlay} />
                      Watch video
                    </span>
                  </div>
                </div>
                <div className="p-3 text-sm text-white/90 flex items-center justify-between">
                  <span>{item.title}</span>
                  {item.category && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-white/10 border border-white/10">
                      {item.category}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TutorialsPage;
