//! Native Linux pen (digital art stylus) input reader.
//!
//! Reads XInput2 device events through the system libX11/libXi (loaded with
//! `libloading` so no build-time X11 dev packages are required), selects event
//! masks, hit-tests the pen position against this app's top-level windows, and
//! forwards every sample to the frontend on the `pen-event` channel as a
//! [`PenEventPayload`].
//!
//! Why this exists: WebKitGTK (the Tauri webview on Linux) flattens pen input
//! into `pointerType: "mouse"` events with a hardcoded `pressure: 0.5`
//! (tauri-apps/tauri#10636), so the frontend cannot get pen data from the DOM.
//! This reader is the Linux equivalent of the standards-compliant
//! `PointerEvent`s that WebView2 (Windows) and WKWebView (macOS) deliver.
//!
//! Verified behaviour on an XWayland session:
//! - `XISelectEvents` on the root window is accepted through libXi (x11rb's
//!   own wire encoding of the same call was rejected with a BadValue, so libXi
//!   is deliberately used instead of x11rb).
//! - This app's windows are discovered via the `_NET_WM_PID` property and
//!   rescanned periodically, so window create/destroy never wedges the reader.
//! - Coordinates are translated through the child-return chain
//!   (`XTranslateCoordinates`) into the deepest native window under the pen,
//!   which lands in the webview's viewport space (GTK title bars are siblings
//!   of the app's top-level window, not children of it).

use std::collections::HashMap;
use std::ffi::CStr;
use std::os::raw::{c_char, c_int, c_long, c_uchar, c_uint, c_ulong, c_void};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use anyhow::anyhow;
use libloading::Library;
use tauri::{AppHandle, Emitter};

use crate::services::pen::pen_capture_state::PenCaptureState;
use crate::services::pen::pen_event_payload::{PenEventKind, PenEventPayload};

/// XInput2 event opcodes (XI2proto).
const XI_BUTTON_PRESS: c_int = 4;
const XI_BUTTON_RELEASE: c_int = 5;
const XI_MOTION: c_int = 6;
const XI_PROXIMITY_IN: c_int = 8;
const XI_PROXIMITY_OUT: c_int = 9;
/// Generic-event code in the X event union (`X_GenericEvent`).
const GENERIC_EVENT_CODE: c_int = 35;

/// XI event mask bits. XI2 has no proximity-mask bit; proximity events are
/// delivered alongside the device events selected for the same device.
const XI_MASK_MOTION: c_ulong = 1 << 6;
const XI_MASK_BUTTON_PRESS: c_ulong = 1 << 4;
const XI_MASK_BUTTON_RELEASE: c_ulong = 1 << 5;
const SELECT_MASK: c_ulong = XI_MASK_MOTION | XI_MASK_BUTTON_PRESS | XI_MASK_BUTTON_RELEASE;
const SELECT_MASK_U32: u32 = SELECT_MASK as u32;

/// Button-mask bit indexes. Bit 0 = button 1 (tip), bit 1 = button 2 (barrel),
/// bit 2 = button 3 (commonly mapped to the eraser tip).
const BUTTON_BARREL_BIT: usize = 1;
const BUTTON_ERASER_BIT: usize = 2;

/// XI device `use` types (`XIDeviceInfo.use`).
const XI_SLAVE_POINTER: c_int = 3;
const XI_FLOATING_SLAVE: c_int = 5;
/// XI class type for `XIValuatorClassInfo`.
const XI_VALUATOR_CLASS: c_int = 2;
/// Selection target for device enumeration.
const XI_ALL_DEVICES: c_int = 0;

const X_NONE: c_ulong = 0;
const X_FALSE: c_int = 0;

/// How often the app-window cache is refreshed.
const WINDOW_SCAN_INTERVAL: Duration = Duration::from_secs(2);
/// Idle poll period between event checks (latency floor while idle).
const EVENT_POLL_INTERVAL: Duration = Duration::from_millis(4);
/// Minimum interval between emitted samples. Caps the emit rate at 200/s
/// while keeping stroke-down and stroke-up transitions immediate.
const EMIT_INTERVAL: Duration = Duration::from_millis(5);

