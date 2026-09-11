import { SquareCheckIcon } from "lucide-react";
import { Tooltip } from "@storyteller/ui-tooltip";
import { useGallerySelectionStore } from "./gallery-selection-store";

// TopBar toggle that puts the create-page gallery into multi-select mode.
// Sits next to GalleryViewToggle; the mode is shared with the gallery via
// useGallerySelectionStore.
export function GallerySelectToggle() {
  const active = useGallerySelectionStore((s) => s.active);
  const setActive = useGallerySelectionStore((s) => s.setActive);
  const label = active ? "Exit selection" : "Select items";

  return (
    <div className="flex items-center rounded-lg border border-white/[0.08] bg-white/[0.04] p-0.5">
      <Tooltip content={label} position="bottom" delay={300}>
        <button
          type="button"
          aria-label={label}
          aria-pressed={active}
          onClick={() => setActive(!active)}
          className={`flex h-6 w-6 items-center justify-center rounded-md text-xs transition-colors ${
            active
              ? "bg-white/10 text-white"
              : "text-white/45 hover:text-white/80"
          }`}
        >
          <SquareCheckIcon />
        </button>
      </Tooltip>
    </div>
  );
}
