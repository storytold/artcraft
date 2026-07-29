import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { twMerge } from "tailwind-merge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/pro-solid-svg-icons";
import { faVideo, faMusic } from "@fortawesome/pro-regular-svg-icons";
import { useEnterToGenerateStore } from "./promptStore";
import { MentionChipMenu } from "./MentionChipMenu";
import { DeckPreviewModal } from "./deck/DeckCard";

export interface MentionItem {
  label: string;
  type: "image" | "video" | "audio" | "character";
  /** Small thumbnail (chip + dropdown row). */
  preview?: string;
  /** Identity for character items (character_token). */
  token?: string;
  /** Larger image for the chip Preview modal; falls back to `preview`. */
  fullPreview?: string;
}

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  mentionItems: MentionItem[];
  placeholder?: string;
  className?: string;
  /** Inline style applied to the editable element (e.g. a maxHeight cap). */
  style?: React.CSSProperties;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  disabled?: boolean;
  colorMap: Record<string, string>;
  /**
   * Overrides the shared enter-to-generate store (used by hosts with their
   * own persisted setting, or to force newline-only behavior on mobile).
   */
  enterToGenerate?: boolean;
  /**
   * Fired when the user picks a mention from the dropdown or swaps one via
   * the chip menu — lets the host record which token a name refers to.
   */
  onMentionSelect?: (item: MentionItem) => void;
  /**
   * name (without "@") -> character token. When several characters share a
   * label, picks which one's thumbnail renders in the chip.
   */
  selectedTokens?: Record<string, string>;
}

interface MentionState {
  isOpen: boolean;
  triggerIndex: number;
  query: string;
  activeIndex: number;
}

interface ChipMenuState {
  label: string;
  token?: string;
  start: number;
  rect: DOMRect;
  /** The clicked chip element — edits go through DOM ranges so they land on
   * the browser undo stack; `start` is the fallback when it's detached. */
  node: HTMLElement;
}

// align-middle, not align-baseline: an inline-flex box takes its baseline
// from the first flex item — here the <img>, whose "baseline" is its bottom
// edge — which makes the chip ride high against the surrounding text.
// No select-none: chips must paint the native selection highlight so users
// can see they're included when sweep-selecting text to copy.
const CHIP_CLASS =
  "mention-chip mx-0.5 inline-flex max-w-[10rem] cursor-pointer items-center gap-1 rounded-md border border-white/10 bg-ui-controls/80 px-1.5 py-0.5 align-middle leading-tight transition-colors hover:border-white/25 hover:bg-white/15";
const CHIP_IMG_CLASS =
  "pointer-events-none h-4 w-4 shrink-0 rounded object-cover select-none";
const CHIP_NAME_CLASS = "pointer-events-none truncate";

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

/**
 * Round-trip generated HTML through the browser parser so it byte-matches
 * `el.innerHTML` reads — `handleInput` compares the two to skip needless
 * rewrites, and chip markup (attributes, img tags) would otherwise never
 * compare equal to the browser's serialization.
 */
let normalizerDiv: HTMLDivElement | null = null;
function normalizeHTML(html: string): string {
  if (typeof document === "undefined") return html;
  if (!normalizerDiv) normalizerDiv = document.createElement("div");
  normalizerDiv.innerHTML = html;
  const out = normalizerDiv.innerHTML;
  normalizerDiv.innerHTML = "";
  return out;
}

// ---------------------------------------------------------------------------
// Plain-text serialization (chips count as their mention label)
// ---------------------------------------------------------------------------

function isChip(node: Node): node is HTMLElement {
  return (
    node.nodeType === Node.ELEMENT_NODE &&
    !!(node as HTMLElement).dataset?.mention
  );
}

/**
 * DOM -> plain text. Mention chips contribute their full label ("@Name"),
 * <br> contributes "\n". This replaces `el.innerText` everywhere: with chips
 * in the tree, innerText would return the chip's visible name without the
 * "@" and drift from the plain-text value.
 */
function serializeEditor(root: Node): string {
  let out = "";
  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        out += child.textContent ?? "";
      } else if (child.nodeName === "BR") {
        out += "\n";
      } else if (isChip(child)) {
        out += child.dataset.mention ?? "";
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child);
      }
    }
  };
  walk(root);
  return out;
}

