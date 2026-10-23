use serde::Serialize;

/// `Down | Move | Up` transition of a native pen tool, emitted to the
/// frontend on the `pen-event` channel.
///
/// This is the Linux bridge payload: the desktop backend reads pen tools
/// natively via XInput2 and replays them into the webview, because WebKitGTK
/// flattens every pen to `pointerType: "mouse"` with a hardcoded
/// `pressure: 0.5` (see tauri-apps/tauri#10636). On Windows/macOS the frontend
/// gets standards-compliant `PointerEvent`s instead and never consumes this
/// channel.
#[derive(Clone, Copy, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PenEventPayload {
  pub kind: PenEventKind,
  /// Coordinates relative to the top-level window content area, in screen pixels.
  pub x: i32,
  pub y: i32,
  /// Normalized tip pressure in `0.0..=1.0`.
  pub pressure: f32,
  pub is_eraser: bool,
  /// Barrel button (button 2) held. Frontend maps this to canvas pan.
  pub is_barrel_pressed: bool,
  /// Any device button is currently held.
  pub is_down: bool,
  pub device_id: i32,
  /// X11 window id of the deepest native window under the pen (informational).
  pub window_id: u64,
}

#[derive(Clone, Copy, Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum PenEventKind {
  Down,
  Move,
  Up,
}
