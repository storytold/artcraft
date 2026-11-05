// DesktopCreatePageShell: the page layout shared by the Generate Image, Generate Video and Audio pages.
// Used by pages/PageImage/TextToImage.tsx, pages/PageVideo/ImageToVideo.tsx and pages/PageAudio/CreateAudio.tsx.
// It only lays out slots (feed list, prompt box, empty-state splash); the pages supply the real content.

import { useEffect, useState, type ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { CreateEmptyState } from "./CreateEmptyState";

// Shared page chrome for the desktop Generate Image / Generate Video pages,
// mirroring the webapp's CreateMediaPageShell: a centered empty-state panel,
// and a scrollable generation feed (padded past the fixed promptbox) once
// there is anything to show.
//
// The empty state (and optional background) behave like a splash screen:
// they stay up while the feed is still loading (pages remount on tab
// switches, so this covers the reload) and fade out once content arrives.
// With a genuinely empty library they simply stay.

// How long (milliseconds) the empty-state splash fades out; must match the Tailwind duration-700 class below.
const SPLASH_FADE_MS = 700;

// hasContent: the feed has items to show; emptyStateTitle/Subtitle: text for the splash;
// listContent: the feed itself; promptBox: the fixed prompt box; bottomRight: optional corner controls.
interface DesktopCreatePageShellProps {
  hasContent: boolean;
  emptyStateTitle: string;
  emptyStateSubtitle: string;
  /** Optional decorative page background (fixed-position); fades out with
   *  the empty state. */
  background?: ReactNode;
  /** Height of the fixed promptbox area, used to pad the feed's bottom. */
  bottomOffset: number;
  listContent: ReactNode;
  /** The fixed-position promptbox stack (caller controls its positioning). */
  promptBox: ReactNode;
  bottomRight?: ReactNode;
}

/**
 * Full-height page frame: scrollable feed behind, splash on top, prompt box floating at the bottom.
 * Returns the layout JSX; holds one piece of state (splashState) to drive the fade.
 */
export function DesktopCreatePageShell({
  hasContent,
  emptyStateTitle,
  emptyStateSubtitle,
  background,
  bottomOffset,
  listContent,
  promptBox,
  bottomRight,
}: DesktopCreatePageShellProps) {
  // Splash life cycle: visible -> fading (opacity transition) -> hidden (unmounted).
  const [splashState, setSplashState] = useState<
    "visible" | "fading" | "hidden"
  >("visible");

  // Runs whenever content appears/disappears. When the first content arrives, start the fade and unmount
  // the splash after SPLASH_FADE_MS (the cleanup cancels the timer if we re-run early). If the feed
  // empties again after being hidden, show the splash again.
  useEffect(() => {
    if (hasContent && splashState === "visible") {
      setSplashState("fading");
      const t = setTimeout(() => setSplashState("hidden"), SPLASH_FADE_MS);
      return () => clearTimeout(t);
    }
    if (!hasContent && splashState === "hidden") {
      // Feed emptied out again (e.g. everything deleted) — bring it back.
      setSplashState("visible");
    }
    return undefined;
  }, [hasContent, splashState]);

  return (
    <div className="flex h-[calc(100vh-56px)] w-full bg-ui-background text-white">
      <div className="relative h-full w-full">
        {hasContent && (
          <div
            className="h-full w-full overflow-y-auto pt-0.5"
            style={{ paddingBottom: bottomOffset + 24 }}
          >
            {listContent}
          </div>
        )}

        {splashState !== "hidden" && (
          <div
            className={twMerge(
              "pointer-events-none absolute inset-0 z-10 transition-opacity duration-700",
              splashState === "fading" ? "opacity-0" : "opacity-100",
            )}
          >
            <div
              className="relative z-20 flex h-full w-full items-center justify-center px-6"
              style={{ paddingBottom: bottomOffset }}
            >
              <CreateEmptyState
                title={emptyStateTitle}
                subtitle={emptyStateSubtitle}
              />
            </div>
            {background}
          </div>
        )}

        {/* Bottom fade behind the floating prompt box so it stays legible
            over the feed. Sits under the prompt box (z-20). */}
        {hasContent && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-48 bg-gradient-to-t from-ui-background to-transparent"
          />
        )}

        {promptBox}

        {bottomRight && (
          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
            {bottomRight}
          </div>
        )}
      </div>
    </div>
  );
}
