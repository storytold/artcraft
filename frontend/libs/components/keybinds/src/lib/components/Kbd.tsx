import { Binding } from "../types";
import { formatBindingTokens } from "../format";

// A single key-cap cluster, e.g. ⌘ ⇧ Z. The app lacked any <kbd> primitive;
// this is the shared one used by the cheatsheet and settings rows.
export function Kbd({ binding }: { binding: Binding }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {formatBindingTokens(binding).map((token, i) => (
        <kbd
          key={i}
          className="inline-flex min-w-[1.4em] items-center justify-center rounded border border-white/15 bg-white/10 px-1.5 py-0.5 text-[11px] font-medium leading-none text-base-fg/90"
        >
          {token}
        </kbd>
      ))}
    </span>
  );
}

// A list of alternative bindings for one action, e.g. "Del / ⌫". Renders a muted
// "Unbound" when empty.
export function KbdBindings({ bindings }: { bindings: Binding[] }) {
  if (!bindings.length) {
    return <span className="text-[11px] italic text-base-fg/40">Unbound</span>;
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      {bindings.map((b, i) => (
        <span key={i} className="inline-flex items-center gap-1.5">
          {i > 0 && <span className="text-[11px] text-base-fg/40">/</span>}
          <Kbd binding={b} />
        </span>
      ))}
    </span>
  );
}
