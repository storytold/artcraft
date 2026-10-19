//! Native digital-art pen (stylus) input support.
//!
//! On Linux, WebKitGTK never delivers real pen data through DOM events: every
//! tablet sample is flattened to `pointerType: "mouse"` with a hardcoded
//! `pressure: 0.5` (tauri-apps/tauri#10636). This service bridges the gap with
//! an XInput2 reader (`x11_pen_reader`) that talks to libX11/libXi at runtime
//! via dlopen and relays pen events to the webview on the `pen-event` channel.
//!
//! Known limitations:
//! - Pen tilt/rotation is not captured (no XI tilt valuator extraction yet).
//! - The reader requires an X display (XWayland counts); GDK is forced to the
//!   x11 backend in `lib.rs::run` for this reason.
//! - Event delivery cannot be exercised by the mock X server used in this
//!   repo's sandbox; validate on a real desktop with a tablet.

pub mod commands;
pub mod pen_capture_state;
pub mod pen_event_payload;
pub mod spawn_pen_input_thread;
pub mod x11_pen_reader;
