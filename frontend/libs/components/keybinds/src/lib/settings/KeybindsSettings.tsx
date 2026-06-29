import { useEffect, useMemo, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { useKeybindsStore } from "../keybinds-store";
import { useResolvedKeybinds } from "../useResolvedKeybinds";
import { useKeybindCapture } from "../useKeybindCapture";
import { ACTIONS, ACTIONS_BY_SURFACE } from "../registry";
import { BASE_BINDINGS, PRESETS } from "../presets";
import { bindingsEqual } from "../matcher";
import { ActionDef, ActionId, Binding, PresetId, Surface } from "../types";
import { KbdBindings } from "../components/Kbd";
import { KeybindCaptureInput } from "../components/KeybindCaptureInput";
import { actionMatchesQuery, groupActions } from "./search";

// House spring — every transition in this panel rides the same curve so the
// motion reads as one system rather than a pile of defaults.
const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

type SearchMode = "name" | "key";

const PRESET_ORDER: PresetId[] = ["gamer", "blender"];

const SURFACE_TITLES: Record<Surface, string> = {
  pagescene: "3D Editor",
  pagedraw: "2D Editor",
  moodboard: "Moodboard",
};

const SURFACE_HINTS: Record<Surface, string> = {
  pagescene: "Viewport camera, transforms & selection",
  pagedraw: "Vector canvas editing",
  moodboard: "Figma-style board tools",
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

  const [searchMode, setSearchMode] = useState<SearchMode>("name");
  const [nameSearch, setNameSearch] = useState("");
  const [keyQuery, setKeyQuery] = useState<Binding | null>(null);
  const [listening, setListening] = useState(false); // key-mode capture armed
  const [pending, setPending] = useState<PendingConflict | null>(null);
  const [openSurfaces, setOpenSurfaces] = useState<Record<Surface, boolean>>({
    pagescene: true,
    pagedraw: false,
    moodboard: false,
  });

  // Key-mode search listens for a literal shortcut, since "⇧D" can't be typed.
  useKeybindCapture({
    active: listening,
    onCapture: (b) => {
      setKeyQuery(b);
      setListening(false);
    },
    onCancel: () => setListening(false),
  });

  const surfaces = useMemo(
    () =>
      (Object.keys(SURFACE_TITLES) as Surface[]).filter(
        (s) => ACTIONS_BY_SURFACE[s].length > 0,
      ),
    [],
  );

  const query = nameSearch.trim().toLowerCase();
  const searchActive = searchMode === "key" ? keyQuery !== null : query !== "";

  // Filter + group every surface in one pass, by name OR by captured key. The
  // `forAction` identity changes whenever a binding does, so results stay live.
  const filtered = useMemo(() => {
    const matchAction = (a: ActionDef) =>
      searchMode === "key"
        ? !keyQuery || forAction(a.id).some((b) => bindingsEqual(b, keyQuery))
        : actionMatchesQuery(a, forAction(a.id), query);
    return surfaces.map((surface) => {
      const actions = ACTIONS_BY_SURFACE[surface].filter(matchAction);
      return { surface, groups: groupActions(actions), count: actions.length };
    });
  }, [surfaces, searchMode, query, keyQuery, forAction]);

  const totalMatches = filtered.reduce((n, s) => n + s.count, 0);
  const overriddenCount = Object.keys(overrides).length;
  const allOpen = surfaces.every((s) => openSurfaces[s]);

  const switchMode = (mode: SearchMode) => {
    setSearchMode(mode);
    setListening(mode === "key" && !keyQuery); // auto-arm an empty key search
  };

  const clearKeyQuery = () => {
    setKeyQuery(null);
    setListening(true);
  };

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

  const toggleAll = () => {
    const next = !allOpen;
    setOpenSurfaces(
      surfaces.reduce(
        (acc, s) => ({ ...acc, [s]: next }),
        {} as Record<Surface, boolean>,
      ),
    );
  };

  return (
    <div className="flex flex-col gap-8">
      {/* ── Preset + layering explainer ────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <Eyebrow>Preset</Eyebrow>
        <PresetDropdown value={selectedPreset} onChange={setPreset} />
        <LayeringNote preset={selectedPreset} />
      </section>

      {/* ── Sticky control bar: search (name|key) + reset, conflict alert ──── */}
      <div className="sticky top-0 z-10 -mt-2 flex flex-col gap-3 border-b border-white/[0.06] bg-ui-modal/80 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-1.5 rounded-2xl bg-white/[0.04] p-1.5 ring-1 ring-white/[0.06]">
          <ModeToggle mode={searchMode} onChange={switchMode} />
          {searchMode === "name" ? (
            <NameSearchField value={nameSearch} onChange={setNameSearch} />
          ) : (
            <KeySearchField
              binding={keyQuery}
              listening={listening}
              onArm={() => setListening(true)}
              onClear={clearKeyQuery}
            />
          )}
          <button
            type="button"
            onClick={resetAll}
            disabled={overriddenCount === 0}
            className={twMerge(
              "h-10 shrink-0 rounded-[0.625rem] px-4 text-[13px] font-medium text-base-fg/70 transition-all hover:bg-white/[0.05] hover:text-base-fg active:scale-[0.97] disabled:pointer-events-none disabled:opacity-30",
              EASE,
            )}
          >
            Reset all
          </button>
        </div>

        {pending && (
          <ConflictAlert
            pending={pending}
            onConfirm={confirmRebind}
            onCancel={() => setPending(null)}
          />
        )}
      </div>

      {/* ── Meta row: counts + expand/collapse ─────────────────────────────── */}
      <div className="-my-2 flex items-center justify-between px-1 text-xs tracking-wide text-base-fg/40">
        <span className="tabular-nums">
          {searchActive
            ? `${totalMatches} ${totalMatches === 1 ? "match" : "matches"}`
            : overriddenCount > 0
              ? `${overriddenCount} customized`
              : "Default bindings"}
        </span>
        {!searchActive && (
          <button
            type="button"
            onClick={toggleAll}
            className="font-medium text-base-fg/50 transition-colors hover:text-base-fg/80"
          >
            {allOpen ? "Collapse all" : "Expand all"}
          </button>
        )}
      </div>

      {/* ── Action list, collapsible per surface → grouped ─────────────────── */}
      {searchActive && totalMatches === 0 ? (
        <EmptyState mode={searchMode} query={nameSearch} binding={keyQuery} />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(({ surface, groups, count }) => {
            if (searchActive && count === 0) return null;
            const locked = searchActive; // search forces matched surfaces open
            const open = locked ? true : openSurfaces[surface];
            return (
              <CollapsibleSurface
                key={surface}
                title={SURFACE_TITLES[surface]}
                hint={SURFACE_HINTS[surface]}
                count={count}
                open={open}
                locked={locked}
                onToggle={() =>
                  setOpenSurfaces((s) => ({ ...s, [surface]: !s[surface] }))
                }
              >
                {groups.map(({ group, actions }) => (
                  <div key={group}>
                    <GroupLabel>{group}</GroupLabel>
                    {actions.map((action) => (
                      <ActionRow
                        key={action.id}
                        action={action}
                        bindings={forAction(action.id)}
                        defaultBindings={presetDefault(
                          action.id,
                          selectedPreset,
                        )}
                        overridden={!!overrides[action.id]}
                        onCapture={(b) => handleCapture(action.id, b)}
                        onReset={() => resetAction(action.id)}
                      />
                    ))}
                  </div>
                ))}
              </CollapsibleSurface>
            );
          })}
        </div>
      )}

      {/* ── Video editor lives in its own customizer ───────────────────────── */}
      <div className="flex items-start gap-3 rounded-2xl bg-white/[0.02] p-4 text-[13px] leading-relaxed text-base-fg/55 ring-1 ring-white/[0.06]">
        <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-base-fg/35" />
        <span>
          Video editor shortcuts are managed in the video editor itself
          {onOpenVideoEditorShortcuts ? (
            <>
              {" — "}
              <button
                type="button"
                onClick={onOpenVideoEditorShortcuts}
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                open shortcut settings
              </button>
              .
            </>
          ) : (
            " (Video editor → Settings → Shortcuts)."
          )}
        </span>
      </div>
    </div>
  );
}

