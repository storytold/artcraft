// Experimental "scene enhancement" panel. Floating glass HUD in the 3D
// editor (gated behind the experimental flag; shown in dev by default)
// that round-trips the scene through a universal config:
//
//  - Export/copy the scene as a compact JSON descriptor OR as glTF.
//  - Paste a descriptor back and Apply it — reconciled in place by id, so
//    existing meshes aren't reloaded.
//  - Undo/redo — an Apply is a single history entry, so one undo reverts
//    the entire config application at once.
//
// Milestone 1 is a manual round-trip (no in-app LLM call). glTF/USDZ are
// export-only interchange; Apply consumes the JSON descriptor.
//
// Styling follows the house "ethereal glass" language: a double-bezel
// shell (outer tray + inner core), hairline highlights, soft diffused
// shadow, and spring-curve motion — no harsh borders or linear easing.

import { useContext, useEffect, useState } from "react";
import { EngineContext } from "../contexts/EngineContext/EngineContext";
import {
  applySceneDescriptor,
  buildSceneDescriptor,
  exportSceneToGltf,
  exportSceneToGltfText,
  exportSceneToUsdz,
  SceneDescriptor,
} from "../scene_descriptor";

type ConfigFormat = "descriptor" | "gltf";
type Status = { kind: "idle" | "ok" | "err"; message: string };

const IDLE: Status = { kind: "idle", message: "" };
const SPRING = "duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]";

