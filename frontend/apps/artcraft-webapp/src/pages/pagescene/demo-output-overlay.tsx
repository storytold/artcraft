import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCompress,
  faExpand,
  faWandMagicSparkles,
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

  const body = (
    <Card
      isExpanded={isExpanded}
      onToggleExpanded={() => setIsExpanded((v) => !v)}
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
    <div className="pointer-events-none absolute right-4 top-4 z-30 w-[30%] min-w-[260px] max-w-lg animate-in fade-in slide-in-from-right-8 duration-500">
      {body}
    </div>
  );
}

interface CardProps {
  isExpanded: boolean;
  onToggleExpanded: () => void;
  promptText: string | null;
  children: React.ReactNode;
}

function Card({
  isExpanded,
  onToggleExpanded,
  promptText,
  children,
}: CardProps) {
  return (
    <div className="pointer-events-auto overflow-hidden rounded-xl border border-white/10 bg-black/50 shadow-2xl ring-1 ring-blue-500/20 backdrop-blur-lg">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-gradient-to-r from-blue-500/10 via-transparent to-transparent px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <FontAwesomeIcon
            icon={faWandMagicSparkles}
            className="h-3 w-3 shrink-0 text-blue-300"
          />
          <div className="min-w-0 leading-tight">
            <div className="text-xs font-semibold uppercase tracking-wider text-white">
              Rendered Output
            </div>
            <div className="truncate text-[10px] text-white/50">
              Generated from this scene
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleExpanded}
          aria-label={isExpanded ? "Collapse output view" : "Expand output view"}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          <FontAwesomeIcon
            icon={isExpanded ? faCompress : faExpand}
            className="h-3 w-3"
          />
        </button>
      </div>
      <div className="relative aspect-video w-full bg-black/60">{children}</div>
      {promptText && (
        <div
          className="border-t border-white/10 px-3 py-2 text-[11px] leading-snug text-white/70"
          title={promptText}
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
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
      className="h-full w-full object-contain"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGES.DEFAULT;
      }}
    />
  );
}
