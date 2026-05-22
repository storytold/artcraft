import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCompress,
  faExpand,
  faImage,
  faVideo,
  faWandMagicSparkles,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
import { MediaFilesApi, PromptsApi } from "@storyteller/api";
import { addCorsParam, PLACEHOLDER_IMAGES } from "@storyteller/common";
import { LoadingSpinner } from "@storyteller/ui-loading-spinner";
import { Viewer3D } from "@storyteller/ui-viewer-3d";
import { is3DModelUrl } from "../../components/lightbox/shared";

// Demo overlay rendered on top-right of the 3D editor when the URL carries
// `?image=<media_token>` (or the legacy `?output=` / `?demo=` aliases) and
// optionally `?video=<media_token>`. Each token is resolved independently
// to a CDN URL and rendered in a 16:9 picture-in-picture card so the scene
// and its rendered output can be shown side by side.
//
// UX details:
//   - "Rendered Output" header with a wand-sparkles icon and a "Generated
//     from this scene" subtitle so first-time viewers immediately understand
//     the card is the AI render of the scene they're looking at.
//   - Slide-in entrance animation draws the eye to the corner on load.
//   - The title-bar expand button promotes the card to a centered larger
//     view over the editor; clicking again (or backdrop / Esc) collapses it.
//   - When both an image and a video token are present, a small segmented
//     toggle appears in the header. Video shows first (the toggle defaults
//     to the video side); flipping the toggle swaps the rendered media
//     *and* the prompt caption shown below it.
//
// The component is fully self-contained: it fetches both assets and renders
// nothing while everything is unresolved or invalid.

interface DemoOutputOverlayProps {
  imageToken: string | null;
  videoToken: string | null;
}

interface ResolvedAsset {
  url: string;
  is3D: boolean;
  promptText: string | null;
}

type View = "video" | "image";

