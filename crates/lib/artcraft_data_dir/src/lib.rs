//! Where ArtCraft keeps its data: `~/Artcraft`, unless `ARTCRAFT_DATA_DIR` names another folder.
//!
//! The Tauri app (`AppDataRoot`) and artcraft-native share this folder, so both resolve it here.

use std::ffi::OsString;
use std::path::{is_separator, Path, PathBuf};

use anyhow::anyhow;
use directories::UserDirs;
use log::{info, warn};

/// Set to an absolute path (or one starting with `~`) to use that folder instead of
/// `~/Artcraft`. Unset or blank means the default.
pub const DATA_DIR_ENV_VAR: &str = "ARTCRAFT_DATA_DIR";

/// The default folder name, in the user's home directory.
pub const DEFAULT_DATA_DIR_NAME: &str = "Artcraft";

/// The data directory and where the choice came from.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct DataDir {
  pub path: PathBuf,
  pub source: DataDirSource,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum DataDirSource {
  /// `~/Artcraft`, because `ARTCRAFT_DATA_DIR` isn't set (or is blank).
  Default,

  /// The folder named by `ARTCRAFT_DATA_DIR`.
  EnvVar,

  /// `ARTCRAFT_DATA_DIR` is set to something unusable, so `~/Artcraft` is used.
  /// Holds the reason, for the log.
  IgnoredEnvVar(String),
}

impl DataDir {
  /// Reads `ARTCRAFT_DATA_DIR` and falls back to `~/Artcraft`.
  ///
  /// The folder isn't created here. Fails only when the default is needed and there is no
  /// home directory.
  pub fn resolve() -> anyhow::Result<Self> {
    let maybe_home = UserDirs::new().map(|dirs| dirs.home_dir().to_path_buf());
    resolve_from(std::env::var_os(DATA_DIR_ENV_VAR), maybe_home.as_deref())
  }

  /// Logs `describe()`, as a warning when `ARTCRAFT_DATA_DIR` was ignored.
  pub fn log_choice(&self) {
    match self.source {
      DataDirSource::IgnoredEnvVar(_) => warn!("{}", self.describe()),
      DataDirSource::Default | DataDirSource::EnvVar => info!("{}", self.describe()),
    }
  }

  /// A line for the startup log.
  pub fn describe(&self) -> String {
    match &self.source {
      DataDirSource::Default => format!("App data directory: {:?}", self.path),
      DataDirSource::EnvVar => format!("App data directory (from {}): {:?}", DATA_DIR_ENV_VAR, self.path),
      DataDirSource::IgnoredEnvVar(reason) => format!("Ignoring {}: {}. App data directory: {:?}", DATA_DIR_ENV_VAR, reason, self.path),
    }
  }
}

fn resolve_from(maybe_value: Option<OsString>, maybe_home: Option<&Path>) -> anyhow::Result<DataDir> {
  let maybe_ignored_reason = match maybe_value.map(|value| parse_override(value, maybe_home)) {
    None | Some(Ok(None)) => None,
    Some(Ok(Some(path))) => return Ok(DataDir { path, source: DataDirSource::EnvVar }),
    Some(Err(reason)) => Some(reason),
  };

  let home = maybe_home.ok_or_else(|| anyhow!("could not determine user home directory"))?;
  let path = home.join(DEFAULT_DATA_DIR_NAME);

  let source = match maybe_ignored_reason {
    Some(reason) => DataDirSource::IgnoredEnvVar(reason),
    None => DataDirSource::Default,
  };

  Ok(DataDir { path, source })
}

/// `Ok(None)` for a blank value, `Err` (with the reason) for one that can't be used.
fn parse_override(value: OsString, maybe_home: Option<&Path>) -> Result<Option<PathBuf>, String> {
  let path = match value.to_str() {
    // NB: A value that isn't UTF-8 can't be trimmed or have "~" in it; take it as it is.
    None => PathBuf::from(value),
    Some(value) => {
      let value = value.trim();
      if value.is_empty() {
        return Ok(None);
      }
      match expand_tilde(value, maybe_home)? {
        Some(path) => path,
        None => PathBuf::from(value),
      }
    },
  };

  // NB: A relative path would depend on the working directory, which is "/" when the app is
  // launched from Finder.
  if !path.is_absolute() {
    return Err(format!("{:?} is not an absolute path", path));
  }

  Ok(Some(path))
}

/// "~" and "~/rest" (also "~\rest" on Windows) are relative to the home directory.
/// Returns `None` when the value doesn't start that way, including "~user".
fn expand_tilde(value: &str, maybe_home: Option<&Path>) -> Result<Option<PathBuf>, String> {
  let rest = match value.strip_prefix('~') {
    Some(rest) if rest.is_empty() || rest.starts_with(is_separator) => rest,
    _ => return Ok(None),
  };
  let home = maybe_home.ok_or_else(|| format!("can't expand \"~\" in {:?} without a home directory", value))?;
  // NB: Joining an absolute path would replace the home directory ("~//x" is "~/x").
  Ok(Some(home.join(rest.trim_start_matches(is_separator))))
}

