import { useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";
import { useKeybindsStore } from "../keybinds-store";
import { useResolvedKeybinds } from "../useResolvedKeybinds";
import { ACTIONS, ACTIONS_BY_SURFACE } from "../registry";
import { PRESETS } from "../presets";
import { bindingsEqual } from "../matcher";
import { ActionDef, ActionId, Binding, PresetId, Surface } from "../types";
import { KbdBindings } from "../components/Kbd";
import { KeybindCaptureInput } from "../components/KeybindCaptureInput";

const PRESET_ORDER: PresetId[] = ["gamer", "blender"];

const SURFACE_TITLES: Record<Surface, string> = {
  pagescene: "3D Editor",
  pagedraw: "2D Editor",
  moodboard: "Moodboard",
};

interface PendingConflict {
  id: ActionId;
  binding: Binding;
  conflicts: ActionId[];
}

// The shared body of the Settings → Keybinds section. Rendered identically in
// the desktop and web settings shells. Dependency-free (no @storyteller/ui-*),
// styled with the app's tailwind tokens.
export function KeybindsSettings({
  onOpenVideoEditorShortcuts,
}: {
  onOpenVideoEditorShortcuts?: () => void;
}) {
  const selectedPreset = useKeybindsStore((s) => s.selectedPreset);
  const overrides = useKeybindsStore((s) => s.overrides);
  const setPreset = useKeybindsStore((s) => s.setPreset);
  const setBinding = useKeybindsStore((s) => s.setBinding);
  const resetAction = useKeybindsStore((s) => s.resetAction);
  const resetAll = useKeybindsStore((s) => s.resetAll);
  const findConflicts = useKeybindsStore((s) => s.findConflicts);
  const { forAction } = useResolvedKeybinds();

  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<PendingConflict | null>(null);

  const surfaces = useMemo(
    () =>
      (Object.keys(SURFACE_TITLES) as Surface[]).filter(
        (s) => ACTIONS_BY_SURFACE[s].length > 0,
      ),
    [],
  );

  const matches = (a: ActionDef) =>
    !search || a.label.toLowerCase().includes(search.toLowerCase());

  const applyBinding = (id: ActionId, binding: Binding) =>
    setBinding(id, [binding]);

  const handleCapture = (id: ActionId, binding: Binding) => {
    const conflicts = findConflicts(id, binding);
    if (conflicts.length) {
      setPending({ id, binding, conflicts });
    } else {
      applyBinding(id, binding);
    }
  };

  const confirmRebind = () => {
    if (!pending) return;
    // Take the key from the conflicting actions, then assign it here.
    for (const other of pending.conflicts) {
      const remaining = forAction(other).filter(
        (b) => !bindingsEqual(b, pending.binding),
      );
      setBinding(other, remaining);
    }
    applyBinding(pending.id, pending.binding);
    setPending(null);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Preset selector */}
      <section>
        <SectionHeading
          title="Preset"
          subtitle="A starting scheme for the 3D viewport. Your individual changes are kept on top."
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PRESET_ORDER.map((id) => (
            <PresetCard
              key={id}
              preset={id}
              selected={selectedPreset === id}
              onSelect={() => setPreset(id)}
            />
          ))}
        </div>
      </section>

      {/* Conflict alert */}
      {pending && (
        <div
          role="alert"
          className="flex flex-col gap-2 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm"
        >
          <span>
            <KbdBindings bindings={[pending.binding]} /> is already used by{" "}
            <strong>
              {pending.conflicts.map((c) => ACTIONS[c]?.label).join(", ")}
            </strong>
            .
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirmRebind}
              className="rounded-md bg-red px-3 py-1 text-sm font-medium text-white hover:bg-red/80"
            >
              Rebind anyway
            </button>
            <button
              type="button"
              onClick={() => setPending(null)}
              className="rounded-md bg-ui-controls px-3 py-1 text-sm hover:bg-ui-controls/80"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search + global reset */}
      <div className="flex items-center gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search shortcuts…"
          className="h-9 grow rounded-md border border-ui-controls-border bg-ui-controls px-3 text-sm text-base-fg placeholder:text-base-fg/40 focus:border-primary/80 focus:outline-none"
        />
        <button
          type="button"
          onClick={resetAll}
          className="h-9 shrink-0 rounded-md bg-ui-controls px-3 text-sm hover:bg-ui-controls/80"
        >
          Reset all
        </button>
      </div>

      {/* Action list, grouped by surface → group */}
      {surfaces.map((surface) => {
        const actions = ACTIONS_BY_SURFACE[surface].filter(matches);
        if (!actions.length) return null;
        return (
          <section key={surface}>
            <SectionHeading title={SURFACE_TITLES[surface]} />
            <div className="flex flex-col divide-y divide-white/5">
              {actions.map((action) => (
                <ActionRow
                  key={action.id}
                  action={action}
                  bindings={forAction(action.id)}
                  overridden={!!overrides[action.id]}
                  onCapture={(b) => handleCapture(action.id, b)}
                  onReset={() => resetAction(action.id)}
                />
              ))}
            </div>
          </section>
        );
      })}

      {/* Video editor lives in its own customizer */}
      <section className="rounded-lg border border-ui-controls-border bg-ui-controls/30 p-3 text-sm text-base-fg/70">
        Video editor shortcuts are managed in the video editor itself
        {onOpenVideoEditorShortcuts ? (
          <>
            {" — "}
            <button
              type="button"
              onClick={onOpenVideoEditorShortcuts}
              className="text-primary underline-offset-2 hover:underline"
            >
              open shortcut settings
            </button>
            .
          </>
        ) : (
          " (Video editor → Settings → Shortcuts)."
        )}
      </section>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function PresetCard({
  preset,
  selected,
  onSelect,
}: {
  preset: PresetId;
  selected: boolean;
  onSelect: () => void;
}) {
  const def = PRESETS[preset];
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={twMerge(
        "flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors",
        selected
          ? "border-primary/80 bg-primary/10"
          : "border-ui-controls-border bg-ui-controls hover:bg-ui-controls/80",
      )}
    >
      <span className="text-sm font-semibold text-base-fg">{def.label}</span>
      <span className="text-[13px] text-base-fg/60">{def.description}</span>
    </button>
  );
}

function ActionRow({
  action,
  bindings,
  overridden,
  onCapture,
  onReset,
}: {
  action: ActionDef;
  bindings: Binding[];
  overridden: boolean;
  onCapture: (binding: Binding) => void;
  onReset: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="grow text-sm text-base-fg/90">{action.label}</span>
      {overridden && (
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-base-fg/50 hover:text-base-fg"
          title="Reset to preset default"
        >
          Reset
        </button>
      )}
      <KeybindCaptureInput bindings={bindings} onCapture={onCapture} />
    </div>
  );
}

function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-2">
      <h3 className="text-sm font-semibold text-base-fg">{title}</h3>
      {subtitle && <p className="text-[13px] text-base-fg/60">{subtitle}</p>}
    </div>
  );
}
