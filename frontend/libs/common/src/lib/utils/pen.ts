/**
 * Digital-art pen (stylus) input support.
 *
 * On Windows and macOS the webview delivers standards-compliant
 * `PointerEvent`s with real `pointerType`, `pressure`, and the eraser tip
 * exposed through `pointerType === "pen"` plus `buttons`/barrel bits — the
 * drawing surfaces here consume those directly.
 *
 * On Linux WebKitGTK never exposes a pen as a pen: it flattens every tablet
 * sample into `pointerType: "mouse"` with a hardcoded `pressure: 0.5`
 * (tauri-apps/tauri#10636). The Rust backend therefore bridges native XInput2
 * pen events over the `pen-event` Tauri channel and the drawing surfaces feed
 * those through the same stroke pressers as DOM pointer events.
 */

export const PEN_EVENT_CHANNEL = "pen-event";

/** `pressure` at or below this value renders as the thinnest brush width. */
export const PEN_MIN_WIDTH_FACTOR = 0.15;

/** Payload sent by the Rust pen bridge (`services/pen` in the desktop crate). */
export type PenEventKind = "down" | "move" | "up";

export interface PenEventPayload {
  kind: PenEventKind;
  /** Coordinates relative to the window content area, in screen pixels. */
  x: number;
  y: number;
  /** Normalized tip pressure, 0..1. */
  pressure: number;
  isEraser: boolean;
  isBarrelPressed: boolean;
  isDown: boolean;
  deviceId: number;
  /** X11 window id of the deepest native window under the pen (Linux only). */
  windowId: number;
}

/** True for pen/stylus tips and for the desktop pen bridge's virtual pointer. */
export function isPenPointer(event: PointerEvent): boolean {
  return event.pointerType === "pen";
}

/**
 * True when the eraser end of the pen is active — either the separate eraser
 * tip device/button (`pointerType: "eraser"` on some platforms) or the
 * hardware eraser button on the pen barrel (`event.button === 5`).
 */
export function isPenEraserActive(event: PointerEvent | PenEventPayload): boolean {
  if ("pointerType" in event) {
    return event.pointerType === "eraser" || (event.pointerType === "pen" && event.button === 5);
  }
  return event.isEraser;
}

/** All samples the browser buffered between pointer samples (may be empty). */
export function coalescedPointerEvents(event: PointerEvent): PointerEvent[] {
  const native = typeof event.getCoalescedEvents === "function" ? event.getCoalescedEvents() : [];
  return native.length > 0 ? native : [event];
}

/**
 * Exponential moving average for pressure samples; keeps ~45% of the previous
 * value so jitter on cheap digitizers does not flicker stroke width.
 */
export function smoothPressure(previous: number, sample: number): number {
  return previous * 0.45 + sample * 0.55;
}

/**
 * Maps normalized pressure to a stroke-width multiplier: zero pressure renders
 * at `PEN_MIN_WIDTH_FACTOR`, full pressure at `1`.
 */
export function pressureToWidthFactor(pressure: number): number {
  const clamped = Math.max(0, Math.min(1, pressure));
  return PEN_MIN_WIDTH_FACTOR + (1 - PEN_MIN_WIDTH_FACTOR) * clamped;
}

/** True when a recorded stroke has real per-point pressure samples. */
export function hasPressureData(points: unknown[], pressures: unknown): pressures is number[] {
  return (
    Array.isArray(pressures) &&
    pressures.length > 1 &&
    pressures.length >= points.length
  );
}
