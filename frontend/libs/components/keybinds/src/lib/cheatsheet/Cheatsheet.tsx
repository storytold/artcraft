import { useMemo } from "react";
import { twMerge } from "tailwind-merge";
import { useResolvedKeybinds } from "../useResolvedKeybinds";
import { useCheatsheetPin } from "./useCheatsheetVisibility";
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
  "Rating",
  "Navigation",
];

// Translucent overlay listing a surface's important shortcuts, resolved live
// from the keybinds store (so it reflects the active preset and any
// overrides). Shown while the user holds Ctrl/Cmd alone for 3s, or pinned
// open via useCheatsheetPin (then Esc / click outside dismisses; the panel
// becomes interactive so it can scroll). Render it inside a positioned
// (relative) container — it fills `inset-0`.
export function Cheatsheet({
  surface,
  visible,
}: {
  surface: Surface;
  visible: boolean;
}) {
  const { forAction, selectedPreset } = useResolvedKeybinds();
  const pinned = useCheatsheetPin((s) => s.pinned);

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
      aria-hidden={!pinned}
      className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
    >
      <div
        data-keybinds-cheatsheet
        className={twMerge(
          "max-h-[80%] w-[min(680px,90%)] overflow-auto rounded-none border border-white/15 bg-ui-panel/95 p-6 text-white/90",
          pinned && "pointer-events-auto",
        )}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white/60">
            Keyboard shortcuts
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/40">
            {selectedPreset} preset
          </span>
        </div>
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
          {GROUP_ORDER.map((group) => {
            const rows = byGroup.get(group);
            if (!rows?.length) return null;
            return (
              <div key={group}>
                <div className="mb-2 font-mono text-[11px] font-medium uppercase tracking-[0.13em] text-white/45">
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
        {pinned && (
          <div className="mt-5 border-t border-white/15 pt-3 text-center font-mono text-[11px] uppercase tracking-[0.12em] text-white/40">
            Press Esc or click outside to close
          </div>
        )}
      </div>
    </div>
  );
}
