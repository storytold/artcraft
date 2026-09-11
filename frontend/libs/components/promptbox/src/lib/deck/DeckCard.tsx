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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const handleToggleAudio = useCallback(() => {
    if (isPlaying) {
      stopAudio();
    } else if (item.url) {
      const el = new Audio(item.url);
      el.volume = 0.2;
      audioRef.current = el;
      el.onended = () => setIsPlaying(false);
      el.play();
      setIsPlaying(true);
    }
  }, [isPlaying, item.url, stopAudio]);

  useEffect(() => stopAudio, [stopAudio]);

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
        "glass group relative aspect-square w-14 shrink-0 overflow-hidden rounded-lg border-2 border-white/30 transition-all duration-200",
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
      {item.kind === "mesh" && (
        <div className="flex h-full w-full items-center justify-center">
          <BoxIcon
            
            className="h-5 w-5 text-base-fg/60 transition-colors group-hover:text-base-fg" />
        </div>
      )}
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

      {item.kind === "video" && (
        <div className="pointer-events-none absolute left-[3px] top-[3px] flex h-4 w-4 items-center justify-center rounded bg-black/60 text-white">
          <VideoIcon  className="h-2.5 w-2.5" />
        </div>
      )}
      {item.kind === "audio" && (
        <div className="pointer-events-none absolute left-[3px] top-[3px] flex h-4 w-4 items-center justify-center rounded bg-black/60 text-white">
          <MusicIcon  className="h-2.5 w-2.5" />
        </div>
      )}

      {item.duration != null && (
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-center justify-center bg-black/70 py-0.5 text-[10px] font-bold text-white">
          {item.duration}s
        </div>
      )}

      {item.uploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <LoaderCircleIcon
            
            className="h-6 w-6 animate-spin text-white" />
        </div>
      )}

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
  const groups: { name?: string; actions: DeckAddAction[] }[] = [];
  for (const action of actions) {
    const last = groups[groups.length - 1];
    if (last && last.name === action.group) {
      last.actions.push(action);
    } else {
      groups.push({ name: action.group, actions: [action] });
    }
  }
  const showHeaders =
    groups.some((g) => g.name) && (groups.length > 1 || !!groupHints);

  return (
    <div className="flex w-48 flex-col">
      {groups.map((group, groupIndex) => (
        <div
          key={group.name ?? groupIndex}
          className={
            groupIndex > 0 ? "mt-1 border-t border-white/10 pt-1" : undefined
          }
        >
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
          {group.actions.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={action.onSelect}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-[13px] font-medium text-base-fg transition-colors hover:bg-white/10"
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
    {item &&
      (item.kind === "video" ? (
        <video
          src={item.previewUrl ?? item.url}
          controls
          autoPlay
          className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
        />
      ) : (
        <img
          src={item.previewUrl ?? item.url}
          alt={item.name}
          className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
        />
      ))}
  </Modal>
);
