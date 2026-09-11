use crate::core::state::window::main_window_position::MainWindowPosition;
use crate::core::windows::main_window::constants::MAIN_WINDOW_NAME;
use errors::AnyhowResult;
use tauri::{AppHandle, Manager, PhysicalPosition};

/// Try to position the main window at startup.
/// If it doesn't meet certain placement heuristics, abandon manual placement and let the OS
/// decide where to place the app.
pub fn position_main_window(
  app: &AppHandle,
  position: &MainWindowPosition,
) -> AnyhowResult<()> {

  // NB: This non-negative position heuristic is good for MacBook (single screen).
  // Not sure how this fares on Windows, Linux, or multiscreen setups.
  // On Mac, this prevents the windows from being positioned off to the top-left,
  // as (0,0) is the top left directly under the top menu bar.
  if position.x < 0 {
    // TODO(bt,2025-07-16): just in the case of x/width, allow slight placement off
    //  screen as long as the app is wide enough.
    return Err(anyhow::anyhow!("X position must be non-negative"));
  } else if position.y < 0 {
    return Err(anyhow::anyhow!("Y position must be non-negative"));
  }

  let windows = app.windows();

  let window = windows.get(MAIN_WINDOW_NAME)
      .ok_or_else(|| anyhow::anyhow!("Main window not found"))?;

  if let Ok(Some(monitor)) = window.current_monitor() {
    // Reports the size of the monitor, e.g. PhysicalSize { width: 4112, height: 2658 }
    // This is not impacted by `scale_factor`, even if that's a multiple like "2".
    // i.e., positioning the app at `monitor.size().width/2` and `monitor.size().height/2`
    // will place the **top left corner of the app** in roughly the center of the monitor.
    let monitor_size = monitor.size();

    println!("Current monitor - size: {:?}", monitor_size);
    println!("Current monitor - scale factor: {:?}", monitor.scale_factor());
    println!("Current monitor - position: {:?}", monitor.position());

    let width_padding = monitor_size.width.div_ceil(6);
    let height_padding = monitor_size.height.div_ceil(6);

    let max_width = monitor_size.width.saturating_sub(width_padding);
    let max_height = monitor_size.height.saturating_sub(height_padding);

    let max_width = i32::try_from(max_width)?;
    let max_height = i32::try_from(max_height)?;

    // Prevent the window from being positioned off the screen to the bottom, right, and bottom right.
    // This works on MacBook (single screen), but should be tested on Windows, Linux, and multiscreen setups.
    if position.x > max_width {
      return Err(anyhow::anyhow!("X position must be less than or equal to {} (monitor width {})",
        max_width, monitor_size.width));
    } else if position.y > max_height {
      return Err(anyhow::anyhow!("Y position must be less than or equal to {} (monitor height {})",
        max_height, monitor_size.height));
    }
  }

  window.set_position(PhysicalPosition::new(position.x, position.y))?;

  Ok(())
}