// ── Preset dropdown ───────────────────────────────────────────────────────────

function PresetDropdown({
  value,
  onChange,
}: {
  value: PresetId;
  onChange: (id: PresetId) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const def = PRESETS[value];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={twMerge(
          "flex w-full items-center gap-3 rounded-2xl bg-white/[0.04] p-1.5 text-left ring-1 ring-white/[0.08] transition-all hover:bg-white/[0.06] active:scale-[0.995]",
          EASE,
          open && "ring-primary/40",
        )}
      >
        <div className="flex min-w-0 grow flex-col gap-0.5 px-3 py-1.5">
          <span className="text-sm font-medium text-base-fg">{def.label}</span>
          <span className="truncate text-[12px] text-base-fg/50">
            {def.description}
          </span>
        </div>
        <ChevronIcon
          className={twMerge(
            "mr-3 h-4 w-4 shrink-0 text-base-fg/40 transition-transform duration-300",
            EASE,
            open ? "-rotate-90" : "rotate-90",
          )}
        />
      </button>

      <div
        role="listbox"
        aria-label="Preset"
        className={twMerge(
          "absolute left-0 right-0 top-full z-20 mt-2 origin-top rounded-2xl bg-ui-modal shadow-[0_20px_50px_-16px_rgba(0,0,0,0.7)] ring-1 ring-white/10 transition-all duration-200 overflow-hidden",
          EASE,
          open
            ? "scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0",
        )}
      >
        {PRESET_ORDER.map((id) => {
          const p = PRESETS[id];
          const selected = id === value;
          return (
            <button
              key={id}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => {
                onChange(id);
                setOpen(false);
              }}
              className={twMerge(
                "flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors",
                EASE,
                selected ? "bg-primary/[0.08]" : "hover:bg-white/[0.04]",
              )}
            >
              <span
                className={twMerge(
                  "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full text-white transition-all",
                  selected ? "bg-primary opacity-100" : "opacity-0",
                )}
              >
                <CheckIcon className="h-2.5 w-2.5" />
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-medium text-base-fg">
                  {p.label}
                </span>
                <span className="text-[12px] leading-relaxed text-base-fg/55">
                  {p.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LayeringNote({ preset }: { preset: PresetId }) {
  return (
    <p className="text-[13px] leading-relaxed text-base-fg/55">
      Every shortcut starts from the{" "}
      <span className="font-medium text-base-fg/80">
        {PRESETS[preset].label}
      </span>{" "}
      preset. Any key you change is saved as your own{" "}
      <span className="font-medium text-base-fg/80">override</span> on top —
      these sit beside the dimmed preset default
      <span className="mx-1 inline-block h-1.5 w-1.5 translate-y-px rounded-full bg-primary align-middle" />
      and revert with ↺.
    </p>
  );
}

// ── Search fields ─────────────────────────────────────────────────────────────

function ModeToggle({
  mode,
  onChange,
}: {
  mode: SearchMode;
  onChange: (mode: SearchMode) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-[0.625rem] bg-ui-modal/60 p-0.5">
      {(["name", "key"] as SearchMode[]).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          aria-pressed={mode === m}
          className={twMerge(
            "rounded-lg px-3 py-1.5 text-[12px] font-medium capitalize transition-all",
            EASE,
            mode === m
              ? "bg-white/10 text-base-fg shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
              : "text-base-fg/50 hover:text-base-fg/80",
          )}
        >
          {m}
        </button>
      ))}
    </div>
  );
}

function NameSearchField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      className={twMerge(
        "group flex grow items-center rounded-[0.625rem] bg-ui-modal/60 ring-1 ring-transparent transition-all",
        EASE,
        "focus-within:bg-ui-modal/80 focus-within:ring-primary/50",
      )}
    >
      <SearchIcon className="ml-3 h-4 w-4 shrink-0 text-base-fg/35 transition-colors group-focus-within:text-primary" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by name — “rotate”, “camera up”…"
        className="h-10 w-full bg-transparent px-3 text-sm text-base-fg placeholder:text-base-fg/35 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className={twMerge(
            "mr-1.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-base-fg/40 transition-all hover:bg-white/10 hover:text-base-fg active:scale-90",
            EASE,
          )}
        >
          <ClearIcon className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function KeySearchField({
  binding,
  listening,
  onArm,
  onClear,
}: {
  binding: Binding | null;
  listening: boolean;
  onArm: () => void;
  onClear: () => void;
}) {
  return (
    <div
      className={twMerge(
        "flex grow items-center rounded-[0.625rem] bg-ui-modal/60 ring-1 transition-all",
        EASE,
        listening ? "ring-primary/60" : "ring-transparent",
      )}
    >
      <button
        type="button"
        onClick={onArm}
        className="flex h-10 grow items-center gap-2 px-3 text-left"
      >
        <KeyIcon
          className={twMerge(
            "h-4 w-4 shrink-0",
            listening ? "text-primary" : "text-base-fg/35",
          )}
        />
        {listening ? (
          <span className="animate-pulse text-[13px] font-medium text-primary">
            Listening… press a shortcut
          </span>
        ) : binding ? (
          <span className="flex items-center gap-2 text-[13px] text-base-fg/60">
            <KbdBindings bindings={[binding]} />
            <span className="text-base-fg/35">— filtering by this key</span>
          </span>
        ) : (
          <span className="text-sm text-base-fg/35">
            Click, then press a shortcut to filter…
          </span>
        )}
      </button>
      {binding && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear key filter"
          className={twMerge(
            "mr-1.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-base-fg/40 transition-all hover:bg-white/10 hover:text-base-fg active:scale-90",
            EASE,
          )}
        >
          <ClearIcon className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// ── Sections ──────────────────────────────────────────────────────────────────

function CollapsibleSurface({
  title,
  hint,
  count,
  open,
  locked,
  onToggle,
  children,
}: {
  title: string;
  hint: string;
  count: number;
  open: boolean;
  locked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.06]">
      <div className="overflow-hidden rounded-[0.625rem] bg-ui-modal/40">
        <button
          type="button"
          onClick={locked ? undefined : onToggle}
          aria-expanded={open}
          disabled={locked}
          className={twMerge(
            "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
            EASE,
            locked ? "cursor-default" : "hover:bg-white/[0.03]",
          )}
        >
          <ChevronIcon
            className={twMerge(
              "h-4 w-4 shrink-0 text-base-fg/40 transition-transform duration-500",
              EASE,
              open && "rotate-90",
              locked && "opacity-40",
            )}
          />
          <div className="flex min-w-0 grow flex-col">
            <span className="truncate text-sm font-medium text-base-fg">
              {title}
            </span>
            <span className="truncate text-xs text-base-fg/40">{hint}</span>
          </div>
          <span className="shrink-0 rounded-full bg-white/[0.06] px-2 py-0.5 text-xs tabular-nums text-base-fg/55">
            {count}
          </span>
        </button>

        {/* grid-rows 0fr→1fr gives a buttery height reveal without measuring. */}
        <div
          className={twMerge(
            "grid transition-[grid-template-rows] duration-500",
            EASE,
            open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <div className="overflow-hidden">
            <div className="px-2 pb-2">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Rows ──────────────────────────────────────────────────────────────────────

function ActionRow({
  action,
  bindings,
  defaultBindings,
  overridden,
  onCapture,
  onReset,
}: {
  action: ActionDef;
  bindings: Binding[];
  defaultBindings: Binding[];
  overridden: boolean;
  onCapture: (binding: Binding) => void;
  onReset: () => void;
}) {
  return (
    <div
      className={twMerge(
        "group/row flex items-center gap-3 rounded-xl px-3 py-2 transition-colors",
        EASE,
        "hover:bg-white/[0.03]",
      )}
    >
      <span
        className={twMerge(
          "h-1.5 w-1.5 shrink-0 rounded-full bg-primary transition-opacity duration-300",
          overridden ? "opacity-100" : "opacity-0",
        )}
        title={overridden ? "Customized" : undefined}
      />
      <span className="grow truncate text-[13px] text-base-fg/90">
        {action.label}
      </span>

      {/* Layering made literal: dimmed preset default → revert → live override. */}
      {overridden && (
        <span
          className="hidden items-center gap-1.5 text-xs text-base-fg/35 opacity-70 sm:inline-flex"
          title="Preset default"
        >
          <KbdBindings bindings={defaultBindings} />
        </span>
      )}
      {overridden && (
        <button
          type="button"
          onClick={onReset}
          title="Revert to preset default"
          aria-label="Revert to preset default"
          className={twMerge(
            "grid h-7 w-7 shrink-0 place-items-center rounded-full text-base-fg/40 transition-all hover:bg-white/10 hover:text-base-fg active:scale-90",
            EASE,
          )}
        >
          <ResetIcon className="h-3.5 w-3.5" />
        </button>
      )}
      <KeybindCaptureInput
        bindings={bindings}
        accent={overridden}
        onCapture={onCapture}
      />
    </div>
  );
}

function ConflictAlert({
  pending,
  onConfirm,
  onCancel,
}: {
  pending: PendingConflict;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-2.5 rounded-2xl bg-red/[0.08] p-3.5 text-[13px] ring-1 ring-red/30"
    >
      <span className="leading-relaxed text-base-fg/80">
        <KbdBindings bindings={[pending.binding]} /> is already used by{" "}
        <strong className="font-medium text-base-fg">
          {pending.conflicts.map((c) => ACTIONS[c]?.label).join(", ")}
        </strong>
        .
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onConfirm}
          className={twMerge(
            "rounded-full bg-red px-4 py-1.5 text-[13px] font-medium text-white transition-all hover:bg-red/85 active:scale-[0.97]",
            EASE,
          )}
        >
          Rebind anyway
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={twMerge(
            "rounded-full bg-white/[0.06] px-4 py-1.5 text-[13px] text-base-fg/80 transition-all hover:bg-white/10 active:scale-[0.97]",
            EASE,
          )}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function EmptyState({
  mode,
  query,
  binding,
}: {
  mode: SearchMode;
  query: string;
  binding: Binding | null;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/[0.06] px-6 py-12 text-center ring-1 ring-white/[0.06]">
      {mode === "key" ? (
        <KeyIcon className="h-6 w-6 text-base-fg/25" />
      ) : (
        <SearchIcon className="h-6 w-6 text-base-fg/25" />
      )}
      <p className="flex flex-wrap items-center justify-center gap-1.5 text-sm text-base-fg/60">
        Nothing is bound to
        {mode === "key" && binding ? (
          <KbdBindings bindings={[binding]} />
        ) : (
          <span className="font-medium text-base-fg/90">“{query}”</span>
        )}
        {mode === "key" ? " yet." : "."}
      </p>
    </div>
  );
}

// ── Bits ──────────────────────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-medium tracking-wide text-base-fg/50">
      {children}
    </span>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pb-1 pt-4 text-[11px] font-medium uppercase tracking-[0.13em] text-base-fg/45 first:pt-2">
      {children}
    </div>
  );
}

function presetDefault(id: ActionId, preset: PresetId): Binding[] {
  return PRESETS[preset].bindings[id] ?? BASE_BINDINGS[id] ?? [];
}

// ── Icons (thin-line, currentColor; keeps the lib dependency-free) ────────────

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="m20 20-3.4-3.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="m11.2 11.2 8 8M16 16l2.2-2.2M18.4 18.4 21 15.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="m9 6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClearIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="m5 12.5 4.5 4.5L19 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ResetIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4 5v4h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.2 13a7.5 7.5 0 1 0 1.9-6.4L4 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 11v5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="8" r="0.9" fill="currentColor" />
    </svg>
  );
}
