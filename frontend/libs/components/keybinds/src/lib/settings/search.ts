import { formatBindingTokens } from "../format";
import { ActionDef, Binding, KeyGroup } from "../types";

// Free-text matching for the Keybinds settings search box. A query matches an
// action by NAME or by KEY: the haystack folds in the label, the group, every
// rendered glyph of each binding (⌘ ⇧ ↑ …), and cross-platform word synonyms
// (so "ctrl" matches a ⌘ binding on macOS, "option" matches Alt, etc.).

export function actionMatchesQuery(
  action: ActionDef,
  bindings: Binding[],
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = `${action.label} ${action.group} ${bindings
    .map(bindingSearchText)
    .join(" ")}`.toLowerCase();
  // A compact pass strips spaces/`+` so "ctrl+z" / "⇧d" match contiguously…
  const compactHay = haystack.replace(/[\s+]/g, "");
  const compactQ = q.replace(/[\s+]/g, "");
  if (compactQ && compactHay.includes(compactQ)) return true;
  // …otherwise every whitespace-separated term must appear ("camera up").
  return q
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

export function groupActions(
  actions: ActionDef[],
): { group: KeyGroup; actions: ActionDef[] }[] {
  const out: { group: KeyGroup; actions: ActionDef[] }[] = [];
  const index = new Map<KeyGroup, number>();
  for (const action of actions) {
    if (!index.has(action.group)) {
      index.set(action.group, out.length);
      out.push({ group: action.group, actions: [] });
    }
    out[index.get(action.group)!].actions.push(action);
  }
  return out;
}

function bindingSearchText(b: Binding): string {
  const parts: string[] = [];
  if (b.ctrl) parts.push("ctrl", "cmd", "command", "meta", "control");
  if (b.shift) parts.push("shift");
  if (b.alt) parts.push("alt", "option", "opt");
  parts.push(codeToWords(b.code));
  parts.push(...formatBindingTokens(b)); // displayed glyphs/words (⌘ ⇧ ↑ …)
  return parts.join(" ");
}

const CODE_SYNONYMS: Record<string, string> = {
  Space: "space spacebar",
  Escape: "esc escape",
  Delete: "del delete",
  Backspace: "backspace delete",
  Enter: "enter return",
  Tab: "tab",
  Home: "home",
  End: "end",
  ArrowUp: "up arrow",
  ArrowDown: "down arrow",
  ArrowLeft: "left arrow",
  ArrowRight: "right arrow",
  Backquote: "backtick grave tilde",
  Backslash: "backslash",
  Minus: "minus dash",
  Equal: "equal plus",
};

function codeToWords(code: string): string {
  const base = code.toLowerCase();
  if (CODE_SYNONYMS[code]) return `${base} ${CODE_SYNONYMS[code]}`;
  if (code.startsWith("Key")) return `${base} ${code.slice(3).toLowerCase()}`;
  if (code.startsWith("Digit")) return `${base} ${code.slice(5)}`;
  if (code.startsWith("Numpad")) {
    const n = code.slice(6).toLowerCase();
    return `${base} num${n} numpad ${n}`;
  }
  return base;
}
