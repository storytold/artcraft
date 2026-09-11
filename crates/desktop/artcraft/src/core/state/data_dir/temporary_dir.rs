use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use std::path::{Path, PathBuf};
use tempdir::TempDir;
use tempfile::{Builder, NamedTempFile};

#[derive(Clone)]
pub struct TemporaryDir {
  path: PathBuf,
}

impl DataSubdir for TemporaryDir {
  const DIRECTORY_NAME: &'static str = "temp";

  fn new_from<P: AsRef<Path>>(dir: P) -> Self {
    Self {
      path: dir.as_ref().to_path_buf(),
    }
  }

  fn path(&self) -> &Path {
    &self.path
  }
}

impl TemporaryDir {
  pub fn with_prefix(&self, prefix: &str) -> anyhow::Result<TempDir> {
    let tempdir = TempDir::new_in(&self.path, prefix)?;
    Ok(tempdir)
  }

  pub fn new_named_temp_file(&self) -> anyhow::Result<NamedTempFile> {
    let tempfile = Builder::new()
        .prefix("temp_")
        .suffix(".bin")
        .tempfile_in(&self.path)?;
    Ok(tempfile)
  }

  pub fn new_named_temp_file_with_extension(&self, extension: &str) -> Result<NamedTempFile, std::io::Error> {
    let extension = if extension.starts_with(".") {
      extension.to_string()
    } else {
      format!(".{}", extension)
    };
    let tempfile = Builder::new()
        .prefix("temp_")
        .suffix(&extension)
        .tempfile_in(&self.path)?;
    Ok(tempfile)
  }
}
