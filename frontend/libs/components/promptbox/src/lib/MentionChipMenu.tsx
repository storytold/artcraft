import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { twMerge } from "tailwind-merge";
import {
  ChevronLeftIcon,
  EyeIcon,
  ImageIcon,
  RefreshCwIcon,
  Trash2Icon,
  UserIcon,
} from "lucide-react";
import type { MentionItem } from "./MentionTextarea";

const VIEWPORT_MARGIN = 8;
const ANCHOR_GAP = 4;
// Window after opening during which scroll/resize re-anchors the menu
// instead of closing it. Opening the menu on touch blurs the editor, and the
// on-screen keyboard's dismissal fires exactly those events — closing on
// them would dismiss the menu before the user's first tap.
const OPEN_GRACE_MS = 700;

const MENU_ROW =
  "flex w-full items-center gap-2 rounded-[3px] px-2 py-2 text-sm text-base-fg transition-colors hover:bg-ui-controls/60 cursor-pointer";

// Header subtitle and empty-replace-list copy per chip type.
const TYPE_COPY: Record<MentionItem["type"], { title: string; empty: string }> =
  {
    character: { title: "Character", empty: "No other characters" },
    image: { title: "Image reference", empty: "No other images" },
    video: { title: "Video reference", empty: "No other videos" },
    audio: { title: "Audio reference", empty: "No other audio" },
  };

export interface MentionChipMenuProps {
  /** Viewport-space rect of the clicked chip. */
  anchorRect: DOMRect;
  /**
   * The clicked chip element. Pointerdowns on it must not outside-close the
   * menu — the chip's own click handler toggles it, and closing here first
   * would turn that toggle into a close-then-reopen flash.
   */
  anchorNode?: HTMLElement;
  /** Canonical mention label including the "@", e.g. "@robot cartoon". */
  currentLabel: string;
  /** Chip type — drives the header subtitle and fallback avatar icon. */
  currentType?: MentionItem["type"];
  /** Thumbnail of the current mention, shown in the menu header. */
  currentPreview?: string;
  /** Same-type mentions offered as replacements (current one excluded by the caller). */
  replaceItems: MentionItem[];
  onReplace: (item: MentionItem) => void;
  onPreview: () => void;
  onRemove: () => void;
  onClose: () => void;
}

/**
 * Floating menu for an inline mention chip (character or image ref):
 * Replace / Preview / Remove, with the Replace action swapping to a second
 * "Back" panel listing the other same-type mentions.
 *
 * Portaled to document.body with fixed positioning — the promptbox `.glass`
 * container (backdrop-blur) is a containing block that would trap
 * `position: fixed` descendants, so the menu must not render inside it.
 */