export function SceneDescriptorPanel() {
  const editor = useContext(EngineContext);
  // Open by default so the panel is clearly present (like the outliner /
  // debug panes); the header ✕ collapses it to a compact pill.
  const [open, setOpen] = useState(true);
  const [format, setFormat] = useState<ConfigFormat>("descriptor");
  const [includeGeometry, setIncludeGeometry] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>(IDLE);
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    if (!editor) return;
    await withBusy(async () => {
      if (format === "descriptor") {
        const descriptor = buildSceneDescriptor(editor, { includeGeometry });
        setText(JSON.stringify(descriptor, null, 2));
        setStatus({
          kind: "ok",
          message: `Exported ${descriptor.entities.length} ${plural(
            descriptor.entities.length,
            "entity",
            "entities",
          )} as descriptor.`,
        });
      } else {
        setText(await exportSceneToGltfText(editor));
        setStatus({ kind: "ok", message: "Exported scene as glTF (text)." });
      }
    }, "Export failed");
  };

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setStatus({ kind: "ok", message: "Copied to clipboard." });
    } catch (err) {
      setStatus({ kind: "err", message: errMsg("Copy failed", err) });
    }
  };

  const handleDownload = async () => {
    if (!editor) return;
    await withBusy(async () => {
      if (format === "descriptor") {
        const body =
          text ||
          JSON.stringify(buildSceneDescriptor(editor, { includeGeometry }), null, 2);
        downloadBlob(
          new Blob([body], { type: "application/json" }),
          "scene-descriptor.json",
        );
        setStatus({ kind: "ok", message: "Downloaded scene-descriptor.json." });
      } else {
        const blob = await exportSceneToGltf(editor, { binary: true });
        downloadBlob(blob, "scene.glb");
        setStatus({ kind: "ok", message: "Downloaded scene.glb." });
      }
    }, "Download failed");
  };

  const handleDownloadUsdz = async () => {
    if (!editor) return;
    await withBusy(async () => {
      const blob = await exportSceneToUsdz(editor);
      downloadBlob(blob, "scene.usdz");
      setStatus({ kind: "ok", message: "Downloaded scene.usdz." });
    }, "USDZ export failed");
  };

  const handleApply = async () => {
    if (!editor || !text.trim()) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      setStatus({ kind: "err", message: errMsg("Invalid JSON", err) });
      return;
    }
    if (!isDescriptor(parsed)) {
      setStatus({
        kind: "err",
        message: looksLikeGltf(parsed)
          ? "glTF is export-only — paste a scene descriptor to apply."
          : "Not a scene descriptor (missing `entities`).",
      });
      return;
    }
    await withBusy(async () => {
      const r = await applySceneDescriptor(editor, parsed);
      const notes = [
        r.removed ? `${r.removed} removed` : "",
        r.skipped ? `${r.skipped} skipped` : "",
      ].filter(Boolean);
      const suffix = notes.length ? ` (${notes.join(", ")})` : "";
      setStatus({
        kind: "ok",
        message: `Applied ${r.applied} ${plural(
          r.applied,
          "entity",
          "entities",
        )}${suffix}. Undo reverts the whole apply.`,
      });
    }, "Apply failed");
  };

  const handleUndo = () =>
    withBusy(async () => {
      await editor?.history.undo();
      setStatus({ kind: "ok", message: "Undid last change." });
    }, "Undo failed");

  const handleRedo = () =>
    withBusy(async () => {
      await editor?.history.redo();
      setStatus({ kind: "ok", message: "Redid last change." });
    }, "Redo failed");

  const withBusy = async (fn: () => Promise<void>, errLabel: string) => {
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      setStatus({ kind: "err", message: errMsg(errLabel, err) });
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`group pointer-events-auto absolute right-4 top-1/2 z-50 flex -translate-y-1/2 items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-semibold tracking-wide text-emerald-50 shadow-[0_8px_30px_-10px_rgba(16,185,129,0.5)] ring-1 ring-emerald-400/10 backdrop-blur-xl transition-all active:scale-[0.97] hover:bg-emerald-400/20 ${SPRING}`}
      >
        <Sparkle className="h-3.5 w-3.5 text-emerald-300 transition-transform group-hover:rotate-90" />
        Enhance
      </button>
    );
  }

  return (
    <PanelShell onClose={() => setOpen(false)} busy={busy}>
      {/* Format selector — sliding segmented control */}
      <Segmented
        value={format}
        onChange={setFormat}
        options={[
          { value: "descriptor", label: "Descriptor" },
          { value: "gltf", label: "glTF" },
        ]}
      />

      {format === "descriptor" && (
        <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-1 text-[11px] text-white/60">
          <span className="flex flex-col">
            <span className="text-white/75">Include geometry</span>
            <span className="text-[10px] text-white/40">
              Per-object vertex data — much larger output
            </span>
          </span>
          <input
            type="checkbox"
            checked={includeGeometry}
            onChange={(e) => setIncludeGeometry(e.target.checked)}
            className="h-3.5 w-3.5 shrink-0 accent-emerald-400"
          />
        </label>
      )}

      <div className="grid grid-cols-3 gap-1.5">
        <GhostButton onClick={handleExport} disabled={!editor || busy}>
          Export
        </GhostButton>
        <GhostButton onClick={handleCopy} disabled={!text || busy}>
          Copy
        </GhostButton>
        <GhostButton onClick={handleDownload} disabled={!editor || busy}>
          Download
        </GhostButton>
      </div>

      {/* Inner-bezel editor surface */}
      <div className="rounded-xl bg-black/40 p-1 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          placeholder={
            format === "descriptor"
              ? "Export a descriptor, edit it (or paste an LLM-edited one), then Apply."
              : "glTF export — copy or download for use in other tools."
          }
          className={`h-44 w-full resize-y rounded-lg bg-transparent p-2.5 font-mono text-[10px] leading-relaxed text-white/85 outline-none transition-colors placeholder:text-white/30 ${SPRING}`}
        />
      </div>

      {/* Primary CTA — button-in-button with a nested icon island */}
      <ApplyButton
        onClick={handleApply}
        disabled={!editor || !text || busy || format !== "descriptor"}
        hint={
          format !== "descriptor"
            ? "Apply consumes the JSON descriptor"
            : undefined
        }
      />

      <div className="grid grid-cols-2 gap-1.5">
        <GhostButton onClick={handleUndo} disabled={!editor || busy}>
          <span className="inline-flex items-center justify-center gap-1.5">
            <Undo className="h-3 w-3" /> Undo
          </span>
        </GhostButton>
        <GhostButton onClick={handleRedo} disabled={!editor || busy}>
          <span className="inline-flex items-center justify-center gap-1.5">
            <Undo className="h-3 w-3 -scale-x-100" /> Redo
          </span>
        </GhostButton>
      </div>

      <button
        type="button"
        onClick={handleDownloadUsdz}
        disabled={!editor || busy}
        className={`w-full rounded-lg py-1.5 text-[11px] text-white/45 transition-colors hover:text-white/80 disabled:opacity-40 ${SPRING}`}
      >
        Download USDZ
      </button>

      {status.kind !== "idle" && (
        <p
          className={`text-[11px] leading-snug ${
            status.kind === "err" ? "text-rose-300/90" : "text-emerald-300/90"
          }`}
        >
          {status.message}
        </p>
      )}
    </PanelShell>
  );
}

