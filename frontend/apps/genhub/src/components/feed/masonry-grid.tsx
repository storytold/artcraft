import Masonry from "react-masonry-css";
import { useEffect, useRef, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

const BREAKPOINT_COLS = {
  default: 5,
  1536: 4,
  1024: 3,
  640: 2,
};

interface MasonryGridProps {
  children: ReactNode;
  hasMore: boolean;
  onLoadMore: () => void;
}

export function MasonryGrid({ children, hasMore, onLoadMore }: MasonryGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

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

  return (
    <>
      <Masonry
        breakpointCols={BREAKPOINT_COLS}
        className="flex w-auto -ml-4"
        columnClassName="pl-4 bg-clip-padding"
      >
        {children}
      </Masonry>

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </>
  );
}
