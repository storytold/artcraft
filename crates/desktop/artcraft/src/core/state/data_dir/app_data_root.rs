use crate::core::state::data_dir::app_assets_dir::AppAssetsDir;
use crate::core::state::data_dir::app_credentials_dir::AppCredentialsDir;
use crate::core::state::data_dir::app_downloads_dir::AppDownloadsDir;
use crate::core::state::data_dir::app_settings_dir::AppSettingsDir;
use crate::core::state::data_dir::app_state_dir::AppStateDir;
use crate::core::state::data_dir::temporary_dir::TemporaryDir;
use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use crate::core::state::expanduser::expanduser;
use crate::core::state::os_platform::OsPlatform;
use anyhow::{anyhow, Context};
use artcraft_data_dir::DataDir;
use std::path::{Path, PathBuf};

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

  /// How `create_default` chose the directory, so it can be logged once the logger is up.
  maybe_data_dir: Option<DataDir>,
}

impl AppDataRoot {
  /// `~/Artcraft`, or the folder named by `ARTCRAFT_DATA_DIR`. Created if it doesn't exist.
  pub fn create_default() -> anyhow::Result<Self> {
    // NB: The logger isn't installed yet; `set_app_log_level` logs the choice once it is.
    let data_dir = DataDir::resolve()?;

    // NB: Say which folder failed (eg. an unwritable ARTCRAFT_DATA_DIR) in the startup panic.
    let mut root = Self::create_existing(&data_dir.path).with_context(|| data_dir.unusable())?;

    root.maybe_data_dir = Some(data_dir);
    Ok(root)
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
      maybe_data_dir: None,
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

  /// Set when the root came from `create_default`.
  pub fn maybe_data_dir(&self) -> Option<&DataDir> {
    self.maybe_data_dir.as_ref()
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
