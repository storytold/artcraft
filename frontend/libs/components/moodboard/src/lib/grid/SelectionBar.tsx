import { ReactNode, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrashCan,
  faXmark,
  faWandMagicSparkles,
  faLayerGroup,
  faPlus,
} from "@fortawesome/pro-regular-svg-icons";
import { BoardSection } from "../boards/boardTypes";

interface Props {
  count: number;
  // True when the selection has at least one reference-capable item (an image
  // with a media token). Notes/colors/links can't be used as a reference.
  canUseReference: boolean;
  sections: BoardSection[];
  onUseReference: () => void;
  onAssignToSection: (sectionId: string | null) => void;
  onCreateSectionWithSelection: () => void;
  onDelete: () => void;
  onClear: () => void;
}

// Floats above the grid when items are multi-selected. "Move to" assigns the
// selection into a section lane; "Use as reference" is the board→generate loop.
export const SelectionBar = ({
  count,
  canUseReference,
  sections,
  onUseReference,
  onAssignToSection,
  onCreateSectionWithSelection,
  onDelete,
  onClear,
}: Props) => {
  if (count === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-6 z-30 flex justify-center">
      {/* Styled to match the webapp library's multiselect bar: solid pill, filled
          control buttons, red delete, round clear. */}
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-ui-panel-border bg-ui-panel/95 px-2.5 py-2 shadow-xl backdrop-blur">
        <span className="px-1 text-sm font-medium text-white/80">
          {count} selected
        </span>
        {/* Triage shortcut discoverability — these keys act on the selection. */}
        <span className="hidden items-center gap-1 text-[11px] text-white/40 sm:flex">
          <Kbd>1–5</Kbd> rate
          <Kbd>0</Kbd> clear
        </span>
        <MoveToMenu
          sections={sections}
          onAssignToSection={onAssignToSection}
          onCreateSectionWithSelection={onCreateSectionWithSelection}
        />
        {canUseReference && (
          <button
            type="button"
            onClick={onUseReference}
            className="flex items-center gap-2 rounded-full bg-ui-controls/60 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-ui-controls/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <FontAwesomeIcon icon={faWandMagicSparkles} className="text-xs" />
            Use as reference
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center gap-2 rounded-full bg-red/90 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red focus:outline-none focus-visible:ring-2 focus-visible:ring-red"
        >
          <FontAwesomeIcon icon={faTrashCan} className="text-xs" />
          Delete
        </button>
        <button
          type="button"
          aria-label="Clear selection"
          onClick={onClear}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-ui-controls/60 text-white transition-colors hover:bg-ui-controls/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>
    </div>
  );
};

const MoveToMenu = ({
  sections,
  onAssignToSection,
  onCreateSectionWithSelection,
}: {
  sections: BoardSection[];
  onAssignToSection: (sectionId: string | null) => void;
  onCreateSectionWithSelection: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (fn: () => void) => {
    fn();
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full bg-ui-controls/60 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-ui-controls/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <FontAwesomeIcon icon={faLayerGroup} className="text-xs" />
        Move to
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-[calc(100%+8px)] left-1/2 z-40 max-h-72 w-52 -translate-x-1/2 overflow-y-auto rounded-lg border border-ui-panel-border bg-ui-panel p-2 shadow-xl"
        >
          <MenuItem
            label="Ungrouped"
            muted
            onClick={() => pick(() => onAssignToSection(null))}
          />
          {sections.length > 0 && (
            <div className="mx-1.5 my-1 border-t border-ui-panel-border" />
          )}
          {sections.map((s) => (
            <MenuItem
              key={s.id}
              label={s.name}
              onClick={() => pick(() => onAssignToSection(s.id))}
            />
          ))}
          <div className="mx-1.5 my-1 border-t border-ui-panel-border" />
          <MenuItem
            label="New section"
            icon={faPlus}
            accent
            onClick={() => pick(onCreateSectionWithSelection)}
          />
        </div>
      )}
    </div>
  );
};

const MenuItem = ({
  label,
  icon,
  muted,
  accent,
  onClick,
}: {
  label: string;
  icon?: typeof faPlus;
  muted?: boolean;
  accent?: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    role="menuitem"
    onClick={onClick}
    className={[
      "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
      accent
        ? "text-primary hover:bg-ui-controls/50"
        : muted
          ? "text-white/50 hover:bg-ui-controls/50 hover:text-white"
          : "text-white hover:bg-ui-controls/50",
    ].join(" ")}
  >
    {icon ? (
      <FontAwesomeIcon icon={icon} className="h-3 w-3 shrink-0 opacity-70" />
    ) : (
      <span className="h-3 w-3 shrink-0" />
    )}
    <span className="truncate">{label}</span>
  </button>
);

const Kbd = ({ children }: { children: ReactNode }) => (
  <kbd className="rounded border border-ui-panel-border bg-white/5 px-1 py-px font-sans text-[10px] text-white/60">
    {children}
  </kbd>
);
