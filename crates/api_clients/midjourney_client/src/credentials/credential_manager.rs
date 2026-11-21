//! The Midjourney login shared by the desktop apps: kept in one file, refreshed before it
//! expires, and turned into a [`MidjourneySession`] for each submit or poll.

use std::path::PathBuf;
use std::sync::{Arc, RwLock};
use std::time::Duration;

use anyhow::{anyhow, bail};
use browser_emulation::browser_profile::BrowserProfile;
use chrono::Utc;
use cookie_store_wrapper::cookie_store::CookieStore;
use serde_json::Value;
use tokio::sync::Mutex;
use url::Url;

use crate::credentials::auth_token::{extract_midjourney_user_id_from_cookie_header, jwt_claims, token_needs_refresh};
use crate::credentials::cookie_names::{AUTH_COOKIE_NAME_I, AUTH_COOKIE_NAME_R};
use crate::credentials::cookie_store_has_auth_cookies::cookie_store_has_auth_cookies;
use crate::credentials::credential_file::{MidjourneyAccountInfo, MidjourneyCredential};
use crate::credentials::midjourney_user_id::MidjourneyUserId;
use crate::endpoints::refresh_token::{DEFAULT_FIREBASE_API_KEY, RefreshTokenArgs, RefreshTokenRequest, refresh_token};
use crate::error::midjourney_api_error::MidjourneyApiError;
use crate::error::midjourney_error::MidjourneyError;
use crate::recipes::get_user_info::{GetUserInfoArgs, get_user_info};

/// Where the auth cookies are scoped.
pub const MIDJOURNEY_ORIGIN: &str = "https://www.midjourney.com/";
/// Token refresh and account lookups give up after this long.
const NETWORK_TIMEOUT: Duration = Duration::from_secs(30);

#[derive(Clone)]
pub struct MidjourneyCredentialManager {
  credential: Arc<RwLock<Option<MidjourneyCredential>>>,
  // Serialize refresh, login, and logout so an old refresh cannot resurrect a
  // signed-out session or overwrite credentials captured by a new login.
  mutation: Arc<Mutex<()>>,
  credential_path: PathBuf,
  /// Older formats, removed on logout so they can't be migrated back.
  legacy_paths: Vec<PathBuf>,
}

/// What a submit or poll needs: the cookies to send, whose account it is, and the browser to
/// present (the one the cookies were captured with).
pub struct MidjourneySession {
  pub credential_id: String,
  pub cookie_header: String,
  pub user_id: MidjourneyUserId,
  pub browser: BrowserProfile,
}

impl MidjourneyCredentialManager {
  /// A manager that saves to `credential_path`, starting from `credential`.
  pub fn new(credential_path: PathBuf, legacy_paths: Vec<PathBuf>, credential: Option<MidjourneyCredential>) -> Self {
    Self { credential: Arc::new(RwLock::new(credential)), mutation: Arc::new(Mutex::new(())), credential_path, legacy_paths }
  }

  /// A manager for the login saved at `credential_path`, if there is one.
  pub fn load(credential_path: PathBuf, legacy_paths: Vec<PathBuf>) -> anyhow::Result<Self> {
    let credential = if credential_path.exists() {
      let credential = MidjourneyCredential::load(&credential_path)?;
      credential.save(&credential_path)?; // Persist a stable ID for hand-written files.
      Some(credential)
    } else {
      None
    };
    Ok(Self::new(credential_path, legacy_paths, credential))
  }

  pub fn credential_path(&self) -> &PathBuf {
    &self.credential_path
  }

  pub fn maybe_copy_cookie_store(&self) -> anyhow::Result<Option<CookieStore>> {
    Ok(self.snapshot()?.map(|credential| credential.cookie.cookies))
  }

  pub fn maybe_account_info(&self) -> anyhow::Result<Option<MidjourneyAccountInfo>> {
    Ok(self.snapshot()?.and_then(|credential| credential.maybe_user_info))
  }

  pub fn session_appears_active(&self) -> anyhow::Result<bool> {
    Ok(self.snapshot()?.is_some_and(|credential| credential.cookie.maybe_relogin_required_since.is_none() && (cookie_store_has_auth_cookies(&credential.cookie.cookies) || !token_needs_refresh(credential.cookie.cookies.get_cookie_value(AUTH_COOKIE_NAME_I), Utc::now().timestamp()))))
  }

  pub async fn save_login(&self, cookies: CookieStore) -> anyhow::Result<()> {
    let _guard = self.mutation.lock().await;
    let mut credential = MidjourneyCredential::new(cookies);
    populate_account_info(&mut credential);
    self.store(credential)
  }

  pub async fn clear_credentials(&self) -> anyhow::Result<()> {
    let _guard = self.mutation.lock().await;
    // Remove every format, so a later startup cannot migrate a logged-out account.
    for path in self.legacy_paths.iter().chain([&self.credential_path]) {
      match std::fs::remove_file(path) {
        Ok(()) => {},
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => {},
        Err(err) => return Err(err.into()),
      }
    }
    *self.credential.write().map_err(|_| anyhow!("Midjourney credential lock poisoned"))? = None;
    Ok(())
  }

