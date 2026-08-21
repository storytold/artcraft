import { useMemo, useRef, useState } from "react";
import { TagIcon, XIcon } from "lucide-react";

export interface TagSuggestion {
  value: string;
  useCount: number;
}

interface TagChipInputProps {
  /** Current tag values, in display casing. */
  chips: string[];
  /** The user's existing tags, offered as autocomplete while typing. */
  suggestions: TagSuggestion[];
  /** Read-only mode: chips render without remove affordance or input. */
  disabled?: boolean;
  /** Open the suggestion dropdown above the input instead of below — for
   *  hosts anchored to the bottom of the viewport (e.g. the bulk action bar). */
  dropUp?: boolean;
  onAdd: (values: string[]) => void;
  onRemove: (value: string) => void;
}

const MAX_SUGGESTIONS = 8;

/**
 * Removable tag chips with an inline autocomplete input. Enter / comma / blur
 * commit the draft, pasting comma-separated text adds every entry, Backspace
 * on an empty draft removes the last chip. Duplicates (case-insensitive) are
 * rejected locally with a brief flash on the existing chip.
 */
export function TagChipInput({
  chips,
  suggestions,
  disabled,
  dropUp,
  onAdd,
  onRemove,
}: TagChipInputProps) {
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);
  // -1 = free-typing (Enter commits the draft, not a suggestion).
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [flashValue, setFlashValue] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const flashTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const chipsLower = useMemo(
    () => new Set(chips.map((c) => c.toLowerCase())),
    [chips],
  );

  const filtered = useMemo(() => {
    const query = draft.trim().toLowerCase();
    if (!query) return [];
    return suggestions
      .filter(
        (s) =>
          s.value.toLowerCase().includes(query) &&
          !chipsLower.has(s.value.toLowerCase()),
      )
      .slice(0, MAX_SUGGESTIONS);
  }, [draft, suggestions, chipsLower]);

  const dropdownOpen = focused && filtered.length > 0;
  const highlight = Math.min(highlightIndex, filtered.length - 1);

  const flashChip = (value: string) => {
    clearTimeout(flashTimeout.current);
    setFlashValue(value);
    flashTimeout.current = setTimeout(() => setFlashValue(null), 800);
  };

  // Commit raw text: split on commas, trim, reject values already present
  // (flashing the existing chip so the rejection is visible).
  const commit = (raw: string) => {
    const values = raw
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    const fresh: string[] = [];
    const seen = new Set<string>();
    for (const value of values) {
      const lower = value.toLowerCase();
      if (chipsLower.has(lower)) {
        flashChip(chips.find((c) => c.toLowerCase() === lower) ?? value);
        continue;
      }
      if (seen.has(lower)) continue;
      seen.add(lower);
      fresh.push(value);
    }
    if (fresh.length > 0) onAdd(fresh);
    setDraft("");
    setHighlightIndex(-1);
  };

  const pickSuggestion = (value: string) => {
    onAdd([value]);
    setDraft("");
    setHighlightIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (dropdownOpen && highlight >= 0) {
        pickSuggestion(filtered[highlight].value);
      } else if (draft.trim()) {
        commit(draft);
      }
    } else if (e.key === "Backspace" && draft === "" && chips.length > 0) {
      onRemove(chips[chips.length - 1]);
    } else if (e.key === "ArrowDown" && dropdownOpen) {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp" && dropdownOpen) {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Escape") {
      setHighlightIndex(-1);
      inputRef.current?.blur();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (text.includes(",")) {
      e.preventDefault();
      commit(draft + text);
    }
  };

  const chipClass = (value: string) =>
    `flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-base-fg/80 transition-all ${
      flashValue === value ? "ring-2 ring-primary" : ""
    }`;

  return (
    <div className="relative">
      <div
        className={`flex flex-wrap items-center gap-1.5 rounded-xl bg-black/20 border border-white/5 px-3 py-2.5 ${
          disabled ? "" : "cursor-text"
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        {chips.map((value) =>
          disabled ? (
            <span key={value.toLowerCase()} className={chipClass(value)}>
              <TagIcon  className="h-2.5 w-2.5 text-base-fg/40" />
              {value}
            </span>
          ) : (
            <button
              key={value.toLowerCase()}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(value);
              }}
              title={`Remove "${value}"`}
              className={`group/tag ${chipClass(value)} hover:bg-red/15 hover:text-red focus:outline-none focus-visible:ring-2 focus-visible:ring-red`}
            >
              {value}
              <XIcon  className="h-2.5 w-2.5" />
            </button>
          ),
        )}
        {!disabled && (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setHighlightIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              if (draft.trim()) commit(draft);
            }}
            placeholder={chips.length === 0 ? "Add tags (comma separated)" : "Add tag"}
            className="min-w-[7rem] flex-1 bg-transparent py-0.5 text-sm text-base-fg placeholder:text-base-fg/40 focus:outline-none"
          />
        )}
      </div>

      {dropdownOpen && (
        <div
          className={`absolute left-0 right-0 z-30 max-h-48 overflow-y-auto rounded-lg border border-ui-panel-border bg-ui-panel p-1 shadow-xl ${
            dropUp ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
          {filtered.map((suggestion, index) => (
            <button
              key={suggestion.value.toLowerCase()}
              type="button"
              // preventDefault so the input's blur doesn't fire before the click.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pickSuggestion(suggestion.value)}
              onMouseEnter={() => setHighlightIndex(index)}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-base-fg transition-colors ${
                highlight === index ? "bg-ui-controls/60" : "hover:bg-ui-controls/40"
              }`}
            >
              <TagIcon  className="text-[10px] text-base-fg/40" />
              <span className="truncate">{suggestion.value}</span>
              <span className="ml-auto text-[11px] text-base-fg/40">
                {suggestion.useCount}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
