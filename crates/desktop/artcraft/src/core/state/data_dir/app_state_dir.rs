use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use crate::core::state::task_database_version::TASK_DATABASE_VERSION;
use std::path::{Path, PathBuf};

#[derive(Clone)]
pub struct AppStateDir {
  path: PathBuf,
}

impl DataSubdir for AppStateDir{
  const DIRECTORY_NAME: &'static str = "state";

  fn new_from<P: AsRef<Path>>(dir: P) -> Self {
    Self {
      path: dir.as_ref().to_path_buf(),
    }
  }

  fn path(&self) -> &Path {
    &self.path
  }
}

impl AppStateDir {
  pub fn get_tasks_sqlite_database_path(&self) -> PathBuf {
    // NB: This must be incremented on any change to the database schema (including comments).
    // The database houses ephemeral content and will be migrated automatically.
    self.path.join(format!("tasks_v{TASK_DATABASE_VERSION}.sqlite"))
  }

  pub fn get_window_size_config_file(&self) -> PathBuf {
    self.path.join("window_size.json")
  }

  pub fn get_window_position_config_file(&self) -> PathBuf {
    self.path.join("window_position.json")
  }
}