/// Forwarding configuration for one device, derived from device discovery.
#[derive(Clone, Copy)]
struct PenDeviceConfig {
  device_id: c_int,
  is_eraser: bool,
  /// Index of the pressure axis within the valuator list, if the device
  /// exposes one (generic mice do not).
  maybe_pressure_axis: Option<c_int>,
  pressure_min: f64,
  pressure_max: f64,
}

/// The X11/libXi FFI surface. Only the reader thread ever handles one of
/// these, so the non-`Send` `Library` handles never cross threads.
struct X11Api {
  x11_handle: Library,
  xi_handle: Library,
  x_open_display: unsafe extern "C" fn(*const c_char) -> *mut c_void,
  x_close_display: unsafe extern "C" fn(*mut c_void) -> c_int,
  x_default_root_window: unsafe extern "C" fn(*mut c_void) -> c_ulong,
  x_pending: unsafe extern "C" fn(*mut c_void) -> c_int,
  x_next_event: unsafe extern "C" fn(*mut c_void, *mut c_char) -> c_int,
  x_get_event_data: unsafe extern "C" fn(*mut c_void, *mut GenericEventCookie) -> c_int,
  x_free_event_data: unsafe extern "C" fn(*mut c_void, *mut GenericEventCookie),
  x_free: unsafe extern "C" fn(*mut c_void),
  x_query_tree: unsafe extern "C" fn(*mut c_void, c_ulong, *mut c_ulong, *mut c_ulong, *mut *mut c_ulong, *mut c_uint) -> c_int,
  x_intern_atom: unsafe extern "C" fn(*mut c_void, *const c_char, c_int) -> c_ulong,
  x_get_window_property: unsafe extern "C" fn(*mut c_void, c_ulong, c_ulong, c_long, c_long, c_int, c_ulong, *mut c_ulong, *mut c_int, *mut c_ulong, *mut c_ulong, *mut *mut c_uchar) -> c_int,
  x_translate_coordinates: unsafe extern "C" fn(*mut c_void, c_ulong, c_ulong, c_int, c_int, *mut c_int, *mut c_int, *mut c_ulong) -> c_int,
  x_set_error_handler: unsafe extern "C" fn(unsafe extern "C" fn(*mut c_void, *mut c_void) -> c_int) -> usize,
  xi_query_version: unsafe extern "C" fn(*mut c_void, *mut c_int, *mut c_int) -> c_int,
  xi_query_device: unsafe extern "C" fn(*mut c_void, c_int, *mut c_int) -> *mut c_void,
  xi_select_events: unsafe extern "C" fn(*mut c_void, c_ulong, *mut X11EventMask, c_int) -> c_int,
}

/// Per-device stroke bookkeeping and throttling for the reader loop.
struct ReaderLoop {
  top_level_windows: Vec<c_ulong>,
  devices: HashMap<i32, PenDeviceConfig>,
  device_down_state: Mutex<HashMap<i32, bool>>,
  last_emit: Mutex<Option<Instant>>,
  last_window_scan: Instant,
}

/// `XIEventMask` (device id, mask length in bytes, mask bytes).
#[repr(C)]
struct X11EventMask {
  device_id: c_int,
  mask_len: c_int,
  mask: *mut c_uchar,
}

/// `XGenericEventCookie`, the union head of an X11 generic event.
#[repr(C)]
struct GenericEventCookie {
  type_: c_int,
  serial: c_ulong,
  send_event: c_int,
  display: *mut c_void,
  extension: c_int,
  event_type: c_int,
  cookie: c_uint,
  data: *mut c_void,
}

