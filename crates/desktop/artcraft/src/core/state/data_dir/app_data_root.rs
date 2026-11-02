use crate::core::state::data_dir::app_assets_dir::AppAssetsDir;
use crate::core::state::data_dir::app_credentials_dir::AppCredentialsDir;
use crate::core::state::data_dir::app_downloads_dir::AppDownloadsDir;
use crate::core::state::data_dir::app_settings_dir::AppSettingsDir;
use crate::core::state::data_dir::app_state_dir::AppStateDir;
use crate::core::state::data_dir::temporary_dir::TemporaryDir;
use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use crate::core::state::expanduser::expanduser;
use crate::core::state::os_platform::OsPlatform;
use anyhow::anyhow;
use directories::UserDirs;
use std::ffi::OsString;
use std::path::{Path, PathBuf};

const DEFAULT_DATA_DIR : &str = "Artcraft";

/// Overrides the default data directory when set to an absolute path (or one starting
/// with "~" on Linux and macOS), eg. ARTCRAFT_DATA_DIR="~/Library/Application Support/Artcraft"
const DATA_DIR_ENV_VAR : &str = "ARTCRAFT_DATA_DIR";

/// Note: Tauri appends ".log" to the end of the filename.
const LOG_FILE_NAME : &str = "artcraft_debug";

/// The path to the application data directory, which includes "asset" and "weights" data.
#[derive(Clone)]
pub struct AppDataRoot {
  path: PathBuf,
  
  log_file_name: PathBuf,
  log_file_name_string: String,
  
  assets_dir: AppAssetsDir,
  credentials_dir: AppCredentialsDir,
  downloads_dir: AppDownloadsDir,
  settings_dir: AppSettingsDir,
  state_dir: AppStateDir,
  temp_dir: TemporaryDir,
}

impl AppDataRoot {
  pub fn create_default() -> anyhow::Result<Self> {
    let directory = get_default_data_dir()?;
    println!("App data directory: {:?}", directory);
    Self::create_existing(directory)
  }

  pub fn create_existing<P: AsRef<Path>>(dir: P) -> anyhow::Result<Self> {
    let mut dir = dir.as_ref().to_path_buf();
    
    match OsPlatform::get() {
      OsPlatform::Linux | OsPlatform::MacOs => {
        if let Some(d) = dir.as_os_str().to_str() {
          dir = expanduser(d)?;
        }
      },
      OsPlatform::Windows => {}
    }
    
    if !dir.is_dir() {
      println!("Creating directory {:?}", dir);
      std::fs::create_dir_all(&dir)?;
    }

    match dir.canonicalize() {
      Ok(d) => dir = d,
      Err(err) => {
        println!("Error canonicalizing {:?}: {}", dir, err);
      }
    }
    
    let assets_dir = AppAssetsDir::get_or_create_in_root_dir(&dir)?;
    let credentials_dir = AppCredentialsDir::get_or_create_in_root_dir(&dir)?;
    let downloads_dir = AppDownloadsDir::get_or_create_in_root_dir(&dir)?;
    let settings_dir = AppSettingsDir::get_or_create_in_root_dir(&dir)?;
    let state_dir = AppStateDir::get_or_create_in_root_dir(&dir)?;
    let temp_dir = TemporaryDir::get_or_create_in_root_dir(&dir)?;
    let log_file_name = dir.join(LOG_FILE_NAME);
    let log_file_name_string = log_file_name
        .to_str()
        .ok_or(anyhow!("couldn't convert log path to str"))?
        .to_string();

    Ok(Self {
      path: dir,
      log_file_name,
      log_file_name_string,
      assets_dir,
      credentials_dir,
      downloads_dir,
      settings_dir,
      state_dir,
      temp_dir,
    })
  }
  
  pub fn assets_dir(&self) -> &AppAssetsDir {
    &self.assets_dir
  }

  pub fn credentials_dir(&self) -> &AppCredentialsDir {
    &self.credentials_dir
  }

  pub fn downloads_dir(&self) -> &AppDownloadsDir {
    &self.downloads_dir
  }

  pub fn settings_dir(&self) -> &AppSettingsDir {
    &self.settings_dir
  }
  
  pub fn state_dir(&self) -> &AppStateDir {
    &self.state_dir
  }

