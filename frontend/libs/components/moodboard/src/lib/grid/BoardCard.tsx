import { memo, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUpRightAndDownLeftFromCenter,
  faTrashCan,
  faCheck,
  faWandMagicSparkles,
} from "@fortawesome/pro-regular-svg-icons";
import { faStar } from "@fortawesome/pro-solid-svg-icons";
import { BoardItem } from "../boards/boardTypes";
import { hostnameOf } from "../boards/linkMeta";
import { PositionedItem } from "./gridLayout";
import { Favicon } from "./Favicon";

interface Props {
  item: BoardItem;
  pos: PositionedItem;
  selected: boolean;
  /** Play a one-time fade-up the first time this card is revealed. */
  animateIn?: boolean;
  revealDelayMs?: number;
  /** Roving tabindex: only the active card is keyboard-reachable via Tab. */
  tabStop?: boolean;
  /** Programmatically pull DOM focus here (set after arrow-key navigation). */
  focused?: boolean;
  onFocusCard?: (id: string) => void;
  onKeyNav?: (id: string, e: React.KeyboardEvent) => void;
  onSelect: (id: string, additive: boolean) => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onUseReference: (id: string) => void;
  /** This text card is in inline-edit mode (renders an editable textarea). */
  editing?: boolean;
  /** Enter inline edit for a text card (double-click). */
  onEditText?: (id: string) => void;
  /** Commit edited note text (blur / Enter). */
  onCommitText?: (id: string, text: string) => void;
}

