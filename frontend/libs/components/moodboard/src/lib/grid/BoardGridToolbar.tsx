import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faArrowUpFromBracket,
  faImages,
  faNoteSticky,
  faPalette,
  faTableCells,
  faTableCellsLarge,
  faGrip,
  faLayerGroup,
} from "@fortawesome/pro-regular-svg-icons";
import { faStar } from "@fortawesome/pro-solid-svg-icons";
import { GridDensity } from "../boards/boardTypes";
import { DENSITY_ORDER } from "./gridLayout";
import { SmartSearchBar } from "./SmartSearchBar";

interface Props {
  boardName: string;
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
  onAddColor: () => void;
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

// Floating glass island — detached from the top edge, not glued to it.
export const BoardGridToolbar = ({
  boardName,
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
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center px-4 pt-4">
      <div className="glass pointer-events-auto flex max-w-full items-center gap-3 rounded-2xl border border-ui-divider px-3 py-2 shadow-[0_8px_28px_-12px_rgba(0,0,0,0.45)]">
        <div className="flex min-w-0 flex-col pl-1 pr-2">
          <span className="truncate text-sm font-semibold leading-tight text-base-fg">
            {boardName}
          </span>
          <span className="text-[11px] leading-tight text-base-fg/45">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </span>
        </div>

        <Divider />

        {/* Add cluster */}
        <div className="flex items-center gap-1">
          <IslandButton
            icon={faArrowUpFromBracket}
            label="Upload"
            onClick={onUpload}
          />
          {canPickLibrary && (
            <IslandButton
              icon={faImages}
              label="From library"
              onClick={onLibrary}
            />
          )}
          <IslandButton icon={faNoteSticky} label="Add note" onClick={onAddNote} />
          <IslandButton icon={faPalette} label="Add color" onClick={onAddColor} />
          <IslandButton
            icon={faLayerGroup}
            label="New section"
            onClick={onNewSection}
          />
        </div>

        <Divider />

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
                <FontAwesomeIcon icon={DENSITY_ICON[d]} className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>

        <Divider />

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

        <Divider />

        <SmartSearchBar
          query={query}
          onQueryChange={onQueryChange}
          tags={tags}
          activeTags={activeTags}
          onToggleTag={onToggleTag}
        />
      </div>
    </div>
  );
};

const Divider = () => <div className="h-7 w-px shrink-0 bg-ui-divider" />;

const IslandButton = ({
  icon,
  label,
  onClick,
}: {
  icon: IconDefinition;
  label: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    onClick={onClick}
    className="flex h-8 w-8 items-center justify-center rounded-[10px] text-base-fg/70 transition-colors duration-150 hover:bg-base-fg/10 hover:text-base-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
  >
    <FontAwesomeIcon icon={icon} className="h-4 w-4" />
  </button>
);