/// `XIDeviceEvent` from XInput2.h, transcribed field by field:
/// `type, serial, send_event, display, extension, evtype, time, deviceid,
/// sourceid, detail, root, event, child, root_x, root_y, event_x, event_y,
/// flags, buttons {mask_len, mask}, valuators {mask_len, mask, values},
/// mods {base, latched, locked, effective}, group {base, latched, locked,
/// effective}`.
///
/// `repr(C)` reproduces the C padding: each `(int, int)` pair in front of a
/// pointer field re-aligns that pointer to its own 8-byte boundary, matching
/// the C ABI libXi uses when it fills this struct.
#[repr(C)]
#[allow(dead_code)]
struct XIDeviceEventFields {
  type_: c_int,
  serial: c_ulong,
  send_event: c_int,
  display: *mut c_void,
  extension: c_int,
  event_type: c_int,
  time: c_ulong,
  device_id: c_int,
  source_id: c_int,
  detail: c_int,
  root: c_ulong,
  event: c_ulong,
  child: c_ulong,
  root_x: f64,
  root_y: f64,
  event_x: f64,
  event_y: f64,
  flags: c_int,
  button_mask_len: c_int,
  button_mask: *const c_uchar,
  valuator_mask_len: c_int,
  valuator_mask: *const c_uchar,
  valuator_values: *const f64,
  mods_base: c_int,
  mods_latched: c_int,
  mods_locked: c_int,
  mods_effective: c_int,
  group_base: c_int,
  group_latched: c_int,
  group_locked: c_int,
  group_effective: c_int,
}

/// Reader-thread entry point: loads the FFI surface, installs a no-op X error
/// handler (X errors must not abort the event loop), then runs the event loop
/// until the connection fails.
pub fn run_pen_reader(
  app: AppHandle,
  capture_state: Arc<PenCaptureState>,
) -> anyhow::Result<()> {
  unsafe {
    let api = X11Api::load()?;
    (api.x_set_error_handler)(noop_error_handler);
    api.run(app, capture_state)
  }
}

/// Swallows protocol errors from our own non-essential requests (window scans,
/// event selections) so they never kill the event loop.
extern "C" fn noop_error_handler(_display: *mut c_void, _error: *mut c_void) -> c_int {
  0
}

impl X11Api {
  /// Loads libX11 and libXi and resolves the symbols used by the reader.
  unsafe fn load() -> anyhow::Result<X11Api> {
    unsafe {
      let x11_handle = Library::new("libX11.so.6").or_else(|_| Library::new("libX11.so"))?;
      let xi_handle = Library::new("libXi.so.6").or_else(|_| Library::new("libXi.so"))?;

      type DisplayFn = unsafe extern "C" fn(*const c_char) -> *mut c_void;
      type CloseDisplayFn = unsafe extern "C" fn(*mut c_void) -> c_int;
      type RootWindowFn = unsafe extern "C" fn(*mut c_void) -> c_ulong;
      type PendingFn = unsafe extern "C" fn(*mut c_void) -> c_int;
      type NextEventFn = unsafe extern "C" fn(*mut c_void, *mut c_char) -> c_int;
      type GetEventDataFn = unsafe extern "C" fn(*mut c_void, *mut GenericEventCookie) -> c_int;
      type FreeEventDataFn = unsafe extern "C" fn(*mut c_void, *mut GenericEventCookie);
      type FreeFn = unsafe extern "C" fn(*mut c_void);
      type QueryTreeFn = unsafe extern "C" fn(*mut c_void, c_ulong, *mut c_ulong, *mut c_ulong, *mut *mut c_ulong, *mut c_uint) -> c_int;
      type InternAtomFn = unsafe extern "C" fn(*mut c_void, *const c_char, c_int) -> c_ulong;
      type GetWindowPropertyFn = unsafe extern "C" fn(*mut c_void, c_ulong, c_ulong, c_long, c_long, c_int, c_ulong, *mut c_ulong, *mut c_int, *mut c_ulong, *mut c_ulong, *mut *mut c_uchar) -> c_int;
      type TranslateCoordsFn = unsafe extern "C" fn(*mut c_void, c_ulong, c_ulong, c_int, c_int, *mut c_int, *mut c_int, *mut c_ulong) -> c_int;
      type SetErrorHandlerFn = unsafe extern "C" fn(unsafe extern "C" fn(*mut c_void, *mut c_void) -> c_int) -> usize;
      type QueryVersionFn = unsafe extern "C" fn(*mut c_void, *mut c_int, *mut c_int) -> c_int;
      type QueryDeviceFn = unsafe extern "C" fn(*mut c_void, c_int, *mut c_int) -> *mut c_void;
      type SelectEventsFn = unsafe extern "C" fn(*mut c_void, c_ulong, *mut X11EventMask, c_int) -> c_int;

      macro_rules! symbol {
        ($lib:expr, $name:literal, $ty:ty) => {
          *$lib.get::<$ty>(concat!($name, "\0").as_bytes())
            .map_err(|err| anyhow!("pen reader: missing symbol {}: {}", $name, err))?
        };
      }

      Ok(X11Api {
        x_open_display: symbol!(x11_handle, "XOpenDisplay", DisplayFn),
        x_close_display: symbol!(x11_handle, "XCloseDisplay", CloseDisplayFn),
        x_default_root_window: symbol!(x11_handle, "XDefaultRootWindow", RootWindowFn),
        x_pending: symbol!(x11_handle, "XPending", PendingFn),
        x_next_event: symbol!(x11_handle, "XNextEvent", NextEventFn),
        x_get_event_data: symbol!(x11_handle, "XGetEventData", GetEventDataFn),
        x_free_event_data: symbol!(x11_handle, "XFreeEventData", FreeEventDataFn),
        x_free: symbol!(x11_handle, "XFree", FreeFn),
        x_query_tree: symbol!(x11_handle, "XQueryTree", QueryTreeFn),
        x_intern_atom: symbol!(x11_handle, "XInternAtom", InternAtomFn),
        x_get_window_property: symbol!(x11_handle, "XGetWindowProperty", GetWindowPropertyFn),
        x_translate_coordinates: symbol!(x11_handle, "XTranslateCoordinates", TranslateCoordsFn),
        x_set_error_handler: symbol!(x11_handle, "XSetErrorHandler", SetErrorHandlerFn),
        xi_query_version: symbol!(xi_handle, "XIQueryVersion", QueryVersionFn),
        xi_query_device: symbol!(xi_handle, "XIQueryDevice", QueryDeviceFn),
        xi_select_events: symbol!(xi_handle, "XISelectEvents", SelectEventsFn),
        x11_handle,
        xi_handle,
      })
    }
  }

