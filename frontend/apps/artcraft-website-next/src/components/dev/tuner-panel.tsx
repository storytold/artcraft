"use client";

import { useEffect, useRef, useState } from "react";
import {
  useTunerStore,
  tunerSnapshot,
  type TunableGroup,
} from "@/lib/tuner";
import { Button } from "@/components/ui";

const UI_KEY = "artcraft-tuner-ui";

type UiState = {
  x: number;
  y: number;
  collapsed: boolean;
  open: Record<string, boolean>;
};

const DEFAULT_UI: UiState = { x: 16, y: 72, collapsed: false, open: {} };

function loadUi(): UiState {
  try {
    return { ...DEFAULT_UI, ...JSON.parse(localStorage.getItem(UI_KEY) ?? "{}") };
  } catch {
    return DEFAULT_UI;
  }
}

// Floating dev tuner: renders every group registered via defineTunables as a
// collapsible section of slider + number-input rows. Drag by the header.
// Shown in dev builds, or anywhere with ?tuner=1. See TUNER.md.
export default function TunerPanel() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    setEnabled(
      process.env.NODE_ENV === "development" ||
        new URLSearchParams(window.location.search).has("tuner"),
    );
  }, []);
  if (!enabled) return null;
  return <Panel />;
}

function Panel() {
  const groups = useTunerStore((s) => s.groups);
  const resetAll = useTunerStore((s) => s.resetAll);
  const [ui, setUi] = useState<UiState>(loadUi);
  const [copied, setCopied] = useState(false);
  const dragOrigin = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  const saveUi = (next: UiState) => {
    setUi(next);
    try {
      localStorage.setItem(UI_KEY, JSON.stringify(next));
    } catch {
      // Non-persistent tuning is still tuning.
    }
  };

  const onHeaderPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragOrigin.current = { px: e.clientX, py: e.clientY, x: ui.x, y: ui.y };
  };
  const onHeaderPointerMove = (e: React.PointerEvent) => {
    const o = dragOrigin.current;
    if (!o) return;
    saveUi({
      ...ui,
      x: Math.max(0, Math.min(window.innerWidth - 60, o.x + e.clientX - o.px)),
      y: Math.max(0, Math.min(window.innerHeight - 40, o.y + e.clientY - o.py)),
    });
  };
  const onHeaderPointerUp = () => {
    dragOrigin.current = null;
  };

  const copyValues = async () => {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(tunerSnapshot(), null, 2),
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard can be blocked; the values are still visible in the panel.
    }
  };

  const ordered = Object.values(groups).sort((a, b) => a.order - b.order);

  return (
    <div
      className="fixed z-[100] w-[300px] border border-line-strong bg-bg-raised text-ink shadow-[0_8px_32px_rgba(0,0,0,0.35)] select-none"
      style={{ left: ui.x, top: ui.y }}
    >
      <div
        className="flex cursor-grab items-center justify-between border-b border-line bg-bg-sunken px-3 py-2 active:cursor-grabbing"
        onPointerDown={onHeaderPointerDown}
        onPointerMove={onHeaderPointerMove}
        onPointerUp={onHeaderPointerUp}
      >
        <p className="hud-label font-bold">Tuner</p>
        <div className="flex items-center gap-1">
          <HeaderButton onClick={copyValues} label={copied ? "Copied" : "Copy"} />
          <HeaderButton onClick={resetAll} label="Reset" />
          <HeaderButton
            onClick={() => saveUi({ ...ui, collapsed: !ui.collapsed })}
            label={ui.collapsed ? "+" : "–"}
          />
        </div>
      </div>

      {!ui.collapsed && (
        <div className="max-h-[70vh] overflow-y-auto">
          {ordered.length === 0 && (
            <p className="hud-label px-3 py-4 text-faint">
              No tunables registered
            </p>
          )}
          {ordered.map((group) => (
            <Section
              key={group.id}
              group={group}
              open={ui.open[group.id] ?? false}
              onToggle={() =>
                saveUi({
                  ...ui,
                  open: { ...ui.open, [group.id]: !(ui.open[group.id] ?? false) },
                })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function HeaderButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      className="min-w-[44px] border border-line px-1.5 py-0.5 text-[10px] font-medium"
    >
      {label}
    </Button>
  );
}

function Section({
  group,
  open,
  onToggle,
}: {
  group: TunableGroup;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-line last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="hud-label flex w-full items-center justify-between px-3 py-2 text-muted hover:text-ink"
        aria-expanded={open}
      >
        {group.title}
        <span aria-hidden className="text-faint">
          {open ? "–" : "+"}
        </span>
      </button>
      {open && (
        <div className="flex flex-col gap-2 px-3 pb-3">
          {Object.entries(group.defs).map(([key, def]) => (
            <Row key={key} groupId={group.id} tunableKey={key} def={def} />
          ))}
        </div>
      )}
    </div>
  );
}

function Row({
  groupId,
  tunableKey,
  def,
}: {
  groupId: string;
  tunableKey: string;
  def: TunableGroup["defs"][string];
}) {
  const storeKey = `${groupId}.${tunableKey}`;
  const value = useTunerStore((s) => s.values[storeKey] ?? def.default);
  const setValue = useTunerStore((s) => s.setValue);
  const modified = value !== def.default;

  return (
    <label className="flex flex-col gap-1">
      <span className="flex items-center justify-between">
        <span
          className={`font-mono text-[10px] tracking-[0.08em] uppercase ${
            modified ? "text-accent-ink" : "text-muted"
          }`}
        >
          {def.label}
        </span>
        <input
          type="number"
          value={round(value)}
          min={def.min}
          max={def.max}
          step={def.step}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!Number.isNaN(v)) setValue(groupId, tunableKey, v);
          }}
          className="w-[72px] border border-line bg-bg px-1 py-0.5 text-right font-mono text-[11px] text-ink focus:outline-none focus:border-line-strong"
        />
      </span>
      <input
        type="range"
        value={value}
        min={def.min}
        max={def.max}
        step={def.step}
        onChange={(e) => setValue(groupId, tunableKey, Number(e.target.value))}
        className="h-1 w-full cursor-ew-resize accent-[var(--accent)]"
      />
    </label>
  );
}

function round(v: number): number {
  return Math.round(v * 10000) / 10000;
}
