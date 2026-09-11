use errors::AnyhowResult;
use tauri::{PhysicalSize, Window};

// A typical height difference when dev tools are open:
//   Window inner size = PhysicalSize { width: 3704, height: 732 }
//   Window outer size = PhysicalSize { width: 3704, height: 1476 }
const DEV_TOOLS_HEIGHT_DIFFERENCE_THRESHOLD: u32 = 300;

/// Get the best window size
pub fn get_window_size_heuristic(window: &Window) -> AnyhowResult<PhysicalSize<u32>> {
  // NB: Ordinarily we'd use inner size, as the outer size includes the window decorations.
  // However, dev tools contract the inner size, and in the event they're open, we should 
  // prefer the outer size.
  let inner = window.inner_size()?;
  let outer = window.outer_size()?;

  let height_delta = outer.height.saturating_sub(inner.height);
  if height_delta > DEV_TOOLS_HEIGHT_DIFFERENCE_THRESHOLD {
    // Dev tools are open, use the outer size
    Ok(outer)
  } else {
    // Dev tools are not open, use the inner size
    Ok(inner)
  }
}
