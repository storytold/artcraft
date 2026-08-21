import { useMemo } from "react";
import { useResolvedKeybinds } from "../useResolvedKeybinds";
import { ACTIONS_BY_SURFACE } from "../registry";
import { KbdBindings } from "../components/Kbd";
import { ActionDef, KeyGroup, Surface } from "../types";

const GROUP_ORDER: KeyGroup[] = [
  "Camera",
  "Tools",
  "Transform",
  "Selection",
  "Edit",
  "View",
  "Timeline",
  "Record",
  "History",
];

// Translucent, non-interactive overlay listing a surface's important shortcuts,
// resolved live from the keybinds store (so it reflects the active preset and
// any overrides). Shown while the user holds Ctrl/Cmd alone for 3s. Render it
// inside a positioned (relative) container — it fills `inset-0`.
export function Cheatsheet({
  surface,
  visible,
}: {
  surface: Surface;
  visible: boolean;
}) {
  const { forAction, selectedPreset } = useResolvedKeybinds();

  const byGroup = useMemo(() => {
    const map = new Map<KeyGroup, ActionDef[]>();
    for (const a of ACTIONS_BY_SURFACE[surface]) {
      if (!a.important) continue;
      const arr = map.get(a.group) ?? [];
      arr.push(a);
      map.set(a.group, arr);
    }
    return map;
  }, [surface]);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
    >
      <div className="max-h-[80%] w-[min(680px,90%)] overflow-auto rounded-xl border border-white/15 bg-black/70 p-6 text-white/90 shadow-2xl backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs uppercase tracking-widest text-white/50">
            Keyboard shortcuts
          </span>
          <span className="text-xs capitalize text-white/40">
            {selectedPreset} preset
          </span>
        </div>
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
          {GROUP_ORDER.map((group) => {
            const rows = byGroup.get(group);
            if (!rows?.length) return null;
            return (
              <div key={group}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/60">
                  {group}
                </div>
                <ul className="flex flex-col gap-1.5">
                  {rows.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="text-white/80">{a.label}</span>
                      <KbdBindings bindings={forAction(a.id)} />
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
}
