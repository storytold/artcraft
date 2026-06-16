import { ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrashCan,
  faXmark,
  faWandMagicSparkles,
} from "@fortawesome/pro-regular-svg-icons";

interface Props {
  count: number;
  onUseReference: () => void;
  onDelete: () => void;
  onClear: () => void;
}

// Floats above the grid when items are multi-selected. Remix / Add-to-board /
// Palette land here in later phases; "Use as reference" is the Phase 2 loop.
export const SelectionBar = ({
  count,
  onUseReference,
  onDelete,
  onClear,
}: Props) => {
  if (count === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-6 z-30 flex justify-center">
      <div className="glass pointer-events-auto flex items-center gap-2 rounded-full border border-ui-divider py-1.5 pl-4 pr-1.5 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.5)]">
        <span className="text-sm font-medium text-base-fg">
          {count} selected
        </span>
        {/* Triage shortcut discoverability — these keys act on the selection. */}
        <span className="hidden items-center gap-1 text-[11px] text-base-fg/45 sm:flex">
          <Kbd>1–5</Kbd> rate
          <Kbd>0</Kbd> clear
        </span>
        <div className="mx-1 h-5 w-px bg-ui-divider" />
        <button
          type="button"
          onClick={onUseReference}
          className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-base-fg/80 transition-colors duration-150 hover:bg-primary/15 hover:text-primary"
        >
          <FontAwesomeIcon icon={faWandMagicSparkles} className="h-3.5 w-3.5" />
          Use as reference
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-base-fg/80 transition-colors duration-150 hover:bg-danger/15 hover:text-danger"
        >
          <FontAwesomeIcon icon={faTrashCan} className="h-3.5 w-3.5" />
          Delete
        </button>
        <button
          type="button"
          aria-label="Clear selection"
          onClick={onClear}
          className="flex h-8 w-8 items-center justify-center rounded-full text-base-fg/60 transition-colors duration-150 hover:bg-base-fg/10 hover:text-base-fg"
        >
          <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const Kbd = ({ children }: { children: ReactNode }) => (
  <kbd className="rounded border border-ui-divider bg-base-fg/5 px-1 py-px font-sans text-[10px] text-base-fg/70">
    {children}
  </kbd>
);
