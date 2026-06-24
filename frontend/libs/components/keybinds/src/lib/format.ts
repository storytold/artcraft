import { Binding } from "./types";

// Human-readable rendering of a binding. macOS uses symbol glyphs (⌘⇧⌥);
// other platforms use word modifiers joined with "+".

const isMac =
  typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

// event.code → display token.
const CODE_LABELS: Record<string, string> = {
  Space: "Space",
  Escape: "Esc",
  Delete: "Del",
  Backspace: "⌫",
  Enter: "Enter",
  Tab: "Tab",
  Home: "Home",
  End: "End",
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  Backquote: "`",
  Backslash: "\\",
  Minus: "-",
  Equal: "=",
};

export function formatBindingTokens(binding: Binding): string[] {
  const tokens: string[] = [];
  if (binding.ctrl) tokens.push(isMac ? "⌘" : "Ctrl");
  if (binding.shift) tokens.push(isMac ? "⇧" : "Shift");
  if (binding.alt) tokens.push(isMac ? "⌥" : "Alt");
  tokens.push(codeLabel(binding.code));
  return tokens;
}

export function formatBinding(binding: Binding): string {
  return formatBindingTokens(binding).join(isMac ? "" : "+");
}

export function formatBindings(bindings: Binding[]): string {
  if (!bindings.length) return "Unbound";
  return bindings.map(formatBinding).join(" / ");
}

function codeLabel(code: string): string {
  if (CODE_LABELS[code]) return CODE_LABELS[code];
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  return code;
}
