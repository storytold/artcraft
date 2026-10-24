// React hooks: useState keeps values the screen depends on, useMemo remembers a computed value between renders, useRef keeps a value that is NOT drawn on screen, useEffect runs side effects after drawing. `type MouseEvent` is only a type (it is erased when the app is built).
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
// Icons from the lucide-react icon set, used in the menu rows, the news list and the Back buttons.
import { ArrowRightIcon, BookIcon, ChevronLeftIcon, CircleHelpIcon, NewspaperIcon } from "lucide-react";
// The app's own brand icons for the Discord, GitHub and YouTube menu rows.
import { DiscordIcon, GithubIcon, YoutubeIcon } from "@storyteller/icons";
// OpenUrl asks the Tauri shell (the desktop wrapper around the web page) to open an address in the user's normal browser.
import { OpenUrl } from "@storyteller/tauri-api";
// The shared pop-up window component (backdrop, title bar, close button).
import { Modal } from "@storyteller/ui-modal";
// The list of tutorial videos and the shape of one entry (see tutorials.ts).
import { defaultTutorials, TutorialItem } from "./tutorials.js";
// The zustand store that remembers which Help view is showing, which tutorial is picked and how far each video was watched.
import { useTutorialModalStore } from "./help-menu-store";
// The shared button component, used for the "Back" button on the video view.
import { Button } from "@storyteller/ui-button";
// The shared pop-up menu (the "Help" button and its list of rows) and the type of one row.
import { PopoverMenu, PopoverItem } from "@storyteller/ui-popover";
// getNewsPosts: the news articles bundled into the app. markdownToHtml: turns an article's Markdown text into HTML.
import { getNewsPosts, markdownToHtml } from "@storyteller/markdown-content";

// The props the caller of <HelpMenuButton /> may pass. All are optional.
export type HelpMenuButtonProps = {
  // Replace the built-in tutorial list.
  items?: TutorialItem[];
  // Replace the pop-up window title shown on the tutorial grid ("Tutorials" by default).
  panelTitle?: string;
  // Extra CSS classes for the wrapper around the Help button.
  className?: string;
  // Called with true when the window opens and false when it closes, so the parent can react (for example to pause hotkeys).
  onOpenChange?: (open: boolean) => void;
};

// The public website. Site-relative links written in an article ("/download", "/press-kit#top") are meant for it.
const WEBSITE_ORIGIN = "https://getartcraft.com";