export function MentionChipMenu({
  anchorRect,
  anchorNode,
  currentLabel,
  currentType = "character",
  currentPreview,
  replaceItems,
  onReplace,
  onPreview,
  onRemove,
  onClose,
}: MentionChipMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const openedAt = useRef(performance.now());
  // Anchor rect the placement actually uses — re-measured from anchorNode
  // when the viewport shifts during the opening grace window.
  const [liveRect, setLiveRect] = useState(anchorRect);
  const [view, setView] = useState<"menu" | "replace">("menu");
  const [placement, setPlacement] = useState<{
    left: number;
    top: number;
    flippedAbove: boolean;
  } | null>(null);
  // Drives the same 75ms fade/slide-in our PopoverMenu panels use.
  const [entered, setEntered] = useState(false);

  const currentName = currentLabel.replace(/^@/, "");

  // Keep the live anchor in sync when the caller hands us a new chip rect.
  useEffect(() => setLiveRect(anchorRect), [anchorRect]);

  // Position below the chip, flipped above when there is no room, clamped
  // horizontally into the viewport. Re-measured when the view swaps (the
  // replace panel is taller than the menu).
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const width = panel.offsetWidth;
    const height = panel.offsetHeight;

    let top = liveRect.bottom + ANCHOR_GAP;
    let flippedAbove = false;
    if (top + height > window.innerHeight - VIEWPORT_MARGIN) {
      top = liveRect.top - height - ANCHOR_GAP;
      flippedAbove = true;
    }
    top = Math.max(VIEWPORT_MARGIN, top);

    const left = Math.max(
      VIEWPORT_MARGIN,
      Math.min(liveRect.left, window.innerWidth - width - VIEWPORT_MARGIN),
    );

    setPlacement({ left, top, flippedAbove });
  }, [liveRect, view, replaceItems.length]);

  useEffect(() => {
    if (!placement || entered) return;
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, [placement, entered]);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      const panel = panelRef.current;
      const target = e.target as Node;
      if (anchorNode?.contains(target)) return;
      if (panel && !panel.contains(target)) onClose();
    };
    // During the opening grace window, viewport churn re-anchors the menu to
    // its chip instead of closing (see OPEN_GRACE_MS); afterwards scrolling
    // or resizing dismisses as usual.
    const repositionOrClose = () => {
      if (
        performance.now() - openedAt.current < OPEN_GRACE_MS &&
        anchorNode?.isConnected
      ) {
        setLiveRect(anchorNode.getBoundingClientRect());
        return;
      }
      onClose();
    };
    const handleScroll = (e: Event) => {
      const panel = panelRef.current;
      if (panel && e.target instanceof Node && panel.contains(e.target)) return;
      repositionOrClose();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", repositionOrClose);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", repositionOrClose);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, anchorNode]);

  const handleRowKeyActivate = useCallback(
    (e: React.PointerEvent) => e.preventDefault(),
    [],
  );

  return createPortal(
    <div
      ref={panelRef}
      // Marks clicks in this body-portaled panel as not-outside for the
      // focus-mode modal (see OUTSIDE_SAFE_SELECTOR in @storyteller/ui-modal).
      data-modal-outside-safe=""
      // Body-portaled, so the focus-mode modal's scroll lock
      // (react-remove-scroll) would preventDefault wheel/touch events over
      // this panel — stop propagation so the Replace list stays scrollable.
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      className={twMerge(
        "fixed z-[9999] w-56 rounded-[3px] border border-ui-panel-border bg-ui-panel p-1 shadow-xl",
        "transform-gpu transition duration-75 ease-out",
        entered
          ? "translate-y-0 opacity-100"
          : placement?.flippedAbove
            ? "-translate-y-1 opacity-0"
            : "translate-y-1 opacity-0",
      )}
      style={{
        // Re-enable interaction under the modal's body-wide pointer-events lock.
        pointerEvents: "auto",
        ...(placement
          ? { left: placement.left, top: placement.top }
          : {
              left: liveRect.left,
              top: liveRect.bottom + ANCHOR_GAP,
              visibility: "hidden",
            }),
      }}
    >
      {view === "menu" ? (
        <>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <button
              type="button"
              onClick={onPreview}
              title="View full size"
              aria-label={`View ${currentName}`}
              className="group/avatar relative shrink-0 cursor-pointer overflow-hidden rounded-[3px]"
            >
              <ChipAvatar
                preview={currentPreview}
                name={currentName}
                type={currentType}
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover/avatar:opacity-100">
                <EyeIcon  className="h-3 w-3 text-white" />
              </span>
            </button>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-base-fg">
                {currentName}
              </div>
              <div className="text-[11px] text-base-fg/50">
                {TYPE_COPY[currentType].title}
              </div>
            </div>
          </div>
          <div className="my-1 border-t border-ui-panel-border" />
          <button type="button" className={MENU_ROW} onClick={() => setView("replace")}>
            <RefreshCwIcon  className="h-3.5 w-3.5 opacity-60" />
            <span className="flex-1 text-left">Replace</span>
            <span className="text-xs text-base-fg/40">{replaceItems.length}</span>
          </button>
          <button type="button" className={MENU_ROW} onClick={onPreview}>
            <EyeIcon  className="h-3.5 w-3.5 opacity-60" />
            <span className="flex-1 text-left">Preview</span>
          </button>
          <div className="my-1 border-t border-ui-panel-border" />
          <button
            type="button"
            className={twMerge(MENU_ROW, "text-red-500 hover:bg-red-500/10")}
            onClick={onRemove}
          >
            <Trash2Icon  className="h-3.5 w-3.5 opacity-60" />
            <span className="flex-1 text-left">Remove</span>
          </button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded-[3px] text-base-fg/60 transition-colors hover:bg-ui-controls/60 hover:text-base-fg"
              onClick={() => setView("menu")}
              aria-label="Back"
            >
              <ChevronLeftIcon  className="h-3 w-3" />
            </button>
            <div className="min-w-0">
              <div className="text-sm font-medium text-base-fg">Replace</div>
              <div className="truncate text-[11px] text-base-fg/50">
                Currently {currentName}
              </div>
            </div>
          </div>
          <div className="my-1 border-t border-ui-panel-border" />
          <div className="max-h-64 overflow-y-auto">
            {replaceItems.length === 0 && (
              <div className="px-2 py-3 text-center text-xs text-base-fg/50">
                {TYPE_COPY[currentType].empty}
              </div>
            )}
            {replaceItems.map((item, i) => (
              <button
                key={item.token ?? `${item.label}-${i}`}
                type="button"
                className={MENU_ROW}
                onPointerDown={handleRowKeyActivate}
                onClick={() => onReplace(item)}
              >
                <ChipAvatar
                  preview={item.preview}
                  name={item.label}
                  type={item.type}
                />
                <span className="min-w-0 flex-1 truncate text-left">
                  {item.label.replace(/^@/, "")}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>,
    document.body,
  );
}

function ChipAvatar({
  preview,
  name,
  type = "character",
}: {
  preview?: string;
  name: string;
  type?: MentionItem["type"];
}) {
  const FallbackIcon = type === "character" ? UserIcon : ImageIcon;
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden border border-white/10 bg-black/20">
      {preview ? (
        <img src={preview} alt={name} className="h-full w-full object-cover" />
      ) : (
        <FallbackIcon  className="h-3.5 w-3.5 text-base-fg/60" />
      )}
    </div>
  );
}