  /// Opens the display and runs the reader loop.
  unsafe fn run(
    &self,
    app: AppHandle,
    capture_state: Arc<PenCaptureState>,
  ) -> anyhow::Result<()> {
    unsafe {
      let display = (self.x_open_display)(std::ptr::null());
      if display.is_null() {
        return Err(anyhow!("pen reader: XOpenDisplay(NULL) failed"));
      }

      let result = self.run_inner(&app, display, capture_state);
      (self.x_close_display)(display);
      result
    }
  }

  unsafe fn run_inner(
    &self,
    app: &AppHandle,
    display: *mut c_void,
    capture_state: Arc<PenCaptureState>,
  ) -> anyhow::Result<()> {
    unsafe {
      let mut xi_major = 2;
      let mut xi_minor = 3;
      if (self.xi_query_version)(display, &mut xi_major, &mut xi_minor) == X_FALSE {
        return Err(anyhow!("pen reader: XInput version 2.x unavailable"));
      }
      log::info!("pen reader: XInput {}.{} available", xi_major, xi_minor);

      let root = (self.x_default_root_window)(display);
      let net_wm_pid_atom = self.intern_pid_atom(display);
      let our_pid = std::process::id() as c_ulong;

      let devices = self.scan_pen_devices(display);
      log::info!("pen reader: tracking {} pen devices", devices.len());

      let mut state = ReaderLoop {
        top_level_windows: Vec::new(),
        devices,
        device_down_state: Mutex::new(HashMap::new()),
        last_emit: Mutex::new(None),
        last_window_scan: Instant::now(),
      };
      self.scan_and_select_windows(display, root, net_wm_pid_atom, our_pid, &mut state);

      let event_buffer: [c_char; 192] = [0; 192];
      let mut event_buffer = event_buffer;

      loop {
        if (self.x_pending)(display) == 0 {
          if state.last_window_scan.elapsed() >= WINDOW_SCAN_INTERVAL {
            self.scan_and_select_windows(display, root, net_wm_pid_atom, our_pid, &mut state);
            state.last_window_scan = Instant::now();
          }
          std::thread::sleep(EVENT_POLL_INTERVAL);
          continue;
        }

        if (self.x_next_event)(display, event_buffer.as_mut_ptr()) != 0 {
          break;
        }

        if (*(event_buffer.as_ptr() as *const c_int)) != GENERIC_EVENT_CODE {
          continue;
        }
        let cookie = &*(event_buffer.as_ptr() as *const GenericEventCookie);
        let is_relevant_event = matches!(
          cookie.event_type,
          XI_BUTTON_PRESS | XI_BUTTON_RELEASE | XI_MOTION | XI_PROXIMITY_IN | XI_PROXIMITY_OUT
        );
        if (cookie.display as usize) != (display as usize) || cookie.data.is_null() || !is_relevant_event {
          continue;
        }

        if (self.x_get_event_data)(display, event_buffer.as_mut_ptr() as *mut GenericEventCookie) == X_FALSE {
          continue;
        }

        let device_event = cookie.data as *const XIDeviceEventFields;
        let config = state.devices.get(&((*device_event).device_id as i32)).copied();

        if let Some(config) = config {
          self.handle_device_event(app, display, root, device_event, config, &mut state, &capture_state);
        }

        (self.x_free_event_data)(display, event_buffer.as_mut_ptr() as *mut GenericEventCookie);
      }

      Err(anyhow!("pen reader: event loop ended"))
    }
  }

