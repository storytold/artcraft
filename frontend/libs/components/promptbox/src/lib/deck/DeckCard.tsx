import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { BoxIcon, ImagesIcon, LoaderCircleIcon, MusicIcon, PlayIcon, SquareIcon, UploadIcon, VideoIcon, XIcon } from "lucide-react";
import { DynamicIcon } from "@storyteller/icons";
import { Modal } from "@storyteller/ui-modal";
import { twMerge } from "tailwind-merge";
import { DeckAddAction, DeckItem } from "./deckTypes";

/**
 * One-shot pop-in used when a card is added to the deck. Injected inline so
 * the lib doesn't depend on app Tailwind configs defining the keyframes.
 */
export const DECK_KEYFRAMES = `
@keyframes deck-pop {
  from { opacity: 0; transform: scale(0.6); }
  to { opacity: 1; transform: scale(1); }
}
`;

export const DeckStyles = () => <style>{DECK_KEYFRAMES}</style>;

// Settings for one card: the item to show, remove and click callbacks, and display switches.
interface DeckCardProps {
  item: DeckItem;
  onRemove?: () => void;
  onClick?: () => void;
  /** Force-hide hover chrome (remove button) — used while dragging. */
  hideHoverChrome?: boolean;
  /** Skip the pop-in animation (collapsed fan re-renders shouldn't pop). */
  animateIn?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * A single reference card face: image/video thumbnail or audio play tile,
 * duration badge, uploading spinner, hover remove and hover name label.
 */
export const DeckCard = ({
  item,
  onRemove,
  onClick,
  hideHoverChrome,
  animateIn,
  className,
  style,
}: DeckCardProps) => {
  // The sound playing from an audio card, if any.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Pauses and forgets the sound and puts the card back on the Play icon.
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // Audio cards: a click starts the clip (at 20% volume) or stops it.
  const handleToggleAudio = useCallback(() => {
    if (isPlaying) {
      // Already playing: stop it.
      stopAudio();
    } else if (item.url) {
      // Not playing and there is a clip to play: start it.
      const el = new Audio(item.url);
      el.volume = 0.2;
      audioRef.current = el;
      el.onended = () => setIsPlaying(false);
      // FIX: play() rejects when the webview can't decode the clip (or blocks
      // it); `ended` never fires then, so the card stayed on the stop icon.
      // The `=== el` check ignores a late rejection from a clip that was
      // already stopped, replaced or unmounted.
      Promise.resolve(el.play()).catch(() => {
        if (audioRef.current === el) {
          audioRef.current = null;
          setIsPlaying(false);
        }
      });
      setIsPlaying(true);
    }
  }, [isPlaying, item.url, stopAudio]);

  // Stops any sound when the card leaves the screen.
  useEffect(() => stopAudio, [stopAudio]);

  // Does nothing while uploading; audio cards play or stop; image and video cards open the preview; mesh cards do nothing.
  const handleClick = () => {
    if (item.uploading) return;
    if (item.kind === "audio") {
      handleToggleAudio();
    } else if (item.kind !== "mesh") {
      // Mesh files have nothing to preview.
      onClick?.();
    }
  };

  return (
    <div
      className={twMerge(
        "glass group relative aspect-square w-14 shrink-0 overflow-hidden rounded-[3px] border-2 border-white/30 transition-all duration-200",
        !item.uploading &&
          "cursor-pointer hover:border-white/80 hover:cursor-zoom-in",
        item.kind === "audio" && "hover:cursor-pointer",
        item.kind === "mesh" && "hover:cursor-default",
        animateIn && "animate-[deck-pop_180ms_ease-out]",
        className,
      )}
      style={style}
      onClick={handleClick}
    >
      {/* Image thumbnail, blurred while uploading. */}
      {item.kind === "image" && item.url && (
        <img
          src={item.url}
          alt={item.name}
          loading="lazy"
          className={twMerge(
            "h-full w-full object-cover",
            item.uploading && "blur-sm",
          )}
        />
      )}
      {/* Video thumbnail: the muted video's first frame, blurred while uploading. */}
      {item.kind === "video" && item.url && (
        <video
          src={item.url}
          muted
          preload="metadata"
          className={twMerge(
            "h-full w-full object-cover",
            item.uploading && "blur-sm",
          )}
        />
      )}
      {/* Mesh files have no picture, so a box icon stands in. */}
      {item.kind === "mesh" && (
        <div className="flex h-full w-full items-center justify-center">
          <BoxIcon
            
            className="h-5 w-5 text-base-fg/60 transition-colors group-hover:text-base-fg" />
        </div>
      )}
      {/* Audio cards show a Play icon that turns into a red Stop icon while the clip plays. */}
      {item.kind === "audio" && (
        <div className="flex h-full w-full items-center justify-center">
          <DynamicIcon
            icon={isPlaying ? SquareIcon : PlayIcon}
            className={twMerge(
              "h-5 w-5 transition-colors",
              isPlaying
                ? "text-red-400"
                : "text-base-fg/60 group-hover:text-base-fg",
            )}
          />
        </div>
      )}

      {/* Small video badge in the top-left corner. */}
      {item.kind === "video" && (
        <div className="pointer-events-none absolute left-[3px] top-[3px] flex h-4 w-4 items-center justify-center bg-black/60 text-white">
          <VideoIcon  className="h-2.5 w-2.5" />
        </div>
      )}
      {/* Small music-note badge in the top-left corner. */}
      {item.kind === "audio" && (
        <div className="pointer-events-none absolute left-[3px] top-[3px] flex h-4 w-4 items-center justify-center bg-black/60 text-white">
          <MusicIcon  className="h-2.5 w-2.5" />
        </div>
      )}

      {/* Length badge along the bottom, for example 8s. */}
      {item.duration != null && (
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-center justify-center bg-black/70 py-0.5 text-[10px] font-bold text-white">
          {item.duration}s
        </div>
      )}

      {/* Spinner over the card while its upload is running. */}
      {item.uploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <LoaderCircleIcon
            
            className="h-6 w-6 animate-spin text-white" />
        </div>
      )}

      {/* Remove button, visible on hover. It keeps stray clicks from reaching the card and stops any sound before removing. */}
      {onRemove && !item.uploading && !hideHoverChrome && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            stopAudio();
            onRemove();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute right-[2px] top-[2px] flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-md transition-colors hover:bg-red/70 group-hover:opacity-100"
        >
          <XIcon  className="h-2.5 w-2.5" />
        </button>
      )}
    </div>
  );
};

