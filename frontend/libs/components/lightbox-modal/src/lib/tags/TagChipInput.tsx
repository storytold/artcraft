// useMemo caches the lower-cased chip set and the filtered suggestion list between renders; useRef holds the input element and
// the flash timer id (values that must survive renders without causing one); useState holds the typed draft, the focus flag,
// the highlighted suggestion and the chip that is currently flashing.
import { useMemo, useRef, useState } from "react";
// Two small icons from the lucide-react icon package: the tag glyph (read-only chips and dropdown rows) and the "x" on a removable chip.
import { TagIcon, XIcon } from "lucide-react";

// One autocomplete suggestion. Exported because TagsSection builds these from the API's tag records (`tag_value` becomes `value`,
// `use_count` becomes `useCount`). The dropdown shows `value` and, on the right, `useCount`.
export interface TagSuggestion {
  value: string;
  useCount: number;
}

// The props of the chip box. The only place that renders it is TagsSection, which passes `chips`, `suggestions`, `disabled`,
// `onAdd` and `onRemove`; nothing in this repository passes `dropUp`, so the dropdown always opens below the box today.
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
  // Called with the new values (already trimmed, de-duplicated and not present yet) when the user commits text or picks a suggestion.
  // The parent decides what to do with them (TagsSection updates its chips and queues a save to the server).
  onAdd: (values: string[]) => void;
  // Called with the chip's display text when the user clicks a chip's remove button or presses Backspace in an empty box.
  onRemove: (value: string) => void;
}