// ── Layout primitives ──────────────────────────────────────────────────

// Double-bezel shell: outer tray + inner core, soft diffused shadow, and
// a spring-in reveal on mount.
function PanelShell({
  children,
  onClose,
  busy,
}: {
  children: React.ReactNode;
  onClose: () => void;
  busy: boolean;
}) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={`pointer-events-auto absolute right-4 top-1/2 z-50 w-80 -translate-y-1/2 rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-1.5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.75)] backdrop-blur-2xl transition-all ${SPRING} ${
        shown ? "scale-100 opacity-100 blur-0" : "scale-[0.97] opacity-0 blur-[2px]"
      }`}
    >
      <div className="flex flex-col gap-3 rounded-[calc(1.5rem-0.375rem)] bg-black/50 p-3.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-medium uppercase tracking-[0.22em] text-white/40">
              Experimental
            </span>
            <span className="flex items-center gap-1.5 text-sm font-semibold tracking-tight text-white/90">
              <Sparkle
                className={`h-3.5 w-3.5 text-emerald-300/80 ${
                  busy ? "animate-pulse" : ""
                }`}
              />
              Scene Enhance
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`flex h-7 w-7 items-center justify-center rounded-full text-white/40 transition-all hover:bg-white/10 hover:text-white/90 active:scale-90 ${SPRING}`}
          >
            <Close className="h-3 w-3" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  return (
    <div className="relative flex rounded-xl bg-black/40 p-1 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
      <span
        className={`absolute inset-y-1 left-1 rounded-lg bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] transition-transform ${SPRING}`}
        style={{
          width: `calc((100% - 0.5rem) / ${options.length})`,
          transform: `translateX(${index * 100}%)`,
        }}
      />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`relative z-10 flex-1 rounded-lg py-1.5 text-[11px] font-medium transition-colors ${SPRING} ${
            value === o.value
              ? "text-white/90"
              : "text-white/45 hover:text-white/70"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function GhostButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border border-white/10 bg-white/[0.03] py-1.5 text-[11px] text-white/70 transition-all active:scale-[0.97] hover:bg-white/10 hover:text-white/90 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-white/[0.03] ${SPRING}`}
    >
      {children}
    </button>
  );
}

function ApplyButton({
  onClick,
  disabled,
  hint,
}: {
  onClick: () => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={hint}
      className={`group flex items-center justify-between rounded-full bg-white py-1.5 pl-5 pr-1.5 text-[12px] font-semibold tracking-tight text-black transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/40 ${SPRING}`}
    >
      Apply to scene
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full bg-black/10 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-px group-disabled:bg-white/10 ${SPRING}`}
      >
        <Arrow className="h-3.5 w-3.5" />
      </span>
    </button>
  );
}

// ── Ultra-light line icons (1px stroke, no icon library) ────────────────

type IconProps = { className?: string };

function Sparkle({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 3v18M3 12h18M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );
}

function Arrow({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Undo({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M9 7L4 12l5 5M4 12h11a5 5 0 0 1 0 10h-1"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Close({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────

// Duck-type guards so paste-Apply gives a useful message regardless of
// which format the user pasted.
function isDescriptor(value: unknown): value is SceneDescriptor {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as { entities?: unknown }).entities)
  );
}

function looksLikeGltf(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return "asset" in v && ("scenes" in v || "meshes" in v || "nodes" in v);
}

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoke on the next tick so the click-driven download has started.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function errMsg(label: string, err: unknown): string {
  const detail = err instanceof Error ? err.message : String(err);
  return `${label}: ${detail}`;
}
