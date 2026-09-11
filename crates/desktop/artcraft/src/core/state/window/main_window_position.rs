use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::windows::main_window::constants::MAIN_WINDOW_NAME;
use errors::AnyhowResult;
use serde_derive::{Deserialize, Serialize};
use std::fs::OpenOptions;
use std::io::Write;
use tauri::{AppHandle, Manager, PhysicalPosition, Window};

#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq)]
pub struct MainWindowPosition {
  pub x: i32,
  pub y: i32,
}

impl MainWindowPosition {
  pub fn new(x: i32, y: i32) -> Self {
    Self { x, y }
  }

  pub fn from_main_window(app: &AppHandle) -> AnyhowResult<Self> {
    let windows = app.windows();
    windows.get(MAIN_WINDOW_NAME)
        .map(|window| Self::from_window(window))
        .unwrap_or_else(|| Err(anyhow::anyhow!("Main window not found")))
  }

  pub fn from_window(window: &Window) -> AnyhowResult<Self> {
    let position = window.outer_position()?;
    Ok(Self {
      x: position.x,
      y: position.y,
    })
  }

  pub fn from_filesystem_configs(app_data_root: &AppDataRoot) -> AnyhowResult<Option<Self>> {
    let filename = app_data_root.get_window_position_config_file();
    if !filename.exists() {
      return Ok(None);
    }
    let contents = std::fs::read_to_string(filename)?;
    let pos : MainWindowPosition = serde_json::from_str(&contents)?;
    Ok(Some(pos))
  }

  pub fn persist_to_filesystem(&self, app_data_root: &AppDataRoot) -> AnyhowResult<()> {
    let filename = app_data_root.get_window_position_config_file();
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

  pub fn to_physical_position(&self) -> PhysicalPosition<i32> {
    PhysicalPosition::new(self.x, self.y)
  }

  pub fn matches_physical_position(&self, pos: &PhysicalPosition<i32>) -> bool {
    self.x == pos.x && self.y == pos.y
  }
}
