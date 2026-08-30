use std::fs;
use std::path::PathBuf;
use anyhow::{anyhow, Result};
use log::{info, warn};
use directories::UserDirs;

use artcraft_client::credentials::storyteller_avt_cookie::StorytellerAvtCookie;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::credentials::storyteller_session_cookie::StorytellerSessionCookie;

pub fn resolve_credentials() -> Result<StorytellerCredentialSet> {
  // 1. Check environment variables
  let env_session = std::env::var("ARTCRAFT_SESSION").ok();
  let env_avt = std::env::var("ARTCRAFT_AVT").ok();

  if env_session.is_some() || env_avt.is_some() {
    info!("Resolving credentials from environment variables ARTCRAFT_SESSION / ARTCRAFT_AVT");
    let session = env_session.map(StorytellerSessionCookie::new);
    let avt = env_avt.map(StorytellerAvtCookie::new);
    return Ok(StorytellerCredentialSet::initialize(avt, session));
  }

  // 2. Check standard desktop directory
  if let Some(user_dirs) = UserDirs::new() {
    let home = user_dirs.home_dir();
    let artcraft_dir = home.join("Artcraft");
    let creds_dir = artcraft_dir.join("credentials");
    
    let session_path = creds_dir.join("artcraft_session.txt");
    let avt_path = creds_dir.join("artcraft_avt.txt");

    let mut session = None;
    let mut avt = None;

    if session_path.exists() {
      if let Ok(contents) = fs::read_to_string(&session_path) {
        let trimmed = contents.trim().to_string();
        if !trimmed.is_empty() {
          session = Some(StorytellerSessionCookie::new(trimmed));
        }
      }
    }

    if avt_path.exists() {
      if let Ok(contents) = fs::read_to_string(&avt_path) {
        let trimmed = contents.trim().to_string();
        if !trimmed.is_empty() {
          avt = Some(StorytellerAvtCookie::new(trimmed));
        }
      }
    }

    if session.is_some() || avt.is_some() {
      info!("Resolved credentials from user data directory: {:?}", creds_dir);
      return Ok(StorytellerCredentialSet::initialize(avt, session));
    }
  }

  // 3. Fallback to local artcraft_cookies.txt
  let local_cookie_path = PathBuf::from("artcraft_cookies.txt");
  if local_cookie_path.exists() {
    info!("Attempting to read credentials from local cookie file: {:?}", local_cookie_path);
    if let Ok(contents) = fs::read_to_string(&local_cookie_path) {
      if let Ok(Some(creds)) = StorytellerCredentialSet::parse_multi_cookie_header(contents.trim()) {
        return Ok(creds);
      }
    }
  }

  warn!("No credentials found. Requests requiring auth will fail.");
  Err(anyhow!(
    "Could not resolve credentials. Please set ARTCRAFT_SESSION and ARTCRAFT_AVT env variables, \
     ensure the desktop app is logged in, or place artcraft_cookies.txt in the current directory."
  ))
}
