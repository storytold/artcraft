import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { BoardItem, BoardSection, GridDensity } from "../boards/boardTypes";
import { BoardCard } from "./BoardCard";
import { SectionHeader } from "./SectionHeader";
import {
  DENSITY_CONFIG,
  NavDirection,
  SectionGroup,
  SectionedLayout,
  computeMasonryLayout,
  computeSectionedLayout,
  nearestInDirection,
  sliceVisible,
} from "./gridLayout";

const ARROW_DIRS: Record<string, NavDirection> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

interface Props {
  items: BoardItem[];
  density: GridDensity;
  selectedIds: Set<string>;
  onSelect: (id: string, additive: boolean) => void;
  onSelectMany: (ids: string[], additive: boolean) => void;
  onClearSelection: () => void;
  onOpen: (id: string) => void;
  onUseReference: (id: string) => void;
  onDelete: (id: string) => void;
  // Inline text editing: which text card is being edited, plus enter/commit.
  editingTextId?: string | null;
  onEditText?: (id: string) => void;
  onCommitText?: (id: string, text: string) => void;
  // When present (non-empty), the grid groups items into section lanes with
  // header rows. Absent → flat masonry (the default).
  sections?: BoardSection[];
  onRenameSection?: (id: string, name: string) => void;
  onDeleteSection?: (id: string) => void;
  onToggleSectionCollapsed?: (id: string) => void;
}

const OUTER_PADDING = 24;
const VIRTUAL_BUFFER = 600;
const MARQUEE_THRESHOLD = 4;