#[cfg(test)]
mod tests {
  use super::*;

  mod resolve_tests {
    use super::*;

    #[test]
    fn unset_uses_the_default() {
      let home = home();
      assert_eq!(resolve_from(None, Some(&home)).unwrap(), DataDir { path: home.join("Artcraft"), source: DataDirSource::Default });
    }

    #[test]
    fn blank_uses_the_default() {
      let home = home();
      for value in ["", "  ", "\t\n"] {
        let data_dir = resolve_from(Some(OsString::from(value)), Some(&home)).unwrap();
        assert_eq!(data_dir, DataDir { path: home.join("Artcraft"), source: DataDirSource::Default });
      }
    }

    #[test]
    fn absolute_path_is_used() {
      let dir = absolute_dir().join("artcraft data");
      let data_dir = resolve_from(Some(dir.clone().into_os_string()), Some(&home())).unwrap();
      assert_eq!(data_dir, DataDir { path: dir, source: DataDirSource::EnvVar });
    }

    #[test]
    fn surrounding_whitespace_is_trimmed() {
      let dir = absolute_dir().join("artcraft data");
      let value = format!("  {}\n", dir.to_str().unwrap());
      let data_dir = resolve_from(Some(OsString::from(value)), Some(&home())).unwrap();
      assert_eq!(data_dir.path, dir);
    }

    #[test]
    fn absolute_path_works_without_a_home_directory() {
      let dir = absolute_dir().join("Artcraft");
      let data_dir = resolve_from(Some(dir.clone().into_os_string()), None).unwrap();
      assert_eq!(data_dir.path, dir);
    }

    #[test]
    fn relative_path_is_ignored() {
      let home = home();
      for value in ["Artcraft", "./data/Artcraft", "../Artcraft", "~bob/Artcraft"] {
        let data_dir = resolve_from(Some(OsString::from(value)), Some(&home)).unwrap();
        assert_eq!(data_dir.path, home.join("Artcraft"), "{value}");
        assert!(matches!(data_dir.source, DataDirSource::IgnoredEnvVar(_)), "{value}");
      }
    }

    #[test]
    fn tilde_expands_to_the_home_directory() {
      let home = home();
      let cases = [("~", home.clone()), ("~/", home.clone()), ("~/Library/Application Support/Artcraft", home.join("Library/Application Support/Artcraft")), ("~//Artcraft", home.join("Artcraft"))];
      for (value, expected) in cases {
        let data_dir = resolve_from(Some(OsString::from(value)), Some(&home)).unwrap();
        assert_eq!(data_dir, DataDir { path: expected, source: DataDirSource::EnvVar }, "{value}");
      }
    }

    #[test]
    fn tilde_without_a_home_directory_is_an_error() {
      assert!(resolve_from(Some(OsString::from("~/Artcraft")), None).is_err());
    }

    #[test]
    fn no_home_directory_and_no_override_is_an_error() {
      assert!(resolve_from(None, None).is_err());
    }

    #[test]
    fn describe_names_the_source() {
      let home = home();
      let ignored = resolve_from(Some(OsString::from("Artcraft")), Some(&home)).unwrap();
      assert!(ignored.describe().starts_with("Ignoring ARTCRAFT_DATA_DIR: \"Artcraft\" is not an absolute path."));
      let set = resolve_from(Some(absolute_dir().into_os_string()), Some(&home)).unwrap();
      assert!(set.describe().starts_with("App data directory (from ARTCRAFT_DATA_DIR): "));
    }
  }

  #[cfg(windows)]
  mod windows_tests {
    use super::*;

    #[test]
    fn drive_unc_and_verbatim_paths_are_used() {
      for value in [r"D:\Artcraft", "D:/Artcraft", r"\\server\share\Artcraft", r"\\?\D:\Artcraft"] {
        let data_dir = resolve_from(Some(OsString::from(value)), Some(&home())).unwrap();
        assert_eq!(data_dir, DataDir { path: PathBuf::from(value), source: DataDirSource::EnvVar }, "{value}");
      }
    }

    #[test]
    fn drive_relative_and_root_relative_paths_are_ignored() {
      for value in [r"D:Artcraft", r"\Artcraft"] {
        let data_dir = resolve_from(Some(OsString::from(value)), Some(&home())).unwrap();
        assert!(matches!(data_dir.source, DataDirSource::IgnoredEnvVar(_)), "{value}");
      }
    }

    #[test]
    fn tilde_with_a_backslash_expands() {
      let home = home();
      let data_dir = resolve_from(Some(OsString::from(r"~\Artcraft")), Some(&home)).unwrap();
      assert_eq!(data_dir.path, home.join("Artcraft"));
    }
  }

  fn home() -> PathBuf {
    absolute_dir().join("home").join("alice")
  }

  /// An absolute path on this platform.
  fn absolute_dir() -> PathBuf {
    if cfg!(windows) { PathBuf::from(r"C:\data") } else { PathBuf::from("/data") }
  }
}