/** Plain-text length a node contributes (chips = label length, BR = 1). */
function nodeLength(node: Node): number {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent?.length ?? 0;
  if (node.nodeName === "BR") return 1;
  if (isChip(node)) return node.dataset.mention?.length ?? 0;
  let len = 0;
  for (const child of Array.from(node.childNodes)) len += nodeLength(child);
  return len;
}

/** Plain-text offset at which `target` (e.g. a chip element) starts. */
function getNodeStartOffset(root: Node, target: Node): number {
  let offset = 0;
  const walk = (node: Node): boolean => {
    for (const child of Array.from(node.childNodes)) {
      if (child === target) return true;
      if (
        child.nodeType === Node.ELEMENT_NODE &&
        !isChip(child) &&
        child.contains(target)
      ) {
        return walk(child);
      }
      offset += nodeLength(child);
    }
    return false;
  };
  walk(root);
  return offset;
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
        offset += nodeLength(child);
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
        if (isChip(child)) {
          // A selection boundary inside an atomic chip counts as after it.
          if (child.contains(anchorNode)) {
            offset += nodeLength(child);
            return true;
          }
          offset += nodeLength(child);
          continue;
        }
        if (child.contains(anchorNode)) {
          return countBefore(child);
        }
        offset += nodeLength(child);
      }
      return false;
    }

    countBefore(el);
    return offset;
  } catch (e) {
    console.debug("getCaretOffset: DOM/selection changed during read", e);
    return 0;
  }
}

