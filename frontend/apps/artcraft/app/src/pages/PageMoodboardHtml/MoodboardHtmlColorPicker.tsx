import { useEffect, useRef, useState } from "react";
import { HexColorPicker, RgbColorPicker } from "react-colorful";
import { useShallow } from "zustand/react/shallow";
import { useMoodboardStore } from "../PageMoodboard/MoodboardStore";

const PRESETS = [
  "#FFFFFF",
  "#F5F5F0",
  "#FFF8E1",
  "#E3F2FD",
  "#E8F5E9",
  "#FCE4EC",
  "#F3E5F5",
  "#ECEFF1",
  "#1F2937",
];

type Mode = "hex" | "rgb";

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full || "0", 16);
  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255,
  };
};

const rgbToHex = (r: number, g: number, b: number): string => {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const h = (clamp(r) << 16) | (clamp(g) << 8) | clamp(b);
  return `#${h.toString(16).padStart(6, "0").toUpperCase()}`;
};

// Floating color-picker toolbar, pinned to the bottom-left of the moodboard.
// Renders only when the selection contains exactly one card. Offers a row of
// preset swatches, the current color, and a toggleable advanced picker
// (hex / RGB).
export const MoodboardHtmlColorPicker = () => {
  const { selectedIds, nodes } = useMoodboardStore(
    useShallow((s) => ({ selectedIds: s.selectedIds, nodes: s.nodes })),
  );
  const setCardColor = useMoodboardStore((s) => s.setCardColor);
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<Mode>("hex");
  const rootRef = useRef<HTMLDivElement | null>(null);

  const ids = Array.from(selectedIds);
  const only = ids.length === 1 ? nodes[ids[0]] : null;
  const card = only && only.kind === "card" ? only : null;

  // Collapse the advanced picker whenever the selection changes to a
  // different card — keeps the UI from lingering open unexpectedly.
  useEffect(() => {
    setExpanded(false);
  }, [card?.id]);

  // Outside-click closes the advanced picker. The preset row stays visible
  // regardless since it lives in the always-mounted toolbar.
  useEffect(() => {
    if (!expanded) return undefined;
    const handler = (e: MouseEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (e.target instanceof Node && el.contains(e.target)) return;
      setExpanded(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [expanded]);

  if (!card) return null;

  const current = card.backgroundColor;
  const rgb = hexToRgb(current);

  return (
    <div
      ref={rootRef}
      // Stop stage pointerdowns from clearing selection when the user
      // interacts with the picker panel itself.
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: "absolute",
        left: 16,
        bottom: 16,
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: 10,
        borderRadius: 10,
        background: "rgba(24,24,27,0.92)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        color: "#e5e7eb",
        fontSize: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ opacity: 0.7 }}>Card color</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {PRESETS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Set color ${c}`}
            onClick={() => setCardColor(card.id, c)}
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: c,
              border:
                c.toLowerCase() === current.toLowerCase()
                  ? "2px solid #3b82f6"
                  : "1px solid rgba(255,255,255,0.25)",
              cursor: "pointer",
              padding: 0,
            }}
          />
        ))}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-label="Custom color"
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background:
              "conic-gradient(#f87171, #fbbf24, #34d399, #60a5fa, #a78bfa, #f472b6, #f87171)",
            border: "1px solid rgba(255,255,255,0.35)",
            cursor: "pointer",
            padding: 0,
          }}
        />
      </div>
      {expanded && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            paddingTop: 6,
          }}
        >
          <div style={{ display: "flex", gap: 4 }}>
            <ModeTab label="HEX" active={mode === "hex"} onClick={() => setMode("hex")} />
            <ModeTab label="RGB" active={mode === "rgb"} onClick={() => setMode("rgb")} />
          </div>
          {mode === "hex" ? (
            <>
              <HexColorPicker
                color={current}
                onChange={(c) => setCardColor(card.id, c.toUpperCase())}
                style={{ width: 180, height: 140 }}
              />
              <input
                type="text"
                value={current}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  if (/^#?[0-9a-fA-F]{6}$/.test(v)) {
                    setCardColor(card.id, v.startsWith("#") ? v.toUpperCase() : `#${v.toUpperCase()}`);
                  }
                }}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.08)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 4,
                  padding: "4px 6px",
                  fontFamily: "monospace",
                }}
              />
            </>
          ) : (
            <>
              <RgbColorPicker
                color={rgb}
                onChange={(c) => setCardColor(card.id, rgbToHex(c.r, c.g, c.b))}
                style={{ width: 180, height: 140 }}
              />
              <div style={{ display: "flex", gap: 4 }}>
                {(["r", "g", "b"] as const).map((key) => (
                  <input
                    key={key}
                    type="number"
                    min={0}
                    max={255}
                    value={rgb[key]}
                    onChange={(e) => {
                      const n = Math.max(0, Math.min(255, Number(e.target.value) || 0));
                      const next = { ...rgb, [key]: n };
                      setCardColor(card.id, rgbToHex(next.r, next.g, next.b));
                    }}
                    style={{
                      flex: 1,
                      background: "rgba(255,255,255,0.08)",
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 4,
                      padding: "4px 6px",
                      fontFamily: "monospace",
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

interface ModeTabProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const ModeTab = ({ label, active, onClick }: ModeTabProps) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      flex: 1,
      padding: "4px 8px",
      borderRadius: 4,
      fontSize: 11,
      cursor: "pointer",
      background: active ? "rgba(59,130,246,0.35)" : "rgba(255,255,255,0.06)",
      border: active
        ? "1px solid #3b82f6"
        : "1px solid rgba(255,255,255,0.1)",
      color: "#fff",
    }}
  >
    {label}
  </button>
);
