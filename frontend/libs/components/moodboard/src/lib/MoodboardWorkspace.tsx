import { ReactNode, useState } from "react";
import { CheckIcon, CloudUploadIcon, Grid3x3Icon, LoaderCircleIcon, PlayIcon, SquareDashedIcon, TriangleAlertIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DynamicIcon } from "@storyteller/icons";
import { BoardGridView } from "./grid/BoardGridView";
import { PresentationView } from "./grid/PresentationView";
import { useBoardLibraryStore } from "./boards/BoardLibraryStore";
import { useActiveBoard } from "./boards/boardSelectors";
import type { ViewMode } from "./boards/boardTypes";
import type { MoodboardAdapter } from "./adapter";
import { Moodboard } from "./canvas/Moodboard";
import { BoardPicker } from "./BoardPicker";
import {
  useMoodboardSync,
  type MoodboardSaveStatus,
} from "./persistence/moodboardSync";

interface Props {
  adapter: MoodboardAdapter;
  // Host chrome rendered in the top-right cluster, left of nothing — beside the
  // Present button. Webapp hosts that hide the global topbar inject their nav
  // actions (pricing/credits/task queue/profile) here, mirroring the 3D and
  // video editors. Tauri leaves it unset.
  topBarEndSlot?: ReactNode;
}

// Root moodboard surface. Switches how the board is rendered — Grid (virtualized
// masonry) vs Canvas (freeform Konva planning) — plus a transient Presentation
// overlay. Fills its parent; the host app sizes the container. Platform seams
// (upload, library picker, send-to-generation) arrive via the adapter.
export const MoodboardWorkspace = ({ adapter, topBarEndSlot }: Props) => {
  const viewMode = useBoardLibraryStore((s) => s.viewMode);
  const setViewMode = useBoardLibraryStore((s) => s.setViewMode);
  const board = useActiveBoard();
  // Remote board sync (no-op unless the adapter provides persistence and
  // the user is signed in).
  const { enabled: syncEnabled, status, saveNow } = useMoodboardSync(adapter);
  // Presentation is a transient overlay, not a persisted view mode — so a
  // reload never reopens straight into a slideshow.
  const [presenting, setPresenting] = useState(false);

  const presentItems = board
    ? board.itemOrder.map((id) => board.items[id]).filter((it) => Boolean(it))
    : [];

  return (
    <div
      data-moodboard-root
      className="relative h-full w-full overflow-hidden"
      // Desktop themes set --st-bg (gray/light/black/aurora) so the board follows
      // the active theme. The webapp never defines --st-bg, so it falls back to
      // its own --background token (0 0% 9% / #171717), matching the rest of the app.
      style={{ background: "var(--st-bg, hsl(0 0% 9%))" }}
    >
      {viewMode === "grid" ? (
        <BoardGridView active={!presenting} adapter={adapter} />
      ) : (
        <Moodboard adapter={adapter} />
      )}
      <TopLeftCluster mode={viewMode} onChange={setViewMode} />
      <TopRightCluster
        onPresent={() => setPresenting(true)}
        saveStatus={syncEnabled ? status : null}
        onSave={syncEnabled ? saveNow : undefined}
        endSlot={topBarEndSlot}
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

const OPTIONS: Array<{ mode: ViewMode; label: string; icon: LucideIcon }> =
  [
    { mode: "grid", label: "Grid", icon: Grid3x3Icon },
    { mode: "canvas", label: "Canvas", icon: SquareDashedIcon },
  ];

// Top-left chrome: the board picker plus the Grid/Canvas view switch, sharing
// one glass island.
const TopLeftCluster = ({
  mode,
  onChange,
}: {
  mode: ViewMode;
  onChange: (m: ViewMode) => void;
}) => (
  <div className="glass absolute left-3 top-3 z-40 flex items-center gap-0.5 rounded-2xl border border-ui-divider p-1 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.45)]">
    <BoardPicker />
    <div className="mx-0.5 h-5 w-px bg-ui-divider" />
    {OPTIONS.map((opt) => {
      const active = opt.mode === mode;
      return (
        <button
          key={opt.mode}
          type="button"
          onClick={() => onChange(opt.mode)}
          className={[
            "flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-sm font-medium",
            "transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            active
              ? "bg-base-fg/15 text-base-fg"
              : "text-base-fg/55 hover:text-base-fg",
          ].join(" ")}
        >
          <DynamicIcon icon={opt.icon} className="h-3.5 w-3.5" />
          {opt.label}
        </button>
      );
    })}
  </div>
);

// Manual save trigger + live sync state. Only rendered when remote
// persistence is active (adapter.persistence present + signed in).
const SaveButton = ({
  status,
  onSave,
}: {
  status: MoodboardSaveStatus;
  onSave: () => void;
}) => {
  const icon =
    status === "saving"
      ? LoaderCircleIcon
      : status === "saved"
        ? CheckIcon
        : status === "error"
          ? TriangleAlertIcon
          : CloudUploadIcon;
  const label =
    status === "saving"
      ? "Saving..."
      : status === "saved"
        ? "Saved"
        : status === "error"
          ? "Retry save"
          : "Save";

  return (
    <button
      type="button"
      onClick={onSave}
      disabled={status === "saving"}
      title="Save board"
      aria-label="Save board"
      className={[
        "flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-sm font-medium transition-colors duration-150",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        status === "error"
          ? "text-red-400 hover:text-red-300"
          : "text-base-fg/55 hover:text-base-fg",
      ].join(" ")}
    >
      <DynamicIcon
        icon={icon}
        className={[
          "h-3.5 w-3.5",
          status === "saving" ? "animate-spin" : "",
        ].join(" ")}
      />
      {label}
    </button>
  );
};

// Top-right chrome: Save (when remote sync is active), the Present action
// (always present, including Tauri), and the host's relocated nav actions
// (webapp only, via endSlot). The wrapper is click-through so the gap between
// the clusters never blocks the board beneath.
const TopRightCluster = ({
  onPresent,
  saveStatus,
  onSave,
  endSlot,
}: {
  onPresent: () => void;
  saveStatus: MoodboardSaveStatus | null;
  onSave?: () => void;
  endSlot?: ReactNode;
}) => (
  <div className="pointer-events-none absolute right-3 top-3 z-40 flex items-center gap-2">
    <div className="glass pointer-events-auto flex items-center rounded-xl border border-ui-divider p-0.5 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.45)]">
      {saveStatus !== null && onSave && (
        <SaveButton status={saveStatus} onSave={onSave} />
      )}
      <button
        type="button"
        onClick={onPresent}
        title="Present"
        aria-label="Present"
        className="flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-sm font-medium text-base-fg/55 transition-colors duration-150 hover:text-base-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <PlayIcon  className="h-3 w-3" />
        Present
      </button>
    </div>
    {endSlot && <div className="pointer-events-auto">{endSlot}</div>}
  </div>
);
