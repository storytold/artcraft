// GalleryLoadError: the small notice a generation feed shows at the bottom when loading the user's history FAILED.
// Used by GenerationGridView.tsx and GenerationListView.tsx in place of the "more is loading" spinner. Before this existed
// a failed load left that spinner on screen forever, because nothing ever asked the server again.

// Props: onRetry runs the same "load the next page" request that scrolling to the bottom would have run
// (useGalleryData's loadMore). Without it the notice is text only, which still beats a spinner that never ends.
export interface GalleryLoadErrorProps {
  onRetry?: () => void;
}

// Draws the message and, when the host wired a retry, a "Try again" button. It touches no state; the hook owns the retry.
export function GalleryLoadError({ onRetry }: GalleryLoadErrorProps) {
  return (
    // Centered column; the caller's wrapper already supplies the vertical padding.
    <div className="flex flex-col items-center gap-3 text-center">
      {/* Says what happened in plain words (the loaded items above it, if any, are still valid). */}
      <p className="text-sm text-white/60">Couldn't load your generations.</p>
      {/* Only shown when the page gave us a way to ask again. */}
      {onRetry && (
        <button
          type="button"
          // Re-runs the failed request through the hook; the hook clears this notice as soon as the new request starts.
          onClick={onRetry}
          // Same flat control look as the other buttons in the feed (select-mode download bar).
          className="border border-white/15 bg-ui-controls/60 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ui-controls/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          Try again
        </button>
      )}
    </div>
  );
}
