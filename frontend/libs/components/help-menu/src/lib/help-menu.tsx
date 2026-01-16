import { useEffect, useMemo, useRef, useState } from "react";
import {
  faBook,
  faChevronLeft,
  faCircleQuestion,
  faNewspaper,
  faArrowRight,
} from "@fortawesome/pro-solid-svg-icons";
import {
  faDiscord,
  faGithub,
  faYoutube
} from "@fortawesome/free-brands-svg-icons";
import { OpenUrl } from "@storyteller/tauri-api";
import { Modal } from "@storyteller/ui-modal";
import { defaultTutorials, TutorialItem } from "./tutorials.js";
import { useTutorialModalStore } from "./help-menu-store";
import { Button } from "@storyteller/ui-button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PopoverMenu, PopoverItem } from "@storyteller/ui-popover";
import { getNewsPosts, markdownToHtml } from "@storyteller/markdown-content";

export type HelpMenuButtonProps = {
  items?: TutorialItem[];
  panelTitle?: string;
  className?: string;
  onOpenChange?: (open: boolean) => void;
};

// Internal News Component
const NewsView = ({ onBack }: { onBack: () => void }) => {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const bundledItems = useMemo(() => getNewsPosts(), []);
  const [items, setItems] = useState(bundledItems);

  useEffect(() => {
    // Attempt to fetch fresh news
    const fetchNews = async () => {
      try {
        const baseUrl = import.meta.env.DEV ? "http://localhost:4200" : "https://getartcraft.com";
        const res = await fetch(`${baseUrl}/news.json`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setItems(data);
          }
        }
      } catch (e) {
        // Fallback or ignore
        console.warn("Failed to fetch news feed, using bundled content.", e);
      }
    };
    fetchNews();
  }, []);

  const selectedPost = useMemo(() => 
    selectedSlug ? items.find(i => i.slug === selectedSlug) : null
  , [selectedSlug, items]);

  const html = useMemo(() => 
     selectedPost ? markdownToHtml(selectedPost.body) : ""
  , [selectedPost]);

  if (selectedPost) {
    return (
      <div className="flex flex-col h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        <button 
          onClick={() => setSelectedSlug(null)}
          className="self-start mb-4 text-sm flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <FontAwesomeIcon icon={faChevronLeft} /> Back to News
        </button>
        
        <div className="article-content">
          <h1 className="text-2xl font-bold mb-2">{selectedPost.title}</h1>
           {selectedPost.date && <p className="text-xs text-white/50 mb-4">{selectedPost.date}</p>}
           
           {selectedPost.thumbnail && (
             <img src={selectedPost.thumbnail} alt={selectedPost.title} className="w-full h-48 object-cover rounded-lg mb-4 border border-white/10" />
           )}

           <div dangerouslySetInnerHTML={{ __html: html }} className="text-white/80 space-y-4" />
        </div>
         <style>{`
          .article-content h1 { font-size: 1.5rem; font-weight: 700; margin: 1rem 0 0.5rem; }
          .article-content h2 { font-size: 1.25rem; font-weight: 700; margin: 1rem 0 0.5rem; color: #93c5fd; }
          .article-content h3 { font-size: 1.1rem; font-weight: 600; margin: 0.75rem 0 0.5rem; }
          .article-content p { margin-bottom: 0.75rem; line-height: 1.6; }
          .article-content ul { list-style: disc; padding-left: 1.25rem; margin-bottom: 0.75rem; }
          .article-content li { margin-bottom: 0.25rem; }
          .article-content img { border-radius: 0.5rem; max-width: 100%; height: auto; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 mt-2 h-[500px] overflow-y-auto pr-2 custom-scrollbar">
      {items.map(item => (
        <div 
          key={item.slug} 
          onClick={() => setSelectedSlug(item.slug)}
          className="bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-lg cursor-pointer transition-all group"
        >
          <div className="flex justify-between items-start">
             <h3 className="text-lg font-semibold group-hover:text-blue-300 transition-colors flex items-center gap-2">
               {item.title}
               <FontAwesomeIcon icon={faArrowRight} size="xs" className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-400" />
             </h3>
             {item.date && <span className="text-xs text-white/40 font-mono whitespace-nowrap ml-2">{item.date}</span>}
          </div>
          <p className="text-sm text-white/60 mt-1 line-clamp-2">{item.description}</p>
        </div>
      ))}
      {items.length === 0 && <div className="text-center text-white/40 py-10">No news yet.</div>}
    </div>
  );
};


export function HelpMenuButton({
  items,
  panelTitle = "Tutorials",
  className,
  onOpenChange,
}: HelpMenuButtonProps) {
  const [open, setOpen] = useState(false);
  const tutorials = useMemo(() => items ?? defaultTutorials, [items]);
  const view = useTutorialModalStore((s) => s.view);
  const selected = useTutorialModalStore((s) => s.selected);
  const setGrid = useTutorialModalStore((s) => s.setGrid);
  const setNews = useTutorialModalStore((s) => s.setNews);
  const viewTutorial = useTutorialModalStore((s) => s.viewTutorial);
  const getProgress = useTutorialModalStore((s) => s.getProgress);
  const setProgress = useTutorialModalStore((s) => s.setProgress);

  // Sync open state if managed externally? No, local state + optional callback.
  
  const handleOpenTutorials = () => {
    setGrid();
    setOpen(true);
    onOpenChange?.(true);
  };
  
  const handleOpenNews = () => {
    setNews();
    setOpen(true);
    onOpenChange?.(true);
  };

  const handleClose = () => {
    setOpen(false);
    onOpenChange?.(false);
  };

  // Menu items for the popover
  const menuItems: PopoverItem[] = [
    {
      label: "Tutorials",
      selected: false,
      icon: <FontAwesomeIcon icon={faBook} className="text-base" />,
      action: "tutorials",
    },
    {
      label: "News & Updates",
      selected: false,
      icon: <FontAwesomeIcon icon={faNewspaper} className="text-base" />,
      action: "news",
    },
    {
      label: "Discord",
      selected: false,
      icon: <FontAwesomeIcon icon={faDiscord} className="text-base" />,
      action: "discord",
    },
    {
      label: "GitHub",
      selected: false,
      icon: <FontAwesomeIcon icon={faGithub} className="text-base" />,
      action: "github",
    },
    {
      label: "ArtCraft Studios",
      selected: false,
      icon: <FontAwesomeIcon icon={faYoutube} className="text-base" />,
      action: "artcraft",
    },
  ];

  const handleMenuSelect = (item: PopoverItem) => {
    switch (item.action) {
      case "tutorials":
        handleOpenTutorials();
        break;
      case "news":
        handleOpenNews();
        break;
      case "discord":
        OpenUrl("https://discord.com/invite/75svZP2Vje");
        break;
      case "github":
        OpenUrl("https://github.com/storytold/artcraft");
        break;
      case "artcraft":
        OpenUrl("https://www.youtube.com/@OfficialArtCraftStudios");
        break;
    }
  };

  // ------------------------------------------------------
  // YouTube Player setup for restoring and saving progress
  // ------------------------------------------------------
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any | null>(null);
  const progressTimerRef = useRef<number | null>(null);

  const extractYouTubeId = (url: string): string | null => {
    try {
      const u = new URL(url);
      const host = u.hostname.replace(/^www\./, "");
      if (host === "youtube.com" && u.pathname.startsWith("/embed/")) {
        return u.pathname.split("/")[2] ?? null;
      }
      if (host.includes("youtube.com") && u.pathname.startsWith("/shorts/")) {
        return u.pathname.split("/")[2] ?? null;
      }
      if (host.includes("youtube.com") && u.pathname === "/watch") {
        return u.searchParams.get("v");
      }
      if (host === "youtu.be") {
        return u.pathname.slice(1) || null;
      }
    } catch {}
    return null;
  };

  const loadYouTubeIframeAPI = async (): Promise<void> => {
    if (typeof window === "undefined") return;
    const w = window as any;
    if (w.YT && w.YT.Player) return;
    await new Promise<void>((resolve) => {
      const existing = document.getElementById("youtube-iframe-api");
      if (existing) {
        const check = () =>
          w.YT && w.YT.Player ? resolve() : setTimeout(check, 50);
        check();
        return;
      }
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
      w.onYouTubeIframeAPIReady = () => resolve();
    });
  };

  useEffect(() => {
    if (!open || view !== "video" || !selected) return;
    const run = async () => {
      await loadYouTubeIframeAPI();
      const w = window as any;
      const videoId = extractYouTubeId(selected.videoUrl);
      if (!videoId) return;

      if (!playerContainerRef.current) return;
      // Clear any previous iframe content
      playerContainerRef.current.innerHTML = "";

      const startSeconds = getProgress(selected.id) || 0;
      playerRef.current = new w.YT.Player(playerContainerRef.current, {
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          start: Math.floor(startSeconds),
          playsinline: 1,
        },
        events: {
          onReady: () => {
            // Start polling current time
            progressTimerRef.current = window.setInterval(() => {
              try {
                const t = Math.floor(
                  playerRef.current?.getCurrentTime?.() ?? 0
                );
                if (Number.isFinite(t)) setProgress(selected.id, t);
              } catch {}
            }, 1000);
          },
        },
      });
    };

    run();

    return () => {
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      try {
        playerRef.current?.destroy?.();
      } catch {}
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, view, selected?.id]);

  const modalTitle = view === "video" ? undefined : (view === "news" ? "News & Updates" : panelTitle);

  return (
    <div className={className}>
      <PopoverMenu
        items={menuItems}
        onSelect={handleMenuSelect}
        showIconsInList
        position="top"
        align="end"
        triggerIcon={
          <FontAwesomeIcon icon={faCircleQuestion} className="text-base-fg" />
        }
        triggerLabel="Help"
        buttonClassName="h-9"
      />

      <Modal
        isOpen={open}
        onClose={handleClose}
        title={modalTitle}
        titleIcon={view === "news" ? faNewspaper : faBook}
        accessibleTitle={modalTitle}
        className={view === "news" ? "max-w-3xl" : "max-w-5xl"}
      >
        {view === "news" && (
          <NewsView onBack={() => {}} />
        )}

        {view === "grid" && (
          <>
            {tutorials.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-white/60">
                No tutorials yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tutorials.map((item: TutorialItem) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => viewTutorial(item)}
                    className="group block overflow-hidden rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-left"
                  >
                    <div className="aspect-video w-full overflow-hidden">
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                      />
                    </div>
                    <div className="p-3 text-sm text-white/90">
                      {item.title}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {view === "video" && selected && (
          <div className="flex w-full flex-col">
            <div className="mb-3 flex items-center gap-3">
              <Button
                onClick={setGrid}
                className="w-fit text-base-fg opacity-80 hover:opacity-100 font-medium"
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
                <div ref={playerContainerRef} className="h-full w-full" />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default HelpMenuButton;
