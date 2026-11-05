//! Where the signed-in session lives: our own file under `~/Artcraft/credentials`, seeded on
//! first run from the Tauri app's cookie jar so an existing ArtCraft login carries over.

use std::fs;
use std::path::{Path, PathBuf};

use artcraft_client::credentials::storyteller_avt_cookie::StorytellerAvtCookie;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::credentials::storyteller_session_cookie::StorytellerSessionCookie;
use artcraft_client::utils::api_host::ApiHost;
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
  /// Written by sign-out. The file stays so the next start does not import the desktop app's login again.
  #[serde(default)]
  pub signed_out: bool,
}

impl Credentials {
  pub fn to_set(&self) -> StorytellerCredentialSet {
    StorytellerCredentialSet::initialize(self.visitor.clone().map(StorytellerAvtCookie::new), Some(StorytellerSessionCookie::new(self.session.clone())))
  }
}

/// `~/Artcraft`, shared with the Tauri app (`AppDataRoot`).
pub fn data_root() -> PathBuf {
  directories::UserDirs::new().map(|d| d.home_dir().to_path_buf()).unwrap_or_else(|| PathBuf::from(".")).join("Artcraft")
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
  load_with(root, import_tauri_cookies)
}

fn load_with(root: &Path, import: impl FnOnce() -> Option<Credentials>) -> Option<Credentials> {
  let path = credentials_path(root);
  if let Ok(text) = fs::read_to_string(&path) {
    match serde_json::from_str::<Credentials>(&text) {
      Ok(creds) if creds.signed_out => return None,
      Ok(creds) if !creds.session.is_empty() => return Some(creds),
      Ok(_) => {},
      Err(err) => warn!("Ignoring unreadable {}: {err}", path.display()),
    }
  }
  let imported = import()?;
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

/// Forgets the session (sign-out). The file is kept, emptied and marked, because with no file the next start would
/// import the desktop app's login and sign the person straight back in.
pub fn delete(root: &Path) {
  save(root, &Credentials { signed_out: true, ..Credentials::default() });
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

  fn root() -> PathBuf {
    std::env::temp_dir().join(format!("artcraft-native-session-{}", uuid::Uuid::new_v4()))
  }

  fn desktop_login() -> Option<Credentials> {
    Some(Credentials { session: "from-the-desktop-app".into(), ..Credentials::default() })
  }

  #[test]
  fn signing_out_stays_signed_out_even_when_the_desktop_app_is_signed_in() {
    let root = root();
    save(&root, &Credentials { session: "mine".into(), visitor: Some("v".into()), signed_out: false });
    assert_eq!(load_with(&root, || None).map(|c| c.session).as_deref(), Some("mine"));
    delete(&root);
    assert!(load_with(&root, desktop_login).is_none(), "the next start must not import the desktop app's login");
    let _ = fs::remove_dir_all(root);
  }

  #[test]
  fn a_first_start_imports_the_desktop_apps_login_once() {
    let root = root();
    assert_eq!(load_with(&root, desktop_login).map(|c| c.session).as_deref(), Some("from-the-desktop-app"));
    assert_eq!(load_with(&root, || None).map(|c| c.session).as_deref(), Some("from-the-desktop-app"), "it was saved");
    let _ = fs::remove_dir_all(root);
  }
}
