import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faArrowUpFromBracket,
  faImages,
  faNoteSticky,
  faTableCells,
  faTableCellsLarge,
  faGrip,
  faLayerGroup,
} from "@fortawesome/pro-regular-svg-icons";
import { faStar } from "@fortawesome/pro-solid-svg-icons";
import { GridDensity } from "../boards/boardTypes";
import { DENSITY_ORDER } from "./gridLayout";
import { SmartSearchBar } from "./SmartSearchBar";
import { ColorPickerPopover } from "./ColorPickerPopover";
import { ToolbarShell, ToolbarIconButton, ToolbarDivider } from "../ui/Toolbar";

interface Props {
  boardName: string;
  onRenameBoard: (name: string) => void;
  itemCount: number;
  density: GridDensity;
  onDensityChange: (d: GridDensity) => void;
  query: string;
  onQueryChange: (q: string) => void;
  tags: string[];
  activeTags: string[];
  onToggleTag: (tag: string) => void;
  ratingFilter: number;
  onCycleRatingFilter: () => void;
  onUpload: () => void;
  onLibrary: () => void;
  canPickLibrary: boolean;
  onAddNote: () => void;
  onAddColor: (color: string) => void;
  onNewSection: () => void;
}

const DENSITY_ICON: Record<GridDensity, IconDefinition> = {
  compact: faGrip,
  cozy: faTableCells,
  comfortable: faTableCellsLarge,
};

const DENSITY_LABEL: Record<GridDensity, string> = {
  compact: "Compact",
  cozy: "Cozy",
  comfortable: "Comfortable",
};

// Floating glass island — detached from the top edge, not glued to it. Shares
// its shell, buttons, and dividers with the Canvas toolbar (see ../ui/Toolbar).
export const BoardGridToolbar = ({
  boardName,
  onRenameBoard,
  itemCount,
  density,
  onDensityChange,
  query,
  onQueryChange,
  tags,
  activeTags,
  onToggleTag,
  ratingFilter,
  onCycleRatingFilter,
  onUpload,
  onLibrary,
  canPickLibrary,
  onAddNote,
  onAddColor,
  onNewSection,
}: Props) => {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center px-3 pt-3">
      <ToolbarShell className="max-w-full">
        <div className="flex min-w-0 flex-col pl-1 pr-2">
          <BoardTitle name={boardName} onRename={onRenameBoard} />
          <span className="pl-1.5 text-[11px] leading-tight text-base-fg/45">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </span>
        </div>

        <ToolbarDivider />

        {/* Add cluster */}
        <div className="flex items-center gap-1">
          <ToolbarIconButton
            icon={faArrowUpFromBracket}
            label="Upload"
            onClick={onUpload}
          />
          {canPickLibrary && (
            <ToolbarIconButton
              icon={faImages}
              label="From library"
              onClick={onLibrary}
            />
          )}
          <ToolbarIconButton
            icon={faNoteSticky}
            label="Add note"
            onClick={onAddNote}
          />
          <ColorPickerPopover onAdd={onAddColor} />
          <ToolbarIconButton
            icon={faLayerGroup}
            label="New section"
            onClick={onNewSection}
          />
        </div>

        <ToolbarDivider />

        {/* Density segmented control */}
        <div className="flex items-center gap-0.5 rounded-full bg-base-fg/5 p-0.5">
          {DENSITY_ORDER.map((d) => {
            const active = d === density;
            return (
              <button
                key={d}
                type="button"
                title={DENSITY_LABEL[d]}
                aria-label={`${DENSITY_LABEL[d]} density`}
                onClick={() => onDensityChange(d)}
                className={[
                  "flex h-7 w-7 items-center justify-center rounded-full transition-colors duration-150",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  active
                    ? "bg-base-fg/15 text-base-fg"
                    : "text-base-fg/50 hover:text-base-fg",
                ].join(" ")}
              >
                <FontAwesomeIcon
                  icon={DENSITY_ICON[d]}
                  className="h-3.5 w-3.5"
                />
              </button>
            );
          })}
        </div>

        <ToolbarDivider />

        {/* Rating filter — cycles off → ≥1 … ≥5 → off (Lightroom-style sift). */}
        <button
          type="button"
          title={
            ratingFilter > 0
              ? `Showing ${ratingFilter}+ stars`
              : "Filter by rating"
          }
          aria-label="Filter by rating"
          onClick={onCycleRatingFilter}
          className={[
            "flex h-8 items-center gap-1 rounded-full px-2.5 transition-colors duration-150",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            ratingFilter > 0
              ? "bg-yellow-400/15 text-yellow-500"
              : "text-base-fg/55 hover:bg-base-fg/10 hover:text-base-fg",
          ].join(" ")}
        >
          <FontAwesomeIcon icon={faStar} className="h-3.5 w-3.5" />
          <span className="text-xs font-semibold tabular-nums">
            {ratingFilter > 0 ? `${ratingFilter}+` : "All"}
          </span>
        </button>

        <ToolbarDivider />

        <SmartSearchBar
          query={query}
          onQueryChange={onQueryChange}
          tags={tags}
          activeTags={activeTags}
          onToggleTag={onToggleTag}
        />
      </ToolbarShell>
    </div>
  );
};

// Inline-editable board title — click to rename (mirrors SectionHeader). Commits
// on Enter / blur, Escape cancels; empty or unchanged input is ignored.
const BoardTitle = ({
  name,
  onRename,
}: {
  name: string;
  onRename: (name: string) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    const next = draft.trim();
    if (next && next !== name) onRename(next);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          else if (e.key === "Escape") setEditing(false);
        }}
        onBlur={commit}
        className="min-w-0 rounded-md bg-base-fg/5 px-1.5 py-0.5 text-sm font-semibold leading-tight text-base-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
    );
  }

  return (
    <button
      type="button"
      title="Rename board"
      onClick={() => {
        setDraft(name);
        setEditing(true);
      }}
      className="truncate rounded-md px-1.5 py-0.5 text-left text-sm font-semibold leading-tight text-base-fg transition-colors hover:bg-base-fg/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {name}
    </button>
  );
};