  /// Resolve identity and renew expiring Firebase credentials before sending
  /// generation or polling requests. The refresh token can outlive the ID JWT.
  pub async fn session(&self) -> anyhow::Result<Option<MidjourneySession>> {
    let _guard = self.mutation.lock().await;
    let Some(mut credential) = self.snapshot()? else {
      return Ok(None);
    };
    if credential.cookie.maybe_relogin_required_since.is_some() {
      return Ok(None);
    }
    if token_needs_refresh(credential.cookie.cookies.get_cookie_value(AUTH_COOKIE_NAME_I), Utc::now().timestamp()) {
      let Some(refresh) = credential.cookie.cookies.get_cookie_value(AUTH_COOKIE_NAME_R).map(str::to_owned) else {
        self.mark_relogin(&mut credential)?;
        return Ok(None);
      };
      let refreshed = tokio::time::timeout(NETWORK_TIMEOUT, refresh_token(RefreshTokenArgs { request: RefreshTokenRequest { refresh_token: &refresh, api_key: DEFAULT_FIREBASE_API_KEY }, browser: Some(credential.browser()) })).await?;
      match refreshed {
        Ok(response) => {
          let origin = Url::parse(MIDJOURNEY_ORIGIN)?;
          // Preserve the host-only Secure scope required by __Host- cookies.
          for (name, value) in [(AUTH_COOKIE_NAME_I, response.id_token), (AUTH_COOKIE_NAME_R, response.refresh_token)] {
            credential.cookie.cookies.apply_set_cookie_header(&format!("{name}={value}; Path=/; Secure; HttpOnly"), &origin);
          }
          credential.cookie.maybe_updated_at = Some(Utc::now());
          credential.cookie.maybe_succeeded_at = Some(Utc::now());
          populate_account_info(&mut credential);
          self.store(credential.clone())?;
        },
        Err(err) if is_revoked_refresh(&err) => {
          self.mark_relogin(&mut credential)?;
          return Ok(None);
        },
        Err(err) => {
          credential.cookie.maybe_failed_at = Some(Utc::now());
          self.store(credential)?;
          return Err(err.into());
        },
      }
    }
    populate_account_info(&mut credential);
    let cookie_header = credential.cookie.cookies.cookie_header_for_url(&Url::parse(MIDJOURNEY_ORIGIN)?).unwrap_or_default();
    let browser = credential.browser();
    let mut maybe_user_id = extract_midjourney_user_id_from_cookie_header(&cookie_header).or_else(|| credential.maybe_user_info.as_ref()?.maybe_user_id.as_deref().map(MidjourneyUserId::from_str));
    if maybe_user_id.is_none() {
      let info = tokio::time::timeout(NETWORK_TIMEOUT, get_user_info(GetUserInfoArgs { cookie_header: &cookie_header, hostname: None, browser: Some(browser.clone()) })).await??;
      maybe_user_id = info.user_id;
      credential.maybe_user_info = Some(MidjourneyAccountInfo { maybe_user_id: maybe_user_id.as_ref().map(|id| id.as_str().to_string()), maybe_email: info.email, maybe_username: None });
      self.store(credential.clone())?;
    }
    let Some(user_id) = maybe_user_id else {
      bail!("Could not resolve the Midjourney account; please log in again")
    };
    Ok(Some(MidjourneySession { credential_id: credential.id, cookie_header, user_id, browser }))
  }

  fn snapshot(&self) -> anyhow::Result<Option<MidjourneyCredential>> {
    Ok(self.credential.read().map_err(|_| anyhow!("Midjourney credential lock poisoned"))?.clone())
  }

  fn store(&self, credential: MidjourneyCredential) -> anyhow::Result<()> {
    credential.save(&self.credential_path)?;
    *self.credential.write().map_err(|_| anyhow!("Midjourney credential lock poisoned"))? = Some(credential);
    Ok(())
  }

  fn mark_relogin(&self, credential: &mut MidjourneyCredential) -> anyhow::Result<()> {
    let now = Utc::now();
    credential.cookie.maybe_failed_at = Some(now);
    credential.cookie.maybe_relogin_required_since.get_or_insert(now);
    self.store(credential.clone())
  }
}

/// Fills the account's id and email from the auth token's claims.
pub fn populate_account_info(credential: &mut MidjourneyCredential) {
  let Some(claims) = credential.cookie.cookies.get_cookie_value(AUTH_COOKIE_NAME_I).and_then(jwt_claims) else {
    return;
  };
  let info = credential.maybe_user_info.get_or_insert_with(MidjourneyAccountInfo::default);
  if let Some(id) = claims.get("midjourney_id").and_then(Value::as_str).filter(|id| !id.is_empty()) {
    info.maybe_user_id = Some(id.to_string());
  }
  if let Some(email) = claims.get("email").and_then(Value::as_str) {
    info.maybe_email = Some(email.to_string());
  }
}

