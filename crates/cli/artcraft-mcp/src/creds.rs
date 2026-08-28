use std::path::PathBuf;

use anyhow::{anyhow, Result};
use serde::Deserialize;

use artcraft_client::credentials::storyteller_avt_cookie::StorytellerAvtCookie;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::credentials::storyteller_session_cookie::StorytellerSessionCookie;
use artcraft_client::utils::api_host::ApiHost;

use crate::errors::ToolError;

const STORYTELLER_API_HOST: &str = "api.storyteller.ai";

/// Shared entry for every tool: returns the API host plus loaded session
/// cookies, or a structured ToolError (NOT_LOGGED_IN / ARTCRAFT_NOT_INSTALLED)
/// with a clear remediation if the desktop app hasn't been signed in.
pub fn load_session() -> Result<(ApiHost, StorytellerCredentialSet), ToolError> {
  let creds = load_storyteller_credentials().map_err(|e| ToolError::internal(format!("{:#}", e)))?;
  if creds.is_empty() {
    return Err(ToolError::not_logged_in());
  }
  Ok((ApiHost::Storyteller, creds))
}

fn load_storyteller_credentials() -> Result<StorytellerCredentialSet> {
  // Production desktop app keeps Storyteller cookies in the Tauri HTTP
  // plugin's cookie jar at ~/Library/Caches/ai.artcraft.app/.cookies.
  // The text-file path under ~/Artcraft/credentials/ is wired up in the
  // dev source but the `persist_all_to_disk()` call is commented out,
  // so shipped builds never populate those files. Try the cookie jar
  // first, then fall back to the text files for forward-compat.
  if let Some(creds) = try_load_from_tauri_cookies_jar()? {
    if !creds.is_empty() {
      tracing::info!("loaded storyteller cookies from tauri http plugin jar");
      return Ok(creds);
    }
  }

  let creds_dir = home_dir()?.join("Artcraft").join("credentials");
  let session = read_trimmed(&creds_dir.join("artcraft_session.txt"))?
    .map(StorytellerSessionCookie::new);
  let avt =
    read_trimmed(&creds_dir.join("artcraft_avt.txt"))?.map(StorytellerAvtCookie::new);
  Ok(StorytellerCredentialSet::initialize(avt, session))
}

fn try_load_from_tauri_cookies_jar() -> Result<Option<StorytellerCredentialSet>> {
  let Some(path) = tauri_cookies_jar_path() else {
    return Ok(None);
  };
  if !path.exists() {
    return Ok(None);
  }

  let raw = std::fs::read_to_string(&path)?;
  let entries: Vec<CookieEntry> = serde_json::from_str(&raw)?;

  let mut session = None;
  let mut visitor = None;
  for entry in entries {
    if !entry.domain_is(STORYTELLER_API_HOST) {
      continue;
    }
    let Some((name, value)) = split_name_value(&entry.raw_cookie) else {
      continue;
    };
    match name {
      "session" if session.is_none() => {
        session = Some(StorytellerSessionCookie::new(value.to_string()));
      }
      "visitor" if visitor.is_none() => {
        visitor = Some(StorytellerAvtCookie::new(value.to_string()));
      }
      _ => {}
    }
  }

  Ok(Some(StorytellerCredentialSet::initialize(visitor, session)))
}

#[derive(Deserialize)]
struct CookieEntry {
  raw_cookie: String,
  #[serde(default)]
  domain: serde_json::Value,
}

impl CookieEntry {
  fn domain_is(&self, host: &str) -> bool {
    if let Some(s) = self.domain.get("HostOnly").and_then(|v| v.as_str()) {
      return s.eq_ignore_ascii_case(host);
    }
    if let Some(s) = self.domain.get("Suffix").and_then(|v| v.as_str()) {
      return host.eq_ignore_ascii_case(s) || host.ends_with(&format!(".{}", s));
    }
    false
  }
}

fn split_name_value(raw_cookie: &str) -> Option<(&str, &str)> {
  let head = raw_cookie.split(';').next()?.trim();
  let eq = head.find('=')?;
  Some((&head[..eq], &head[eq + 1..]))
}

fn tauri_cookies_jar_path() -> Option<PathBuf> {
  // Tauri's app_cache_dir() on macOS is ~/Library/Caches/<bundle_id>.
  // Bundle id is ai.artcraft.app — see Info.plist of the installed app.
  // ProjectDirs::from("ai", "artcraft", "app").cache_dir() resolves to
  // the same path on macOS. Linux/Windows resolutions differ from
  // Tauri's; deferred until we need them.
  let dirs = directories::ProjectDirs::from("ai", "artcraft", "app")?;
  Some(dirs.cache_dir().join(".cookies"))
}

fn read_trimmed(path: &PathBuf) -> Result<Option<String>> {
  if !path.exists() {
    return Ok(None);
  }
  let raw = std::fs::read_to_string(path)?;
  let trimmed = raw.trim();
  if trimmed.is_empty() {
    Ok(None)
  } else {
    Ok(Some(trimmed.to_string()))
  }
}

fn home_dir() -> Result<PathBuf> {
  directories::UserDirs::new()
    .map(|d| d.home_dir().to_path_buf())
    .ok_or_else(|| anyhow!("could not determine home directory"))
}
