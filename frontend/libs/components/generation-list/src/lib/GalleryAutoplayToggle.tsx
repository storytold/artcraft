import { PauseIcon, PlayIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DynamicIcon } from "@storyteller/icons";
import { Tooltip } from "@storyteller/ui-tooltip";
import { useGalleryViewStore } from "./gallery-view-store";

const OPTIONS: {
  autoplay: boolean;
  icon: LucideIcon;
  label: string;
}[] = [
  { autoplay: true, icon: PlayIcon, label: "Play video previews" },
  { autoplay: false, icon: PauseIcon, label: "Still thumbnails" },
];

// Segmented playing/still switch for video preview thumbnails. Sits next to
// GalleryViewToggle on the video page; the selection is shared with the
// gallery via useGalleryViewStore.
export function GalleryAutoplayToggle() {
  const autoplayVideos = useGalleryViewStore((s) => s.autoplayVideos);
  const setAutoplayVideos = useGalleryViewStore((s) => s.setAutoplayVideos);

  return (
    <div
      role="group"
      aria-label="Video preview playback"
      className="flex items-center gap-0.5 rounded-lg border border-white/[0.08] bg-white/[0.04] p-0.5"
    >
      {OPTIONS.map(({ autoplay, icon, label }) => {
        const active = autoplayVideos === autoplay;
        return (
          <Tooltip key={label} content={label} position="bottom" delay={300}>
            <button
              type="button"
              aria-label={label}
              aria-pressed={active}
              onClick={() => setAutoplayVideos(autoplay)}
              className={`flex h-6 w-6 items-center justify-center rounded-md text-xs transition-colors ${
                active
                  ? "bg-white/10 text-white"
                  : "text-white/45 hover:text-white/80"
              }`}
            >
              <DynamicIcon icon={icon} />
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}
