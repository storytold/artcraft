import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/pro-solid-svg-icons";
import {
  faVideo,
  faMusic,
} from "@fortawesome/pro-regular-svg-icons";

export interface MentionItem {
  label: string;
  type: "image" | "video" | "audio" | "character";
  preview?: string;
}

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  mentionItems: MentionItem[];
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  disabled?: boolean;
  colorMap: Record<string, string>;
}

interface MentionState {
  isOpen: boolean;
  triggerIndex: number;
  query: string;
  activeIndex: number;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHTML(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------------
// Cursor helpers for contentEditable
// ---------------------------------------------------------------------------

function getCaretOffset(el: HTMLElement): number {
  const sel = window.getSelection();
  if (!sel?.rangeCount || !sel.anchorNode || !el.contains(sel.anchorNode)) {
    return 0;
  }

  const anchorNode = sel.anchorNode;
  const anchorOffset = sel.anchorOffset;
  let offset = 0;

  if (anchorNode === el) {
    for (let i = 0; i < anchorOffset; i++) {
      const child = el.childNodes[i];
      if (child.nodeType === Node.TEXT_NODE) {
        offset += child.textContent?.length ?? 0;
      } else if (child.nodeName === "BR") {
        offset += 1;
      } else {
        offset += child.textContent?.length ?? 0;
      }
    }
    return offset;
  }

  function countBefore(parent: Node): boolean {
    for (const child of Array.from(parent.childNodes)) {
      if (child === anchorNode) {
        if (child.nodeType === Node.TEXT_NODE) {
          offset += anchorOffset;
        }
        return true;
      }
      if (child.contains(anchorNode)) {
        return countBefore(child);
      }
      if (child.nodeType === Node.TEXT_NODE) {
        offset += child.textContent?.length ?? 0;
      } else if (child.nodeName === "BR") {
        offset += 1;
      } else {
        offset += child.textContent?.length ?? 0;
      }
    }
    return false;
  }

  countBefore(el);
  return offset;
}

function setCaretOffset(el: HTMLElement, offset: number) {
  let remaining = offset;

  function findPosition(parent: Node): boolean {
    for (let i = 0; i < parent.childNodes.length; i++) {
      const child = parent.childNodes[i];
      if (child.nodeType === Node.TEXT_NODE) {
        const len = child.textContent?.length ?? 0;
        if (remaining <= len) {
          const sel = window.getSelection();
          const range = document.createRange();
          range.setStart(child, remaining);
          range.collapse(true);
          sel?.removeAllRanges();
          sel?.addRange(range);
          return true;
        }
        remaining -= len;
      } else if (child.nodeName === "BR") {
        if (remaining === 0) {
          const sel = window.getSelection();
          const range = document.createRange();
          range.setStart(parent, i);
          range.collapse(true);
          sel?.removeAllRanges();
          sel?.addRange(range);
          return true;
        }
        remaining -= 1;
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        if (findPosition(child)) {
          return true;
        }
      }
    }
    return false;
  }

  if (!findPosition(el)) {
    const sel = window.getSelection();
    if (sel) {
      sel.selectAllChildren(el);
      sel.collapseToEnd();
    }
  }
}

/**
 * Scroll the contentEditable so the caret is visible.
 * Uses a zero-width space span to get a measurable rect on empty lines.
 */
function scrollCaretIntoView(el: HTMLElement) {
  const sel = window.getSelection();
  if (!sel?.rangeCount || !el.contains(sel.anchorNode)) return;

  const range = sel.getRangeAt(0).cloneRange();
  range.collapse(false);

  const span = document.createElement("span");
  span.textContent = "\u200B";
  range.insertNode(span);

  const spanRect = span.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();

  if (spanRect.bottom > elRect.bottom) {
    el.scrollTop += spanRect.bottom - elRect.bottom;
  } else if (spanRect.top < elRect.top) {
    el.scrollTop -= elRect.top - spanRect.top;
  }

  // Remove temp node and restore caret after it
  const parent = span.parentNode!;
  const next = span.nextSibling;
  parent.removeChild(span);

  const restored = document.createRange();
  if (next) {
    restored.setStartBefore(next);
  } else {
    restored.setStartAfter(parent.lastChild ?? parent);
  }
  restored.collapse(true);
  sel.removeAllRanges();
  sel.addRange(restored);
}

// ---------------------------------------------------------------------------
// Mention Dropdown
// ---------------------------------------------------------------------------

function MentionDropdown({
  items,
  activeIndex,
  onSelect,
  onHover,
  position,
}: {
  items: MentionItem[];
  activeIndex: number;
  onSelect: (item: MentionItem) => void;
  onHover: (index: number) => void;
  position: { left: number; bottom: number };
}) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const activeItem = list.children[1]?.children[activeIndex] as HTMLElement;
    activeItem?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <div
      ref={listRef}
      className="absolute z-50 mb-1 w-64 max-h-72 overflow-y-auto rounded-lg border border-white/10 bg-ui-controls shadow-lg backdrop-blur-xl"
      style={{ left: position.left, bottom: position.bottom }}
    >
      <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-base-fg/50">
        References
      </div>
      <div>
        {items.map((item, i) => (
          <button
            key={item.label}
            type="button"
            className={twMerge(
              "flex w-full items-center gap-2.5 px-3 py-2 text-sm text-base-fg transition-colors cursor-pointer",
              i === activeIndex ? "bg-white/10" : "hover:bg-white/5",
            )}
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(item);
            }}
            onMouseEnter={() => onHover(i)}
          >
            <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-md border border-white/20 flex items-center justify-center bg-black/20">
              {item.type === "character" && item.preview ? (
                <img
                  src={item.preview}
                  alt={item.label}
                  className="h-full w-full object-cover"
                />
              ) : item.type === "character" ? (
                <FontAwesomeIcon
                  icon={faUser}
                  className="h-3.5 w-3.5 text-base-fg/60"
                />
              ) : item.type === "image" && item.preview ? (
                <img
                  src={item.preview}
                  alt={item.label}
                  className="h-full w-full object-cover"
                />
              ) : item.type === "video" && item.preview ? (
                <video
                  src={item.preview}
                  muted
                  preload="metadata"
                  className="h-full w-full object-cover"
                />
              ) : (
                <FontAwesomeIcon
                  icon={item.type === "video" ? faVideo : faMusic}
                  className="h-3.5 w-3.5 text-base-fg/60"
                />
              )}
            </div>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MentionTextarea Component
// ---------------------------------------------------------------------------

export const MentionTextarea = forwardRef<HTMLDivElement, MentionTextareaProps>(function MentionTextarea({
  value,
  onChange,
  mentionItems,
  placeholder,
  className,
  onKeyDown: externalOnKeyDown,
  onFocus,
  onBlur,
  disabled,
  colorMap,
}, ref) {
  const editorRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => editorRef.current!, []);
  const isInternalUpdate = useRef(false);
  const isComposing = useRef(false);
  const pendingCaret = useRef<number | null>(null);

  const [mentionState, setMentionState] = useState<MentionState>({
    isOpen: false,
    triggerIndex: -1,
    query: "",
    activeIndex: 0,
  });

  // Pixel position of the @ trigger relative to the wrapper div
  const [dropdownPos, setDropdownPos] = useState<{ left: number; bottom: number }>({ left: 0, bottom: 0 });

  const filteredItems = useMemo(() => {
    if (!mentionState.isOpen) return [];
    return mentionItems.filter((item) =>
      mentionState.query
        ? item.label.toLowerCase().includes(mentionState.query.toLowerCase())
        : true,
    );
  }, [mentionItems, mentionState.isOpen, mentionState.query]);

  // Build a regex that matches any known mention label (supports spaces in names)
  // Sort longest-first so "@Pumpkin Head" matches before "@Pumpkin"
  const mentionRegex = useMemo(() => {
    const labels = mentionItems.map((item) => item.label);
    if (labels.length === 0) return null;
    const sorted = [...labels].sort((a, b) => b.length - a.length);
    const pattern = sorted.map((l) => escapeRegex(l)).join("|");
    return new RegExp(`(${pattern})`, "g");
  }, [mentionItems]);

  // Build innerHTML with colored @mentions inline
  const buildHTML = useCallback(
    (text: string): string => {
      if (!text) return "";
      if (!mentionRegex) {
        let html = escapeHTML(text);
        html = html.replace(/\n/g, "<br>");
        if (html.endsWith("<br>")) html += "<br>";
        return html;
      }

      let html = "";
      let lastIndex = 0;
      const regex = new RegExp(mentionRegex);
      let match: RegExpExecArray | null;

      // biome-ignore lint/suspicious/noAssignInExpressions: --
      while ((match = regex.exec(text)) !== null) {
        const fullMatch = match[0];
        const color = colorMap[fullMatch];

        if (match.index > lastIndex) {
          html += escapeHTML(text.slice(lastIndex, match.index));
        }

        if (color) {
          html += `<span style="color:${color}">${escapeHTML(fullMatch)}</span>`;
        } else {
          html += escapeHTML(fullMatch);
        }

        lastIndex = match.index + fullMatch.length;
      }

      if (lastIndex < text.length) {
        html += escapeHTML(text.slice(lastIndex));
      }

      html = html.replace(/\n/g, "<br>");
      if (html.endsWith("<br>")) {
        html += "<br>";
      }

      return html;
    },
    [colorMap, mentionRegex],
  );

  // Sync DOM when value changes from parent (not from user input)
  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }

    const el = editorRef.current;
    if (!el) return;

    const caret = pendingCaret.current ?? getCaretOffset(el);
    el.innerHTML = buildHTML(value);
    if (pendingCaret.current !== null) {
      setCaretOffset(el, pendingCaret.current);
      pendingCaret.current = null;
    } else if (document.activeElement === el) {
      setCaretOffset(el, caret);
    }
  }, [value, buildHTML]);

