import { useEffect, useRef } from "react";

interface UseScrollSyncProps {
  rulerScrollRef?: React.RefObject<HTMLDivElement | null>;
  tracksScrollRef: React.RefObject<HTMLDivElement | null>;
  trackLabelsScrollRef?: React.RefObject<HTMLDivElement | null>;
  bookmarksScrollRef?: React.RefObject<HTMLDivElement | null>;
}

export function useScrollSync({
  tracksScrollRef,
  rulerScrollRef,
  trackLabelsScrollRef,
  bookmarksScrollRef,
}: UseScrollSyncProps) {
  const isUpdatingRef = useRef(false);
  const lastRulerSync = useRef(0);
  const lastTracksSync = useRef(0);
  const lastVerticalSync = useRef(0);
  const lastBookmarksSync = useRef(0);

  useEffect(() => {
    const rulerViewport = rulerScrollRef?.current ?? null;
    const tracksViewport = tracksScrollRef.current;
    const trackLabelsViewport = trackLabelsScrollRef?.current;
    const bookmarksViewport = bookmarksScrollRef?.current;
    let handleBookmarksScroll: (() => void) | null = null;

    if (!tracksViewport) return;

    const syncScrollLeft = ({
      target,
      scrollLeft,
    }: {
      target: HTMLDivElement | null | undefined;
      scrollLeft: number;
    }) => {
      if (target) {
        target.scrollLeft = scrollLeft;
      }
    };

    const handleRulerScroll = () => {
      const now = Date.now();
      if (isUpdatingRef.current || now - lastRulerSync.current < 16) return;
      lastRulerSync.current = now;
      isUpdatingRef.current = true;
      tracksViewport.scrollLeft = rulerViewport?.scrollLeft ?? 0;
      syncScrollLeft({
        target: bookmarksViewport,
        scrollLeft: rulerViewport?.scrollLeft ?? 0,
      });
      isUpdatingRef.current = false;
    };

    const handleTracksScroll = () => {
      const now = Date.now();
      if (isUpdatingRef.current || now - lastTracksSync.current < 16) return;
      lastTracksSync.current = now;
      isUpdatingRef.current = true;
      syncScrollLeft({
        target: rulerViewport,
        scrollLeft: tracksViewport.scrollLeft,
      });
      syncScrollLeft({
        target: bookmarksViewport,
        scrollLeft: tracksViewport.scrollLeft,
      });
      isUpdatingRef.current = false;
    };

    if (rulerViewport && rulerViewport !== tracksViewport) {
      rulerViewport.addEventListener("scroll", handleRulerScroll);
    }
    if (tracksViewport !== rulerViewport) {
      tracksViewport.addEventListener("scroll", handleTracksScroll);
    }

    if (bookmarksViewport) {
      handleBookmarksScroll = () => {
        const now = Date.now();
        if (isUpdatingRef.current || now - lastBookmarksSync.current < 16)
          return;
        lastBookmarksSync.current = now;
        isUpdatingRef.current = true;
        const nextScrollLeft = bookmarksViewport.scrollLeft;
        tracksViewport.scrollLeft = nextScrollLeft;
        syncScrollLeft({
          target: rulerViewport,
          scrollLeft: nextScrollLeft,
        });
        isUpdatingRef.current = false;
      };

      if (bookmarksViewport !== tracksViewport) {
        bookmarksViewport.addEventListener("scroll", handleBookmarksScroll);
      }
    }

    if (trackLabelsViewport) {
      const handleTrackLabelsScroll = () => {
        const now = Date.now();
        if (isUpdatingRef.current || now - lastVerticalSync.current < 16)
          return;
        lastVerticalSync.current = now;
        isUpdatingRef.current = true;
        tracksViewport.scrollTop = trackLabelsViewport.scrollTop;
        isUpdatingRef.current = false;
      };

      const handleTracksVerticalScroll = () => {
        const now = Date.now();
        if (isUpdatingRef.current || now - lastVerticalSync.current < 16)
          return;
        lastVerticalSync.current = now;
        isUpdatingRef.current = true;
        trackLabelsViewport.scrollTop = tracksViewport.scrollTop;
        isUpdatingRef.current = false;
      };

      trackLabelsViewport.addEventListener("scroll", handleTrackLabelsScroll);
      tracksViewport.addEventListener("scroll", handleTracksVerticalScroll);

      return () => {
        if (rulerViewport && rulerViewport !== tracksViewport) {
          rulerViewport.removeEventListener("scroll", handleRulerScroll);
        }
        if (tracksViewport !== rulerViewport) {
          tracksViewport.removeEventListener("scroll", handleTracksScroll);
        }
        if (
          bookmarksViewport &&
          bookmarksViewport !== tracksViewport &&
          handleBookmarksScroll
        ) {
          bookmarksViewport.removeEventListener(
            "scroll",
            handleBookmarksScroll,
          );
        }
        trackLabelsViewport.removeEventListener(
          "scroll",
          handleTrackLabelsScroll,
        );
        tracksViewport.removeEventListener(
          "scroll",
          handleTracksVerticalScroll,
        );
      };
    }

    return () => {
      if (rulerViewport && rulerViewport !== tracksViewport) {
        rulerViewport.removeEventListener("scroll", handleRulerScroll);
      }
      if (tracksViewport !== rulerViewport) {
        tracksViewport.removeEventListener("scroll", handleTracksScroll);
      }
      if (
        bookmarksViewport &&
        bookmarksViewport !== tracksViewport &&
        handleBookmarksScroll
      ) {
        bookmarksViewport.removeEventListener("scroll", handleBookmarksScroll);
      }
    };
  }, [
    rulerScrollRef,
    tracksScrollRef,
    trackLabelsScrollRef,
    bookmarksScrollRef,
  ]);
}
