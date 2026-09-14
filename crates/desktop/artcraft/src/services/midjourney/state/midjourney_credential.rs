use browser_emulation::browser_profile::BrowserProfile;
use chrono::{DateTime, Utc};
use cookie_store_wrapper::cookie_store::CookieStore;
use serde::{Deserialize, Serialize};
use std::io::Write;
use std::path::Path;
use tempfile::NamedTempFile;
use uuid_utils::uuid::generate_random_uuid;

use crate::services::midjourney::utils::midjourney_browser_profile::MIDJOURNEY_USER_AGENT;

/// Midjourney's slice of ArtCraftX's credential format. Other accounts retain
/// their existing storage. Websocket tokens are deliberately never persisted.
#[derive(Clone, Serialize, Deserialize)]
pub struct MidjourneyCredential {
  #[serde(default = "new_credential_id")]
  pub id: String,
  pub service: MidjourneyService,
  #[serde(default, rename = "name", skip_serializing_if = "Option::is_none")]
  pub maybe_name: Option<String>,
  #[serde(default, rename = "user_info", skip_serializing_if = "Option::is_none")]
  pub maybe_user_info: Option<MidjourneyAccountInfo>,
  pub cookie: MidjourneyCookieCredential,
}

#[derive(Clone, Serialize, Deserialize)]
pub enum MidjourneyService {
  #[serde(rename = "midjourney_cookies")]
  Cookies,
}

#[derive(Clone, Default, Serialize, Deserialize)]
pub struct MidjourneyAccountInfo {
  #[serde(default, rename = "user_id", skip_serializing_if = "Option::is_none")]
  pub maybe_user_id: Option<String>,
  #[serde(default, rename = "email", skip_serializing_if = "Option::is_none")]
  pub maybe_email: Option<String>,
  #[serde(default, rename = "username", skip_serializing_if = "Option::is_none")]
  pub maybe_username: Option<String>,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct MidjourneyCookieCredential {
  #[serde(default, rename = "updated_at", skip_serializing_if = "Option::is_none")]
  pub maybe_updated_at: Option<DateTime<Utc>>,
  #[serde(default, rename = "failed_at", skip_serializing_if = "Option::is_none")]
  pub maybe_failed_at: Option<DateTime<Utc>>,
  #[serde(default, rename = "succeeded_at", skip_serializing_if = "Option::is_none")]
  pub maybe_succeeded_at: Option<DateTime<Utc>>,
  #[serde(default, rename = "relogin_required_since", skip_serializing_if = "Option::is_none")]
  pub maybe_relogin_required_since: Option<DateTime<Utc>>,
  #[serde(default, rename = "user_agent", skip_serializing_if = "Option::is_none")]
  pub maybe_user_agent: Option<String>,
  // TOML arrays of tables belong after scalar fields.
  pub cookies: CookieStore,
}

impl MidjourneyCredential {
  pub fn new(cookies: CookieStore) -> Self {
    Self { id: new_credential_id(), service: MidjourneyService::Cookies, maybe_name: None, maybe_user_info: None, cookie: MidjourneyCookieCredential { maybe_updated_at: Some(Utc::now()), maybe_failed_at: None, maybe_succeeded_at: None, maybe_relogin_required_since: None, maybe_user_agent: Some(MIDJOURNEY_USER_AGENT.to_string()), cookies } }
  }

  pub fn load(path: &Path) -> anyhow::Result<Self> {
    Ok(toml::from_str(&std::fs::read_to_string(path)?)?)
  }

  pub fn save(&self, path: &Path) -> anyhow::Result<()> {
    // Atomic replacement avoids truncating the only session on a failed write.
    // NamedTempFile creates the file with private permissions on Unix.
    let mut file = NamedTempFile::new_in(path.parent().ok_or_else(|| anyhow::anyhow!("Missing credential directory"))?)?;
    file.write_all(toml::to_string_pretty(self)?.as_bytes())?;
    file.as_file().sync_all()?;
    file.persist(path)?;
    Ok(())
  }

  pub fn browser(&self) -> BrowserProfile {
    BrowserProfile::matching_user_agent(self.cookie.maybe_user_agent.as_deref().unwrap_or(MIDJOURNEY_USER_AGENT))
  }
}

fn new_credential_id() -> String {
  format!("credential_{}", generate_random_uuid())
}
