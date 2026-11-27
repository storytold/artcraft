//! Where the signed-in session lives: our own file under `~/Artcraft/credentials`, seeded on
//! first run from the Tauri app's cookie jar so an existing ArtCraft login carries over.

use std::fs;
use std::path::{Path, PathBuf};

use artcraft_client::credentials::storyteller_avt_cookie::StorytellerAvtCookie;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::credentials::storyteller_session_cookie::StorytellerSessionCookie;
use artcraft_client::utils::api_host::ApiHost;
use anyhow::Context;
use artcraft_data_dir::DataDir;
use log::{info, warn};
use serde::{Deserialize, Serialize};

/// The Tauri app's identifier: its cookie jar lives in `<cache dir>/<identifier>/.cookies`.
const TAURI_APP_IDENTIFIER: &str = "ai.artcraft.app";
const TAURI_COOKIES_FILENAME: &str = ".cookies";
const CREDENTIALS_FILENAME: &str = "native_session.json";

/// The two ArtCraft cookies, as sent on every request (`Cookie: visitor=…; session=…`).
#[derive(Clone, Default, Serialize, Deserialize)]
pub struct Credentials {
  pub session: String,
  #[serde(default)]
  pub visitor: Option<String>,
}

impl Credentials {
  pub fn to_set(&self) -> StorytellerCredentialSet {
    StorytellerCredentialSet::initialize(self.visitor.clone().map(StorytellerAvtCookie::new), Some(StorytellerSessionCookie::new(self.session.clone())))
  }
}

/// `~/Artcraft` (or `ARTCRAFT_DATA_DIR`), shared with the Tauri app (`AppDataRoot`).
///
/// Fails, like the Tauri app, when there's no usable folder (no home directory and no
/// `ARTCRAFT_DATA_DIR`), rather than falling back to a folder in the working directory.
pub fn data_root() -> anyhow::Result<PathBuf> {
  let data_dir = DataDir::resolve()?;
  data_dir.log_choice();
  create_data_root(&data_dir)
}

/// Creates the data folder, so one that can't be used (eg. `ARTCRAFT_DATA_DIR` names a file)
/// stops startup with the folder's name, rather than failing every later save with a warning.
fn create_data_root(data_dir: &DataDir) -> anyhow::Result<PathBuf> {
  fs::create_dir_all(&data_dir.path).with_context(|| data_dir.unusable())?;
  Ok(data_dir.path.clone())
}

/// The API host from `~/Artcraft/settings/env_configs.json` (production unless it says
/// `"storyteller_host": "localhost"`).
pub fn api_host(root: &Path) -> ApiHost {
  #[derive(Deserialize)]
  struct EnvConfigs {
    storyteller_host: Option<String>,
    storyteller_port: Option<u32>,
  }
  let path = root.join("settings").join("env_configs.json");
  let configs = fs::read_to_string(&path).ok().and_then(|s| serde_json::from_str::<EnvConfigs>(&s).ok());
  match configs {
    Some(EnvConfigs { storyteller_host: Some(host), storyteller_port }) if host == "localhost" => ApiHost::Localhost { port: storyteller_port.unwrap_or(12345) },
    _ => ApiHost::Storyteller,
  }
}

/// The saved session, or the Tauri app's (imported and saved for next time).
pub fn load(root: &Path) -> Option<Credentials> {
  let path = credentials_path(root);
  if let Ok(text) = fs::read_to_string(&path) {
    match serde_json::from_str::<Credentials>(&text) {
      Ok(creds) if !creds.session.is_empty() => return Some(creds),
      Ok(_) => {},
      Err(err) => warn!("Ignoring unreadable {}: {err}", path.display()),
    }
  }
  let imported = import_tauri_cookies()?;
  info!("Imported the ArtCraft login from the desktop app's cookie jar");
  save(root, &imported);
  Some(imported)
}

pub fn save(root: &Path, creds: &Credentials) {
  let path = credentials_path(root);
  let result = path.parent().map_or(Ok(()), fs::create_dir_all).and_then(|_| fs::write(&path, serde_json::to_vec_pretty(creds).unwrap_or_default()));
  if let Err(err) = result {
    warn!("Couldn't save the session to {}: {err}", path.display());
  }
}

pub fn delete(root: &Path) {
  let path = credentials_path(root);
  if let Err(err) = fs::remove_file(&path) {
    if err.kind() != std::io::ErrorKind::NotFound {
      warn!("Couldn't delete {}: {err}", path.display());
    }
  }
}

fn credentials_path(root: &Path) -> PathBuf {
  root.join("credentials").join(CREDENTIALS_FILENAME)
}

/// Reads `session` and `visitor` for the ArtCraft API from the Tauri HTTP plugin's jar: a JSON
/// array of `cookie_store` cookies (`{"raw_cookie": "...", "domain": {...}, "expires": {...}}`).
fn import_tauri_cookies() -> Option<Credentials> {
  let path = directories::BaseDirs::new()?.cache_dir().join(TAURI_APP_IDENTIFIER).join(TAURI_COOKIES_FILENAME);
  let text = fs::read_to_string(&path).ok()?;
  let cookies: Vec<serde_json::Value> = serde_json::from_str(&text).ok()?;
  let now = chrono::Utc::now();
  let mut creds = Credentials::default();
  for entry in &cookies {
    let for_api = entry.get("domain").map(|d| d.to_string()).is_some_and(|d| d.contains("storyteller.ai"));
    let expired = entry.pointer("/expires/AtUtc").and_then(|v| v.as_str()).and_then(|s| chrono::DateTime::parse_from_rfc3339(s).ok()).is_some_and(|t| t < now);
    let Some(raw) = entry.get("raw_cookie").and_then(|v| v.as_str()) else {
      continue;
    };
    if !for_api || expired {
      continue;
    }
    let Ok(cookie) = cookie::Cookie::parse(raw) else {
      continue;
    };
    match cookie.name() {
      "session" => creds.session = cookie.value().to_owned(),
      "visitor" => creds.visitor = Some(cookie.value().to_owned()),
      _ => {},
    }
  }
  (!creds.session.is_empty()).then_some(creds)
}

#[cfg(test)]
mod tests {
  use super::*;
  use artcraft_data_dir::DataDirSource;

  #[test]
  fn the_data_folder_is_created() {
    let temp = tempfile::tempdir().unwrap();
    let path = temp.path().join("Artcraft").join("data");
    let data_dir = DataDir { path: path.clone(), source: DataDirSource::EnvVar };
    assert_eq!(create_data_root(&data_dir).unwrap(), path);
    assert!(path.is_dir());
    // An existing folder is fine too.
    assert_eq!(create_data_root(&data_dir).unwrap(), path);
  }

  #[test]
  fn a_file_in_place_of_the_data_folder_is_an_error() {
    let temp = tempfile::tempdir().unwrap();
    let path = temp.path().join("not a folder");
    fs::write(&path, "x").unwrap();
    let data_dir = DataDir { path: path.clone(), source: DataDirSource::EnvVar };
    let err = create_data_root(&data_dir).unwrap_err();
    assert!(format!("{err:#}").contains("(from ARTCRAFT_DATA_DIR) as the data directory"), "{err:#}");
    assert!(path.is_file(), "the file was left alone");
  }
}
