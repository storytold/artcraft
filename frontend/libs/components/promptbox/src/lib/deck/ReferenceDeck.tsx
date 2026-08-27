import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Tooltip } from "@storyteller/ui-tooltip";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { twMerge } from "tailwind-merge";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DeckAddAction, DeckItem } from "./deckTypes";
import {
  DeckAddMenu,
  DeckCard,
  DeckPreviewModal,
  DeckStyles,
} from "./DeckCard";

/** Collapsed-fan tilt/offset per stacked card, front to back. */
const FAN_TRANSFORMS = [
  "rotate(-8deg)",
  "translateX(12px) rotate(2deg)",
  "translateX(24px) rotate(9deg)",
];

const CLOSE_DELAY_MS = 150;

// Expanding is delayed so the pointer can travel across the cards to the
// circular "+" without the panel opening over it mid-way.
const OPEN_DELAY_MS = 170;

interface ReferenceDeckProps {
  items: DeckItem[];
  onRemove: (id: string) => void;
  /** Reorder within the image group; caller applies arrayMove to its image array. */
  onReorderImages?: (fromIndex: number, toIndex: number) => void;
  /** Entries for the "+" add menu. Empty → no add affordance. */
  addActions?: DeckAddAction[];
  /** Compact limits per menu group, shown right of the group header —
   *  e.g. { image: "2/9", video: "1/3 · 8/15s" }. */
  addMenuGroupHints?: Record<string, string>;
  /** Direct click on the reference card / circular "+". Defaults to the
   *  first enabled add action; pass the combined any-file picker to accept
   *  every supported media type in one dialog. */
  onAddClick?: () => void;
  /** Whether more refs can be added (caller computes from per-type limits). */
  canAdd: boolean;
  /** Clears every attached ref; shown in the expanded panel when 2+ items. */
  onClearAll?: () => void;
  /** Label on the empty placeholder card. */
  emptyLabel?: string;
  /** Render fully expanded and in-flow (fullscreen prompt modal). */
  alwaysExpanded?: boolean;
  /** Max cards in the collapsed fan before the +N badge. */
  maxCollapsed?: number;
  className?: string;
}

/**
 * Dreamina-style reference deck: a fanned stack of tilted thumbnail cards
 * that expands on hover into a wrap/scroll panel with drag-reorder, hover
 * remove, name labels, and a fullscreen preview. Scales to 50 refs — the
 * collapsed fan mounts at most `maxCollapsed` media elements.
 */
