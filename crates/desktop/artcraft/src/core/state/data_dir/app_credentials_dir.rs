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
  /// Session cookies, bearer and refresh tokens and API keys are plain files in here, so on Unix
  /// the directory is readable by its owner only (0700). Created with the default 0755, any other
  /// account on the machine could read them (home folders are 0755 on macOS). Folders made by
  /// earlier versions are tightened too.
  pub fn restrict_to_owner(&self) -> std::io::Result<()> {
    #[cfg(unix)]
    {
      use std::os::unix::fs::PermissionsExt;
      std::fs::set_permissions(&self.path, std::fs::Permissions::from_mode(0o700))?;
    }
    Ok(())
  }

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

  pub fn get_midjourney_credential_path(&self) -> PathBuf {
    self.path.join("midjourney_cookies.toml")
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

#[cfg(all(test, unix))]
mod tests {
  use crate::core::state::data_dir::app_data_root::AppDataRoot;
  use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
  use std::os::unix::fs::PermissionsExt;

  fn mode(path: &std::path::Path) -> u32 {
    std::fs::metadata(path).unwrap().permissions().mode() & 0o777
  }

  #[test]
  fn new_credentials_dir_is_private_to_its_owner() {
    let dir = tempfile::tempdir().unwrap();
    let root = AppDataRoot::create_existing(dir.path()).unwrap();
    assert_eq!(mode(root.credentials_dir().path()), 0o700);
  }

  #[test]
  fn existing_credentials_dir_is_made_private() {
    // Folders made by earlier versions are 0755 under the usual umask: other local accounts could
    // read the session cookies and API keys inside.
    let dir = tempfile::tempdir().unwrap();
    let credentials = dir.path().join("credentials");
    std::fs::create_dir(&credentials).unwrap();
    std::fs::set_permissions(&credentials, std::fs::Permissions::from_mode(0o755)).unwrap();
    let root = AppDataRoot::create_existing(dir.path()).unwrap();
    assert_eq!(mode(root.credentials_dir().path()), 0o700);
  }
}