  /// Reads one XI2 device event and forwards it to the frontend when relevant.
  unsafe fn handle_device_event(
    &self,
    app: &AppHandle,
    display: *mut c_void,
    root: c_ulong,
    device_event: *const XIDeviceEventFields,
    config: PenDeviceConfig,
    state: &mut ReaderLoop,
    capture_state: &Arc<PenCaptureState>,
  ) {
    unsafe {
      let event = &*device_event;
      if matches!(event.event_type, XI_PROXIMITY_IN | XI_PROXIMITY_OUT) {
        return; // Hover visibility is derived from motion events instead.
      }

      let device_key = config.device_id as i32;
      let is_down = self.is_any_button_pressed(event);
      let was_down = state.device_down_state.lock().map(|guard| guard.get(&device_key).copied().unwrap_or(false)).unwrap_or(false);

      let kind = match event.event_type {
        XI_BUTTON_PRESS => {
          if was_down {
            return;
          }
          PenEventKind::Down
        }
        XI_BUTTON_RELEASE => {
          if is_down {
            return;
          }
          PenEventKind::Up
        }
        XI_MOTION => PenEventKind::Move,
        _ => return,
      };

      let located = self.locate_window_under_point(display, root, event.root_x, event.root_y, &state.top_level_windows);

      // A different tool taking over (pen <-> eraser) ends the previous stroke
      // so the frontend never sees overlapping strokes.
      if kind == PenEventKind::Down {
        if let Ok(mut guard) = state.device_down_state.lock() {
          for (device_id, down) in guard.iter_mut() {
            if *down && *device_id != device_key {
              *down = false;
              let _ = app.emit("pen-event", PenEventPayload {
                kind: PenEventKind::Up,
                x: 0,
                y: 0,
                pressure: 0.0,
                is_eraser: false,
                is_barrel_pressed: false,
                is_down: false,
                device_id: *device_id,
                window_id: 0,
              });
            }
          }
        }
      }

      match located {
        Some((window_id, x, y)) => {
          // While capture is idle, pointless hover traffic is dropped.
          if !capture_state.is_active() && kind == PenEventKind::Move && !is_down {
            return;
          }
          if kind == PenEventKind::Move {
            if let Ok(mut guard) = state.last_emit.lock() {
              let now = Instant::now();
              if let Some(last) = *guard {
                if now.duration_since(last) < EMIT_INTERVAL {
                  return;
                }
              }
              *guard = Some(now);
            }
          }
          if let Ok(mut guard) = state.device_down_state.lock() {
            guard.insert(device_key, is_down);
          }

          let _ = app.emit("pen-event", PenEventPayload {
            kind,
            x,
            y,
            pressure: self.extract_pressure(event, config),
            is_eraser: config.is_eraser
              || self.mask_bit_pressed(event.button_mask, event.button_mask_len, BUTTON_ERASER_BIT),
            is_barrel_pressed: self.mask_bit_pressed(event.button_mask, event.button_mask_len, BUTTON_BARREL_BIT),
            is_down,
            device_id: device_key,
            window_id,
          });
        }
        None => {
          // Pen left all our windows mid-stroke: end it now so the frontend
          // never waits for a release that would arrive outside the webview.
          if was_down {
            if let Ok(mut guard) = state.device_down_state.lock() {
              guard.insert(device_key, false);
            }
            let _ = app.emit("pen-event", PenEventPayload {
              kind: PenEventKind::Up,
              x: 0,
              y: 0,
              pressure: 0.0,
              is_eraser: config.is_eraser,
              is_barrel_pressed: false,
              is_down: false,
              device_id: device_key,
              window_id: 0,
            });
          }
        }
      }
    }
  }