/**
 * Uniform add-menu body: ghost rows grouped by media type with small
 * uppercase section headers and separators. `groupHints` puts a compact
 * limits readout on the right of each header (e.g. "2/9", "1/3 · 8/15s").
 */
export const DeckAddMenu = ({
  actions,
  groupHints,
}: {
  actions: DeckAddAction[];
  groupHints?: Record<string, string>;
}) => {
  // Neighbouring actions that share a group name are collected into one section.
  const groups: { name?: string; actions: DeckAddAction[] }[] = [];
  for (const action of actions) {
    const last = groups[groups.length - 1];
    if (last && last.name === action.group) {
      last.actions.push(action);
    } else {
      groups.push({ name: action.group, actions: [action] });
    }
  }
  // Section headers appear only if some action has a group and there are several groups or limit hints.
  const showHeaders =
    groups.some((g) => g.name) && (groups.length > 1 || !!groupHints);

  return (
    <div className="flex w-48 flex-col">
      {/* One block per group, separated by a thin line. */}
      {groups.map((group, groupIndex) => (
        <div
          key={group.name ?? groupIndex}
          className={
            groupIndex > 0 ? "mt-1 border-t border-white/10 pt-1" : undefined
          }
        >
          {/* Group header with the name and, when given, its limits hint. */}
          {showHeaders && group.name && (
            <div className="flex items-center justify-between gap-3 px-2.5 pb-0.5 pt-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-base-fg/40">
                {group.name}
              </span>
              {groupHints?.[group.name] && (
                <span className="text-[10px] font-medium tabular-nums text-base-fg/40">
                  {groupHints[group.name]}
                </span>
              )}
            </div>
          )}
          {/* One button per action, with its own icon, else an upload icon for keys starting with "upload", else a pictures icon. */}
          {group.actions.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={action.onSelect}
              className="flex w-full items-center gap-2.5 rounded-[3px] px-2.5 py-1.5 text-left text-[13px] font-medium text-base-fg transition-colors hover:bg-white/10"
            >
              <DynamicIcon
                icon={
                  action.icon ??
                  (action.key.startsWith("upload")
                    ? UploadIcon
                    : ImagesIcon)
                }
                className="h-3.5 w-3.5 opacity-60"
              />
              {action.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};

// The item to enlarge (null keeps the modal closed) and a close callback.
interface DeckPreviewModalProps {
  item: DeckItem | null;
  onClose: () => void;
}

/** Darkened-backdrop fullscreen preview for a clicked deck card. */
export const DeckPreviewModal = ({ item, onClose }: DeckPreviewModalProps) => (
  <Modal
    isOpen={item !== null}
    onClose={onClose}
    backdropClassName="!bg-black/80"
    className="h-fit w-fit max-w-none border-0 bg-transparent p-0 shadow-none"
  >
    {/* Videos play with controls; everything else shows as an image, using the full-size URL when there is one. */}
    {item &&
      (item.kind === "video" ? (
        <video
          src={item.previewUrl ?? item.url}
          controls
          autoPlay
          className="max-h-[90vh] max-w-[90vw] object-contain"
        />
      ) : (
        <img
          src={item.previewUrl ?? item.url}
          alt={item.name}
          className="max-h-[90vh] max-w-[90vw] object-contain"
        />
      ))}
  </Modal>
);
