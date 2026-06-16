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
        <MoveToMenu
          sections={sections}
          onAssignToSection={onAssignToSection}
          onCreateSectionWithSelection={onCreateSectionWithSelection}
        />
        <button
          type="button"
          onClick={onUseReference}
          className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-base-fg/80 transition-colors duration-150 hover:bg-primary/15 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <FontAwesomeIcon icon={faWandMagicSparkles} className="h-3.5 w-3.5" />
          Use as reference
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-base-fg/80 transition-colors duration-150 hover:bg-danger/15 hover:text-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-danger"
        >
          <FontAwesomeIcon icon={faTrashCan} className="h-3.5 w-3.5" />
          Delete
        </button>
        <button
          type="button"
          aria-label="Clear selection"
          onClick={onClear}
          className="flex h-8 w-8 items-center justify-center rounded-full text-base-fg/60 transition-colors duration-150 hover:bg-base-fg/10 hover:text-base-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
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
        className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-base-fg/80 transition-colors duration-150 hover:bg-base-fg/10 hover:text-base-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <FontAwesomeIcon icon={faLayerGroup} className="h-3.5 w-3.5" />
        Move to
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-[calc(100%+8px)] left-1/2 z-40 max-h-72 w-52 -translate-x-1/2 overflow-y-auto rounded-2xl border border-ui-divider bg-ui-panel/95 p-1.5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.55)] backdrop-blur-xl"
        >
          <MenuItem
            label="Ungrouped"
            muted
            onClick={() => pick(() => onAssignToSection(null))}
          />
          {sections.length > 0 && (
            <div className="my-1 h-px bg-ui-divider/70" />
          )}
          {sections.map((s) => (
            <MenuItem
              key={s.id}
              label={s.name}
              onClick={() => pick(() => onAssignToSection(s.id))}
            />
          ))}
          <div className="my-1 h-px bg-ui-divider/70" />
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
      "flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition-colors duration-150",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
      accent
        ? "text-primary hover:bg-primary/10"
        : muted
          ? "text-base-fg/55 hover:bg-base-fg/10 hover:text-base-fg"
          : "text-base-fg/85 hover:bg-base-fg/10",
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
  <kbd className="rounded border border-ui-divider bg-base-fg/5 px-1 py-px font-sans text-[10px] text-base-fg/70">
    {children}
  </kbd>
);
