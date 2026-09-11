import { useEffect, useMemo, useRef } from "react";
import type { FailedJob, GalleryItem, InProgressJob } from "./types";

// Shared between the grid and list views: both merge the in-progress / failed /
// completed streams into a single time-sorted feed and lazy-load more on scroll.

export type GalleryEntry =
  | { kind: "pending"; key: string; createdAt: number; job: InProgressJob }
  | { kind: "failed"; key: string; createdAt: number; job: FailedJob }
  | { kind: "gallery"; key: string; createdAt: number; item: GalleryItem };

export interface MergedEntriesInput {
  inProgressJobs: InProgressJob[];
  failedJobs: FailedJob[];
  newlyCompletedItems: GalleryItem[];
  galleryItems: GalleryItem[];
  newlyCompletedTokens: Set<string>;
}

export function useMergedGalleryEntries({
  inProgressJobs,
  failedJobs,
  newlyCompletedItems,
  galleryItems,
  newlyCompletedTokens,
}: MergedEntriesInput): GalleryEntry[] {
  return useMemo(() => {
    const entries: GalleryEntry[] = [];

    for (const job of inProgressJobs) {
      entries.push({
        kind: "pending",
        key: job.id,
        createdAt: new Date(job.createdAt).getTime(),
        job,
      });
    }
    for (const job of failedJobs) {
      entries.push({
        kind: "failed",
        key: job.id,
        createdAt: new Date(job.createdAt).getTime(),
        job,
      });
    }
    for (const item of newlyCompletedItems) {
      entries.push({
        kind: "gallery",
        key: `new-${item.id}`,
        createdAt: new Date(item.createdAt).getTime(),
        item,
      });
    }
    for (const item of galleryItems) {
      if (newlyCompletedTokens.has(item.id)) continue;
      entries.push({
        kind: "gallery",
        key: item.id,
        createdAt: new Date(item.createdAt).getTime(),
        item,
      });
    }

    entries.sort((a, b) => b.createdAt - a.createdAt);
    return entries;
  }, [
    inProgressJobs,
    failedJobs,
    newlyCompletedItems,
    galleryItems,
    newlyCompletedTokens,
  ]);
}

// Returns a ref to attach to a sentinel element near the end of the feed;
// `onLoadMore` fires when it scrolls into view (with a 400px lookahead).
export function useInfiniteScrollSentinel(
  hasMore: boolean,
  onLoadMore: () => void,
) {
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

  return sentinelRef;
}
