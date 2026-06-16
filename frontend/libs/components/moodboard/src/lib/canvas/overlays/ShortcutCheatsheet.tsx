import { SHORTCUTS, ShortcutRow } from "./shortcuts";

interface Props {
  visible: boolean;
}

const SECTION_ORDER: ShortcutRow["section"][] = [
  "Tools",
  "Selection",
  "Editing",
  "Viewport",
  "History",
];

// Translucent, non-interactive overlay that lists all keyboard shortcuts.
// Shown while the user holds Ctrl/Cmd alone for 3 s (see
// `useShortcutCheatsheet.ts`). `pointer-events: none` so it never steals
// focus — the user can keep panning / zooming / typing while it's visible.
export const ShortcutCheatsheet = ({ visible }: Props) => {
  if (!visible) return null;

  // Group rows by section, preserving declaration order within each.
  const bySection = new Map<ShortcutRow["section"], ShortcutRow[]>();
  for (const row of SHORTCUTS) {
    const arr = bySection.get(row.section) ?? [];
    arr.push(row);
    bySection.set(row.section, arr);
  }

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
    >
      <div className="max-h-[80%] w-[min(640px,90%)] overflow-auto rounded-xl border border-white/15 bg-black/70 p-6 text-white/90 shadow-2xl backdrop-blur-sm">
        <div className="mb-3 text-xs uppercase tracking-widest text-white/50">
          Keyboard shortcuts
        </div>
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
          {SECTION_ORDER.map((section) => {
            const rows = bySection.get(section);
            if (!rows) return null;
            return (
              <div key={section}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/60">
                  {section}
                </div>
                <ul className="flex flex-col gap-1.5">
                  {rows.map((row) => (
                    <li
                      key={row.label}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="text-white/80">{row.label}</span>
                      <span className="flex items-center gap-1">
                        {row.keys.map((k, i) => (
                          <Key key={`${row.label}-${i}`} label={k} />
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const Key = ({ label }: { label: string }) => (
  <kbd className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-white/90">
    {label}
  </kbd>
);
