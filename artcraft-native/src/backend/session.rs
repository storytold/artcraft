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
  let path = credentials_path(root);
  if let Ok(text) = fs::read_to_string(&path) {
    match serde_json::from_str::<Credentials>(&text) {
      Ok(creds) if !creds.session.is_empty() => return Some(creds),
      Ok(_) => {},
      Err(err) => warn!("Ignoring unreadable {}: {err}", path.display()),
    }
  }
  let imported = import_tauri_cookies(&api_host(root))?;
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
fn import_tauri_cookies(host: &ApiHost) -> Option<Credentials> {
  let path = directories::BaseDirs::new()?.cache_dir().join(TAURI_APP_IDENTIFIER).join(TAURI_COOKIES_FILENAME);
  let text = fs::read_to_string(&path).ok()?;
  credentials_from_jar(&text, host)
}

fn credentials_from_jar(text: &str, host: &ApiHost) -> Option<Credentials> {
  // The plugin serializes cookie_store directly, including host-only scope,
  // path, Secure and expiration. Let the same RFC implementation match them.
  let store: cookie_store_rfc::CookieStore = serde_json::from_str(text).ok()?;
  let url = url::Url::parse(&format!("{}/", host.to_api_hostname_and_scheme())).ok()?;
  let mut creds = Credentials::default();
  for (name, value) in store.get_request_values(&url) {
    match name {
      "session" if creds.session.is_empty() => creds.session = value.to_owned(),
      // Flattening two distinct scopes to one header would pick an arbitrary identity.
      "session" => return None,
      "visitor" if creds.visitor.is_none() => creds.visitor = Some(value.to_owned()),
      "visitor" => return None,
      _ => {},
    }
  }
  (!creds.session.is_empty()).then_some(creds)
}

#[cfg(test)]
mod cookie_import_tests {
  use super::*;

  #[test]
  fn accepts_parent_domain_and_exact_api_host() {
    for raw in ["session=valid; Domain=storyteller.ai; Path=/; Secure", "session=valid; Path=/; Secure"] {
      let jar = jar(raw, "https://api.storyteller.ai/");
      assert_eq!(credentials_from_jar(&jar, &ApiHost::Storyteller).unwrap().session, "valid");
    }
  }

  #[test]
  fn rejects_unrelated_hosts_paths_and_expired_cookies() {
    for (raw, source) in [
      ("session=wrong; Path=/", "https://storyteller.ai.evil.example/"),
      ("session=wrong; Path=/", "https://notstoryteller.ai/"),
      ("session=wrong; Path=/", "https://storyteller.ai/"),
      ("session=wrong; Path=/admin", "https://api.storyteller.ai/"),
      ("session=wrong; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT", "https://api.storyteller.ai/"),
    ] {
      assert!(credentials_from_jar(&jar(raw, source), &ApiHost::Storyteller).is_none(), "accepted {source} {raw}");
    }
  }

  #[test]
  fn import_uses_the_configured_api_host() {
    let prod = jar("session=prod; Domain=storyteller.ai; Path=/", "https://api.storyteller.ai/");
    assert!(credentials_from_jar(&prod, &ApiHost::Localhost { port: 12345 }).is_none());
    let local = jar("session=local; Path=/", "http://localhost:12345/");
    assert_eq!(credentials_from_jar(&local, &ApiHost::Localhost { port: 12345 }).unwrap().session, "local");
  }

  fn jar(raw: &str, source: &str) -> String {
    let cookie = cookie_store_rfc::Cookie::parse(raw.to_owned(), &url::Url::parse(source).unwrap()).unwrap();
    serde_json::to_string(&vec![cookie]).unwrap()
  }
}