export function DemoOutputOverlay({
  imageToken,
  videoToken,
}: DemoOutputOverlayProps) {
  const [image, setImage] = useState<ResolvedAsset | null>(null);
  const [video, setVideo] = useState<ResolvedAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  // Video shows first when both tokens are provided. When only one token
  // is present, the effective view derivation below pins to that side
  // regardless of this value, so the initial pick only matters for the
  // both-present case.
  const [view, setView] = useState<View>(videoToken ? "video" : "image");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrorMessage(null);
    setImage(null);
    setVideo(null);
    setView(videoToken ? "video" : "image");

    (async () => {
      const [imageResult, videoResult] = await Promise.all([
        imageToken ? resolveAsset(imageToken) : Promise.resolve(null),
        videoToken ? resolveAsset(videoToken) : Promise.resolve(null),
      ]);
      if (cancelled) return;
      setImage(imageResult);
      setVideo(videoResult);
      const anyRequested = !!(imageToken || videoToken);
      const anyResolved = !!(imageResult || videoResult);
      if (anyRequested && !anyResolved) {
        setErrorMessage("Rendered output not found");
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [imageToken, videoToken]);

  useEffect(() => {
    if (!isExpanded) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsExpanded(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isExpanded]);

  const hasImage = !!image;
  const hasVideo = !!video;
  // The selected `view` reflects user intent, but render against whichever
  // side actually resolved — if a fetch fails, we silently fall back to
  // the other side rather than showing an empty card with a dead toggle.
  const effectiveView: View | null = useMemo(() => {
    if (view === "video" && hasVideo) return "video";
    if (view === "image" && hasImage) return "image";
    if (hasVideo) return "video";
    if (hasImage) return "image";
    return null;
  }, [view, hasImage, hasVideo]);
  const activeAsset = effectiveView === "video" ? video : image;
  const captionText = activeAsset?.promptText ?? null;
  const showToggle = hasImage && hasVideo;

  if (isHidden) {
    return <ShowOutputPill onClick={() => setIsHidden(false)} />;
  }

  // The X button steps down one level: expanded → PIP, PIP → hidden.
  // Lets users escape full-screen without losing the corner card.
  const handleStepDown = () => {
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }
    setIsHidden(true);
  };

  const body = (
    <Card
      isExpanded={isExpanded}
      onToggleExpanded={() => setIsExpanded((v) => !v)}
      onHide={handleStepDown}
      captionText={captionText}
      toggle={
        showToggle && effectiveView ? (
          <ViewToggle view={effectiveView} onChange={setView} />
        ) : null
      }
      activeIsVideo={effectiveView === "video"}
    >
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner className="h-6 w-6 text-white/60" />
        </div>
      ) : errorMessage ? (
        <div className="absolute inset-0 flex items-center justify-center px-3 text-center text-xs text-white/60">
          {errorMessage}
        </div>
      ) : activeAsset && effectiveView ? (
        <OverlayMediaView asset={activeAsset} view={effectiveView} />
      ) : null}
    </Card>
  );

  if (isExpanded) {
    return (
      <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-8 backdrop-blur-sm animate-in fade-in duration-200">
        <button
          type="button"
          aria-label="Close expanded view"
          className="absolute inset-0 cursor-default"
          onClick={() => setIsExpanded(false)}
        />
        <div className="relative w-full max-w-5xl">{body}</div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute right-2 top-16 z-30 w-[30%] min-w-[260px] max-w-lg animate-in fade-in slide-in-from-right-8 duration-500">
      {body}
    </div>
  );
}

async function resolveAsset(token: string): Promise<ResolvedAsset | null> {
  try {
    const mediaResponse = await new MediaFilesApi().GetMediaFileByToken({
      mediaFileToken: token,
    });
    const file = mediaResponse?.data;
    const url = file?.media_links?.cdn_url;
    if (!mediaResponse?.success || !file || !url) return null;
    // Prompt fetch is best-effort and decorative; a missing or failed
    // prompt token leaves the asset without a caption rather than
    // failing the whole resolve.
    let promptText: string | null = null;
    if (file.maybe_prompt_token) {
      try {
        const promptResponse = await new PromptsApi().GetPromptsByToken({
          token: file.maybe_prompt_token,
        });
        promptText = promptResponse?.success
          ? promptResponse.data?.maybe_positive_prompt || null
          : null;
      } catch {
        // leave promptText null
      }
    }
    return { url, is3D: is3DModelUrl(url), promptText };
  } catch {
    return null;
  }
}

function ShowOutputPill({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Show rendered output"
      className="pointer-events-auto absolute right-2 top-16 z-30 flex items-center gap-2 rounded-xl border border-ui-controls-border bg-ui-controls px-3 py-1.5 text-sm font-medium text-base-fg shadow-xl transition-colors duration-150 hover:bg-ui-controls/80 animate-in fade-in slide-in-from-right-4"
    >
      <FontAwesomeIcon icon={faImage} className="h-3 w-3 text-primary" />
      Show output
    </button>
  );
}

interface ViewToggleProps {
  view: View;
  onChange: (next: View) => void;
}

// Single-button sliding toggle. The whole pill is the click target —
// clicking anywhere on it flips between video and image. A primary-
// coloured indicator translates between the two icons to show which
// side is currently active.
function ViewToggle({ view, onChange }: ViewToggleProps) {
  const next: View = view === "video" ? "image" : "video";
  return (
    <button
      type="button"
      aria-label={view === "video" ? "Switch to image" : "Switch to video"}
      onClick={() => onChange(next)}
      className="relative flex h-7 w-14 shrink-0 items-center rounded-full border border-ui-controls-border bg-black/30 p-0.5 transition-colors hover:bg-black/40"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-0.125rem)] rounded-full bg-primary shadow-sm transition-transform duration-200 ease-out"
        style={{
          transform: view === "image" ? "translateX(100%)" : "translateX(0%)",
        }}
      />
      <ToggleIcon icon={faVideo} active={view === "video"} />
      <ToggleIcon icon={faImage} active={view === "image"} />
    </button>
  );
}