export const ReferenceDeck = ({
  items,
  onRemove,
  onReorderImages,
  addActions = [],
  addMenuGroupHints,
  onAddClick,
  canAdd,
  onClearAll,
  emptyLabel = "Reference",
  alwaysExpanded,
  maxCollapsed = 3,
  className,
}: ReferenceDeckProps) => {
  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<DeckItem | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [panelMaxWidth, setPanelMaxWidth] = useState<number>();

  // Hold the panel open while dragging or while the add menu is up —
  // collapsing mid-drag would unmount the sortable context and abort it.
  const expanded = alwaysExpanded || hovered || isDragging || addMenuOpen;

  // The panel never scrolls: it fits every ref, growing rightward up to the
  // far edge of the promptbox (the enclosing .glass container), then wraps
  // into additional rows and grows taller/upward. The panel's absolute
  // positioning context is the small deck root, so measure the promptbox.
  useLayoutEffect(() => {
    if (!expanded || alwaysExpanded) return;
    const root = rootRef.current;
    const box = root?.closest(".glass");
    if (root && box) {
      const available =
        box.getBoundingClientRect().right -
        root.getBoundingClientRect().left -
        12;
      setPanelMaxWidth(available > 120 ? available : undefined);
    }
  }, [expanded, alwaysExpanded]);

  const enabledActions = useMemo(
    () => addActions.filter((a) => !a.disabled),
    [addActions],
  );

  const imageItems = useMemo(
    () =>
      items.filter(
        (i) => i.kind === "image" && !i.uploading && i.sortable !== false,
      ),
    [items],
  );
  const allowReorder = !!onReorderImages && imageItems.length > 1;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const clearOpenTimer = () => {
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
  };

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  // Opening is armed by the card stack only (delayed, so the pointer can
  // reach the circular "+" first). Closing is scoped to the deck ROOT, which
  // contains both the stack and the expanded panel: when the panel opens
  // over the cursor the hit target swaps to it without leaving the root, so
  // no close fires and the open/close flicker loop can't happen.
  const handleStackEnter = () => {
    clearOpenTimer();
    openTimer.current = setTimeout(() => setHovered(true), OPEN_DELAY_MS);
  };

  const handleStackLeave = () => {
    clearOpenTimer();
  };

  const handleRootEnter = () => {
    clearCloseTimer();
    // The add menu is body-portaled, so hovering it counts as leaving the
    // root and decays `hovered` (the panel stays up via addMenuOpen). Coming
    // back onto the open panel must re-arm `hovered`, or it would collapse
    // under the cursor the moment the menu closes.
    if (expanded) setHovered(true);
  };

  const handleRootLeave = () => {
    clearOpenTimer();
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setHovered(false), CLOSE_DELAY_MS);
  };

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setIsDragging(false);
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const fromIndex = imageItems.findIndex((i) => i.id === active.id);
      const toIndex = imageItems.findIndex((i) => i.id === over.id);
      if (fromIndex === -1 || toIndex === -1) return;
      onReorderImages?.(fromIndex, toIndex);
    },
    [imageItems, onReorderImages],
  );

  // Clicking the + card / reference card opens the combined file picker when
  // the caller provides one (routes by MIME type), else the primary action.
  // Hovering reveals the full menu when there are more options.
  const handleAddClick = () => {
    if (onAddClick) {
      onAddClick();
    } else {
      enabledActions[0]?.onSelect();
    }
  };

  // holdPanel: keep the expanded panel open while this menu is up (used by
  // the + card inside the panel). The collapsed stack's circular + must NOT
  // hold the panel open — expanding would cover its own trigger.
  const addMenu = (trigger: React.ReactElement, holdPanel = true) =>
    enabledActions.length > 1 ? (
      <Tooltip
        interactive={true}
        position="top"
        delay={100}
        // Body-portaled: rendered inline, the menu is trapped in the
        // promptbox's .glass stacking context and paints under the fixed
        // z-30 sidebar no matter its own z-index.
        portal
        zIndex={9999}
        className="-mb-0.5 border border-ui-controls-border bg-ui-controls p-1.5 text-base-fg"
        closeOnClick={true}
        onOpenChange={holdPanel ? setAddMenuOpen : undefined}
        content={
          <DeckAddMenu
            actions={enabledActions}
            groupHints={addMenuGroupHints}
          />
        }
      >
        {trigger}
      </Tooltip>
    ) : (
      trigger
    );

  if (items.length === 0 && enabledActions.length === 0) {
    return null;
  }

  // ---- Empty state: single tilted dashed placeholder card ----
  if (items.length === 0) {
    return (
      <div
        className={twMerge(
          "relative flex shrink-0 items-center self-start",
          className,
        )}
      >
        <DeckStyles />
        {addMenu(
          <button
            type="button"
            onClick={handleAddClick}
            className="glass flex aspect-square w-14 -rotate-6 flex-col items-center justify-center gap-0.5 rounded-[3px] border-2 border-dashed border-black/5 bg-ui-controls/40 text-base-fg transition-all duration-200 hover:rotate-0 hover:scale-105 hover:bg-ui-controls/60 dark:border-white/25"
          >
            <PlusIcon className="text-lg opacity-80" />
            <span className="text-[9px] font-medium leading-none opacity-70">
              {emptyLabel}
            </span>
          </button>,
        )}
      </div>
    );
  }

  const collapsedItems = items.slice(0, maxCollapsed);
  const overflowCount = items.length - collapsedItems.length;

  const expandedPanel = (
    <div
      className={twMerge(
        "glass w-max rounded-[3px] border border-white/10 p-2 shadow-2xl",
        // In-flow (fullscreen modal): cap at the container width so the
        // cards wrap into rows instead of overflowing the modal.
        alwaysExpanded
          ? "relative max-w-full"
          : twMerge(
              "absolute bottom-0 left-0 z-40 origin-bottom-left transition-all duration-200 ease-out",
              expanded
                ? "visible translate-y-0 scale-100 opacity-100"
                : "pointer-events-none invisible translate-y-1 scale-95 opacity-0 [transition:opacity_.2s,transform_.2s,visibility_0s_.2s]",
            ),
      )}
      style={
        !alwaysExpanded && panelMaxWidth
          ? { maxWidth: `${panelMaxWidth}px` }
          : undefined
      }
    >
      {onClearAll && items.length > 1 && (
        <div className="mb-1.5 flex items-center justify-between px-0.5">
          <span className="text-[11px] font-medium text-base-fg/60">
            {items.length} reference{items.length !== 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={onClearAll}
            className="flex items-center gap-1 rounded-[3px] px-1 py-0.5 text-[11px] text-base-fg/60 transition-colors hover:text-red-400"
          >
            <Trash2Icon className="h-2.5 w-2.5" />
            Clear all
          </button>
        </div>
      )}
      {/* Rows are 56px cards + 8px gap; cap at three rows in the fullscreen
          modal and scroll past that so a huge deck can't crush the editor. */}
      <div
        className={twMerge(
          "flex flex-wrap gap-2",
          alwaysExpanded && "max-h-[184px] overflow-y-auto overscroll-contain",
        )}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={() => setIsDragging(true)}
          onDragCancel={() => setIsDragging(false)}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={imageItems.map((i) => i.id)}
            strategy={rectSortingStrategy}
          >
            {items.map((item) =>
              allowReorder &&
              item.kind === "image" &&
              !item.uploading &&
              item.sortable !== false ? (
                <SortableDeckCard
                  key={item.id}
                  item={item}
                  hideHoverChrome={isDragging}
                  onRemove={() => onRemove(item.id)}
                  onClick={() => setPreviewItem(item)}
                />
              ) : (
                <Tooltip
                  key={item.id}
                  content={item.name}
                  position="top"
                  delay={150}
                  disabled={isDragging || item.uploading}
                >
                  <DeckCard
                    item={item}
                    animateIn
                    hideHoverChrome={isDragging}
                    onRemove={
                      item.uploading ? undefined : () => onRemove(item.id)
                    }
                    onClick={() => setPreviewItem(item)}
                  />
                </Tooltip>
              ),
            )}
          </SortableContext>
        </DndContext>
        {canAdd &&
          enabledActions.length > 0 &&
          addMenu(
            <button
              type="button"
              onClick={handleAddClick}
              className="glass flex aspect-square w-14 shrink-0 items-center justify-center rounded-[3px] border-2 border-dashed border-black/5 bg-ui-controls/40 text-base-fg transition-all hover:bg-ui-controls/60 dark:border-white/25"
            >
              <PlusIcon className="text-xl opacity-80" />
            </button>,
          )}
      </div>
    </div>
  );

  if (alwaysExpanded) {
    return (
      // No shrink-0 here: hosts may place this in a flex row (webapp focus
      // mode), where the w-max panel makes the root's preferred width the
      // full unwrapped card row. min-w-0 + shrink lets the root collapse to
      // the row's width so the panel's max-w-full has a bounded reference.
      <div
        className={twMerge(
          "relative flex min-w-0 max-w-full items-center",
          className,
        )}
      >
        <DeckStyles />
        {expandedPanel}
        <DeckPreviewModal
          item={previewItem}
          onClose={() => setPreviewItem(null)}
        />
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={twMerge(
        "relative flex shrink-0 items-center self-center",
        className,
      )}
      onMouseEnter={handleRootEnter}
      onMouseLeave={handleRootLeave}
    >
      <DeckStyles />

      {/* Collapsed fan — footprint tracks the card count (stack width plus
          the circular +'s 12px overhang) so a single card doesn't reserve
          the full 3-card fan width and push the textarea away. Only the
          card stack expands the panel on hover; the circular + in front has
          its own hover menu. */}
      <div
        className={twMerge(
          "relative h-14 transition-opacity duration-150",
          expanded && "pointer-events-none opacity-0",
        )}
        style={{ width: `${(collapsedItems.length - 1) * 12 + 68}px` }}
      >
        <div
          className="absolute inset-y-0 left-0"
          style={{
            // Hover zone hugs the actual card stack — with one card the
            // dead space next to it must not trigger the expand.
            width: `${(collapsedItems.length - 1) * 12 + 56}px`,
          }}
          onMouseEnter={handleStackEnter}
          onMouseLeave={handleStackLeave}
        >
          {collapsedItems.map((item, index) => (
            <DeckCard
              key={item.id}
              item={item}
              className="absolute left-0 top-0 shadow-md"
              style={{
                transform: FAN_TRANSFORMS[index] ?? FAN_TRANSFORMS[2],
                zIndex: collapsedItems.length - index,
              }}
            />
          ))}
          {overflowCount > 0 && (
            <div className="pointer-events-none absolute -right-1 -top-1 z-10 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
              {items.length}
            </div>
          )}
        </div>
        {canAdd && enabledActions.length > 0 && (
          // The Tooltip wraps its trigger in a plain `relative` div, so the
          // absolute anchor must live on this wrapper — putting it on the
          // button would position it against the tooltip wrapper instead of
          // the deck.
          <div
            className="absolute z-20"
            style={{
              left: `${(collapsedItems.length - 1) * 12 + 56 - 12}px`,
              bottom: "-4px",
            }}
          >
            {addMenu(
              <button
                type="button"
                onClick={handleAddClick}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-white/15 bg-ui-controls text-xs text-base-fg shadow-md transition-all hover:scale-110 hover:brightness-125"
              >
                <PlusIcon />
              </button>,
              false,
            )}
          </div>
        )}
      </div>

      {expandedPanel}

      <DeckPreviewModal
        item={previewItem}
        onClose={() => setPreviewItem(null)}
      />
    </div>
  );
};

const SortableDeckCard = ({
  item,
  onRemove,
  onClick,
  hideHoverChrome,
}: {
  item: DeckItem;
  onRemove: () => void;
  onClick: () => void;
  hideHoverChrome?: boolean;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 9999 : undefined,
      }}
      {...attributes}
      {...listeners}
      className={isDragging ? "opacity-50" : undefined}
    >
      <Tooltip
        content={item.name}
        position="top"
        delay={150}
        disabled={hideHoverChrome || isDragging}
      >
        <DeckCard
          item={item}
          animateIn
          hideHoverChrome={hideHoverChrome || isDragging}
          onRemove={onRemove}
          onClick={onClick}
          className={
            isDragging
              ? "cursor-grabbing hover:cursor-grabbing"
              : "cursor-grab hover:cursor-grab active:cursor-grabbing"
          }
        />
      </Tooltip>
    </div>
  );
};