const KIND_NOUN: Record<BoardItem["kind"], string> = {
  image: "image",
  video: "video",
  text: "note",
  link: "link",
  color: "color swatch",
};

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// One masonry tile. Absolutely positioned by the grid; the card owns only its
// visual treatment (double-bezel shell), per-kind content, and hover affordances.
const BoardCardInner = ({
  item,
  pos,
  selected,
  animateIn,
  revealDelayMs = 0,
  tabStop = false,
  focused = false,
  onFocusCard,
  onKeyNav,
  onSelect,
  onOpen,
  onDelete,
  onUseReference,
  editing = false,
  onEditText,
  onCommitText,
}: Props) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [entering, setEntering] = useState(
    Boolean(animateIn) && !prefersReducedMotion(),
  );
  useEffect(() => {
    if (!entering) return undefined;
    const r = requestAnimationFrame(() => setEntering(false));
    return () => cancelAnimationFrame(r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pull DOM focus here when the grid hands us focus via arrow navigation.
  useEffect(() => {
    if (focused && rootRef.current && document.activeElement !== rootRef.current) {
      rootRef.current.focus();
    }
  }, [focused]);

  const caption = "caption" in item ? item.caption : undefined;
  const label = `${KIND_NOUN[item.kind]}${caption ? `: ${caption}` : ""}${
    item.rating > 0 ? `, rated ${item.rating}` : ""
  }${selected ? ", selected" : ""}`;

  return (
    <div
      ref={rootRef}
      role="button"
      tabIndex={tabStop ? 0 : -1}
      aria-label={label}
      aria-pressed={selected}
      className="group absolute rounded-[18px] transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-ui-panel motion-reduce:transition-none"
      style={{
        left: pos.x,
        top: pos.y,
        width: pos.width,
        height: pos.height,
        transitionDelay: `${revealDelayMs}ms`,
        opacity: entering ? 0 : 1,
        transform: entering ? "translateY(8px)" : undefined,
      }}
      onPointerDown={(e) => {
        // Left-click selects; modifier-click extends. Action buttons stop
        // propagation so they don't double as a select.
        if (e.button !== 0) return;
        onSelect(item.id, e.shiftKey || e.metaKey || e.ctrlKey);
      }}
      onDoubleClick={() =>
        item.kind === "text" && onEditText
          ? onEditText(item.id)
          : onOpen(item.id)
      }
      onFocus={() => onFocusCard?.(item.id)}
      onKeyDown={(e) => onKeyNav?.(item.id, e)}
    >
      {/* Outer shell — double-bezel. Lifts slightly on hover; ring turns to the
          brand blue when selected. */}
      <div
        className={[
          "h-full w-full rounded-[18px] p-1 transition-all duration-200",
          "ease-[cubic-bezier(0.4,0,0.2,1)]",
          "ring-1 group-hover:-translate-y-0.5",
          "bg-[var(--mb-plane-1,rgba(127,127,127,0.04))]",
          selected
            ? "ring-2 ring-primary"
            : "ring-[var(--mb-hairline,rgba(127,127,127,0.12))] group-hover:ring-[var(--mb-hairline,rgba(127,127,127,0.22))]",
          selected
            ? "shadow-[0_8px_28px_-10px_rgba(0,0,0,0.45)]"
            : "shadow-[0_1px_2px_rgba(0,0,0,0.10)] group-hover:shadow-[0_10px_30px_-12px_rgba(0,0,0,0.4)]",
        ].join(" ")}
      >
        {/* Inner core — concentric radius, holds the content. */}
        <div className="relative h-full w-full overflow-hidden rounded-[14px] bg-ui-panel shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
          <CardContent
            item={item}
            editing={editing}
            onCommitText={onCommitText}
          />

          {/* Rating — persistent when set (Lightroom-style triage marker).
              No backdrop-blur: this tile lives in a virtualized scroll
              container, where blur filters trigger GPU repaints on every
              scroll frame. A solid scrim keeps the icons legible instead. */}
          {item.rating > 0 && (
            <div className="absolute bottom-2 left-2 flex items-center gap-0.5 rounded-full bg-black/65 px-2 py-1">
              {Array.from({ length: item.rating }).map((_, i) => (
                <FontAwesomeIcon
                  key={i}
                  icon={faStar}
                  className="h-2.5 w-2.5 text-yellow-400"
                />
              ))}
            </div>
          )}

          {/* Selection check — visible when selected or on hover. */}
          <div
            className={[
              "absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full",
              "border transition-all duration-150",
              selected
                ? "border-primary bg-primary text-white opacity-100"
                : "border-white/40 bg-black/45 text-white/0 opacity-0 group-hover:opacity-100",
            ].join(" ")}
          >
            <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
          </div>

          {/* Action rail — solid scrim pill (no blur in the scroll container),
              fades up on hover. */}
          <div className="absolute right-2 top-2 flex translate-y-1 items-center gap-1 rounded-full border border-white/15 bg-black/65 p-0.5 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
            <RailButton
              label="Open"
              icon={faUpRightAndDownLeftFromCenter}
              onClick={() => onOpen(item.id)}
            />
            {item.kind === "image" && (
              <RailButton
                label="Use as reference"
                icon={faWandMagicSparkles}
                onClick={() => onUseReference(item.id)}
              />
            )}
            <RailButton
              label="Delete"
              icon={faTrashCan}
              onClick={() => onDelete(item.id)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const RailButton = ({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: typeof faCheck;
  onClick: () => void;
}) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    className="flex h-7 w-7 items-center justify-center rounded-full text-white/85 transition-colors duration-150 hover:bg-white/15 hover:text-white focus:outline-none focus-visible:bg-white/15 focus-visible:text-white focus-visible:ring-2 focus-visible:ring-white/70"
    onPointerDown={(e) => e.stopPropagation()}
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
  >
    <FontAwesomeIcon icon={icon} className="h-3.5 w-3.5" />
  </button>
);

const CardContent = ({
  item,
  editing,
  onCommitText,
}: {
  item: BoardItem;
  editing?: boolean;
  onCommitText?: (id: string, text: string) => void;
}) => {
  switch (item.kind) {
    case "image":
      return (
        <img
          src={item.src}
          alt={item.caption || ""}
          draggable={false}
          className="h-full w-full select-none object-cover"
        />
      );
    case "video":
      return (
        <video
          src={item.src}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
        />
      );
    case "color":
      return (
        <div className="h-full w-full" style={{ background: item.color }}>
          <span className="absolute bottom-2 left-2 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white backdrop-blur">
            {item.color}
          </span>
        </div>
      );
    case "text":
      return editing && onCommitText ? (
        <NoteEditor
          initial={item.text}
          onCommit={(text) => onCommitText(item.id, text)}
        />
      ) : (
        // Extra top padding clears the selection check (top-left) so it never
        // overlaps the first line of the note.
        <div className="h-full w-full overflow-hidden px-4 pb-4 pt-10">
          <p
            // Clicking the text itself shouldn't toggle the card's selection —
            // stop the pointer-down from reaching the card root. Double-click
            // (a separate event) still bubbles, so it opens the editor.
            onPointerDown={(e) => e.stopPropagation()}
            className="whitespace-pre-wrap text-sm leading-relaxed text-base-fg/90"
          >
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
          className="flex h-full w-full flex-col"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {item.image && (
            <img
              src={item.image}
              alt=""
              draggable={false}
              className="min-h-0 flex-1 select-none object-cover"
            />
          )}
          <div className="flex items-center gap-2.5 px-3 py-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-base-fg/8">
              <Favicon url={item.url} className="h-4 w-4" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-xs font-medium text-base-fg/90">
                {item.title || hostnameOf(item.url)}
              </span>
              <span className="truncate text-[10px] text-base-fg/45">
                {hostnameOf(item.url)}
              </span>
            </span>
          </div>
        </a>
      );
    default:
      return null;
  }
};

// Inline note editor. Autofocuses, commits on blur or Enter (Shift+Enter inserts
// a newline), reverts on Escape. Pointer events are stopped so typing/selecting
// inside the textarea never triggers card selection, drag, or marquee.
const NoteEditor = ({
  initial,
  onCommit,
}: {
  initial: string;
  onCommit: (text: string) => void;
}) => {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const [draft, setDraft] = useState(initial);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.select();
  }, []);

  return (
    <div
      // Matches the static note: top padding clears the selection check.
      className="h-full w-full px-4 pb-4 pt-10"
      onPointerDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <textarea
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => onCommit(draft.trim())}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onCommit(draft.trim());
          } else if (e.key === "Escape") {
            e.preventDefault();
            onCommit(initial.trim());
          }
        }}
        placeholder="Write a note…"
        className="h-full w-full resize-none bg-transparent text-sm leading-relaxed text-base-fg/90 placeholder:text-base-fg/35 focus:outline-none"
      />
    </div>
  );
};

export const BoardCard = memo(BoardCardInner);