interface ToggleIconProps {
  icon: typeof faVideo;
  active: boolean;
}

function ToggleIcon({ icon, active }: ToggleIconProps) {
  return (
    <span
      className={
        "relative z-10 flex h-full flex-1 items-center justify-center transition-colors " +
        (active ? "text-white" : "text-base-fg/60")
      }
    >
      <FontAwesomeIcon icon={icon} className="h-3 w-3" />
    </span>
  );
}

interface CardProps {
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onHide: () => void;
  captionText: string | null;
  toggle: React.ReactNode;
  activeIsVideo: boolean;
  children: React.ReactNode;
}

function Card({
  isExpanded,
  onToggleExpanded,
  onHide,
  captionText,
  toggle,
  activeIsVideo,
  children,
}: CardProps) {
  // When the video element is active, clicks on the native control bar
  // must not bubble to the wrapper's expand handler — otherwise pressing
  // play would also fullscreen the card. Suppress the wrapper handler
  // for any click whose target lives inside a <video> element.
  const handleMediaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeIsVideo) {
      const target = e.target as HTMLElement;
      if (target.closest("video")) return;
    }
    onToggleExpanded();
  };
  return (
    <div className="glass pointer-events-auto overflow-hidden rounded-xl shadow-xl border-2 border-primary">
      <div className="flex items-center justify-between gap-3 border-b border-ui-controls-border/60 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <FontAwesomeIcon
            icon={faWandMagicSparkles}
            className="h-3 w-3 shrink-0 text-primary"
          />
          <div className="min-w-0 leading-tight">
            <div className="text-xs font-semibold uppercase tracking-wider text-base-fg">
              Rendered Output
            </div>
            <div className="truncate text-[10px] text-base-fg/50">
              Generated from this scene
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {toggle}
          <button
            type="button"
            onClick={onHide}
            aria-label={
              isExpanded
                ? "Collapse to picture-in-picture"
                : "Hide rendered output"
            }
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-base-fg/60 transition-colors hover:bg-ui-controls hover:text-base-fg"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div
        role="button"
        tabIndex={0}
        aria-label={isExpanded ? "Collapse output view" : "Expand output view"}
        onClick={handleMediaClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleExpanded();
          }
        }}
        className={`relative aspect-video w-full bg-black/40 ${isExpanded ? "cursor-zoom-out" : "cursor-zoom-in"
          }`}
      >
        {children}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpanded();
          }}
          aria-label={isExpanded ? "Collapse output view" : "Expand output view"}
          className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-black/60 text-white/80 shadow-lg backdrop-blur-md transition-colors duration-150 hover:bg-black/80 hover:text-white"
        >
          <FontAwesomeIcon
            icon={isExpanded ? faCompress : faExpand}
            className="h-3 w-3"
          />
        </button>
      </div>
      {captionText && (
        <div
          className="border-t border-ui-controls-border/60 px-3 py-2 text-[11px] leading-[15px] text-base-fg/70"
          title={captionText}
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            maxHeight: "47px",
          }}
        >
          {captionText}
        </div>
      )}
    </div>
  );
}

interface OverlayMediaViewProps {
  asset: ResolvedAsset;
  view: View;
}

function OverlayMediaView({ asset, view }: OverlayMediaViewProps) {
  const src = addCorsParam(asset.url) || asset.url;
  if (asset.is3D) {
    return <Viewer3D modelUrl={src} isActive className="h-full w-full" />;
  }
  if (view === "video") {
    return (
      <video
        src={src}
        className="h-full w-full object-contain"
        autoPlay
        loop
        muted
        playsInline
        controls
      />
    );
  }
  return (
    <img
      src={src}
      alt="Rendered output"
      draggable={false}
      className="h-full w-full select-none object-contain"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGES.DEFAULT;
      }}
    />
  );
}
