import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faWandMagicSparkles,
  faTrashCan,
  faPlus,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/pro-regular-svg-icons";
import { faStar } from "@fortawesome/pro-solid-svg-icons";
import { Modal } from "@storyteller/ui-modal";
import { Button } from "@storyteller/ui-button";
import { BoardItem } from "../boards/boardTypes";
import { hostnameOf } from "../boards/linkMeta";
import { extractPalette } from "../boards/palette";
import { Favicon } from "./Favicon";

interface Props {
  item: BoardItem;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onSetRating: (rating: number) => void;
  onUseReference: () => void;
  onAddPaletteToBoard: (colors: string[]) => void;
  onDelete: () => void;
}

const KIND_LABEL: Record<BoardItem["kind"], string> = {
  image: "Image",
  video: "Video",
  text: "Note",
  link: "Link",
  color: "Color",
};

// Lightbox + inspector. Mirrors the shared LightboxModal design: a bounded,
// centered, draggable/resizable panel with the media on the left (object-contain
// on a dark plate) and a fixed-width info/actions column on the right. The shared
// Modal owns the backdrop, Esc, drag/resize and a11y; we own ←/→ navigation.
export const ItemInspector = ({
  item,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onClose,
  onAddTag,
  onRemoveTag,
  onSetRating,
  onUseReference,
  onAddPaletteToBoard,
  onDelete,
}: Props) => {
  const [palette, setPalette] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && hasPrev) onPrev();
      else if (e.key === "ArrowRight" && hasNext) onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onPrev, onNext, hasPrev, hasNext]);

  // Pull a palette for images, keyed on the image src — NOT the whole item, so
  // editing tags/rating (which produce a new item object) doesn't re-decode the
  // image and flicker the palette.
  const imageSrc = item.kind === "image" ? item.src : null;
  useEffect(() => {
    setPalette([]);
    if (!imageSrc) return undefined;
    let alive = true;
    void extractPalette(imageSrc, 6).then((c) => {
      if (alive) setPalette(c);
    });
    return () => {
      alive = false;
    };
  }, [imageSrc]);

  const commitTag = () => {
    const t = tagDraft.trim().toLowerCase();
    if (t) onAddTag(t);
    setTagDraft("");
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      accessibleTitle="Item details"
      className="rounded-xl bg-ui-modal h-[760px] w-[1200px] max-w-screen min-w-[1000px] min-h-[600px] p-4"
      draggable
      resizable
      expandable
      showClose
    >
      {/* Invisible drag strip along the top, matching the shared lightbox. */}
      <Modal.DragHandle>
        <div className="absolute left-0 top-0 z-20 h-12 w-full cursor-move rounded-t-xl" />
      </Modal.DragHandle>

      <div className="flex h-full gap-4">
        {/* Media panel — flexible width, dark plate, contained media. */}
        <div className="group/nav relative flex h-full flex-1 items-center justify-center overflow-hidden rounded-l-xl bg-black/30">
          <Media item={item} />

          {hasPrev && <NavArrow side="left" onClick={onPrev} />}
          {hasNext && <NavArrow side="right" onClick={onNext} />}
        </div>

        {/* Info + actions — fixed width, scrollable body, buttons pinned bottom. */}
        <div className="flex h-full w-[280px] shrink-0 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pb-2 text-base-fg">
            <div className="flex items-center gap-2.5 border-b border-white/5 pb-3 pr-10">
              <span className="rounded-full border border-ui-panel-border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-base-fg/55">
                {KIND_LABEL[item.kind]}
              </span>
            </div>

            <Section title="Rating">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-label={`Rate ${n}`}
                    onClick={() => onSetRating(item.rating === n ? 0 : n)}
                    className="rounded p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <FontAwesomeIcon
                      icon={faStar}
                      className={
                        n <= item.rating
                          ? "h-4 w-4 text-yellow-400"
                          : "h-4 w-4 text-base-fg/20 transition-colors hover:text-base-fg/40"
                      }
                    />
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Tags">
              <div className="flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onRemoveTag(tag)}
                    className="group/tag flex items-center gap-1 rounded-full bg-base-fg/10 px-2.5 py-1 text-[11px] font-medium text-base-fg/80 transition-colors hover:bg-red/15 hover:text-red focus:outline-none focus-visible:ring-2 focus-visible:ring-red"
                  >
                    {tag}
                    <FontAwesomeIcon icon={faXmark} className="h-2.5 w-2.5" />
                  </button>
                ))}
                <input
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitTag();
                  }}
                  onBlur={commitTag}
                  placeholder="Add tag"
                  className="w-20 rounded-full bg-base-fg/5 px-2.5 py-1 text-[11px] text-base-fg placeholder:text-base-fg/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
            </Section>

            {item.kind === "image" && palette.length > 0 && (
              <Section title="Palette">
                <div className="flex flex-wrap gap-1.5">
                  {palette.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      title={`${hex} — copy`}
                      onClick={() => {
                        void navigator.clipboard?.writeText(hex);
                        toast.success(`Copied ${hex}`);
                      }}
                      className="h-7 w-7 rounded-md ring-1 ring-inset ring-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      style={{ background: hex }}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => onAddPaletteToBoard(palette)}
                  className="mt-2.5 flex items-center gap-1.5 rounded text-xs font-medium text-base-fg/60 transition-colors hover:text-base-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
                  Add swatches to board
                </button>
              </Section>
            )}
          </div>

          {/* Actions — shared Button, lightbox-style 2-col grid. */}
          <div className="mt-4 grid grid-cols-2 gap-1.5">
            {item.kind === "image" && (
              <Button
                variant="primary"
                icon={faWandMagicSparkles}
                onClick={onUseReference}
                className="w-full col-span-2 py-1.5 text-[13px]"
              >
                Use as reference
              </Button>
            )}
            <Button
              variant="destructive"
              icon={faTrashCan}
              onClick={onDelete}
              className="w-full col-span-2 py-1.5 text-[13px]"
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <div className="text-sm font-medium text-base-fg/90">{title}</div>
    {children}
  </div>
);