  /// Walks the child-return chain from the root window down to the deepest
  /// native window under the pointer. Returns `None` when the point is not
  /// over one of the app's top-level windows.
  unsafe fn locate_window_under_point(
    &self,
    display: *mut c_void,
    root: c_ulong,
    root_x: f64,
    root_y: f64,
    top_level_windows: &[c_ulong],
  ) -> Option<(u64, i32, i32)> {
    unsafe {
      let x = root_x.floor() as c_int;
      let y = root_y.floor() as c_int;

      let mut found_top_level = None;
      for top_level in top_level_windows.iter().copied() {
        let mut ignored_x = 0;
        let mut ignored_y = 0;
        let mut child = X_NONE;
        if (self.x_translate_coordinates)(display, root, top_level, x, y, &mut ignored_x, &mut ignored_y, &mut child) == 0 {
          continue;
        }
        // A nonzero child return proves the point is inside this app window;
        // overlaps resolve to whichever top-level appears first in stacking
        // order, which matches what the user sees.
        if child != X_NONE {
          found_top_level = Some(top_level);
          break;
        }
      }
      let top_level = found_top_level?;

      // Descend into subwindows: the webview surface is the deepest window in
      // this chain and its coordinate space is the webview viewport.
      let mut deepest = top_level;
      let mut deeper = None;
      for _ in 0..8 {
        let mut out_x = 0;
        let mut out_y = 0;
        let mut child = X_NONE;
        if (self.x_translate_coordinates)(display, root, deepest, x, y, &mut out_x, &mut out_y, &mut child) == 0 {
          break;
        }
        if child == X_NONE {
          break;
        }
        deepest = child;
        deeper = Some(child);
      }

      let mut final_x = 0;
      let mut final_y = 0;
      let mut final_child = X_NONE;
      if (self.x_translate_coordinates)(display, root, deepest, x, y, &mut final_x, &mut final_y, &mut final_child) == 0 {
        return None;
      }

      Some((deeper.map(|window| window as u64).unwrap_or(top_level as u64), final_x, final_y))
    }
  }

  /// Resolves the `_NET_WM_PID` atom for the window scan.
  unsafe fn intern_pid_atom(&self, display: *mut c_void) -> c_ulong {
    unsafe { (self.x_intern_atom)(display, b"_NET_WM_PID\0".as_ptr() as *const c_char, X_FALSE) }
  }

