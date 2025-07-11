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
use std::path::{Path, PathBuf};

const DEFAULT_DATA_DIR : &str = "Artcraft";

/// Note: Tauri appends ".log" to the end of the filename.
const LOG_FILE_NAME : &str = "application_debug";

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

  pub fn get_sora_sentinel_file_path(&self) -> PathBuf {
    self.credentials_dir().get_sora_sentinel_file_path()
  }

  pub fn get_window_size_config_file(&self) -> PathBuf {
    self.state_dir.get_window_size_config_file()
  }
  
  pub fn get_window_position_config_file(&self) -> PathBuf {
    self.state_dir.get_window_position_config_file()
  }
}

// eg. /home/bob/artcraft, /Users/alice/artcraft, or C:\Users\Taylor\artcraft
fn get_default_data_dir() -> anyhow::Result<PathBuf> {
  Ok(UserDirs::new()
      .ok_or_else(|| anyhow!("could not determine user home directory"))?
      .home_dir()
      .join(DEFAULT_DATA_DIR))
}
