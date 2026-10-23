//! Atomic replacement for small credential files. Unix permissions are explicit;
//! on other platforms files inherit the credential directory's access controls.

use std::fs::{self, File};
use std::io::{self, Write};
use std::path::Path;

/// Create or tighten a directory dedicated to credentials. Do not use on a
/// general-purpose parent (for example the user's home or temporary directory).
pub fn ensure_private_directory(path: &Path) -> io::Result<()> {
  let mut builder = fs::DirBuilder::new();
  builder.recursive(true);
  #[cfg(unix)]
  {
    use std::os::unix::fs::DirBuilderExt;
    builder.mode(0o700);
  }
  builder.create(path)?;
  #[cfg(unix)]
  {
    use std::os::unix::fs::PermissionsExt;
    fs::set_permissions(path, fs::Permissions::from_mode(0o700))?;
  }
  Ok(())
}

/// Replace a file only after the new contents have been completely written and
/// synced. A failed write leaves the old file intact and removes the temporary.
pub fn write_private_atomic(path: &Path, contents: &[u8]) -> io::Result<()> {
  replace_with(path, |file| file.write_all(contents))
}

fn replace_with(path: &Path, write: impl FnOnce(&mut File) -> io::Result<()>) -> io::Result<()> {
  let parent = path.parent().filter(|p| !p.as_os_str().is_empty()).unwrap_or_else(|| Path::new("."));
  let mut temp = tempfile::Builder::new().prefix(".credential-").tempfile_in(parent)?;
  #[cfg(unix)]
  {
    use std::os::unix::fs::PermissionsExt;
    temp.as_file().set_permissions(fs::Permissions::from_mode(0o600))?;
  }
  write(temp.as_file_mut())?;
  temp.as_file().sync_all()?;
  temp.persist(path).map_err(|err| err.error)?;
  Ok(())
}

#[cfg(test)]
mod tests {
  use super::*;

  mod replacement_tests {
    use super::*;

    #[test]
    fn interrupted_write_keeps_previous_value_and_cleans_temporary() {
      let dir = tempfile::tempdir().unwrap();
      let path = dir.path().join("key");
      write_private_atomic(&path, b"old synthetic key").unwrap();
      assert!(replace_with(&path, |file| {
        file.write_all(b"partial")?;
        Err(io::Error::new(io::ErrorKind::Interrupted, "simulated interrupted write"))
      }).is_err());
      assert_eq!(fs::read(&path).unwrap(), b"old synthetic key");
      assert_eq!(fs::read_dir(dir.path()).unwrap().count(), 1);
      write_private_atomic(&path, b"new synthetic key").unwrap();
      assert_eq!(fs::read(&path).unwrap(), b"new synthetic key");
    }

    #[cfg(unix)]
    #[test]
    fn creates_and_replaces_with_private_modes_under_permissive_umask() {
      use std::os::unix::fs::PermissionsExt;
      const CHILD: &str = "ARTCRAFT_PRIVATE_FILE_TEST_CHILD";
      if std::env::var_os(CHILD).is_none() {
        let status = std::process::Command::new("sh").args(["-c", "umask 000; exec \"$1\" \"$2\" --exact", "private-file-test"]).arg(std::env::current_exe().unwrap()).arg("private_file::tests::replacement_tests::creates_and_replaces_with_private_modes_under_permissive_umask").env(CHILD, "1").status().unwrap();
        assert!(status.success());
        return;
      }
      let dir = tempfile::tempdir().unwrap();
      let credentials = dir.path().join("credentials");
      fs::create_dir(&credentials).unwrap();
      fs::set_permissions(&credentials, fs::Permissions::from_mode(0o777)).unwrap();
      ensure_private_directory(&credentials).unwrap();
      assert_eq!(fs::metadata(&credentials).unwrap().permissions().mode() & 0o777, 0o700);
      let path = credentials.join("key");
      write_private_atomic(&path, b"first").unwrap();
      assert_eq!(fs::metadata(&path).unwrap().permissions().mode() & 0o777, 0o600);
      fs::set_permissions(&path, fs::Permissions::from_mode(0o644)).unwrap();
      write_private_atomic(&path, b"replacement").unwrap();
      assert_eq!(fs::metadata(&path).unwrap().permissions().mode() & 0o777, 0o600);
    }
  }
}