// Work out where a link clicked inside a news article should open in the system browser.
// `href` is the link's attribute exactly as written in the article (not the browser-resolved address, which inside
// the app would be a made-up "tauri://localhost/..." one). Returns null for links that should be left to the browser,
// such as a same-page "#section" jump.
const resolveArticleLink = (href: string): string | null => {
  // "https://..." or "http://...": open as written.
  if (/^https?:\/\//i.test(href)) return href;
  // "/download": a page on the website. "//host/..." (protocol-relative) is not one of ours, so it is skipped.
  if (href.startsWith("/") && !href.startsWith("//")) return `${WEBSITE_ORIGIN}${href}`;
  // "#credits", "mailto:", anything else: nothing to open.
  return null;
};

// Click handler for the article body. The article HTML is plain <a href> tags; left alone, a click would load that
// page inside the app window itself (replacing the app) because only target="_blank" links reach the system browser.
// So the click is cancelled and the address is handed to OpenUrl, like the Help menu's Discord/GitHub items.
const handleArticleClick = (e: MouseEvent<HTMLElement>) => {
  // The click may land on text or an icon inside the link, so look for the nearest <a> above the click point.
  const anchor = e.target instanceof Element ? e.target.closest("a") : null;
  // Ignore clicks outside any link, and links that are not inside this article body.
  if (!anchor || !e.currentTarget.contains(anchor)) return;
  // Read the link's address exactly as the article wrote it.
  const href = anchor.getAttribute("href");
  // A link with no address (or an empty one) has nothing to open.
  if (!href) return;
  // Decide which address (if any) this link should open in the system browser.
  const target = resolveArticleLink(href);
  // null means "leave this click to the browser" (a same-page jump, a mailto: link, and so on).
  if (!target) return;
  // Stop the window from navigating (this also tells the opener plugin's own click listener to skip this click).
  e.preventDefault();
  // Hand the address to the Tauri shell, which opens it in the user's default browser.
  OpenUrl(target);
};

// Internal News Component
// The "News & Updates" screen inside the Help window: a list of articles, and a reading view for the one picked.
// `onBack` is part of the props but the caller passes an empty function; the reading view has its own "Back to News" button.
const NewsView = ({ onBack }: { onBack: () => void }) => {
  // The slug (short URL-safe id) of the article being read, or null while the list is showing.
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  // The articles that shipped inside the app. Read once (empty dependency list) so the list is stable between renders.
  const bundledItems = useMemo(() => getNewsPosts(), []);
  // The list on screen. It starts as the bundled articles and is swapped for the website's fresher feed if that loads.
  const [items, setItems] = useState(bundledItems);

  // Runs once when the news screen opens: tries to fetch the latest articles from the website.
  useEffect(() => {
    // Attempt to fetch fresh news
    const fetchNews = async () => {
      try {
        // While developing, the website runs locally on port 4200; in the shipped app it is the public site.
        const baseUrl = import.meta.env.DEV
          ? "http://localhost:4200"
          : "https://getartcraft.com";
        // Download the feed (a JSON file listing the articles).
        const res = await fetch(`${baseUrl}/news.json`);
        // Only use it when the server answered with a success status.
        if (res.ok) {
          // Parse the JSON body.
          const data = await res.json();
          // Only swap the list when the file really is a list (guards against an error page or an object).
          if (Array.isArray(data)) {
            // Replace the bundled articles with the fresh ones.
            setItems(data);
          }
        }
      } catch (e) {
        // Fallback or ignore
        // Network or parse failure: keep the bundled articles and leave a note in the console.
        console.warn("Failed to fetch news feed, using bundled content.", e);
      }
    };
    // Start the download (its result is handled inside the function above).
    fetchNews();
  }, []);

  // The full article object for the slug being read, or null/undefined when none is picked or it is not in the list.
  const selectedPost = useMemo(
    () => (selectedSlug ? items.find((i) => i.slug === selectedSlug) : null),
    [selectedSlug, items],
  );

  // The picked article's body converted from Markdown to HTML (empty string when nothing is picked).
  const html = useMemo(
    () => (selectedPost ? markdownToHtml(selectedPost.body) : ""),
    [selectedPost],
  );

  // Reading view: shown when an article is picked.
  if (selectedPost) {
    return (
      <div className="flex flex-col h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {/* Back button: clearing the slug returns to the list. */}
        <button
          onClick={() => setSelectedSlug(null)}
          className="self-start mb-4 text-sm flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ChevronLeftIcon /> Back to News
        </button>

        {/* The `article-content` class ties the article to the style block at the bottom of this view. */}
        <div className="article-content">
          {/* Article title. */}
          <h1 className="font-display text-2xl font-bold mb-2">{selectedPost.title}</h1>
          {/* Publication date, only when the article has one. */}
          {selectedPost.date && (
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/50 mb-4">{selectedPost.date}</p>
          )}

          {/* Header picture, only when the article has one. */}
          {selectedPost.thumbnail && (
            <img
              src={selectedPost.thumbnail}
              alt={selectedPost.title}
              className="w-full h-48 object-cover rounded-none mb-4 border border-white/15"
            />
          )}

          {/* The article body. The HTML comes from our own Markdown converter; clicks on links inside go through handleArticleClick. */}
          <div
            dangerouslySetInnerHTML={{ __html: html }}
            onClick={handleArticleClick}
            className="text-white/80 space-y-4"
          />
        </div>
        {/* Styles for the HTML inside the article (headings, lists, images, links, video embeds). Scoped by the `.article-content` prefix. */}
        <style>{`
          .article-content h1 { font-size: 1.5rem; font-weight: 700; margin: 1rem 0 0.5rem; }
          .article-content h2 { font-size: 1.25rem; font-weight: 700; margin: 1rem 0 0.5rem; color: #ffffff; }
          .article-content h3 { font-size: 1.1rem; font-weight: 600; margin: 0.75rem 0 0.5rem; }
          .article-content p { margin-bottom: 0.75rem; line-height: 1.6; }
          .article-content ul { list-style: disc; padding-left: 1.25rem; margin-bottom: 0.75rem; }
          .article-content li { margin-bottom: 0.25rem; }
          .article-content img { display: block; width: 100%; max-width: 100%; height: auto; border-radius: 0; border: 1px solid rgba(255,255,255,0.15); margin: 1rem 0; }
          .article-content a { color: #74aaff; text-decoration: none; border-bottom: 1px solid transparent; transition: border-color 0.2s; }
          .article-content a:hover { border-bottom-color: #74aaff; }

          /* Video embed styles */
          .article-content .video-embed { position: relative; width: 100%; margin: 1.5rem 0; border-radius: 0; overflow: hidden; border: 1px solid rgba(255,255,255,0.15); background: #000; }
          .article-content .youtube-embed { padding-bottom: 56.25%; /* 16:9 aspect ratio */ height: 0; }
          .article-content .youtube-embed iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
          .article-content .video-embed video { display: block; width: 100%; height: auto; max-height: 50vh; }
        `}</style>
      </div>
    );
  }

  // List view: shown when no article is picked.
  return (
    <div className="flex flex-col gap-4 mt-2 h-[500px] overflow-y-auto pr-2 custom-scrollbar">
      {/* One clickable card per article; clicking sets the slug, which switches to the reading view above. */}
      {items.map((item) => (
        <div
          key={item.slug}
          onClick={() => setSelectedSlug(item.slug)}
          className="bg-white/5 hover:bg-white/[0.07] border border-white/15 hover:border-white/25 p-4 rounded-none cursor-pointer transition-colors group"
        >
          <div className="flex justify-between items-start">
            {/* Card title, with an arrow that slides in when the card is hovered. */}
            <h3 className="text-lg font-semibold group-hover:text-white transition-colors flex items-center gap-2">
              {item.title}
              <ArrowRightIcon

                size="xs"
                className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-white" />
            </h3>
            {/* Date on the right of the card, only when the article has one. */}
            {item.date && (
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/40 whitespace-nowrap ml-2">
                {item.date}
              </span>
            )}
          </div>
          {/* Short description, cut to two lines. */}
          <p className="text-sm text-white/60 mt-1 line-clamp-2">
            {item.description}
          </p>
        </div>
      ))}
      {/* Empty state when there are no articles at all. */}
      {items.length === 0 && (
        <div className="text-center text-white/40 py-10">No news yet.</div>
      )}
    </div>
  );
};

// The "Help" button with its pop-up menu, plus the window that shows Tutorials and News.
export function HelpMenuButton({
  items,
  panelTitle = "Tutorials",
  className,
  onOpenChange,
}: HelpMenuButtonProps) {
  // Whether the Help window (the Modal below) is open. Local to this component, not in the store.
  const [open, setOpen] = useState(false);
  // The tutorials to show: the caller's list if given, otherwise the built-in three. Recomputed only when `items` changes.
  const tutorials = useMemo(() => items ?? defaultTutorials, [items]);
  // Which screen the window shows: "grid" (tutorial thumbnails), "video" (one playing) or "news".
  const view = useTutorialModalStore((s) => s.view);
  // The tutorial currently being watched, or null.
  const selected = useTutorialModalStore((s) => s.selected);
  // Store actions: switch to the thumbnail grid, switch to news, start watching one tutorial.
  const setGrid = useTutorialModalStore((s) => s.setGrid);
  const setNews = useTutorialModalStore((s) => s.setNews);
  const viewTutorial = useTutorialModalStore((s) => s.viewTutorial);
  // Store actions for the saved watch position (seconds) of each tutorial.
  const getProgress = useTutorialModalStore((s) => s.getProgress);
  const setProgress = useTutorialModalStore((s) => s.setProgress);

  // Sync open state if managed externally? No, local state + optional callback.

  // Menu row "Tutorials": show the thumbnail grid and open the window.
  const handleOpenTutorials = () => {
    // Reset to the grid so the window never reopens on a video that was playing before.
    setGrid();
    // Open the window.
    setOpen(true);
    // Tell the parent (if it asked to be told).
    onOpenChange?.(true);
  };

  // Menu row "News & Updates": show the news screen and open the window.
  const handleOpenNews = () => {
    // Switch the store to the news view.
    setNews();
    // Open the window.
    setOpen(true);
    // Tell the parent (if it asked to be told).
    onOpenChange?.(true);
  };

  // Called when the window is closed (close button, backdrop click or Escape, as the Modal decides).
  const handleClose = () => {
    // Hide the window. The video effect further down sees `open` become false and stops the player.
    setOpen(false);
    // Tell the parent (if it asked to be told).
    onOpenChange?.(false);
  };

  // Menu items for the popover
  // The rows of the Help pop-up menu. `action` is the id handleMenuSelect switches on; `selected` is always false because the menu has no "current" row.
  const menuItems: PopoverItem[] = [
    {
      label: "Tutorials",
      selected: false,
      icon: <BookIcon  className="text-base" />,
      action: "tutorials",
    },
    {
      label: "News & Updates",
      selected: false,
      icon: <NewspaperIcon  className="text-base" />,
      action: "news",
    },
    {
      label: "Discord",
      selected: false,
      icon: <DiscordIcon  className="text-base" />,
      action: "discord",
    },
    {
      label: "GitHub",
      selected: false,
      icon: <GithubIcon  className="text-base" />,
      action: "github",
    },
    {
      label: "ArtCraft Studios",
      selected: false,
      icon: <YoutubeIcon  className="text-base" />,
      action: "artcraft",
    },
  ];

  // Runs when a menu row is clicked: opens the Tutorials/News window or sends the user to an outside page.
  const handleMenuSelect = (item: PopoverItem) => {
    switch (item.action) {
      // Tutorials row: open the window on the thumbnail grid.
      case "tutorials":
        handleOpenTutorials();
        break;
      // News row: open the window on the news list.
      case "news":
        handleOpenNews();
        break;
      // Discord row: open the community invite in the system browser.
      case "discord":
        OpenUrl("https://discord.com/invite/75svZP2Vje");
        break;
      // GitHub row: open the project's repository in the system browser.
      case "github":
        OpenUrl("https://github.com/storytold/artcraft");
        break;
      // ArtCraft Studios row: open the YouTube channel in the system browser.
      case "artcraft":
        OpenUrl("https://www.youtube.com/@OfficialArtCraftStudios");
        break;
    }
  };

  // ------------------------------------------------------
  // YouTube Player setup for restoring and saving progress
  // ------------------------------------------------------
  // The empty <div> the YouTube player is built into (YouTube swaps it for its own iframe).
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  // The YouTube player object, so it can be asked for its time and destroyed. `any` because YouTube's script has no types here.
  const playerRef = useRef<any | null>(null);
  // The id of the once-a-second timer that saves the watch position, so it can be stopped.
  const progressTimerRef = useRef<number | null>(null);

  // Pull the video id out of the different YouTube address shapes. Returns null when the address is not one it knows.
  const extractYouTubeId = (url: string): string | null => {
    try {
      // Split the address into host, path and query parts (throws if it is not a valid address).
      const u = new URL(url);
      // Drop a leading "www." so "www.youtube.com" and "youtube.com" compare equal.
      const host = u.hostname.replace(/^www\./, "");
      // https://youtube.com/embed/<id>: the id is the third path piece.
      if (host === "youtube.com" && u.pathname.startsWith("/embed/")) {
        return u.pathname.split("/")[2] ?? null;
      }
      // https://youtube.com/shorts/<id>
      if (host.includes("youtube.com") && u.pathname.startsWith("/shorts/")) {
        return u.pathname.split("/")[2] ?? null;
      }
      // https://youtube.com/watch?v=<id>: the id is in the query string.
      if (host.includes("youtube.com") && u.pathname === "/watch") {
        return u.searchParams.get("v");
      }
      // https://youtu.be/<id>: the id is the whole path after the slash.
      if (host === "youtu.be") {
        return u.pathname.slice(1) || null;
      }
    } catch {}
    // Not a valid address, or not a YouTube one.
    return null;
  };

  // Make sure YouTube's player script is loaded; resolves once `window.YT.Player` exists.
  const loadYouTubeIframeAPI = async (): Promise<void> => {
    // No window (server-side or a test without one): nothing to load.
    if (typeof window === "undefined") return;
    // Reach YouTube's global object without type errors.
    const w = window as any;
    // Already loaded earlier: done.
    if (w.YT && w.YT.Player) return;
    // Otherwise wait until the script has loaded (or fail if it cannot be downloaded).
    await new Promise<void>((resolve, reject) => {
      // Has a previous call already added the script tag?
      const existing = document.getElementById("youtube-iframe-api");
      if (existing) {
        // Check every 50 ms until the player class appears, then finish.
        const check = () => {
          // The player class is there: the wait is over.
          if (w.YT && w.YT.Player) {
            resolve();
            return;
          }
          // WHY: a script that failed to download removes its own tag (see `tag.onerror` below). With the tag gone nothing can
          // ever define the player class, so stop checking instead of polling every 50 ms for as long as the app stays open.
          if (!document.getElementById("youtube-iframe-api")) {
            reject(new Error("YouTube player script failed to load"));
            return;
          }
          // Still loading: look again shortly.
          setTimeout(check, 50);
        };
        check();
        return;
      }
      // First call: add YouTube's script to the page.
      const tag = document.createElement("script");
      // The id lets later calls find this tag instead of adding a second one.
      tag.id = "youtube-iframe-api";
      // YouTube's player script.
      tag.src = "https://www.youtube.com/iframe_api";
      // WHY: before this, a failed download (offline, or the request blocked) left the dead tag in the page. Every later call
      // found it, took the "already added" branch above and waited for a script that would never arrive, so the tutorials stayed
      // blank until the app was restarted even after the network came back. Remove the dead tag so the next pick adds a fresh
      // one, and fail this wait so the caller can give up.
      tag.onerror = () => {
        // Take the failed tag out of the page; the id is then free for a new attempt.
        tag.remove();
        // Fail the wait (the effect below catches this).
        reject(new Error("YouTube player script failed to load"));
      };
      document.head.appendChild(tag);
      // YouTube calls this global function when its script has finished loading.
      w.onYouTubeIframeAPIReady = () => resolve();
    });
  };

  // Builds the player when the window is open on a video, and tears it down (stopping the save timer) on Back, close or another pick.
  useEffect(() => {
    // Only act when the window is open, on the video view, with a tutorial picked.
    if (!open || view !== "video" || !selected) return;
    // WHY: loading the YouTube API can take a while. If the user goes Back and
    // picks another tutorial meanwhile, the earlier run would resume after
    // its cleanup and build a second player in the new container (wrong video,
    // leaked progress timer). Each run bails out once its cleanup has fired.
    let cancelled = false;
    const run = async () => {
      try {
        // Wait for YouTube's script (returns at once when it is already loaded).
        await loadYouTubeIframeAPI();
      } catch (error) {
        // The script could not be downloaded. Leave the video area empty and log why; picking a tutorial again asks for the
        // script again. (Without this catch the rejection would surface as an unhandled promise rejection.)
        console.warn("Could not load the YouTube player", error);
        return;
      }
      // The effect was cleaned up while the API loaded (Back, or a different pick): do not build a player.
      if (cancelled) return;
      const w = window as any;
      // Work out the video id from the tutorial's address.
      const videoId = extractYouTubeId(selected.videoUrl);
      // An address we cannot read: show nothing rather than fail.
      if (!videoId) return;

      // The container div must exist (it is drawn only on the video view).
      if (!playerContainerRef.current) return;
      // Clear any previous iframe content
      playerContainerRef.current.innerHTML = "";

      // Resume where the user stopped last time (0 when never watched).
      const startSeconds = getProgress(selected.id) || 0;
      // Build the player inside the container.
      playerRef.current = new w.YT.Player(playerContainerRef.current, {
        videoId,
        playerVars: {
          // Do not suggest unrelated videos at the end.
          rel: 0,
          // Hide most YouTube branding.
          modestbranding: 1,
          // Start at the saved position (YouTube wants whole seconds).
          start: Math.floor(startSeconds),
          // Play inside the page rather than full-screen on phones.
          playsinline: 1,
        },
        events: {
          // YouTube says the player is ready to be asked questions.
          onReady: () => {
            // Start polling current time
            // Every second, save the playhead position to the store so the next visit resumes there.
            progressTimerRef.current = window.setInterval(() => {
              try {
                // Ask the player for its current time in seconds (0 if it cannot answer), rounded down.
                const t = Math.floor(
                  playerRef.current?.getCurrentTime?.() ?? 0,
                );
                // Save it for this tutorial, unless it is not a real number.
                if (Number.isFinite(t)) setProgress(selected.id, t);
              } catch {}
            }, 1000);
          },
        },
      });
    };

    // Start building (the returned promise is not awaited; the effect cannot be async).
    run();

    // Cleanup: runs on Back, close, or a different pick.
    return () => {
      // Tell a still-pending run (waiting for the YouTube script) not to build anything.
      cancelled = true;
      // Stop the save timer.
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      // Remove the player and its iframe, ignoring errors if YouTube already dropped it.
      try {
        playerRef.current?.destroy?.();
      } catch {}
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, view, selected?.id]);

  // The title bar text: none on the video view (the video has its own heading), "News & Updates" on news, else the panel title.
  const modalTitle =
    view === "video"
      ? undefined
      : view === "news"
        ? "News & Updates"
        : panelTitle;

  return (
    <div className={className}>
      {/* The "Help" button; clicking it shows the menu rows built above. */}
      <PopoverMenu
        items={menuItems}
        onSelect={handleMenuSelect}
        showIconsInList
        position="top"
        align="end"
        triggerIcon={
          <CircleHelpIcon  className="text-base-fg" />
        }
        triggerLabel="Help"
        buttonClassName="h-9"
      />

      {/* The Help window. News gets a narrower window than tutorials (which need room for the video). */}
      <Modal
        isOpen={open}
        onClose={handleClose}
        title={modalTitle}
        titleIcon={view === "news" ? NewspaperIcon : BookIcon}
        accessibleTitle={modalTitle}
        className={view === "news" ? "max-w-3xl" : "max-w-5xl"}
      >
        {/* News screen. The empty onBack is fine: the reading view has its own Back button. */}
        {view === "news" && <NewsView onBack={() => {}} />}

        {/* Thumbnail grid screen. */}
        {view === "grid" && (
          <>
            {/* No tutorials supplied or built in: show a message instead of an empty grid. */}
            {tutorials.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-white/60">
                No tutorials yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* One thumbnail button per tutorial; clicking opens its video view. */}
                {tutorials.map((item: TutorialItem) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => viewTutorial(item)}
                    className="group block overflow-hidden rounded-none border border-white/15 bg-white/5 transition-colors hover:border-white/25 hover:bg-white/[0.07] text-left"
                  >
                    {/* 16:9 picture frame; the picture zooms slightly on hover. */}
                    <div className="aspect-video w-full overflow-hidden">
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                      />
                    </div>
                    {/* Tutorial title under the picture. */}
                    <div className="p-3 text-sm text-white/90">
                      {item.title}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Video screen: only when a tutorial is picked. */}
        {view === "video" && selected && (
          <div className="flex w-full flex-col">
            <div className="mb-3 flex items-center gap-3">
              {/* Back to the thumbnail grid (setGrid also clears the picked tutorial, which stops the player). */}
              <Button
                onClick={setGrid}
                className="w-fit text-base-fg opacity-80 hover:opacity-100 font-medium"
                variant="action"
                icon={ChevronLeftIcon}
              >
                Back
              </Button>
              {/* Heading with the tutorial's name. */}
              <div className="font-display text-lg font-bold text-base-fg">
                Tutorial: {selected.title}
              </div>
            </div>
            <div className="w-full">
              {/* 16:9 black frame; the YouTube player is built into the empty div inside it (see the effect above). */}
              <div className="aspect-video w-full overflow-hidden rounded-none border border-white/15 bg-black">
                <div ref={playerContainerRef} className="h-full w-full" />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// Also export the component as the default so it can be imported without braces.
export default HelpMenuButton;
