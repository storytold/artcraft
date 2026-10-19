use std::sync::atomic::AtomicI32;
use std::sync::atomic::Ordering::SeqCst;

pub const NOT_ACTIVE: i32 = 0;
pub const ACTIVE: i32 = 1;

/// Tracks whether any drawing surface currently wants to receive native pen
/// input events (Linux only; see `x11_pen_reader`).
///
/// The frontend mounts/unmounts drawing surfaces and calls the
/// `enable_pen_capture` / `disable_pen_capture` commands. The X11 reader
/// thread consults this state before replying to events, so idle pages do not
/// chew IPC bandwidth on every pen hover on the desktop.
#[derive(Debug, Default)]
pub struct PenCaptureState {
  surface_count: AtomicI32,
}

impl PenCaptureState {
  pub fn is_active(&self) -> bool {
    self.surface_count.load(SeqCst) > 0
  }

  pub fn enable(&self) {
    self.surface_count.fetch_add(1, SeqCst);
  }

  pub fn disable(&self) {
    self.surface_count.fetch_sub(1, SeqCst);
  }
}