// The dropdown never lists more than this many suggestions, however many tags match.
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
  // The text typed into the input and not yet turned into a chip. Cleared by every commit and every suggestion pick.
  const [draft, setDraft] = useState("");
  // True while the input has keyboard focus. The dropdown is only shown while this is true.
  const [focused, setFocused] = useState(false);
  // -1 = free-typing (Enter commits the draft, not a suggestion).
  const [highlightIndex, setHighlightIndex] = useState(-1);
  // The display text of the chip that is flashing (a ring around it) because the user just tried to add it again; null = none.
  const [flashValue, setFlashValue] = useState<string | null>(null);
  // The <input> element, so a click anywhere in the box, or picking a suggestion, can put the cursor back in it, and Escape can blur it.
  const inputRef = useRef<HTMLInputElement>(null);
  // The id of the 800 ms timer that ends the flash. It is cleared when a new flash starts; it is not cleared when the component
  // unmounts, so a flash that is still running at that moment fires late and only sets state nobody is showing any more.
  const flashTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  // The current chips, lower-cased, as a Set for fast "is this already a chip" checks. TagsSection hands in a freshly mapped array on
  // every render, so this is rebuilt on every render of the section; with a handful of tags that costs nothing.
  const chipsLower = useMemo(
    () => new Set(chips.map((c) => c.toLowerCase())),
    [chips],
  );

  // The suggestions to show for the current draft.
  const filtered = useMemo(() => {
    // Compare ignoring case and surrounding spaces.
    const query = draft.trim().toLowerCase();
    // An empty box shows no suggestions at all, so the dropdown only appears once the user starts typing.
    if (!query) return [];
    return suggestions
      .filter(
        (s) =>
          // Keep suggestions that contain the typed text anywhere (not only at the start)...
          s.value.toLowerCase().includes(query) &&
          // ...and that are not already chips on this file.
          !chipsLower.has(s.value.toLowerCase()),
      )
      // Only the first MAX_SUGGESTIONS, in the order the parent gave them (TagsSection sorts the list it fetches most-used first).
      .slice(0, MAX_SUGGESTIONS);
  }, [draft, suggestions, chipsLower]);

  // The dropdown is open only while the input has focus and at least one suggestion matches.
  const dropdownOpen = focused && filtered.length > 0;
  // The highlighted row, kept inside the list when the list gets shorter as the user types (-1 stays -1).
  const highlight = Math.min(highlightIndex, filtered.length - 1);

  // Makes the existing chip with this display text flash for 800 ms (the "you already have that tag" signal).
  const flashChip = (value: string) => {
    // A second duplicate within the 800 ms restarts the flash instead of letting the first timer end it early.
    clearTimeout(flashTimeout.current);
    setFlashValue(value);
    flashTimeout.current = setTimeout(() => setFlashValue(null), 800);
  };

  // Commit raw text: split on commas, trim, reject values already present
  // (flashing the existing chip so the rejection is visible).
  const commit = (raw: string) => {
    // "a, b ,,c" becomes ["a", "b", "c"]: split on commas, trim each piece, drop empty pieces.
    const values = raw
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    // The values that really are new, and the lower-cased forms already taken within this one commit.
    const fresh: string[] = [];
    const seen = new Set<string>();
    for (const value of values) {
      const lower = value.toLowerCase();
      // Already a chip: flash that chip (using its own display casing) and do not add it again.
      if (chipsLower.has(lower)) {
        flashChip(chips.find((c) => c.toLowerCase() === lower) ?? value);
        continue;
      }
      // Typed twice in the same commit ("a, A"): the first one wins and the repeat is dropped without a flash.
      if (seen.has(lower)) continue;
      seen.add(lower);
      fresh.push(value);
    }
    // Tell the parent only when something new is left.
    if (fresh.length > 0) onAdd(fresh);
    // Always empty the box, even when every value was a duplicate.
    setDraft("");
    setHighlightIndex(-1);
  };

  // Adds one suggestion straight from the dropdown (by click, or by Enter/comma on the highlighted row).
  const pickSuggestion = (value: string) => {
    // The suggestion list already leaves out values that are chips, so no duplicate check is needed here.
    onAdd([value]);
    setDraft("");
    setHighlightIndex(-1);
    // Keep the cursor in the box so the user can carry on typing the next tag.
    inputRef.current?.focus();
  };

  // Keyboard handling for the input (it runs on every key press while the input has focus).
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      // Stop the browser's own action for the key (for a comma, typing it into the box).
      e.preventDefault();
      if (dropdownOpen && highlight >= 0) {
        // A suggestion is highlighted (arrow keys or mouse hover): take that one.
        pickSuggestion(filtered[highlight].value);
      } else if (draft.trim()) {
        // Nothing highlighted: take the text as typed. An empty or all-space draft does nothing.
        commit(draft);
      }
    } else if (e.key === "Backspace" && draft === "" && chips.length > 0) {
      // Backspace in an empty box takes off the last chip.
      onRemove(chips[chips.length - 1]);
    } else if (e.key === "ArrowDown" && dropdownOpen) {
      // Move the highlight down, stopping at the last row (preventDefault keeps the cursor from jumping to the end of the text).
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp" && dropdownOpen) {
      // Move the highlight up; one step above the first row goes back to -1, "no suggestion highlighted".
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Escape") {
      // Escape drops the highlight and takes focus out of the box. Leaving the box fires onBlur below, which commits whatever is
      // typed as a tag, and this key press is not stopped here, so the lightbox's window-level Escape listener (in Modal) also
      // closes the lightbox. So Escape here saves the half-typed text and closes the lightbox (N-109 in BUGS.md).
      setHighlightIndex(-1);
      inputRef.current?.blur();
    }
  };

  // Paste handling: a paste that contains a comma is treated as a list of tags; any other paste is left to the browser.
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (text.includes(",")) {
      // Take over the paste, so the raw text is not also inserted into the input.
      e.preventDefault();
      // The pasted text is added after the whole draft (not at the cursor position), and every comma-separated entry becomes a chip.
      commit(draft + text);
    }
  };

  // The Tailwind classes shared by read-only and removable chips; the ring is added while this chip is the one flashing.
  const chipClass = (value: string) =>
    `flex items-center gap-1 break-all text-left rounded-[3px] border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-base-fg/80 transition-all ${
      flashValue === value ? "ring-2 ring-primary" : ""
    }`;

  return (
    // `relative` makes this the anchor the absolutely positioned dropdown below is placed against.
    <div className="relative">
      {/* The framed box that holds the chips and the input. */}
      <div
        className={`flex flex-wrap items-center gap-1.5 rounded-[3px] bg-ui-panel border border-ui-panel-border focus-within:border-primary/60 px-3 py-2.5 ${
          disabled ? "" : "cursor-text"
        }`}
        // A click on the empty part of the box puts the cursor in the input (in read-only mode there is no input, so this does nothing).
        onClick={() => inputRef.current?.focus()}
      >
        {chips.map((value) =>
          disabled ? (
            // Read-only chip (somebody else's file): plain text with a tag icon, no remove button. Keyed by the lower-cased text, which
            // is unique because duplicates are rejected case-insensitively.
            <span key={value.toLowerCase()} className={chipClass(value)}>
              <TagIcon  className="h-2.5 w-2.5 text-base-fg/40" />
              {value}
            </span>
          ) : (
            // Editable chip: the whole chip is a button that removes it.
            <button
              key={value.toLowerCase()}
              type="button"
              onClick={(e) => {
                // Keep this click from reaching the box's onClick above, which would focus the input.
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
        {/* The text input exists only in editable mode. */}
        {!disabled && (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => {
              // Typing updates the draft and resets the highlight, so Enter commits the typed text until the arrow keys are used.
              setDraft(e.target.value);
              setHighlightIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              // Leaving the box hides the dropdown and turns any typed text into a tag (this is what Escape ends up doing too).
              setFocused(false);
              if (draft.trim()) commit(draft);
            }}
            // The accessible name; the specs find the input by this label.
            aria-label="Tags"
            placeholder={chips.length === 0 ? "Add tags (comma separated)" : "Add tag"}
            className="min-w-[7rem] flex-1 bg-transparent py-0.5 text-sm text-base-fg placeholder:text-base-fg/40 focus:outline-none"
          />
        )}
      </div>

      {/* The suggestion dropdown, drawn over the content below (or above, with dropUp) while the input has focus and something matches. */}
      {dropdownOpen && (
        <div
          className={`absolute left-0 right-0 z-30 max-h-48 overflow-y-auto rounded-none border border-ui-panel-border bg-ui-panel p-1 shadow-xl ${
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
              // Hovering a row highlights it, so Enter then takes that row.
              onMouseEnter={() => setHighlightIndex(index)}
              className={`flex w-full items-center gap-2 rounded-[3px] px-2 py-1.5 text-sm text-base-fg transition-colors ${
                highlight === index ? "bg-ui-controls/60" : "hover:bg-ui-controls/40"
              }`}
            >
              <TagIcon  className="text-[10px] text-base-fg/40" />
              <span className="truncate">{suggestion.value}</span>
              {/* The tag's use count from the API, pushed to the right edge of the row. */}
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
