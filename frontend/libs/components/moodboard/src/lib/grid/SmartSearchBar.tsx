import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faXmark,
} from "@fortawesome/pro-regular-svg-icons";

interface Props {
  query: string;
  onQueryChange: (q: string) => void;
  tags: string[];
  activeTags: string[];
  onToggleTag: (tag: string) => void;
}

// Text search + tag-chip filtering. Color / visual ("find similar") search is
// deferred to Phase 3; this is the table-stakes text layer.
export const SmartSearchBar = ({
  query,
  onQueryChange,
  tags,
  activeTags,
  onToggleTag,
}: Props) => {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="glass flex h-9 min-w-[200px] items-center gap-2 rounded-full border border-ui-divider px-3">
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          className="h-3.5 w-3.5 text-base-fg/45"
        />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search this board"
          className="w-full bg-transparent text-sm text-base-fg placeholder:text-base-fg/40 focus:outline-none"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => onQueryChange("")}
            className="text-base-fg/45 transition-colors hover:text-base-fg"
          >
            <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {tags.length > 0 && (
        <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto">
          {tags.map((tag) => {
            const active = activeTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onToggleTag(tag)}
                className={[
                  "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors duration-150",
                  active
                    ? "bg-primary text-white"
                    : "bg-base-fg/8 text-base-fg/70 hover:bg-base-fg/15",
                ].join(" ")}
              >
                {tag}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