  // Get pixel coordinates of a text offset relative to the wrapper
  const getOffsetRect = useCallback((charOffset: number) => {
    const el = editorRef.current;
    if (!el) return null;

    // Temporarily place caret at charOffset to measure position
    const saved = getCaretOffset(el);
    setCaretOffset(el, charOffset);
    const sel = window.getSelection();
    if (!sel?.rangeCount) {
      setCaretOffset(el, saved);
      return null;
    }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const wrapperRect = el.parentElement!.getBoundingClientRect();
    setCaretOffset(el, saved);

    return {
      left: rect.left - wrapperRect.left,
      bottom: wrapperRect.bottom - rect.top,
    };
  }, []);

  // Detect @mention trigger from cursor position
  // Supports multi-word names by scanning back to the nearest @
  const detectMention = useCallback((text: string, cursorPos: number) => {
    // Find the last @ before cursor
    const textBefore = text.slice(0, cursorPos);
    const lastAt = textBefore.lastIndexOf("@");
    if (lastAt !== -1 && (lastAt === 0 || /\s/.test(text[lastAt - 1]))) {
      const query = text.slice(lastAt, cursorPos); // includes @
      // Only open if there's no newline in the query
      if (!query.includes("\n")) {
        const pos = getOffsetRect(lastAt);
        if (pos) setDropdownPos(pos);
        setMentionState({
          isOpen: true,
          triggerIndex: lastAt,
          query,
          activeIndex: 0,
        });
        return;
      }
    }
    setMentionState((prev) =>
      prev.isOpen ? { ...prev, isOpen: false } : prev,
    );
  }, [getOffsetRect]);

