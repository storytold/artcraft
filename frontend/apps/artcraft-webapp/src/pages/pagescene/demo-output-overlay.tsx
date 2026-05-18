import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCompress,
  faExpand,
  faImage,
  faWandMagicSparkles,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
import { MediaFilesApi, PromptsApi } from "@storyteller/api";
import { addCorsParam, PLACEHOLDER_IMAGES } from "@storyteller/common";
import { LoadingSpinner } from "@storyteller/ui-loading-spinner";
import { Viewer3D } from "@storyteller/ui-viewer-3d";
import { is3DModelUrl, isVideoUrl } from "../../components/lightbox/shared";

// Demo overlay rendered on top-right of the 3D editor when the URL carries
// `?output=<media_token>` (alias: `?demo=<media_token>`). It resolves the
// token to a media URL and renders the asset (image / video / 3D model)
// in a 16:9 picture-in-picture card so the scene and its rendered output
// can be shown side by side.
//
// UX details aimed at making the relationship obvious at a glance:
//   - "Rendered Output" header with a wand-sparkles icon and a
//     "Generated from this scene" subtitle so first-time viewers
//     immediately understand the card is the AI render of the scene
//     they're looking at.
//   - Slide-in entrance animation draws the eye to the corner on load
//     so the card isn't missed.
//   - The title-bar expand button promotes the card to a centered
//     larger view over the editor; clicking again (or the backdrop /
//     Esc) collapses it back to the corner.
//
// The component is fully self-contained: it fetches its own media and
// renders nothing while the token is unresolved or invalid.

interface DemoOutputOverlayProps {
  outputToken: string;
}

interface OverlayMedia {
  url: string;
  isVideo: boolean;
  is3D: boolean;
}

export function DemoOutputOverlay({ outputToken }: DemoOutputOverlayProps) {
  const [media, setMedia] = useState<OverlayMedia | null>(null);
  const [promptText, setPromptText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrorMessage(null);
    setMedia(null);
    setPromptText(null);

    (async () => {
      try {
        const mediaResponse = await new MediaFilesApi().GetMediaFileByToken({
          mediaFileToken: outputToken,
        });
        if (cancelled) return;

        const file = mediaResponse?.data;
        const url = file?.media_links?.cdn_url || null;
        if (!mediaResponse?.success || !file || !url) {
          setErrorMessage("Rendered output not found");
          return;
        }
        setMedia({
          url,
          isVideo: isVideoUrl(url),
          is3D: is3DModelUrl(url),
        });

        // The prompt fetch is best-effort and decorative; failures or a
        // missing prompt_token should leave the card without a caption,
        // not surface an error to the user.
        if (file.maybe_prompt_token) {
          const promptResponse = await new PromptsApi().GetPromptsByToken({
            token: file.maybe_prompt_token,
          });
          if (cancelled) return;
          const text = promptResponse?.success
            ? promptResponse.data?.maybe_positive_prompt || null
            : null;
          setPromptText(text);
        }
      } catch {
        if (!cancelled) setErrorMessage("Failed to load rendered output");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [outputToken]);

  useEffect(() => {
    if (!isExpanded) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsExpanded(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isExpanded]);

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
      promptText={promptText}
    >
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner className="h-6 w-6 text-white/60" />
        </div>
      ) : errorMessage ? (
        <div className="absolute inset-0 flex items-center justify-center px-3 text-center text-xs text-white/60">
          {errorMessage}
        </div>
      ) : media ? (
        <OverlayMediaView media={media} />
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
    <div className="pointer-events-none absolute right-2 top-2 z-30 w-[30%] min-w-[260px] max-w-lg animate-in fade-in slide-in-from-right-8 duration-500">
      {body}
    </div>
  );
}

function ShowOutputPill({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Show rendered output"
      className="pointer-events-auto absolute right-2 top-2 z-30 flex items-center gap-2 rounded-xl border border-ui-controls-border bg-ui-controls px-3 py-1.5 text-sm font-medium text-base-fg shadow-xl transition-colors duration-150 hover:bg-ui-controls/80 animate-in fade-in slide-in-from-right-4"
    >
      <FontAwesomeIcon icon={faImage} className="h-3 w-3 text-primary" />
      Show output
    </button>
  );
}

interface CardProps {
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onHide: () => void;
  promptText: string | null;
  children: React.ReactNode;
}

function Card({
  isExpanded,
  onToggleExpanded,
  onHide,
  promptText,
  children,
}: CardProps) {
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
        <button
          type="button"
          onClick={onHide}
          aria-label={
            isExpanded ? "Collapse to picture-in-picture" : "Hide rendered output"
          }
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-base-fg/60 transition-colors hover:bg-ui-controls hover:text-base-fg"
        >
          <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
        </button>
      </div>
      <div
        role="button"
        tabIndex={0}
        aria-label={isExpanded ? "Collapse output view" : "Expand output view"}
        onClick={onToggleExpanded}
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
      {promptText && (
        <div
          className="border-t border-ui-controls-border/60 px-3 py-2 text-[11px] leading-[15px] text-base-fg/70"
          title={promptText}
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            maxHeight: "47px",
          }}
        >
          {promptText}
        </div>
      )}
    </div>
  );
}

function OverlayMediaView({ media }: { media: OverlayMedia }) {
  const src = addCorsParam(media.url) || media.url;
  if (media.is3D) {
    return <Viewer3D modelUrl={src} isActive className="h-full w-full" />;
  }
  if (media.isVideo) {
    return (
      <video
        src={src}
        className="h-full w-full object-contain"
        autoPlay
        loop
        muted
        playsInline
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
