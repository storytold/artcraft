use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::utils::window::get_window_size_heuristic::get_window_size_heuristic;
use crate::core::windows::main_window::constants::{MAIN_WINDOW_MIN_HEIGHT, MAIN_WINDOW_MIN_WIDTH, MAIN_WINDOW_NAME};
use errors::AnyhowResult;
use serde_derive::{Deserialize, Serialize};
use std::fs::OpenOptions;
use std::io::Write;
use tauri::{AppHandle, Manager, PhysicalSize, Window};


#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq)]
pub struct MainWindowSize {
  pub width: u32,
  pub height: u32,
}

impl MainWindowSize {
  pub fn new(width: u32, height: u32) -> Self {
    Self { width, height }
  }

  pub fn from_main_window(app: &AppHandle) -> AnyhowResult<Self> {
    let windows = app.windows();
    windows.get(MAIN_WINDOW_NAME)
        .map(|window| Self::from_window(window))
        .unwrap_or_else(|| Err(anyhow::anyhow!("Main window not found")))
  }

  pub fn from_window(window: &Window) -> AnyhowResult<Self> {
    let size = get_window_size_heuristic(window)?;
    Ok(Self {
      width: size.width,
      height: size.height,
    })
  }

  pub fn from_filesystem_configs(app_data_root: &AppDataRoot) -> AnyhowResult<Option<Self>> {
    let filename = app_data_root.get_window_size_config_file();
    if !filename.exists() {
      return Ok(None);
    }
    let contents = std::fs::read_to_string(filename)?;
    let size: MainWindowSize = serde_json::from_str(&contents)?;
    Ok(Some(size))
  }

  pub fn persist_to_filesystem(&self, app_data_root: &AppDataRoot) -> AnyhowResult<()> {
    let filename = app_data_root.get_window_size_config_file();
    let json = serde_json::to_string(self)?;
    let mut file = OpenOptions::new()
        .create(true)
        .write(true)
        .truncate(true)
        .open(filename)?;
    file.write_all(json.as_bytes())?;
    file.flush()?;
    Ok(())
  }

  /// Window size is not wide enough to persist or apply.
  pub fn is_not_wide_enough(&self) -> bool {
    self.width < MAIN_WINDOW_MIN_WIDTH
  }

  /// Window size is not tall enough to persist or apply.
  pub fn is_not_tall_enough(&self) -> bool {
    self.height < MAIN_WINDOW_MIN_HEIGHT
  }

  /// Window size is not big enough (tall or wide) to persist or apply.
  pub fn is_not_big_enough(&self) -> bool {
    self.is_not_wide_enough() || self.is_not_tall_enough()
  }

  pub fn to_physical_size(&self) -> PhysicalSize<u32> {
    PhysicalSize::new(self.width, self.height)
  }

  pub fn matches_physical_size(&self, size: &PhysicalSize<u32>) -> bool {
    self.width == size.width && self.height == size.height
  }
}