  pub fn temp_dir(&self) -> &TemporaryDir {
    &self.temp_dir
  }

  pub fn path(&self) -> &Path {
    &self.path
  }

  pub fn log_file_name(&self) -> &Path {
    &self.log_file_name
  }

  pub fn log_file_name_str(&self) -> &str {
    &self.log_file_name_string
  }

  pub fn get_sora_cookie_file_path(&self) -> PathBuf {
    self.credentials_dir().get_sora_cookie_file_path()
  }

  pub fn get_sora_bearer_token_file_path(&self) -> PathBuf {
    self.credentials_dir().get_sora_bearer_token_file_path()
  }

  pub fn get_sora_legacy_sentinel_file_path(&self) -> PathBuf {
    self.credentials_dir().get_sora_legacy_sentinel_file_path()
  }

  pub fn get_sora_sentinel_token_file_path(&self) -> PathBuf {
    self.credentials_dir().get_sora_sentinel_token_file_path()
  }

  pub fn get_window_size_config_file(&self) -> PathBuf {
    self.state_dir.get_window_size_config_file()
  }
  
  pub fn get_window_position_config_file(&self) -> PathBuf {
    self.state_dir.get_window_position_config_file()
  }
}

// eg. /home/bob/artcraft, /Users/alice/artcraft, or C:\Users\Taylor\artcraft
// unless ARTCRAFT_DATA_DIR points somewhere else.
fn get_default_data_dir() -> anyhow::Result<PathBuf> {
  // NB: The logger isn't installed yet, so this has to print.
  match data_dir_override(std::env::var_os(DATA_DIR_ENV_VAR)) {
    Ok(Some(dir)) => return Ok(dir),
    Ok(None) => {},
    Err(err) => println!("Ignoring {}: {}", DATA_DIR_ENV_VAR, err),
  }

  Ok(UserDirs::new()
      .ok_or_else(|| anyhow!("could not determine user home directory"))?
      .home_dir()
      .join(DEFAULT_DATA_DIR))
}

/// Reads the ARTCRAFT_DATA_DIR value. Unset or blank means "use the default".
fn data_dir_override(maybe_value: Option<OsString>) -> anyhow::Result<Option<PathBuf>> {
  let value = match maybe_value {
    Some(value) => value,
    None => return Ok(None),
  };

  let mut dir = PathBuf::from(&value);

  if let Some(value) = value.to_str() {
    let value = value.trim();
    if value.is_empty() {
      return Ok(None);
    }
    dir = match OsPlatform::get() {
      OsPlatform::Linux | OsPlatform::MacOs => expanduser(value)?,
      OsPlatform::Windows => PathBuf::from(value),
    };
  }

  // NB: A relative path would depend on the working directory, which is "/" when
  // the app is launched from Finder.
  if !dir.is_absolute() {
    return Err(anyhow!("{:?} is not an absolute path", dir));
  }

  Ok(Some(dir))
}

#[cfg(test)]
mod tests {
  use super::*;

  mod data_dir_override_tests {
    use super::*;

    #[test]
    fn unset_uses_the_default() {
      assert_eq!(data_dir_override(None).unwrap(), None);
    }

    #[test]
    fn blank_uses_the_default() {
      assert_eq!(data_dir_override(Some(OsString::from(""))).unwrap(), None);
      assert_eq!(data_dir_override(Some(OsString::from("  "))).unwrap(), None);
    }

    #[test]
    fn absolute_path_is_used() {
      let dir = std::env::temp_dir().join("artcraft data");
      let value = OsString::from(dir.as_os_str());
      assert_eq!(data_dir_override(Some(value)).unwrap(), Some(dir));
    }

    #[test]
    fn relative_path_is_rejected() {
      assert!(data_dir_override(Some(OsString::from("Artcraft"))).is_err());
      assert!(data_dir_override(Some(OsString::from("./data/Artcraft"))).is_err());
    }

    #[cfg(not(windows))]
    #[test]
    fn tilde_expands_to_the_home_directory() {
      let home = UserDirs::new().unwrap().home_dir().to_path_buf();
      let expected = home.join("Library/Application Support/Artcraft");
      let value = OsString::from("~/Library/Application Support/Artcraft");
      assert_eq!(data_dir_override(Some(value)).unwrap(), Some(expected));
    }
  }
}
