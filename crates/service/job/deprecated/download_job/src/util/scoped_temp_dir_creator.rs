use std::path::{Path, PathBuf};

use tempdir::TempDir;

#[derive(Clone)]
pub struct ScopedTempDirCreator {
  base_dir: PathBuf,
}

impl ScopedTempDirCreator {

  pub fn for_directory<P: AsRef<Path>>(base_dir: P) -> Self {
    Self {
      base_dir: PathBuf::from(&base_dir.as_ref()),
    }
  }

  pub fn new_tempdir(&self, name: &str) -> std::io::Result<TempDir> {
    TempDir::new_in(&self.base_dir, name)
  }
}