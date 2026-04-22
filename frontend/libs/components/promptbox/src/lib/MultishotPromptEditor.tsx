import {
  CSSProperties,
  forwardRef,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faMinus,
  faTrashAlt,
  faGripLines,
} from "@fortawesome/pro-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Modifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createPortal } from "react-dom";
import { MentionTextarea, type MentionItem } from "./MentionTextarea";
import { Button } from "@storyteller/ui-button";
import {
  MULTISHOT_MAX_TOTAL_SECONDS,
  MULTISHOT_MIN_SHOT_SECONDS,
  MultishotShot,
} from "./promptStore";

const restrictToVerticalAxis: Modifier = ({ transform }) => ({
  ...transform,
  x: 0,
});

interface AutoGrowTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
}

function AutoGrowTextarea({
  value,
  onChange,
  onKeyDown,
  placeholder,
  className,
}: AutoGrowTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      className={className}
    />
  );
}

interface SortableShotRowProps {
  shot: MultishotShot;
  index: number;
  canDecrement: boolean;
  canIncrement: boolean;
  canRemove: boolean;
  hasMentions: boolean;
  mentionItems?: MentionItem[];
  mentionColorMap?: Record<string, string>;
  onUpdateShot: (id: string, patch: Partial<Omit<MultishotShot, "id">>) => void;
  onRemoveShot: (id: string) => void;
  onPromptKeyEnter?: () => void;
}

