// Experimental "scene enhancement" panel. Floating control in the 3D
// editor (gated behind the experimental flag) that round-trips the scene
// through a universal descriptor: export the current scene to editable
// JSON, edit it (by hand or via an external LLM), paste it back, and apply.
// Also offers glTF/USDZ export as a universal interchange fallback.
//
// Milestone 1 is a manual round-trip — no in-app LLM call yet. The Apply
// step rebuilds the scene from the pasted descriptor.

import { useContext, useState } from "react";
import { EngineContext } from "../contexts/EngineContext/EngineContext";
import {
  applySceneDescriptor,
  buildSceneDescriptor,
  exportSceneToGltf,
  exportSceneToUsdz,
  SceneDescriptor,
} from "../scene_descriptor";

type Status = { kind: "idle" | "ok" | "err"; message: string };

const IDLE: Status = { kind: "idle", message: "" };

export function SceneDescriptorPanel() {
  const editor = useContext(EngineContext);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>(IDLE);
  const [busy, setBusy] = useState(false);

  const handleExport = () => {
    if (!editor) return;
    try {
      const descriptor = buildSceneDescriptor(editor);
      setText(JSON.stringify(descriptor, null, 2));
      setStatus({
        kind: "ok",
        message: `Exported ${descriptor.entities.length} entit${
          descriptor.entities.length === 1 ? "y" : "ies"
        }.`,
      });
    } catch (err) {
      setStatus({ kind: "err", message: errMsg("Export failed", err) });
    }
  };

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setStatus({ kind: "ok", message: "Copied descriptor to clipboard." });
    } catch (err) {
      setStatus({ kind: "err", message: errMsg("Copy failed", err) });
    }
  };

  const handleDownloadJson = () => {
    if (!text) return;
    downloadBlob(
      new Blob([text], { type: "application/json" }),
      "scene-descriptor.json",
    );
  };

  const handleDownloadGltf = async () => {
    if (!editor) return;
    await withBusy(async () => {
      const blob = await exportSceneToGltf(editor, { binary: true });
      downloadBlob(blob, "scene.glb");
      setStatus({ kind: "ok", message: "Exported scene.glb." });
    }, "glTF export failed");
  };

  const handleDownloadUsdz = async () => {
    if (!editor) return;
    await withBusy(async () => {
      const blob = await exportSceneToUsdz(editor);
      downloadBlob(blob, "scene.usdz");
      setStatus({ kind: "ok", message: "Exported scene.usdz." });
    }, "USDZ export failed");
  };

  const handleApply = async () => {
    if (!editor || !text.trim()) return;
    let descriptor: SceneDescriptor;
    try {
      descriptor = JSON.parse(text) as SceneDescriptor;
    } catch (err) {
      setStatus({ kind: "err", message: errMsg("Invalid JSON", err) });
      return;
    }
    await withBusy(async () => {
      const result = await applySceneDescriptor(editor, descriptor);
      const skippedNote = result.skipped
        ? ` (${result.skipped} skipped — new models/characters need a source)`
        : "";
      setStatus({
        kind: "ok",
        message: `Applied ${result.applied} entit${
          result.applied === 1 ? "y" : "ies"
        }${skippedNote}.`,
      });
    }, "Apply failed");
  };

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
        className="pointer-events-auto absolute right-2 top-16 z-50 rounded-lg border border-white/10 bg-black/70 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white/90"
      >
        ✦ Enhance
      </button>
    );
  }

  return (
    <div className="pointer-events-auto absolute right-2 top-16 z-50 flex w-72 flex-col gap-2 rounded-lg border border-white/10 bg-black/70 p-3 text-xs text-white/80 backdrop-blur-md">
      <div className="flex items-center justify-between font-medium text-white/90">
        <span>Scene enhancement</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded px-1 text-white/50 hover:text-white/90"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <PanelButton onClick={handleExport} disabled={!editor || busy}>
          Export descriptor
        </PanelButton>
        <PanelButton onClick={handleCopy} disabled={!text || busy}>
          Copy
        </PanelButton>
        <PanelButton onClick={handleDownloadJson} disabled={!text || busy}>
          Download .json
        </PanelButton>
        <PanelButton onClick={handleApply} disabled={!editor || !text || busy}>
          Apply to scene
        </PanelButton>
        <PanelButton onClick={handleDownloadGltf} disabled={!editor || busy}>
          glTF (.glb)
        </PanelButton>
        <PanelButton onClick={handleDownloadUsdz} disabled={!editor || busy}>
          USDZ
        </PanelButton>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        placeholder="Export a descriptor, edit it (or paste an LLM-edited one), then Apply to scene."
        className="h-40 w-full resize-y rounded border border-white/10 bg-black/50 p-2 font-mono text-[10px] leading-snug text-white/80 outline-none focus:border-white/30"
      />

      {status.kind !== "idle" && (
        <p
          className={
            status.kind === "err" ? "text-red-300" : "text-emerald-300"
          }
        >
          {status.message}
        </p>
      )}
    </div>
  );
}

function PanelButton({
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
      className="rounded border border-white/10 py-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white/90 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoke on the next tick so the click-driven navigation has started.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function errMsg(label: string, err: unknown): string {
  const detail = err instanceof Error ? err.message : String(err);
  return `${label}: ${detail}`;
}
