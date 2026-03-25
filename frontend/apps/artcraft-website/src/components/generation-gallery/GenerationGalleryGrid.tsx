import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { LoadingSpinner } from "@storyteller/ui-loading-spinner";
import { PendingCard } from "./PendingCard";
import { FailedCard } from "./FailedCard";
import { GalleryCard } from "./GalleryCard";
import { aspectRatioCache } from "./GalleryCard";
import type { InProgressJob, FailedJob } from "./useGenerationJobs";
import type { GalleryItem } from "./useGalleryData";

// ── Grid layout constants ─────────────────────────────────────────────────

const ROW_HEIGHT = 4; // px – fine-grained row base
const GAP = 4; // px – tight gap like reference screenshot

function getColCount(w: number): number {
  if (w >= 1536) return 5;
  if (w >= 1280) return 4;
  if (w >= 900) return 3;
  return 2;
}

/**
 * Should this item span 2 columns?
 * Only landscape or near-square items get featured — wide content benefits
 * from extra width. Portrait items should NEVER span 2 cols (makes them huge).
 */
function shouldFeature(
  ratio: number,
  galleryIndex: number,
  cols: number,
): boolean {
  if (cols < 3) return false;
  // Only landscape items (wider than tall) benefit from spanning
  if (ratio > 0.9) return false;
  // Feature a landscape item every few items for variety
  return galleryIndex % 6 === 2;
}

// Cap aspect ratio (h/w) so portrait items stay reasonable in the grid.
// 1.4 keeps portrait content visibly tall without dominating the viewport.
const MAX_RATIO = 1.4;

/** Calculate row span from aspect ratio (h/w) and column pixel width */
function calcRowSpan(
  ratio: number,
  colWidth: number,
  colSpan: number,
): number {
  const capped = Math.min(ratio, MAX_RATIO);
  const itemWidth = colWidth * colSpan + GAP * (colSpan - 1);
  const height = itemWidth * capped;
  return Math.max(1, Math.ceil((height + GAP) / (ROW_HEIGHT + GAP)));
}

// ── Types ──────────────────────────────────────────────────────────────────

interface GenerationGalleryGridProps {
  inProgressJobs: InProgressJob[];
  failedJobs: FailedJob[];
  onDismissFailed: (jobToken: string) => void;
  newlyCompletedItems: GalleryItem[];
  galleryItems: GalleryItem[];
  newlyCompletedTokens: Set<string>;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  onGalleryItemClick: (item: GalleryItem) => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export function GenerationGalleryGrid({
  inProgressJobs,
  failedJobs,
  onDismissFailed,
  newlyCompletedItems,
  galleryItems,
  newlyCompletedTokens,
  hasMore,
  isLoading,
  onLoadMore,
  onGalleryItemClick,
}: GenerationGalleryGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [colWidth, setColWidth] = useState(250);
  const [cols, setCols] = useState(4);

  // Measure container to derive column width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const c = getColCount(w);
      setCols(c);
      setColWidth((w - GAP * (c - 1)) / c);
    };
    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onLoadMore();
      },
      { rootMargin: "400px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore]);

  const filteredGalleryItems = useMemo(
    () =>
      newlyCompletedTokens.size > 0
        ? galleryItems.filter((item) => !newlyCompletedTokens.has(item.id))
        : galleryItems,
    [galleryItems, newlyCompletedTokens],
  );

  // Compute grid cell style for a gallery item
  const getItemStyle = useCallback(
    (itemId: string, galleryIndex: number): React.CSSProperties => {
      const ratio = aspectRatioCache.get(itemId) ?? 1;
      const featured = shouldFeature(ratio, galleryIndex, cols);
      const colSpan = featured ? 2 : 1;
      const rowSpan = calcRowSpan(ratio, colWidth, colSpan);
      return {
        gridColumn: `span ${colSpan}`,
        gridRow: `span ${rowSpan}`,
      };
    },
    [cols, colWidth],
  );

  // Square style for pending/failed cards
  const squareStyle = useMemo((): React.CSSProperties => {
    const rowSpan = calcRowSpan(1, colWidth, 1);
    return { gridColumn: "span 1", gridRow: `span ${rowSpan}` };
  }, [colWidth]);

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gridAutoRows: `${ROW_HEIGHT}px`,
    gridAutoFlow: "dense", // backfill gaps for a packed masonry look
    gap: `${GAP}px`,
  };

  return (
    <>
      <div ref={containerRef} style={gridStyle}>
        {inProgressJobs.map((job) => (
          <div key={job.id} style={squareStyle}>
            <PendingCard
              id={job.id}
              prompt={job.prompt}
              modelLabel={job.modelLabel}
              progress={job.progress}
              estimatedTimeLeftMs={job.estimatedTimeLeftMs}
            />
          </div>
        ))}
        {failedJobs.map((job) => (
          <div key={job.id} style={squareStyle}>
            <FailedCard
              id={job.id}
              prompt={job.prompt}
              modelLabel={job.modelLabel}
              failureReason={job.failureReason}
              failureMessage={job.failureMessage}
              onDismiss={onDismissFailed}
            />
          </div>
        ))}
        {newlyCompletedItems.map((item, i) => (
          <div key={`new-${item.id}`} style={getItemStyle(item.id, i)}>
            <GalleryCard item={item} onClick={onGalleryItemClick} />
          </div>
        ))}
        {filteredGalleryItems.map((item, i) => (
          <div
            key={item.id}
            style={getItemStyle(item.id, i + newlyCompletedItems.length)}
          >
            <GalleryCard item={item} onClick={onGalleryItemClick} />
          </div>
        ))}
      </div>

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          <LoadingSpinner className="h-6 w-6 text-white/60" />
        </div>
      )}
    </>
  );
}
