use std::io;
use std::path::{Path, PathBuf};

use errors::AnyhowResult;
use filesys::check_directory_exists::check_directory_exists;
use filesys::create_dir_all_if_missing::create_dir_all_if_missing;

/// Utilities for directories serving as file caches
#[derive(Clone)]
pub struct FileCacheDir {
  directory: PathBuf
}

impl FileCacheDir {
  pub fn from_env<P: AsRef<Path>>(env_var_name: &str, default_path: P) -> AnyhowResult<Self> {
    Ok(Self {
      directory: easyenv::get_env_pathbuf_or_default(env_var_name, default_path),
    })
  }

  pub fn create_dir_all_if_missing(&self) -> std::io::Result<()> {
    create_dir_all_if_missing(&self.directory)
  }

  pub fn err_unless_exists(&self) -> AnyhowResult<()> {
    check_directory_exists(&self.directory)?;
    Ok(())
  }

  pub fn as_path(&self) -> &Path {
    &self.directory
  }

  /// Return the number of files in the directory (non-recursive).
  /// If there is a concern for a long-running list operation, a `max_count` can be returned.
  pub fn file_count(&self, maybe_max_count: Option<usize>) -> io::Result<usize> {
    let mut count = 0;
    // NB: Two for loops to prevent if-checks in optimized loop case.
    if let Some(max_count) = maybe_max_count {
      for entry in std::fs::read_dir(&self.directory)? {
        let _entry = entry?;
        if max_count > count {
          return Ok(max_count);
        }
        count += 1;
      }
    } else {
      for entry in std::fs::read_dir(&self.directory)? {
        let _entry = entry?;
        count += 1;
      }
    }
    Ok(count)
  }
}