  /// Scans root children for this process's top-level windows and (re)installs
  /// the XI2 device event masks on the root window and every found window.
  unsafe fn scan_and_select_windows(
    &self,
    display: *mut c_void,
    root: c_ulong,
    net_wm_pid_atom: c_ulong,
    our_pid: c_ulong,
    state: &mut ReaderLoop,
  ) {
    unsafe {
      let mut new_windows = Vec::new();
      if !state.devices.is_empty() {
        let mut root_return = X_NONE;
        let mut parent_return = X_NONE;
        let mut children: *mut c_ulong = std::ptr::null_mut();
        let mut child_count: c_uint = 0;
        if (self.x_query_tree)(display, root, &mut root_return, &mut parent_return, &mut children, &mut child_count) != 0 {
          if !children.is_null() {
            let children_slice = std::slice::from_raw_parts(children, child_count as usize);
            for child in children_slice {
              if *child == root {
                continue;
              }
              if self.window_pid(display, *child, net_wm_pid_atom) == Some(our_pid) {
                new_windows.push(*child);
              }
            }
            (self.x_free)(children as *mut c_void);
          }
        }
      }

      state.top_level_windows.clear();
      state.top_level_windows.extend(new_windows.iter().copied());

      if state.devices.is_empty() {
        return;
      }

      // Install masks on the root window (broad coverage) and on every app
      // top-level window (guaranteed delivery even when another client has
      // already selected the same masks on an overlapping window).
      let mask_bytes: [c_uchar; 4] = SELECT_MASK_U32.to_le_bytes();
      let mut masks: Vec<X11EventMask> = Vec::with_capacity(state.devices.len());
      for device_id in state.devices.keys() {
        masks.push(X11EventMask {
          device_id: *device_id as c_int,
          mask_len: mask_bytes.len() as c_int,
          mask: mask_bytes.as_ptr() as *mut c_uchar,
        });
      }
      for window in std::iter::once(root).chain(new_windows.iter().copied()) {
        if (self.xi_select_events)(display, window, masks.as_mut_ptr(), masks.len() as c_int) == 0 {
          log::warn!("pen reader: XISelectEvents on window 0x{:x} failed", window);
        }
      }
    }
  }

  unsafe fn window_pid(
    &self,
    display: *mut c_void,
    window: c_ulong,
    net_wm_pid_atom: c_ulong,
  ) -> Option<c_ulong> {
    unsafe {
      if net_wm_pid_atom == 0 {
        return None;
      }
      let mut actual_type = 0;
      let mut actual_format = 0;
      let mut n_items = 0;
      let mut bytes_after = 0;
      let mut prop_data: *mut c_uchar = std::ptr::null_mut();
      let result = (self.x_get_window_property)(
        display,
        window,
        net_wm_pid_atom,
        0,
        1,
        X_FALSE,
        0, // AnyPropertyType
        &mut actual_type,
        &mut actual_format,
        &mut n_items,
        &mut bytes_after,
        &mut prop_data,
      );
      if result == 0 || prop_data.is_null() {
        return None;
      }
      let maybe_pid = if actual_format == 32 && n_items >= 1 {
        Some(std::ptr::read_unaligned(prop_data as *const c_ulong))
      } else {
        None
      };
      if !prop_data.is_null() {
        (self.x_free)(prop_data as *mut c_void);
      }
      maybe_pid
    }
  }

