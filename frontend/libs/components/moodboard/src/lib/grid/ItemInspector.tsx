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
import { BoardItem } from "../boards/boardTypes";
import { extractPalette } from "../boards/palette";

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

// Full-screen lightbox + inspector. Large media on the left, metadata / tags /
// palette / actions on the right. Keyboard: Esc closes, ←/→ navigate.
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
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && hasPrev) onPrev();
      else if (e.key === "ArrowRight" && hasNext) onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

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

  // Lock background scroll while the lightbox is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const commitTag = () => {
    const t = tagDraft.trim().toLowerCase();
    if (t) onAddTag(t);
    setTagDraft("");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Item details"
      className="fixed inset-0 z-50 flex bg-black/80 backdrop-blur-md"
    >
      {/* Backdrop click closes */}
      <div className="absolute inset-0" onClick={onClose} />

      <NavArrow side="left" show={hasPrev} onClick={onPrev} />
      <NavArrow side="right" show={hasNext} onClick={onNext} />

      <div className="relative z-10 flex w-full items-stretch gap-4 p-6">
        {/* Media */}
        <div className="flex min-w-0 flex-1 items-center justify-center">
          <Media item={item} />
        </div>

        {/* Inspector panel — double-bezel */}
        <div className="w-[320px] shrink-0 rounded-[20px] bg-[var(--mb-plane-1,rgba(127,127,127,0.05))] p-1.5 ring-1 ring-[var(--mb-hairline,rgba(127,127,127,0.14))]">
          <div className="flex h-full flex-col rounded-[14px] bg-ui-panel p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-full border border-ui-divider px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-base-fg/55">
                {KIND_LABEL[item.kind]}
              </span>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-base-fg/60 transition-colors hover:bg-base-fg/10 hover:text-base-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
              </button>
            </div>

            {/* Rating */}
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

            {/* Tags */}
            <Section title="Tags">
              <div className="flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onRemoveTag(tag)}
                    className="group/tag flex items-center gap-1 rounded-full bg-base-fg/10 px-2.5 py-1 text-[11px] font-medium text-base-fg/80 transition-colors hover:bg-danger/15 hover:text-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-danger"
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

            {/* Palette */}
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

            <div className="flex-1" />

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {item.kind === "image" && (
                <button
                  type="button"
                  onClick={onUseReference}
                  className="group flex items-center justify-center gap-2.5 rounded-full bg-primary py-2 pl-5 pr-2 text-sm font-medium text-white transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-primary/90 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  Use as reference
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:scale-105">
                    <FontAwesomeIcon
                      icon={faWandMagicSparkles}
                      className="h-3.5 w-3.5"
                    />
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={onDelete}
                className="flex items-center justify-center gap-2 rounded-full border border-ui-divider py-2.5 text-sm font-medium text-base-fg/70 transition-colors hover:bg-danger/10 hover:text-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-danger"
              >
                <FontAwesomeIcon icon={faTrashCan} className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="mb-4">
    <h3 className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-base-fg/45">
      {title}
    </h3>
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
          className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
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
          className="max-h-full max-w-full rounded-xl shadow-2xl"
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
          <div className="p-5">
            <p className="text-base font-medium text-base-fg">
              {item.title || item.url}
            </p>
            <p className="mt-1 truncate text-sm text-base-fg/55">{item.url}</p>
          </div>
        </a>
      );
    default:
      return null;
  }
};

const NavArrow = ({
  side,
  show,
  onClick,
}: {
  side: "left" | "right";
  show: boolean;
  onClick: () => void;
}) => {
  if (!show) return null;
  return (
    <button
      type="button"
      aria-label={side === "left" ? "Previous" : "Next"}
      onClick={onClick}
      className={[
        "absolute top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full",
        "border border-white/15 bg-black/40 text-white/85 backdrop-blur-md transition-colors hover:bg-black/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
        side === "left" ? "left-4" : "right-4",
      ].join(" ")}
    >
      <FontAwesomeIcon
        icon={side === "left" ? faChevronLeft : faChevronRight}
        className="h-4 w-4"
      />
    </button>
  );
};
