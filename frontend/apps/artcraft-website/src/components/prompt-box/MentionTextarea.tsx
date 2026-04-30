import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { twMerge } from "tailwind-merge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserGroup } from "@fortawesome/pro-solid-svg-icons";
import { faVideo, faMusic } from "@fortawesome/pro-regular-svg-icons";
import type { MentionItem } from "./types";

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
  try {
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
        if (!child) break;
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
  } catch {
    return 0;
  }
}

function setCaretOffset(el: HTMLElement, offset: number) {
  try {
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
  } catch {
    // DOM changed during caret restore
  }
}

function scrollCaretIntoView(el: HTMLElement) {
  try {
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

    const parent = span.parentNode;
    if (parent) {
      const next = span.nextSibling;
      parent.removeChild(span);

      const restored = document.createRange();
      if (next) {
        restored.setStartBefore(next);
      } else if (parent.lastChild) {
        restored.setStartAfter(parent.lastChild);
      } else {
        restored.selectNodeContents(parent);
      }
      restored.collapse(true);
      sel.removeAllRanges();
      sel.addRange(restored);
    }
  } catch {
    // DOM changed during measurement
  }
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
      className="absolute z-50 mb-1 w-64 max-h-72 overflow-y-auto rounded-lg border border-white/10 bg-[#2a2a2e] shadow-lg backdrop-blur-xl"
      style={{ left: position.left, bottom: position.bottom }}
    >
      <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/50">
        Mentions
      </div>
      <div>
        {items.map((item, i) => (
          <button
            key={item.label}
            type="button"
            className={twMerge(
              "flex w-full items-center gap-2.5 px-3 py-2 text-sm text-white transition-colors cursor-pointer",
              i === activeIndex ? "bg-white/10" : "hover:bg-white/5",
            )}
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(item);
            }}
            onMouseEnter={() => onHover(i)}
          >
            <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-md border border-white/20 flex items-center justify-center bg-black/20">
              {(item.type === "character" || item.type === "image") && item.preview ? (
                <img
                  src={item.preview}
                  alt={item.label}
                  className="h-full w-full object-cover"
                />
              ) : item.type === "character" ? (
                <FontAwesomeIcon
                  icon={faUserGroup}
                  className="h-3.5 w-3.5 text-white/60"
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
                  className="h-3.5 w-3.5 text-white/60"
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

export const MentionTextarea = forwardRef<HTMLDivElement, MentionTextareaProps>(
  function MentionTextarea(
    {
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
    },
    ref,
  ) {
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

    const [dropdownPos, setDropdownPos] = useState<{
      left: number;
      bottom: number;
    }>({ left: 0, bottom: 0 });

    const filteredItems = useMemo(() => {
      if (!mentionState.isOpen) return [];
      return mentionItems.filter((item) =>
        mentionState.query
          ? item.label.toLowerCase().includes(mentionState.query.toLowerCase())
          : true,
      );
    }, [mentionItems, mentionState.isOpen, mentionState.query]);

    // Build a regex that matches any known mention label. Case-insensitive so
    // a typed `@image1` still highlights when the canonical label is `@Image1`.
    // Sort longest-first so `@Pumpkin Head` matches before `@Pumpkin`.
    const mentionRegex = useMemo(() => {
      const labels = mentionItems.map((item) => item.label);
      if (labels.length === 0) return null;
      const sorted = [...labels].sort((a, b) => b.length - a.length);
      const pattern = sorted.map((l) => escapeRegex(l)).join("|");
      return new RegExp(`(${pattern})`, "gi");
    }, [mentionItems]);

    // Case-insensitive colorMap lookup: "@image1" finds "@Image1".
    const lowerColorMap = useMemo(() => {
      const m: Record<string, string> = {};
      for (const [k, v] of Object.entries(colorMap)) {
        m[k.toLowerCase()] = v;
      }
      return m;
    }, [colorMap]);

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

        while ((match = regex.exec(text)) !== null) {
          const fullMatch = match[0];
          const color = lowerColorMap[fullMatch.toLowerCase()];

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
      [lowerColorMap, mentionRegex],
    );

    // Sync DOM when value changes from parent
    useEffect(() => {
      if (isInternalUpdate.current) {
        isInternalUpdate.current = false;
        return;
      }

      const el = editorRef.current;
      if (!el) return;

      const sel = window.getSelection();
      if (document.activeElement === el && sel && !sel.isCollapsed) return;

      try {
        const caret = pendingCaret.current ?? getCaretOffset(el);
        el.innerHTML = buildHTML(value);
        if (pendingCaret.current !== null) {
          setCaretOffset(el, pendingCaret.current);
          pendingCaret.current = null;
        } else if (document.activeElement === el) {
          setCaretOffset(el, caret);
        }
      } catch {
        el.innerHTML = buildHTML(value);
      }
    }, [value, buildHTML]);

    // Get pixel coordinates of a text offset relative to the wrapper
    const getOffsetRect = useCallback((charOffset: number) => {
      try {
        const el = editorRef.current;
        if (!el) return null;

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
      } catch {
        return null;
      }
    }, []);

    // Detect @mention trigger from cursor position. The `@` is a valid mention
    // trigger when it follows anything that isn't a word character — that covers
    // whitespace, punctuation, CJK/Chinese text, emoji, line starts, etc. Only
    // reject it when it's sitting mid-word after an alphanumeric/underscore.
    const detectMention = useCallback(
      (text: string, cursorPos: number) => {
        const textBefore = text.slice(0, cursorPos);
        const lastAt = textBefore.lastIndexOf("@");
        if (
          lastAt !== -1 &&
          (lastAt === 0 || !/[A-Za-z0-9_]/.test(text[lastAt - 1]))
        ) {
          const query = text.slice(lastAt, cursorPos);
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
      },
      [getOffsetRect],
    );

    const handleInput = useCallback(() => {
      if (isComposing.current) return;
      const el = editorRef.current;
      if (!el) return;

      try {
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

        requestAnimationFrame(() => {
          scrollCaretIntoView(el);
        });
      } catch {
        const text = el.innerText?.replace(/\n$/, "") ?? "";
        isInternalUpdate.current = true;
        onChange(text);
      }
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

        // Use the known mention bounds — `getCaretOffset` can return 0 when the
        // dropdown click collapses the selection out of the editor, which would
        // leave the typed query in the prompt alongside the inserted label.
        const queryEnd =
          mentionState.triggerIndex + mentionState.query.length;
        const before = value.slice(0, mentionState.triggerIndex);
        const after = value.slice(queryEnd);
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
      [value, mentionState.triggerIndex, mentionState.query, onChange],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (mentionState.isOpen && filteredItems.length > 0) {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setMentionState((prev) => ({
              ...prev,
              activeIndex: Math.min(
                prev.activeIndex + 1,
                filteredItems.length - 1,
              ),
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

        if (e.key === "Enter") {
          e.preventDefault();
          document.execCommand("insertLineBreak");
          handleInput();
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
      if (!el) return;
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed) return;
      detectMention(value, getCaretOffset(el));
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
      <div className="relative flex-1 min-w-0 pb-[7px]">
        {!value && placeholder && (
          <div
            className={twMerge(
              className,
              "absolute inset-0 pointer-events-none text-white/50 z-[1]",
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
            "outline-none whitespace-pre-wrap break-words overflow-y-auto resize-y",
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
  },
);