  /// Enumerates X devices and picks the pen-like slaves: pointer slaves with a
  /// valuator axis that looks like pressure (`min == 0`, `max >= 100`, not the
  /// x/y axes).
  unsafe fn scan_pen_devices(&self, display: *mut c_void) -> HashMap<i32, PenDeviceConfig> {
    unsafe {
      let mut configs = HashMap::new();
      let mut device_count: c_int = 0;
      // XIDeviceInfo (64-bit layout): deviceid@0, pad@4, name*@8, use@16,
      // attachment@20, enabled@24, num_classes@28, pad@32, classes*@40.
      const DEVICE_STRIDE: usize = 48;
      const USE_OFFSET: usize = 16;
      const NUM_CLASSES_OFFSET: usize = 28;
      const CLASSES_OFFSET: usize = 40;
      // XIValuatorClassInfo (doubles first): type@0, sourceid@4, number@8,
      // label@12, min@16, max@24, value@32, resolution@40, mode@44.
      const VALUATOR_NUMBER_OFFSET: usize = 8;
      const VALUATOR_MIN_OFFSET: usize = 16;
      const VALUATOR_MAX_OFFSET: usize = 24;

      let infos_pointer = (self.xi_query_device)(display, XI_ALL_DEVICES, &mut device_count);
      if infos_pointer.is_null() {
        return configs;
      }

      for device_index in 0..device_count.max(0) as usize {
        let device = infos_pointer.add(device_index * DEVICE_STRIDE) as *const c_char;
        let device_id = std::ptr::read(device as *const c_int);
        let name_pointer = std::ptr::read(device.add(8) as *const *const c_char);
        let device_use = std::ptr::read(device.add(USE_OFFSET) as *const c_int);
        let num_classes = std::ptr::read(device.add(NUM_CLASSES_OFFSET) as *const c_int);

        if device_id < 0
          || (device_use != XI_SLAVE_POINTER && device_use != XI_FLOATING_SLAVE)
          || num_classes <= 0
          || name_pointer.is_null()
        {
          continue;
        }

        let classes = std::ptr::read(device.add(CLASSES_OFFSET) as *const *const *const c_uchar);
        let name = CStr::from_ptr(name_pointer).to_string_lossy().to_lowercase();

        let mut maybe_pressure_axis: Option<c_int> = None;
        let mut pressure_min = 0.0;
        let mut pressure_max = 0.0;
        for class_index in 0..num_classes as usize {
          let class = *classes.add(class_index);
          if class.is_null() {
            continue;
          }
          if std::ptr::read(class as *const c_int) != XI_VALUATOR_CLASS {
            continue;
          }
          let axis_number = std::ptr::read(class.add(VALUATOR_NUMBER_OFFSET) as *const c_int);
          let axis_min = std::ptr::read(class.add(VALUATOR_MIN_OFFSET) as *const f64);
          let axis_max = std::ptr::read(class.add(VALUATOR_MAX_OFFSET) as *const f64);
          if maybe_pressure_axis.is_none() && axis_number > 1 && axis_min == 0.0 && axis_max >= 100.0 {
            maybe_pressure_axis = Some(axis_number);
            pressure_min = axis_min;
            pressure_max = axis_max;
          }
        }

        if maybe_pressure_axis.is_none() {
          continue; // Not a pen tool (mice carry no pressure axis).
        }

        configs.insert(device_id as i32, PenDeviceConfig {
          device_id,
          is_eraser: name.contains("eraser"),
          maybe_pressure_axis,
          pressure_min,
          pressure_max,
        });
      }

      (self.x_free)(infos_pointer);
      configs
    }
  }

  unsafe fn is_any_button_pressed(&self, event: &XIDeviceEventFields) -> bool {
    unsafe {
      if event.button_mask.is_null() || event.button_mask_len <= 0 {
        return false;
      }
      (0..event.button_mask_len as usize)
        .any(|offset| std::ptr::read_unaligned(event.button_mask.add(offset)) != 0)
    }
  }

  unsafe fn mask_bit_pressed(&self, mask: *const c_uchar, mask_len: c_int, bit: usize) -> bool {
    unsafe {
      let byte_offset = bit / 8;
      if mask.is_null() || byte_offset >= mask_len.max(0) as usize {
        return false;
      }
      let byte = std::ptr::read_unaligned(mask.add(byte_offset));
      (byte >> (bit % 8)) & 1 == 1
    }
  }

  unsafe fn extract_pressure(&self, event: &XIDeviceEventFields, config: PenDeviceConfig) -> f32 {
    unsafe {
      let Some(axis_index) = config.maybe_pressure_axis else {
        return 1.0;
      };
      let Some(found) = self.valuator_value_at(event, axis_index as usize) else {
        return 0.0;
      };
      let range = (config.pressure_max - config.pressure_min).max(1.0);
      ((found - config.pressure_min) / range).clamp(0.0, 1.0) as f32
    }
  }

  /// Interprets the valuator mask/value pair: mask bit `target` set means the
  /// axis is present; the value position is the count of set mask bits below
  /// `target`.
  unsafe fn valuator_value_at(&self, event: &XIDeviceEventFields, target: usize) -> Option<f64> {
    unsafe {
      if event.valuator_mask.is_null() || event.valuator_values.is_null() || event.valuator_mask_len <= 0 {
        return None;
      }
      let mut set_bit_count = 0;
      let mut target_present = false;
      'outer: for byte_index in 0..event.valuator_mask_len as usize {
        let byte = std::ptr::read_unaligned(event.valuator_mask.add(byte_index));
        for bit in 0..8 {
          let axis = byte_index * 8 + bit;
          if (byte >> bit) & 1 == 1 {
            if axis == target {
              target_present = true;
              break 'outer;
            }
            set_bit_count += 1;
          }
        }
      }
      if !target_present {
        return None;
      }
      Some(*event.valuator_values.add(set_bit_count))
    }
  }
}
