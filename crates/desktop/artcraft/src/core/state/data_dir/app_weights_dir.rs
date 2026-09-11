use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use std::path::{Path, PathBuf};

#[derive(Clone)]
pub struct AppWeightsDir {
  path: PathBuf,
}

impl DataSubdir for AppWeightsDir {
  const DIRECTORY_NAME: &'static str = "weights";

  fn new_from<P: AsRef<Path>>(dir: P) -> Self {
    Self {
      path: dir.as_ref().to_path_buf(),
    }
  }

  fn path(&self) -> &Path {
    &self.path
  }
}
