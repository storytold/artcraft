use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use chrono::{DateTime, Local};
use std::path::{Path, PathBuf};

#[derive(Clone)]
pub struct AppAssetsDir {
  path: PathBuf,
}

impl  DataSubdir for AppAssetsDir {
  const DIRECTORY_NAME: &'static str = "assets";

  fn new_from<P: AsRef<Path>>(dir: P) -> Self {
    Self {
      path: dir.as_ref().to_path_buf(),
    }
  }

  fn path(&self) -> &Path {
    &self.path
  }
}

impl AppAssetsDir {
  /// Return the current date asset directory
  /// If it doesn't exist, create it.
  pub fn make_or_get_current_date_dir(&self) -> anyhow::Result<PathBuf> {
    let format: DateTime<Local> = Local::now();
    let date_directory_name = format.format("%Y-%d-%m").to_string();
    let full_path = self.path.join(date_directory_name);
    if !full_path.exists() {
      std::fs::create_dir(&full_path)?;
    }
    Ok(full_path)
  }
}
