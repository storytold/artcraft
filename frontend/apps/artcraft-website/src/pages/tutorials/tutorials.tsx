import { useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";
import { defaultTutorials, TutorialItem } from "@storyteller/ui-tutorial-modal";
import { Button } from "@storyteller/ui-button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faPlay } from "@fortawesome/pro-solid-svg-icons";

const categoriesFrom = (items: TutorialItem[]): string[] => {
  const set = new Set<string>();
  for (const t of items) if (t.category) set.add(t.category);
  return ["All", ...Array.from(set)];
};

const websiteThumb = (url: string): string => {
  // Map shared modal thumbnail paths to website public path
  return url.startsWith("/resources/images/")
    ? url.replace("/resources/images/", "/images/")
    : url;
};

export const TutorialsPage = () => {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selected, setSelected] = useState<TutorialItem | null>(null);

  const tutorials = defaultTutorials;
  const categories = useMemo(() => categoriesFrom(tutorials), [tutorials]);

  const visible = useMemo(() => {
    if (activeCategory === "All") return tutorials;
    return tutorials.filter((t) => t.category === activeCategory);
  }, [activeCategory, tutorials]);

  return (
    <div className="relative min-h-screen bg-[#101014] text-white overflow-hidden bg-dots">
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
        {!selected && (
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
        )}

        {/* Content */}
        {!selected ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelected(item)}
                className="group block overflow-hidden rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-left"
              >
                <div className="aspect-video w-full overflow-hidden relative">
                  <img
                    src={websiteThumb(item.thumbnailUrl)}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="inline-flex items-center gap-2 text-white/90 text-sm font-medium">
                      <FontAwesomeIcon icon={faPlay} />
                      Watch
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
              </button>
            ))}
          </div>
        ) : (
          <div className="flex w-full flex-col">
            <div className="mb-3 flex items-center gap-4 md:flex-row flex-col">
              <Button
                onClick={() => setSelected(null)}
                className="w-fit text-base-fg opacity-80 hover:opacity-100 font-medium border-none"
                variant="action"
                icon={faChevronLeft}
              >
                Back
              </Button>
              <div className="text-lg font-bold text-base-fg">
                Tutorial: {selected.title}
              </div>
            </div>
            <div className="w-full">
              <div className="aspect-video w-full overflow-hidden rounded-lg border border-white/10 bg-black">
                <iframe
                  title={selected.title}
                  src={selected.videoUrl.replace(
                    "youtu.be/",
                    "www.youtube.com/embed/"
                  )}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TutorialsPage;
