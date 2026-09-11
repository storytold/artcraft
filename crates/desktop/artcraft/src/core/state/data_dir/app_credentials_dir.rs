use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use std::path::{Path, PathBuf};

#[derive(Clone)]
pub struct AppCredentialsDir {
  path: PathBuf,
}

impl DataSubdir for AppCredentialsDir {
  const DIRECTORY_NAME: &'static str = "credentials";

  fn new_from<P: AsRef<Path>> (dir: P) -> Self {
    Self {
      path: dir.as_ref().to_path_buf(),
    }
  }

  fn path(&self) -> &Path {
    &self.path
  }
}

impl AppCredentialsDir {
  pub fn get_grok_state_path(&self) -> PathBuf {
    self.path.join("grok_state.json")
  }

  pub fn get_grok_cookies_path(&self) -> PathBuf {
    self.path.join("grok_cookies.txt")
  }
  
  pub fn get_sora_cookie_file_path(&self) -> PathBuf {
    self.path.join("sora_cookies.txt")
  }

  pub fn get_sora_bearer_token_file_path(&self) -> PathBuf {
    self.path.join("sora_bearer_token.txt")
  }

  #[deprecated(note="use the new sentinel token methods")]
  pub fn get_sora_legacy_sentinel_file_path(&self) -> PathBuf {
    self.path.join("sora_sentinel.txt")
  }

  pub fn get_sora_sentinel_token_file_path(&self) -> PathBuf {
    self.path.join("sora_sentinel_token_store.json")
  }

  pub fn get_storyteller_avt_cookie_file_path(&self) -> PathBuf {
    self.path.join("artcraft_avt.txt")
  }
  
  pub fn get_storyteller_session_cookie_file_path(&self) -> PathBuf {
    self.path.join("artcraft_session.txt")
  }

  pub fn get_fal_api_key_file_path(&self) -> PathBuf {
    self.path.join("fal_api_key.txt")
  }

  pub fn get_midjourney_state_path(&self) -> PathBuf {
    self.path.join("midjourney_state.json")
  }

  pub fn get_worldlabs_state_path(&self) -> PathBuf {
    self.path.join("worldlabs_state.json")
  }

  pub fn get_worldlabs_cookies_path(&self) -> PathBuf {
    self.path.join("worldlabs_cookies.txt")
  }

  pub fn get_worldlabs_bearer_path(&self) -> PathBuf {
    self.path.join("worldlabs_bearer.txt")
  }

  pub fn get_worldlabs_refresh_path(&self) -> PathBuf {
    self.path.join("worldlabs_refresh.txt")
  }
}
