import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faTableCells,
  faVectorSquare,
  faPlay,
} from "@fortawesome/pro-regular-svg-icons";
import { BoardGridView } from "./grid/BoardGridView";
import { PresentationView } from "./grid/PresentationView";
import { useBoardLibraryStore } from "./boards/BoardLibraryStore";
import { useActiveBoard } from "./boards/boardSelectors";
import type { ViewMode } from "./boards/boardTypes";
import type { MoodboardAdapter } from "./adapter";
import { Moodboard } from "./canvas/Moodboard";

interface Props {
  adapter: MoodboardAdapter;
}

// Root moodboard surface. Switches how the board is rendered — Grid (virtualized
// masonry) vs Canvas (freeform Konva planning) — plus a transient Presentation
// overlay. Fills its parent; the host app sizes the container. Platform seams
// (upload, library picker, send-to-generation) arrive via the adapter.
export const MoodboardWorkspace = ({ adapter }: Props) => {
  const viewMode = useBoardLibraryStore((s) => s.viewMode);
  const setViewMode = useBoardLibraryStore((s) => s.setViewMode);
  const board = useActiveBoard();
  // Presentation is a transient overlay, not a persisted view mode — so a
  // reload never reopens straight into a slideshow.
  const [presenting, setPresenting] = useState(false);

  const presentItems = board
    ? board.itemOrder
        .map((id) => board.items[id])
        .filter((it) => Boolean(it))
    : [];

  return (
    <div
      data-moodboard-root
      className="relative h-full w-full overflow-hidden bg-ui-background"
    >
      {viewMode === "grid" ? (
        <BoardGridView active={!presenting} adapter={adapter} />
      ) : (
        <Moodboard adapter={adapter} />
      )}
      <ViewSwitch
        mode={viewMode}
        onChange={setViewMode}
        onPresent={() => setPresenting(true)}
      />
      {presenting && (
        <PresentationView
          items={presentItems}
          onClose={() => setPresenting(false)}
        />
      )}
    </div>
  );
};

const OPTIONS: Array<{ mode: ViewMode; label: string; icon: IconDefinition }> = [
  { mode: "grid", label: "Grid", icon: faTableCells },
  { mode: "canvas", label: "Canvas", icon: faVectorSquare },
];

const ViewSwitch = ({
  mode,
  onChange,
  onPresent,
}: {
  mode: ViewMode;
  onChange: (m: ViewMode) => void;
  onPresent: () => void;
}) => (
  <div className="glass absolute left-4 top-4 z-40 flex items-center gap-0.5 rounded-full border border-ui-divider p-0.5 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.45)]">
    {OPTIONS.map((opt) => {
      const active = opt.mode === mode;
      return (
        <button
          key={opt.mode}
          type="button"
          onClick={() => onChange(opt.mode)}
          className={[
            "flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium",
            "transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            active
              ? "bg-base-fg/15 text-base-fg"
              : "text-base-fg/55 hover:text-base-fg",
          ].join(" ")}
        >
          <FontAwesomeIcon icon={opt.icon} className="h-3.5 w-3.5" />
          {opt.label}
        </button>
      );
    })}
    <div className="mx-0.5 h-5 w-px bg-ui-divider" />
    <button
      type="button"
      onClick={onPresent}
      title="Present"
      aria-label="Present"
      className="flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium text-base-fg/55 transition-colors duration-150 hover:text-base-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <FontAwesomeIcon icon={faPlay} className="h-3 w-3" />
      Present
    </button>
  </div>
);
