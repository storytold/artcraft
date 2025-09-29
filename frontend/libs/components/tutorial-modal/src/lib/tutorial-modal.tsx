import { useEffect, useMemo, useRef, useState } from "react";
import { faBook, faChevronLeft } from "@fortawesome/pro-solid-svg-icons";
import { Modal } from "@storyteller/ui-modal";
import { defaultTutorials, TutorialItem } from "./tutorials.js";
import { useTutorialModalStore } from "./tutorial-modal-store";
import { Button } from "@storyteller/ui-button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export type TutorialModalButtonProps = {
  items?: TutorialItem[];
  panelTitle?: string;
  className?: string;
  onOpenChange?: (open: boolean) => void;
};

export function TutorialModalButton({
  items,
  panelTitle = "Tutorials",
  className,
  onOpenChange,
}: TutorialModalButtonProps) {
  const [open, setOpen] = useState(false);
  const tutorials = useMemo(() => items ?? defaultTutorials, [items]);
  const view = useTutorialModalStore((s) => s.view);
  const selected = useTutorialModalStore((s) => s.selected);
  const setGrid = useTutorialModalStore((s) => s.setGrid);
  const viewTutorial = useTutorialModalStore((s) => s.viewTutorial);
  const getProgress = useTutorialModalStore((s) => s.getProgress);
  const setProgress = useTutorialModalStore((s) => s.setProgress);

  const handleOpen = () => {
    setOpen(true);
    onOpenChange?.(true);
  };
  const handleClose = () => {
    setOpen(false);
    onOpenChange?.(false);
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

  return (
    <div className={className}>
      <Button
        aria-label="Open tutorials"
        onClick={handleOpen}
        variant="action"
        title={view === "grid" ? "Tutorials" : selected?.title ?? "Tutorials"}
      >
        <span className="inline-flex items-center gap-2">
          <FontAwesomeIcon icon={faBook} className="text-base-fg" />
          <span className="text-base-fg">Tutorials</span>
        </span>
      </Button>

      <Modal
        isOpen={open}
        onClose={handleClose}
        title={view === "video" ? undefined : panelTitle}
        titleIcon={faBook}
        accessibleTitle={panelTitle}
        className="max-w-5xl"
      >
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

export default TutorialModalButton;