  // Extract text and re-render with mention styling
  const handleInput = useCallback(() => {
    if (isComposing.current) return;
    const el = editorRef.current;
    if (!el) return;

    let text = el.innerText;
    if (text.endsWith("\n")) {
      text = text.slice(0, -1);
    }

    const caret = getCaretOffset(el);
    const html = buildHTML(text);
    if (el.innerHTML !== html) {
      el.innerHTML = html;
      setCaretOffset(el, caret);
    }

    isInternalUpdate.current = true;
    onChange(text);
    detectMention(text, caret);

    // Keep caret visible when content overflows (contentEditable doesn't auto-scroll)
    requestAnimationFrame(() => {
      scrollCaretIntoView(el);
    });
  }, [onChange, buildHTML, detectMention]);

  const handleCompositionStart = useCallback(() => {
    isComposing.current = true;
  }, []);

  const handleCompositionEnd = useCallback(() => {
    isComposing.current = false;
    handleInput();
  }, [handleInput]);

  // Select a mention from the dropdown
  const handleSelect = useCallback(
    (item: MentionItem) => {
      const el = editorRef.current;
      if (!el) return;

      const caretPos = getCaretOffset(el);
      const before = value.slice(0, mentionState.triggerIndex);
      const after = value.slice(caretPos);
      const mention = `${item.label} `;
      const newValue = before + mention + after;

      pendingCaret.current = before.length + mention.length;

      setMentionState({
        isOpen: false,
        triggerIndex: -1,
        query: "",
        activeIndex: 0,
      });

      onChange(newValue);

      requestAnimationFrame(() => {
        el.focus();
      });
    },
    [value, mentionState.triggerIndex, onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (mentionState.isOpen && filteredItems.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setMentionState((prev) => ({
            ...prev,
            activeIndex: Math.min(prev.activeIndex + 1, filteredItems.length - 1),
          }));
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setMentionState((prev) => ({
            ...prev,
            activeIndex: Math.max(prev.activeIndex - 1, 0),
          }));
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          handleSelect(filteredItems[mentionState.activeIndex]);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setMentionState((prev) => ({ ...prev, isOpen: false }));
          return;
        }
      }

      // Shift+Enter (or Cmd+Enter on Mac): insert a newline instead of
      // letting the contentEditable create a <div>
      if (e.key === "Enter" && (e.shiftKey || e.metaKey)) {
        e.preventDefault();
        document.execCommand("insertLineBreak");
        handleInput();
        // Scroll caret into view (textarea does this automatically, contentEditable does not)
        scrollCaretIntoView(editorRef.current!);
        return;
      }

      externalOnKeyDown?.(e);
    },
    [
      mentionState.isOpen,
      mentionState.activeIndex,
      filteredItems,
      handleSelect,
      externalOnKeyDown,
      handleInput,
    ],
  );

  const handleClick = useCallback(() => {
    const el = editorRef.current;
    if (el) {
      detectMention(value, getCaretOffset(el));
    }
  }, [value, detectMention]);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text/plain");
      document.execCommand("insertText", false, text);
    },
    [],
  );

  return (
    <div className="relative flex-1 min-w-0">
      {!value && placeholder && (
        <div
          className={twMerge(
            className,
            "absolute inset-0 pointer-events-none text-base-fg/60 z-[1]",
          )}
        >
          {placeholder}
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        onPaste={handlePaste}
        onFocus={onFocus}
        onBlur={onBlur}
        className={twMerge(
          className,
          "outline-none whitespace-pre-wrap break-words overflow-y-auto",
        )}
      />

      {mentionState.isOpen && filteredItems.length > 0 && (
        <MentionDropdown
          items={filteredItems}
          activeIndex={mentionState.activeIndex}
          onSelect={handleSelect}
          onHover={(i) =>
            setMentionState((prev) => ({ ...prev, activeIndex: i }))
          }
          position={dropdownPos}
        />
      )}
    </div>
  );
});