function setCaretOffset(el: HTMLElement, offset: number) {
  try {
    let remaining = offset;

    function placeAt(node: Node, nodeOffset: number): void {
      const sel = window.getSelection();
      const range = document.createRange();
      range.setStart(node, nodeOffset);
      range.collapse(true);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }

    function findPosition(parent: Node): boolean {
      for (let i = 0; i < parent.childNodes.length; i++) {
        const child = parent.childNodes[i];
        if (child.nodeType === Node.TEXT_NODE) {
          const len = child.textContent?.length ?? 0;
          if (remaining <= len) {
            placeAt(child, remaining);
            return true;
          }
          remaining -= len;
        } else if (child.nodeName === "BR") {
          if (remaining === 0) {
            placeAt(parent, i);
            return true;
          }
          remaining -= 1;
        } else if (isChip(child)) {
          // Atomic: land before the chip at 0, snap after it otherwise —
          // the caret must never end up inside the chip.
          const len = nodeLength(child);
          if (remaining <= 0) {
            placeAt(parent, i);
            return true;
          }
          if (remaining < len) {
            placeAt(parent, i + 1);
            return true;
          }
          remaining -= len;
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
  } catch (e) {
    console.debug("setCaretOffset: DOM changed during caret restore", e);
  }
}

/**
 * Scroll the contentEditable so the caret is visible.
 * Uses a zero-width space span to get a measurable rect on empty lines.
 */
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

    // Remove temp node and restore caret after it
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
  } catch (e) {
    console.debug("scrollCaretIntoView: DOM changed during measurement", e);
  }
}

// ---------------------------------------------------------------------------
// Mention Dropdown
// ---------------------------------------------------------------------------

const DROPDOWN_MARGIN = 8;

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
  /** Viewport-space caret coordinates (the "@" trigger). */
  position: { left: number; caretTop: number; caretBottom: number };
}) {
  const listRef = useRef<HTMLDivElement>(null);
  // Body-portaled with `position: fixed` so the panel never contributes
  // scrollable overflow to an ancestor — absolutely positioned inside the
  // editor wrapper it widened the fullscreen modal's scroll area, and the
  // browser's caret auto-scroll then dragged the whole prompt sideways.
  // Opens above the caret by default, flipped below when space is short.
  const [placement, setPlacement] = useState<{
    left: number;
    top: number;
  } | null>(null);

  useLayoutEffect(() => {
    const panel = listRef.current;
    if (!panel) return;

    const panelWidth = panel.offsetWidth;
    const panelHeight = panel.offsetHeight;

    const left = Math.max(
      DROPDOWN_MARGIN,
      Math.min(position.left, window.innerWidth - panelWidth - DROPDOWN_MARGIN),
    );

    const spaceAbove = position.caretTop - DROPDOWN_MARGIN;
    const spaceBelow =
      window.innerHeight - position.caretBottom - DROPDOWN_MARGIN;

    let top: number;
    if (panelHeight > spaceAbove && spaceBelow > spaceAbove) {
      top = position.caretBottom + 4;
    } else {
      top = Math.max(DROPDOWN_MARGIN, position.caretTop - panelHeight - 4);
    }

    setPlacement({ left, top });
  }, [position, items]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const activeItem = list.children[1]?.children[activeIndex] as HTMLElement;
    activeItem?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return createPortal(
    <div
      ref={listRef}
      className="fixed z-[9999] w-64 max-w-[calc(100vw-2rem)] max-h-72 overflow-y-auto rounded-lg border border-white/10 bg-ui-controls shadow-lg backdrop-blur-xl"
      style={
        placement
          ? { left: placement.left, top: placement.top }
          : {
              left: position.left,
              top: position.caretBottom + 4,
              visibility: "hidden",
            }
      }
    >
      <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-base-fg/50">
        References
      </div>
      <div>
        {items.map((item, i) => (
          <button
            key={item.token ?? `${item.label}-${i}`}
            type="button"
            className={twMerge(
              "flex w-full items-center gap-2.5 px-3 py-2 text-sm text-base-fg transition-colors cursor-pointer",
              i === activeIndex ? "bg-white/10" : "hover:bg-white/5",
            )}
            onPointerDown={(e) => {
              // pointerdown (not click) keeps the editor focused, and works
              // for both mouse and touch — the old mousedown-only handler
              // made taps unreliable on mobile.
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
    </div>,
    document.body,
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
      style,
      onKeyDown: externalOnKeyDown,
      onFocus,
      onBlur,
      disabled,
      colorMap,
      enterToGenerate: enterToGenerateProp,
      onMentionSelect,
      selectedTokens,
    },
    ref,
  ) {
    const editorRef = useRef<HTMLDivElement>(null);
    useImperativeHandle(ref, () => editorRef.current!, []);
    const isInternalUpdate = useRef(false);
    const isComposing = useRef(false);
    const pendingCaret = useRef<number | null>(null);
    const enterToGenerateStore = useEnterToGenerateStore((s) => s.enabled);
    const enterToGenerate = enterToGenerateProp ?? enterToGenerateStore;

    const [mentionState, setMentionState] = useState<MentionState>({
      isOpen: false,
      triggerIndex: -1,
      query: "",
      activeIndex: 0,
    });

    // Viewport-space pixel position of the @ trigger (the dropdown is
    // body-portaled with fixed positioning).
    const [dropdownPos, setDropdownPos] = useState<{
      left: number;
      caretTop: number;
      caretBottom: number;
    }>({ left: 0, caretTop: 0, caretBottom: 0 });

    const [chipMenu, setChipMenu] = useState<ChipMenuState | null>(null);
    const [previewItem, setPreviewItem] = useState<MentionItem | null>(null);

    const filteredItems = useMemo(() => {
      if (!mentionState.isOpen) return [];
      return mentionItems.filter((item) =>
        mentionState.query
          ? item.label.toLowerCase().includes(mentionState.query.toLowerCase())
          : true,
      );
    }, [mentionItems, mentionState.isOpen, mentionState.query]);

    // Build a regex that matches any known mention label (supports spaces in names)
    // Sort longest-first so "@Pumpkin Head" matches before "@Pumpkin".
    // Case-insensitive so users can type "@image1" and still get it tagged
    // when the canonical label is "@Image1".
    const mentionRegex = useMemo(() => {
      const labels = mentionItems.map((item) => item.label);
      if (labels.length === 0) return null;
      const sorted = [...labels].sort((a, b) => b.length - a.length);
      const pattern = sorted.map((l) => escapeRegex(l)).join("|");
      return new RegExp(`(${pattern})`, "gi");
    }, [mentionItems]);

    // Case-insensitive lookup table for colorMap so "@image1" finds "@Image1".
    const lowerColorMap = useMemo(() => {
      const m: Record<string, string> = {};
      for (const [k, v] of Object.entries(colorMap)) {
        m[k.toLowerCase()] = v;
      }
      return m;
    }, [colorMap]);

    // Lowercased label -> items sharing that label (duplicate names possible).
    const itemsByLabel = useMemo(() => {
      const m = new Map<string, MentionItem[]>();
      for (const item of mentionItems) {
        const key = item.label.toLowerCase();
        const arr = m.get(key);
        if (arr) arr.push(item);
        else m.set(key, [item]);
      }
      return m;
    }, [mentionItems]);

    // Lowercased labels that render as atomic chips (characters only).
    const chipLabels = useMemo(() => {
      const s = new Set<string>();
      for (const item of mentionItems) {
        if (item.type === "character") s.add(item.label.toLowerCase());
      }
      return s;
    }, [mentionItems]);

    /** The item a matched label resolves to (honoring the host's token picks). */
    const resolveItem = useCallback(
      (label: string): MentionItem | undefined => {
        const candidates = itemsByLabel.get(label.toLowerCase());
        if (!candidates?.length) return undefined;
        const name = candidates[0].label.replace(/^@/, "");
        const wantedToken = selectedTokens?.[name];
        if (wantedToken) {
          const picked = candidates.find((c) => c.token === wantedToken);
          if (picked) return picked;
        }
        return candidates[0];
      },
      [itemsByLabel, selectedTokens],
    );

    /**
     * Markup for one atomic character chip. data-mention keeps the exact
     * typed text so serialization is lossless; the visible chip shows the
     * name without the "@".
     */
    const buildChipHTML = useCallback(
      (item: MentionItem, matchText: string): string => {
        const color = lowerColorMap[matchText.toLowerCase()];
        const colorStyle = color ? ` style="color:${color}"` : "";
        return (
          `<span contenteditable="false" draggable="false"` +
          ` data-mention="${escapeHTML(matchText)}"` +
          (item.token ? ` data-token="${escapeHTML(item.token)}"` : "") +
          ` class="${CHIP_CLASS}">` +
          (item.preview
            ? `<img src="${escapeHTML(item.preview)}" alt="" draggable="false" class="${CHIP_IMG_CLASS}">`
            : `<span class="${CHIP_NAME_CLASS}"${colorStyle}>@</span>`) +
          `<span class="${CHIP_NAME_CLASS}"${colorStyle}>${escapeHTML(matchText.slice(1))}</span>` +
          `</span>`
        );
      },
      [lowerColorMap],
    );

    // Build innerHTML with mentions inline: character mentions render as
    // atomic thumbnail chips, other reference types as colored text.
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
          const color = lowerColorMap[fullMatch.toLowerCase()];
          const item = resolveItem(fullMatch);

          if (match.index > lastIndex) {
            html += escapeHTML(text.slice(lastIndex, match.index));
          }

          if (item?.type === "character") {
            html += buildChipHTML(item, fullMatch);
          } else if (color) {
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

        return normalizeHTML(html);
      },
      [lowerColorMap, mentionRegex, resolveItem, buildChipHTML],
    );

    // Sync DOM when value changes from parent (not from user input)
    useEffect(() => {
      if (isInternalUpdate.current) {
        isInternalUpdate.current = false;
        return;
      }

      const el = editorRef.current;
      if (!el) return;

      // This effect re-runs whenever `buildHTML`'s identity changes (the parent
      // recomputing `colorMap`/`mentionItems`), not only when `value` genuinely
      // changes from outside. If the DOM already shows this exact text while the
      // user is focused, skip the innerHTML rewrite entirely: reassigning
      // innerHTML under a live caret detaches it on iOS Safari, which makes the
      // cursor disappear mid-typing. A pending caret (mention insert) must still
      // resync, and an unfocused editor is safe to recolor.
      if (pendingCaret.current === null && document.activeElement === el) {
        let domText = serializeEditor(el);
        if (domText.endsWith("\n")) domText = domText.slice(0, -1);
        if (domText === value) return;
      }

      // Don't rewrite innerHTML while the user has text selected
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
      } catch (e) {
        console.debug(
          "MentionTextarea sync: DOM changed during caret restore",
          e,
        );
        el.innerHTML = buildHTML(value);
      }
    }, [value, buildHTML]);

    // Get pixel coordinates of a text offset relative to the wrapper
    const getOffsetRect = useCallback((charOffset: number) => {
      try {
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
        setCaretOffset(el, saved);

        return {
          left: rect.left,
          caretTop: rect.top,
          caretBottom: rect.bottom,
        };
      } catch (e) {
        console.debug("getOffsetRect: DOM changed during measurement", e);
        return null;
      }
    }, []);

    // Detect @mention trigger from cursor position
    // Supports multi-word names by scanning back to the nearest @.
    // A valid trigger requires the char before @ to not be an ASCII
    // identifier char (letter/digit/underscore) — this lets CJK characters,
    // quotes, and punctuation all count as word boundaries, so users can
    // type "@Image1" directly after Chinese text like 从@Image1.
    const detectMention = useCallback(
      (text: string, cursorPos: number) => {
        // Find the last @ before cursor
        const textBefore = text.slice(0, cursorPos);
        const lastAt = textBefore.lastIndexOf("@");
        if (
          lastAt !== -1 &&
          (lastAt === 0 || !/[A-Za-z0-9_]/.test(text[lastAt - 1]))
        ) {
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
      },
      [getOffsetRect],
    );

    // The dropdown is body-portaled with fixed positioning, so a scroll or
    // resize while it's open would leave it floating where the caret used to
    // be — re-measure the trigger's viewport position on those events.
    useEffect(() => {
      if (!mentionState.isOpen) return;
      let raf = 0;
      const reposition = () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const pos = getOffsetRect(mentionState.triggerIndex);
          if (pos) setDropdownPos(pos);
        });
      };
      window.addEventListener("scroll", reposition, true);
      window.addEventListener("resize", reposition);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("scroll", reposition, true);
        window.removeEventListener("resize", reposition);
      };
    }, [mentionState.isOpen, mentionState.triggerIndex, getOffsetRect]);

    // Extract text and re-render with mention styling
    const handleInput = useCallback(() => {
      if (isComposing.current) return;
      const el = editorRef.current;
      if (!el) return;

      try {
        let text = serializeEditor(el);
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
      } catch (e) {
        console.debug("handleInput: DOM changed during input processing", e);
        const text = serializeEditor(el).replace(/\n$/, "");
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
        const queryEnd = mentionState.triggerIndex + mentionState.query.length;
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
        onMentionSelect?.(item);

        requestAnimationFrame(() => {
          el.focus();
        });
      },
      [
        value,
        mentionState.triggerIndex,
        mentionState.query,
        onChange,
        onMentionSelect,
      ],
    );

    // ------------------------------------------------------------------
    // Chip menu (Replace / Preview / Remove)
    // ------------------------------------------------------------------

    const closeChipMenu = useCallback(() => setChipMenu(null), []);

    /** Re-locate the chip's label in the current value; -1 when it's gone. */
    const chipStart = useCallback(
      (menu: ChipMenuState): number => {
        if (
          value.slice(menu.start, menu.start + menu.label.length) === menu.label
        ) {
          return menu.start;
        }
        return value.indexOf(menu.label);
      },
      [value],
    );

    /**
     * Select the chip element (plus its trailing space for removals) so the
     * follow-up execCommand edit lands on the browser's undo stack — Ctrl+Z
     * then restores the chip exactly like undoing deleted text. Returns false
     * when the chip element is no longer in the editor (DOM was rebuilt).
     */
    const selectChipRange = useCallback(
      (menu: ChipMenuState, includeTrailingSpace: boolean): boolean => {
        const el = editorRef.current;
        const chip = menu.node;
        if (!el || !chip || !el.contains(chip)) return false;
        el.focus();
        const range = document.createRange();
        range.setStartBefore(chip);
        const next = chip.nextSibling;
        if (
          includeTrailingSpace &&
          next?.nodeType === Node.TEXT_NODE &&
          next.textContent?.startsWith(" ")
        ) {
          range.setEnd(next, 1);
        } else {
          range.setEndAfter(chip);
        }
        const sel = window.getSelection();
        if (!sel) return false;
        sel.removeAllRanges();
        sel.addRange(range);
        return true;
      },
      [],
    );

    const handleChipReplace = useCallback(
      (next: MentionItem) => {
        if (!chipMenu) return;
        setChipMenu(null);
        if (selectChipRange(chipMenu, false)) {
          document.execCommand(
            "insertHTML",
            false,
            buildChipHTML(next, next.label),
          );
          handleInput();
        } else {
          // Chip element detached (DOM rebuilt) — splice the value instead.
          const start = chipStart(chipMenu);
          if (start === -1) return;
          const newValue =
            value.slice(0, start) +
            next.label +
            value.slice(start + chipMenu.label.length);
          pendingCaret.current = start + next.label.length;
          onChange(newValue);
        }
        onMentionSelect?.(next);
      },
      [
        chipMenu,
        selectChipRange,
        buildChipHTML,
        handleInput,
        chipStart,
        value,
        onChange,
        onMentionSelect,
      ],
    );

    const handleChipRemove = useCallback(() => {
      if (!chipMenu) return;
      setChipMenu(null);
      if (selectChipRange(chipMenu, true)) {
        document.execCommand("delete");
        handleInput();
      } else {
        const start = chipStart(chipMenu);
        if (start === -1) return;
        let end = start + chipMenu.label.length;
        if (value[end] === " ") end += 1;
        pendingCaret.current = start;
        onChange(value.slice(0, start) + value.slice(end));
      }
    }, [chipMenu, selectChipRange, handleInput, chipStart, value, onChange]);

    const handleChipPreview = useCallback(() => {
      if (!chipMenu) return;
      const item =
        (chipMenu.token &&
          mentionItems.find(
            (i) => i.type === "character" && i.token === chipMenu.token,
          )) ||
        resolveItem(chipMenu.label);
      setChipMenu(null);
      if (item) setPreviewItem(item);
    }, [chipMenu, mentionItems, resolveItem]);

    const chipMenuItem = useMemo(() => {
      if (!chipMenu) return undefined;
      return (
        (chipMenu.token &&
          mentionItems.find(
            (i) => i.type === "character" && i.token === chipMenu.token,
          )) ||
        resolveItem(chipMenu.label)
      );
    }, [chipMenu, mentionItems, resolveItem]);

    const replaceItems = useMemo(() => {
      if (!chipMenu) return [];
      return mentionItems.filter(
        (i) =>
          i.type === "character" &&
          (chipMenu.token
            ? i.token !== chipMenu.token
            : i.label.toLowerCase() !== chipMenu.label.toLowerCase()),
      );
    }, [chipMenu, mentionItems]);

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

        // Atomic chip deletion: native contenteditable=false removal is
        // inconsistent across browsers (Safari especially), so when the caret
        // sits at a character-mention boundary, delete the whole label from
        // the plain-text value in one keypress.
        if (
          (e.key === "Backspace" || e.key === "Delete") &&
          chipLabels.size > 0 &&
          mentionRegex
        ) {
          const el = editorRef.current;
          const sel = window.getSelection();
          if (el && sel?.isCollapsed) {
            const caret = getCaretOffset(el);
            const regex = new RegExp(mentionRegex);
            let match: RegExpExecArray | null;
            // biome-ignore lint/suspicious/noAssignInExpressions: --
            while ((match = regex.exec(value)) !== null) {
              if (!chipLabels.has(match[0].toLowerCase())) continue;
              const start = match.index;
              const end = start + match[0].length;
              if (
                (e.key === "Backspace" && end === caret) ||
                (e.key === "Delete" && start === caret)
              ) {
                e.preventDefault();
                // Delete the chip element through the browser's edit command
                // so the removal lands on the undo stack (Ctrl+Z restores it).
                const chip = Array.from(
                  el.querySelectorAll<HTMLElement>("[data-mention]"),
                ).find((c) => getNodeStartOffset(el, c) === start);
                if (chip) {
                  const range = document.createRange();
                  range.setStartBefore(chip);
                  range.setEndAfter(chip);
                  sel.removeAllRanges();
                  sel.addRange(range);
                  document.execCommand("delete");
                  handleInput();
                } else {
                  pendingCaret.current = start;
                  onChange(value.slice(0, start) + value.slice(end));
                }
                return;
              }
              if (start > caret) break;
            }
          }
        }

        // Insert a newline instead of letting the contentEditable create a <div>.
        // When `enterToGenerate` is off (default), all Enter combos insert a newline
        // (only the button submits). When the user opts into Enter-to-generate,
        // Shift/Cmd+Enter inserts a newline and plain Enter submits.
        if (e.key === "Enter") {
          const newlineCombo = !enterToGenerate || e.shiftKey || e.metaKey;
          if (newlineCombo) {
            e.preventDefault();
            document.execCommand("insertLineBreak");
            handleInput();
            // Scroll caret into view (textarea does this automatically, contentEditable does not)
            scrollCaretIntoView(editorRef.current!);
            return;
          }
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
        enterToGenerate,
        chipLabels,
        mentionRegex,
        value,
        onChange,
      ],
    );

    const handleMouseDown = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        // Clicking a chip must not move the caret into/around it.
        const target = e.target as HTMLElement;
        if (target.closest?.("[data-mention]")) {
          e.preventDefault();
        }
      },
      [],
    );

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        const el = editorRef.current;
        if (!el) return;

        const target = e.target as HTMLElement;
        const chip = target.closest?.("[data-mention]") as HTMLElement | null;
        if (chip && el.contains(chip)) {
          const label = chip.dataset.mention ?? "";
          setMentionState((prev) =>
            prev.isOpen ? { ...prev, isOpen: false } : prev,
          );
          setChipMenu({
            label,
            token: chip.dataset.token,
            start: getNodeStartOffset(el, chip),
            rect: chip.getBoundingClientRect(),
            node: chip,
          });
          return;
        }

        const sel = window.getSelection();
        if (sel && !sel.isCollapsed) return; // preserve text selection
        detectMention(value, getCaretOffset(el));
      },
      [value, detectMention],
    );

    const handlePaste = useCallback(
      (e: React.ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain");
        document.execCommand("insertText", false, text);
      },
      [],
    );

    // Copy/cut must yield plain text with mention labels intact ("@Name"),
    // never chip HTML or thumbnail URLs.
    const handleCopy = useCallback(
      (e: React.ClipboardEvent<HTMLDivElement>) => {
        const sel = window.getSelection();
        if (!sel?.rangeCount || sel.isCollapsed) return;
        const holder = document.createElement("div");
        holder.appendChild(sel.getRangeAt(0).cloneContents());
        e.clipboardData.setData("text/plain", serializeEditor(holder));
        e.preventDefault();
      },
      [],
    );

    const handleCut = useCallback(
      (e: React.ClipboardEvent<HTMLDivElement>) => {
        const sel = window.getSelection();
        if (!sel?.rangeCount || sel.isCollapsed) return;
        handleCopy(e);
        document.execCommand("delete");
        handleInput();
      },
      [handleCopy, handleInput],
    );

    return (
      <div className="relative flex-1 min-w-0 pb-[7px]">
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
          onMouseDown={handleMouseDown}
          onClick={handleClick}
          onPaste={handlePaste}
          onCopy={handleCopy}
          onCut={handleCut}
          onFocus={onFocus}
          onBlur={onBlur}
          style={style}
          className={twMerge(
            className,
            "outline-none whitespace-pre-wrap [overflow-wrap:anywhere] overflow-y-auto",
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

        {chipMenu && (
          <MentionChipMenu
            anchorRect={chipMenu.rect}
            currentLabel={chipMenu.label}
            currentPreview={chipMenuItem ? chipMenuItem.preview : undefined}
            replaceItems={replaceItems}
            onReplace={handleChipReplace}
            onPreview={handleChipPreview}
            onRemove={handleChipRemove}
            onClose={closeChipMenu}
          />
        )}

        <DeckPreviewModal
          item={
            previewItem
              ? {
                  id: previewItem.token ?? previewItem.label,
                  kind: "image",
                  url: previewItem.fullPreview ?? previewItem.preview,
                  name: previewItem.label.replace(/^@/, ""),
                }
              : null
          }
          onClose={() => setPreviewItem(null)}
        />
      </div>
    );
  },
);