interface Marquee {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

// Virtualized masonry. The layout is precomputed from item aspects, so we only
// mount the cards intersecting the viewport (± buffer) — this is what keeps the
// grid at 60fps with thousands of items (the competitor failure mode).
export const BoardGrid = ({
  items,
  density,
  selectedIds,
  onSelect,
  onSelectMany,
  onClearSelection,
  onOpen,
  onUseReference,
  onDelete,
  editingTextId,
  onEditText,
  onCommitText,
  sections,
  onRenameSection,
  onDeleteSection,
  onToggleSectionCollapsed,
}: Props) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const revealedRef = useRef<Set<string>>(new Set());
  const [width, setWidth] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(0);
  const [marquee, setMarquee] = useState<Marquee | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const marqueeRef = useRef<{
    active: boolean;
    moved: boolean;
    additive: boolean;
  }>({ active: false, moved: false, additive: false });
  // FIX: the live marquee rectangle, mirrored in a ref so pointer-release can
  // read it WITHOUT going through a setMarquee updater (see the effect below).
  const marqueeRectRef = useRef<Marquee | null>(null);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const measure = () => {
      setWidth(el.clientWidth - OUTER_PADDING * 2);
      setViewportH(el.clientHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Group items into section lanes (ungrouped lane first) when sections exist.
  // null = flat masonry.
  const groups = useMemo<SectionGroup[] | null>(() => {
    if (!sections || sections.length === 0) return null;
    const known = new Set(sections.map((s) => s.id));
    const bySection = new Map<
      string | null,
      Array<{ id: string; aspect: number }>
    >();
    for (const it of items) {
      const key = it.sectionId && known.has(it.sectionId) ? it.sectionId : null;
      const entry = { id: it.id, aspect: it.aspect };
      const arr = bySection.get(key);
      if (arr) arr.push(entry);
      else bySection.set(key, [entry]);
    }
    const named: SectionGroup[] = sections.map((s) => ({
      id: s.id,
      name: s.name,
      collapsed: Boolean(s.collapsed),
      items: bySection.get(s.id) ?? [],
    }));
    const ungrouped = bySection.get(null) ?? [];
    return ungrouped.length > 0
      ? [
          { id: null, name: "Ungrouped", collapsed: false, items: ungrouped },
          ...named,
        ]
      : named;
  }, [items, sections]);

  const layout = useMemo<SectionedLayout>(() => {
    const w = Math.max(width, 1);
    if (groups) {
      return computeSectionedLayout(groups, w, DENSITY_CONFIG[density]);
    }
    const flat = computeMasonryLayout(
      items.map((it) => ({ id: it.id, aspect: it.aspect })),
      w,
      DENSITY_CONFIG[density],
    );
    return { ...flat, bands: [] };
  }, [groups, items, width, density]);

  const itemsById = useMemo(() => {
    const map: Record<string, BoardItem> = {};
    items.forEach((it) => (map[it.id] = it));
    return map;
  }, [items]);

  const visible = useMemo(
    () => sliceVisible(layout.positions, scrollTop, viewportH, VIRTUAL_BUFFER),
    [layout, scrollTop, viewportH],
  );

  // ----- keyboard navigation (roving tabindex) -----
  // Exactly one card is a tab stop: the focused one, falling back to the first.
  // Arrows move focus geometrically; Enter opens, Space selects, Delete removes.
  const activeId = focusedId ?? layout.positions[0]?.id ?? null;

  const scrollCardIntoView = (id: string) => {
    const el = scrollRef.current;
    const p = layout.byId[id];
    if (!el || !p) return;
    // Positions are content-relative; the scroll container adds OUTER_PADDING.
    const top = p.y + OUTER_PADDING;
    const bottom = top + p.height;
    if (top < el.scrollTop) {
      el.scrollTop = Math.max(0, top - OUTER_PADDING);
    } else if (bottom > el.scrollTop + el.clientHeight) {
      el.scrollTop = bottom - el.clientHeight + OUTER_PADDING;
    }
  };

  const handleCardKeyDown = (id: string, e: React.KeyboardEvent) => {
    const dir = ARROW_DIRS[e.key];
    if (dir) {
      const next = nearestInDirection(layout.byId, id, dir);
      if (next) {
        e.preventDefault();
        setFocusedId(next);
        scrollCardIntoView(next);
      }
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      onOpen(id);
    } else if (e.key === " ") {
      e.preventDefault();
      onSelect(id, e.shiftKey || e.metaKey || e.ctrlKey);
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      onDelete(id);
    }
  };

  // ----- marquee selection on empty canvas -----
  const pointToContent = (clientX: number, clientY: number) => {
    const el = scrollRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    // Positions are relative to the inner content div, which begins after the
    // scroll container's padding — so subtract OUTER_PADDING on both axes.
    return {
      x: clientX - rect.left - OUTER_PADDING + el.scrollLeft,
      y: clientY - rect.top - OUTER_PADDING + el.scrollTop,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only start a marquee from bare canvas (not from a card).
    if (e.target !== e.currentTarget) return;
    if (e.button !== 0) return;
    const p = pointToContent(e.clientX, e.clientY);
    marqueeRef.current = {
      active: true,
      moved: false,
      additive: e.shiftKey || e.metaKey || e.ctrlKey,
    };
    const start = { x0: p.x, y0: p.y, x1: p.x, y1: p.y };
    marqueeRectRef.current = start;
    setMarquee(start);
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!marqueeRef.current.active) return;
      const m = marqueeRectRef.current;
      if (!m) return;
      const p = pointToContent(e.clientX, e.clientY);
      if (
        !marqueeRef.current.moved &&
        (Math.abs(p.x - m.x0) > MARQUEE_THRESHOLD ||
          Math.abs(p.y - m.y0) > MARQUEE_THRESHOLD)
      ) {
        marqueeRef.current.moved = true;
      }
      const next = { ...m, x1: p.x, y1: p.y };
      marqueeRectRef.current = next;
      setMarquee(next);
    };
    const onUp = () => {
      const st = marqueeRef.current;
      if (!st.active) return;
      marqueeRef.current.active = false;
      const m = marqueeRectRef.current;
      marqueeRectRef.current = null;
      setMarquee(null);
      // FIX: these parent callbacks used to run INSIDE the setMarquee updater.
      // Updaters must be pure: React StrictMode invokes them twice (so the
      // selection was applied twice), and a parent setState during another
      // component's render triggers React's "cannot update a component while
      // rendering a different component" warning. Call them here instead.
      if (m && st.moved) {
        const hit = intersectIds(layout, m);
        onSelectMany(hit, st.additive);
      } else if (!st.moved) {
        onClearSelection();
      }
    };
    // FIX: when the browser takes over the gesture (a touch drag on the
    // scrollable canvas becomes a scroll, an OS interruption) it sends
    // pointercancel and NEVER pointerup. The marquee used to stay "active", so
    // the next unrelated pointerup anywhere (e.g. tapping a card) was taken for
    // its release and cleared or replaced the selection. A cancel just drops
    // the marquee without touching the selection.
    const onCancel = () => {
      if (!marqueeRef.current.active) return;
      marqueeRef.current.active = false;
      marqueeRectRef.current = null;
      setMarquee(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
  }, [layout, onSelectMany, onClearSelection]);

  return (
    <div
      ref={scrollRef}
      className="h-full w-full overflow-y-auto overflow-x-hidden"
      style={{ padding: OUTER_PADDING }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      onPointerDown={handlePointerDown}
    >
      <div className="relative" style={{ height: layout.totalHeight }}>
        {layout.bands.map((band) => (
          <div
            key={band.id ?? "__ungrouped"}
            className="group/section absolute inset-x-0"
            style={{ top: band.headerY }}
          >
            <SectionHeader
              name={band.name}
              count={band.count}
              collapsed={band.collapsed}
              editable={band.id !== null}
              onToggleCollapse={() =>
                band.id && onToggleSectionCollapsed?.(band.id)
              }
              onRename={(name) => band.id && onRenameSection?.(band.id, name)}
              onDelete={() => band.id && onDeleteSection?.(band.id)}
            />
          </div>
        ))}
        {visible.map((pos, i) => {
          const item = itemsById[pos.id];
          if (!item) return null;
          // Animate each card in only the first time it's revealed this session,
          // so scrolling (which mounts/unmounts virtualized cards) never
          // re-triggers the entry motion.
          const firstReveal = !revealedRef.current.has(pos.id);
          if (firstReveal) revealedRef.current.add(pos.id);
          return (
            <BoardCard
              key={pos.id}
              item={item}
              pos={pos}
              selected={selectedIds.has(pos.id)}
              animateIn={firstReveal}
              revealDelayMs={firstReveal ? Math.min(i, 8) * 25 : 0}
              tabStop={pos.id === activeId}
              focused={pos.id === focusedId}
              onFocusCard={setFocusedId}
              onKeyNav={handleCardKeyDown}
              onSelect={onSelect}
              onOpen={onOpen}
              onUseReference={onUseReference}
              onDelete={onDelete}
              editing={editingTextId === pos.id}
              onEditText={onEditText}
              onCommitText={onCommitText}
            />
          );
        })}
        {marquee && marqueeRef.current.moved && (
          <div
            className="pointer-events-none absolute rounded-[3px] border border-primary bg-primary/10"
            style={{
              left: Math.min(marquee.x0, marquee.x1),
              top: Math.min(marquee.y0, marquee.y1),
              width: Math.abs(marquee.x1 - marquee.x0),
              height: Math.abs(marquee.y1 - marquee.y0),
            }}
          />
        )}
      </div>
    </div>
  );
};

const intersectIds = (
  layout: ReturnType<typeof computeMasonryLayout>,
  m: Marquee,
): string[] => {
  const left = Math.min(m.x0, m.x1);
  const right = Math.max(m.x0, m.x1);
  const top = Math.min(m.y0, m.y1);
  const bottom = Math.max(m.y0, m.y1);
  return layout.positions
    .filter(
      (p) =>
        p.x < right &&
        p.x + p.width > left &&
        p.y < bottom &&
        p.y + p.height > top,
    )
    .map((p) => p.id);
};
