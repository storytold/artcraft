import type { CSSProperties, ReactNode } from "react";
import { XIcon } from "lucide-react";
import { useGallerySelectionStore } from "./gallery-selection-store";

export interface SelectionActionBarProps {
  /** Host-provided action buttons (e.g. "Download selected"). */
  children?: ReactNode;
  /** Replaces the default `bottom-6` offset on the fixed, centered wrapper
   *  (e.g. "bottom-20 sm:bottom-4") so hosts can adjust placement without
   *  fighting conflicting Tailwind utilities. */
  className?: string;
  /** Merged onto the wrapper — e.g. a `left` override to center within the
   *  content area next to a sidebar. */
  style?: CSSProperties;
}

// Floating pill shown while the gallery is in select mode. Styled to match
// the library/moodboard multiselect bars. Selection state comes from
// useGallerySelectionStore; the actions themselves are host-injected since
// download/share flows differ between the webapp and the desktop app.
export function SelectionActionBar({
  children,
  className,
  style,
}: SelectionActionBarProps) {
  const active = useGallerySelectionStore((s) => s.active);
  const count = useGallerySelectionStore((s) => s.ids.size);
  const setActive = useGallerySelectionStore((s) => s.setActive);

  if (!active) return null;

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 z-40 flex justify-center ${className ?? "bottom-6"}`}
      style={style}
    >
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-ui-panel-border bg-ui-panel/95 px-2.5 py-2 shadow-xl backdrop-blur">
        <span className="px-1 text-sm font-medium text-white/80">
          {count} selected
        </span>
        {children}
        <button
          type="button"
          aria-label="Exit selection"
          onClick={() => setActive(false)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-ui-controls/60 text-white transition-colors hover:bg-ui-controls/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <XIcon />
        </button>
      </div>
    </div>
  );
}