const Media = ({ item }: { item: BoardItem }) => {
  switch (item.kind) {
    case "image":
      return (
        <img
          src={item.src}
          alt={item.caption || ""}
          className="h-full w-full object-contain"
        />
      );
    case "video":
      return (
        <video
          src={item.src}
          autoPlay
          muted
          loop
          controls
          playsInline
          className="h-full w-full object-contain"
        />
      );
    case "color":
      return (
        <div
          className="flex h-72 w-72 items-end rounded-2xl p-4 shadow-2xl"
          style={{ background: item.color }}
        >
          <span className="rounded-full bg-black/40 px-3 py-1 text-sm font-medium uppercase tracking-wider text-white backdrop-blur">
            {item.color}
          </span>
        </div>
      );
    case "text":
      return (
        <div className="max-h-full max-w-2xl overflow-auto rounded-2xl bg-ui-panel p-8 shadow-2xl">
          <p className="whitespace-pre-wrap text-lg leading-relaxed text-base-fg">
            {item.text || "Note"}
          </p>
        </div>
      );
    case "link":
      return (
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="flex max-w-lg flex-col overflow-hidden rounded-2xl bg-ui-panel shadow-2xl"
        >
          {item.image && (
            <img src={item.image} alt="" className="w-full object-cover" />
          )}
          <div className="flex items-start gap-3 p-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-base-fg/8">
              <Favicon url={item.url} className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-base font-medium text-base-fg">
                {item.title || hostnameOf(item.url)}
              </p>
              <p className="mt-1 truncate text-sm text-base-fg/55">{item.url}</p>
            </div>
          </div>
        </a>
      );
    default:
      return null;
  }
};

// Hover-reveal navigation arrow, styled to match the shared LightboxModal.
const NavArrow = ({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) => (
  <button
    type="button"
    aria-label={side === "left" ? "Previous" : "Next"}
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className={[
      "absolute top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full",
      "bg-black/50 text-white/70 opacity-0 transition-opacity duration-200",
      "hover:bg-black/70 hover:text-white group-hover/nav:opacity-100 focus:outline-none",
      side === "left" ? "left-3" : "right-3",
    ].join(" ")}
  >
    <FontAwesomeIcon
      icon={side === "left" ? faChevronLeft : faChevronRight}
      className="text-lg"
    />
  </button>
);
