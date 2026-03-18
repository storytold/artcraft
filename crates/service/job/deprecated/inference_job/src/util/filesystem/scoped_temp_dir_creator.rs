use std::path::{Path, PathBuf};

use tempdir::TempDir;

/// This utility will always create TempDirs at a specific mount path.
/// This is useful for k8s deployments where we may need our TempDirs
/// to live on a specific volume.
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

  pub fn get_base_dir(&self) -> &Path {
    &self.base_dir
  }

  pub fn new_tempdir(&self, name: &str) -> std::io::Result<TempDir> {
    TempDir::new_in(&self.base_dir, name)
  }
}
