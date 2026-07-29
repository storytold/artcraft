import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faTrashCan } from "@fortawesome/pro-regular-svg-icons";

interface Props {
  name: string;
  count: number;
  collapsed: boolean;
  // The ungrouped lane can't be renamed, collapsed, or deleted.
  editable: boolean;
  onToggleCollapse: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}

// One section's header row. Click the title to rename inline; the chevron
// collapses the lane; the trash removes the section (items fall back to
// ungrouped). Absolutely positioned by the grid, so it spans the content width.
export const SectionHeader = ({
  name,
  count,
  collapsed,
  editable,
  onToggleCollapse,
  onRename,
  onDelete,
}: Props) => {
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

  const startEdit = () => {
    if (!editable) return;
    setDraft(name);
    setEditing(true);
  };

  return (
    <div className="flex h-12 items-center gap-2 pb-2 pt-3">
      {editable ? (
        <button
          type="button"
          aria-label={collapsed ? "Expand section" : "Collapse section"}
          onClick={onToggleCollapse}
          className="flex h-6 w-6 items-center justify-center rounded-md text-base-fg/45 transition-colors duration-150 hover:bg-base-fg/10 hover:text-base-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <FontAwesomeIcon
            icon={faChevronDown}
            className={[
              "h-3 w-3 transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
              collapsed ? "-rotate-90" : "rotate-0",
            ].join(" ")}
          />
        </button>
      ) : (
        <span className="h-6 w-1" />
      )}

      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            else if (e.key === "Escape") setEditing(false);
          }}
          onBlur={commit}
          className="min-w-0 rounded-md bg-base-fg/5 px-2 py-1 text-sm font-semibold text-base-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
      ) : (
        <button
          type="button"
          onClick={startEdit}
          disabled={!editable}
          className={[
            "truncate rounded-md px-1.5 py-0.5 text-sm font-semibold tracking-[-0.01em] text-base-fg transition-colors",
            editable
              ? "hover:bg-base-fg/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              : "cursor-default text-base-fg/55",
          ].join(" ")}
        >
          {name}
        </button>
      )}

      <span className="rounded-full bg-base-fg/8 px-2 py-0.5 text-[11px] font-medium tabular-nums text-base-fg/50">
        {count}
      </span>

      <div className="h-px flex-1 bg-ui-divider/60" />

      {editable && (
        <button
          type="button"
          aria-label="Delete section"
          title="Delete section (keeps items)"
          onClick={onDelete}
          className="flex h-7 w-7 items-center justify-center rounded-md text-base-fg/40 opacity-0 transition-all duration-150 hover:bg-danger/10 hover:text-danger focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-danger group-hover/section:opacity-100"
        >
          <FontAwesomeIcon icon={faTrashCan} className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};