function SortableShotRow({
  shot,
  index,
  canDecrement,
  canIncrement,
  canRemove,
  hasMentions,
  mentionItems,
  mentionColorMap,
  onUpdateShot,
  onRemoveShot,
  onPromptKeyEnter,
}: SortableShotRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: shot.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  const adjust = (delta: number) =>
    onUpdateShot(shot.id, {
      durationSeconds: shot.durationSeconds + delta,
    });

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onPromptKeyEnter?.();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={twMerge(
        "flex flex-col gap-1.5 bg-transparent",
        index > 0 && "mt-2 border-t border-white/10 pt-2.5",
        isDragging && "opacity-60",
      )}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reorder shot ${index + 1}`}
          className="-ml-1 flex h-6 w-5 cursor-grab items-center justify-center text-base-fg/40 transition-colors hover:text-base-fg/90 active:cursor-grabbing"
        >
          <FontAwesomeIcon icon={faGripLines} className="h-3 w-3" />
        </button>
        <span className="text-sm font-medium text-base-fg">
          Shot {index + 1}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            onClick={() => adjust(-1)}
            disabled={!canDecrement}
            aria-label={`Decrease shot ${index + 1} duration`}
            className={twMerge(
              "flex h-6 w-6 items-center justify-center rounded-md border border-ui-controls-border text-base-fg/90 transition-colors",
              canDecrement
                ? "hover:bg-ui-controls hover:text-base-fg"
                : "cursor-not-allowed opacity-40",
            )}
          >
            <FontAwesomeIcon icon={faMinus} className="h-2.5 w-2.5" />
          </Button>
          <span className="min-w-8 text-center text-sm font-semibold tabular-nums text-base-fg">
            {shot.durationSeconds}s
          </span>
          <Button
            variant="ghost"
            onClick={() => adjust(1)}
            disabled={!canIncrement}
            aria-label={`Increase shot ${index + 1} duration`}
            className={twMerge(
              "flex h-6 w-6 items-center justify-center rounded-md border border-ui-controls-border text-base-fg/90 transition-colors",
              canIncrement
                ? "hover:bg-ui-controls hover:text-base-fg"
                : "cursor-not-allowed opacity-40",
            )}
          >
            <FontAwesomeIcon icon={faPlus} className="h-2.5 w-2.5" />
          </Button>
          {canRemove && (
            <Button
              variant="ghost"
              onClick={() => onRemoveShot(shot.id)}
              aria-label={`Remove shot ${index + 1}`}
              className="ml-1 flex h-6 w-6 items-center justify-center rounded-md border-none text-base-fg/80 transition-colors hover:bg-ui-controls hover:text-red-500/90"
            >
              <FontAwesomeIcon icon={faTrashAlt} className="h-2.5 w-2.5" />
            </Button>
          )}
        </div>
      </div>
      {hasMentions ? (
        <MentionTextarea
          value={shot.prompt}
          onChange={(value) => onUpdateShot(shot.id, { prompt: value })}
          mentionItems={mentionItems ?? []}
          colorMap={mentionColorMap ?? {}}
          placeholder={`Describe what happens in shot ${index + 1}...`}
          className="text-md relative min-h-[3.25em] w-full rounded bg-transparent pb-1 pr-2 pt-1 text-base-fg"
          onKeyDown={onKeyDown}
        />
      ) : (
        <AutoGrowTextarea
          value={shot.prompt}
          onChange={(value) => onUpdateShot(shot.id, { prompt: value })}
          onKeyDown={onKeyDown}
          placeholder={`Describe what happens in shot ${index + 1}...`}
          className="text-md relative w-full resize-none overflow-hidden rounded bg-transparent pb-1 pr-2 pt-1 text-base-fg placeholder-base-fg/60 focus:outline-none"
        />
      )}
    </div>
  );
}

interface MultishotPromptEditorProps {
  shots: MultishotShot[];
  onAddShot: () => void;
  onRemoveShot: (id: string) => void;
  onUpdateShot: (id: string, patch: Partial<Omit<MultishotShot, "id">>) => void;
  onReorderShots: (shots: MultishotShot[]) => void;
  onPromptKeyEnter?: () => void;

  // Optional @-mention support for per-shot prompt editors. When these are
  // provided the per-shot textarea is replaced with the mention-aware
  // contentEditable editor, reusing the same mention/color wiring as the
  // single-prompt flow.
  mentionItems?: MentionItem[];
  mentionColorMap?: Record<string, string>;
}

export const MultishotPromptEditor = forwardRef<
  HTMLDivElement,
  MultishotPromptEditorProps
>(function MultishotPromptEditor(
  {
    shots,
    onAddShot,
    onRemoveShot,
    onUpdateShot,
    onReorderShots,
    onPromptKeyEnter,
    mentionItems,
    mentionColorMap,
  },
  ref,
) {
  const totalSeconds = useMemo(
    () => shots.reduce((sum, s) => sum + s.durationSeconds, 0),
    [shots],
  );
  const remaining = Math.max(0, MULTISHOT_MAX_TOTAL_SECONDS - totalSeconds);
  const canAddMore = remaining >= MULTISHOT_MIN_SHOT_SECONDS;
  const hasMentions = !!mentionItems && mentionItems.length > 0;
  const canRemove = shots.length > 1;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const activeShot = useMemo(
    () => (activeId ? (shots.find((s) => s.id === activeId) ?? null) : null),
    [activeId, shots],
  );
  const activeIndex = useMemo(
    () => (activeId ? shots.findIndex((s) => s.id === activeId) : -1),
    [activeId, shots],
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = shots.findIndex((s) => s.id === active.id);
    const newIndex = shots.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorderShots(arrayMove(shots, oldIndex, newIndex));
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  // Cap the scroll wrapper's max-height so the entire glass promptbox never
  // exceeds the viewport. We measure the promptbox's current bottom position,
  // and if it would overflow (or has slack), adjust the wrapper's maxHeight by
  // exactly that amount. Self-correcting regardless of how much chrome sits
  // around the shot list or what's above/below the promptbox on the page.
  // Re-runs on shots.length to catch the common case where adding shots
  // pushes the panel past the viewport.
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = scrollWrapperRef.current;
    if (!el) return;
    const MIN_HEIGHT_PX = 120;
    const SAFETY_PX = 120;
    let promptbox: HTMLElement | null = el;
    while (promptbox && !promptbox.classList.contains("glass")) {
      promptbox = promptbox.parentElement;
    }
    const measure = () => {
      const anchor = promptbox ?? document.body;
      const anchorBottom = anchor.getBoundingClientRect().bottom;
      const wrapperHeight = el.getBoundingClientRect().height;
      const slack = window.innerHeight - anchorBottom - SAFETY_PX;
      const newMax = Math.max(MIN_HEIGHT_PX, wrapperHeight + slack);
      el.style.maxHeight = `${newMax}px`;
    };
    // Coalesce triggers in the same frame into one measurement, and always
    // read positions AFTER the browser has settled the new layout. Raw resize
    // events often fire before glass.bottom has moved to its final position.
    // A settle timer re-measures ~150ms after the last trigger, which catches
    // fullscreen/restore transitions where layout takes multiple paint cycles
    // and no further event fires to prompt a retry.
    let rafId: number | null = null;
    let settleTimer: number | null = null;
    const schedule = () => {
      if (rafId == null) {
        rafId = requestAnimationFrame(() => {
          rafId = null;
          measure();
        });
      }
      if (settleTimer != null) clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        settleTimer = null;
        measure();
      }, 150);
    };
    measure();
    schedule();
    window.addEventListener("resize", schedule);
    // visualViewport is the canonical source for viewport-size changes and
    // catches fullscreen/restore transitions that window.resize sometimes
    // misses (notably in Tauri/webviews).
    const vv = window.visualViewport;
    vv?.addEventListener("resize", schedule);
    vv?.addEventListener("scroll", schedule);
    const observer = new ResizeObserver(schedule);
    if (promptbox) observer.observe(promptbox);
    observer.observe(document.documentElement);
    observer.observe(document.body);
    return () => {
      if (rafId != null) cancelAnimationFrame(rafId);
      if (settleTimer != null) clearTimeout(settleTimer);
      window.removeEventListener("resize", schedule);
      vv?.removeEventListener("resize", schedule);
      vv?.removeEventListener("scroll", schedule);
      observer.disconnect();
    };
  }, [shots.length]);

  return (
    <div ref={ref} className="flex flex-col">
      <div
        ref={scrollWrapperRef}
        className="promptbox-scrollbar overflow-y-auto overflow-x-hidden pr-1"
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
          modifiers={[restrictToVerticalAxis]}
          autoScroll={{
            canScroll: (el) => el === scrollWrapperRef.current,
          }}
        >
          <SortableContext
            items={shots.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {shots.map((shot, i) => (
              <SortableShotRow
                key={shot.id}
                shot={shot}
                index={i}
                canDecrement={shot.durationSeconds > MULTISHOT_MIN_SHOT_SECONDS}
                canIncrement={remaining >= 1}
                canRemove={canRemove}
                hasMentions={hasMentions}
                mentionItems={mentionItems}
                mentionColorMap={mentionColorMap}
                onUpdateShot={onUpdateShot}
                onRemoveShot={onRemoveShot}
                onPromptKeyEnter={onPromptKeyEnter}
              />
            ))}
          </SortableContext>
          {createPortal(
            <DragOverlay
              dropAnimation={null}
              modifiers={[restrictToVerticalAxis]}
            >
              {activeShot && (
                <div className="flex cursor-grabbing items-center gap-2 rounded-lg border border-white/20 bg-ui-controls px-2.5 py-1.5 shadow-2xl">
                  <FontAwesomeIcon
                    icon={faGripLines}
                    className="h-3 w-3 text-base-fg/60"
                  />
                  <span className="text-sm font-medium text-base-fg">
                    Shot {activeIndex + 1}
                  </span>
                  <span className="rounded-md bg-black/30 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-base-fg">
                    {activeShot.durationSeconds}s
                  </span>
                </div>
              )}
            </DragOverlay>,
            document.body,
          )}
        </DndContext>
      </div>

      <div className="mt-2.5 flex items-center justify-between">
        <Button
          type="button"
          onClick={onAddShot}
          variant="secondary"
          disabled={!canAddMore}
          aria-label="Add shot"
          className={twMerge(
            "flex items-center gap-1.5 rounded-md border border-ui-controls-border px-2.5 py-1 text-xs text-base-fg/80 transition-colors mb-2",
            canAddMore ? "hover:text-base-fg" : "cursor-not-allowed opacity-40",
          )}
        >
          <FontAwesomeIcon icon={faPlus} className="h-2.5 w-2.5" />
          Add shot
          {canAddMore && (
            <span className="text-base-fg/50">({remaining}s left)</span>
          )}
        </Button>
        <span className="text-xs tabular-nums text-base-fg/60">
          {totalSeconds}s / {MULTISHOT_MAX_TOTAL_SECONDS}s
        </span>
      </div>
    </div>
  );
});