fn is_revoked_refresh(error: &MidjourneyError) -> bool {
  let MidjourneyError::Api(MidjourneyApiError::InvalidRequest(body) | MidjourneyApiError::Unauthorized(body)) = error else {
    return false;
  };
  ["TOKEN_EXPIRED", "INVALID_REFRESH_TOKEN", "USER_DISABLED", "USER_NOT_FOUND"].iter().any(|code| body.contains(code))
}

#[cfg(test)]
mod tests {
  use base64::Engine;
  use base64::prelude::BASE64_URL_SAFE_NO_PAD;
  use tempfile::TempDir;

  use super::*;

  const TEST_USER_ID: &str = "00000000-0000-4000-8000-000000000001";

  mod persistence {
    use super::*;

    #[tokio::test]
    async fn expired_session_without_refresh_requires_login_and_new_login_clears_it() {
      let (_dir, manager) = manager();
      manager.save_login(cookies(10)).await.unwrap();
      assert!(manager.session().await.unwrap().is_none());
      assert!(!manager.session_appears_active().unwrap());
      let dead = MidjourneyCredential::load(manager.credential_path()).unwrap();
      assert!(dead.cookie.maybe_relogin_required_since.is_some());
      manager.save_login(cookies(Utc::now().timestamp() + 3600)).await.unwrap();
      assert!(manager.session().await.unwrap().is_some());
      assert!(manager.session_appears_active().unwrap());
      assert!(manager.snapshot().unwrap().unwrap().cookie.maybe_relogin_required_since.is_none());
    }

    #[tokio::test]
    async fn loads_a_saved_login_and_logout_removes_every_format() {
      let (dir, manager) = manager();
      manager.save_login(cookies(Utc::now().timestamp() + 3600)).await.unwrap();
      let legacy = dir.path().join("midjourney_state.json");
      std::fs::write(&legacy, "{}").unwrap();
      let reloaded = MidjourneyCredentialManager::load(manager.credential_path().clone(), vec![legacy.clone()]).unwrap();
      let session = reloaded.session().await.unwrap().unwrap();
      assert_eq!(session.user_id.as_str(), TEST_USER_ID);
      reloaded.clear_credentials().await.unwrap();
      assert!(!legacy.exists());
      assert!(!manager.credential_path().exists());
      assert!(reloaded.session().await.unwrap().is_none());
    }

    #[test]
    fn cookie_attributes_and_user_agent_survive_toml_round_trip() {
      let (_dir, manager) = manager();
      let origin = Url::parse(MIDJOURNEY_ORIGIN).unwrap();
      let mut cookies = CookieStore::empty();
      cookies.apply_set_cookie_header("session=host; Path=/; Secure; HttpOnly; SameSite=Lax", &origin);
      cookies.apply_set_cookie_header("session=domain; Domain=midjourney.com; Path=/api; Secure", &origin);
      let credential = MidjourneyCredential::new(cookies);
      let path = manager.credential_path();
      credential.save(path).unwrap();
      let loaded = MidjourneyCredential::load(path).unwrap();
      assert_eq!(loaded.cookie.cookies, credential.cookie.cookies);
      assert_eq!(loaded.browser(), credential.browser());
      assert_eq!(loaded.cookie.cookies.cookie_header_for_url(&origin).as_deref(), Some("session=host"));
      assert!(loaded.cookie.cookies.cookie_header_for_url(&Url::parse("http://www.midjourney.com/").unwrap()).is_none());
      assert_eq!(loaded.cookie.cookies.cookie_header_for_url(&Url::parse("https://midjourney.com/api/test").unwrap()).as_deref(), Some("session=domain"));
      #[cfg(unix)]
      {
        use std::os::unix::fs::PermissionsExt;
        assert_eq!(std::fs::metadata(path).unwrap().permissions().mode() & 0o777, 0o600);
      }
    }
  }

  #[test]
  fn temporary_refresh_failures_do_not_force_logout() {
    assert!(!is_revoked_refresh(&MidjourneyApiError::NetworkError("offline".into()).into()));
    assert!(!is_revoked_refresh(&MidjourneyApiError::InvalidRequest("API_KEY_INVALID".into()).into()));
    assert!(is_revoked_refresh(&MidjourneyApiError::InvalidRequest("INVALID_REFRESH_TOKEN".into()).into()));
  }

  fn manager() -> (TempDir, MidjourneyCredentialManager) {
    let dir = tempfile::tempdir().unwrap();
    let manager = MidjourneyCredentialManager::new(dir.path().join("midjourney_cookies.toml"), Vec::new(), None);
    (dir, manager)
  }

  fn cookies(exp: i64) -> CookieStore {
    CookieStore::from_cookie_header(&format!("{AUTH_COOKIE_NAME_I}={}", token(exp)), &Url::parse(MIDJOURNEY_ORIGIN).unwrap())
  }

  fn token(exp: i64) -> String {
    let claims = serde_json::json!({"exp": exp, "midjourney_id": TEST_USER_ID});
    format!("header.{}.signature", BASE64_URL_SAFE_NO_PAD.encode(claims.to_string()))
  }
}
