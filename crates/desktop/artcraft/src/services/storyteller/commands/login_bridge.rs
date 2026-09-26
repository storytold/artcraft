use std::collections::HashMap;
use std::sync::Arc;

use artcraft_api_defs::users::login_challenges::{LoginChallengeFailure, LoginChallengeState};
use artcraft_api_defs::users::session_info::SessionUserInfo;
use artcraft_client::endpoints::users::password_login::PasswordLoginRequest;
use artcraft_client::endpoints::users::password_signup::PasswordSignupRequest;
use artcraft_client::utils::api_host::ApiHost;
use artcraft_client::utils::login_challenge_client::{
  LoginChallengeClient, LoginChallengeClientError,
};
use chrono::{DateTime, Utc};
use log::{info, warn};
use serde::Serialize;
use tauri::{AppHandle, Manager};
use tauri_plugin_http::reqwest_cookie_store::{CookieStoreMutex, RawCookie};
use tauri_plugin_http::Http;
use tokio::sync::Mutex;
use uuid_utils::uuid::generate_random_uuid;

use crate::core::threads::main_window_thread::persist_storyteller_cookies_task::get_credentials_from_cookie_store;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;

const MAX_PENDING_CHALLENGES: usize = 8;

/// All bearer credentials stay in Rust. The UI holds only a local lookup handle.
#[derive(Default)]
pub struct DesktopLoginBridgeState {
  pending: Mutex<HashMap<String, PendingChallenge>>,
}

#[derive(Clone)]
struct PendingChallenge {
  device_token: String,
  expires_at: DateTime<Utc>,
  client: LoginChallengeClient,
}

#[derive(Serialize)]
pub struct DesktopLoginChallenge {
  pub challenge_id: String,
  pub verification_url: String,
  pub confirmation_code: String,
  pub expires_at: DateTime<Utc>,
  pub poll_interval_seconds: u32,
}

#[derive(Serialize)]
pub struct DesktopLoginOutcome {
  pub status: LoginChallengeState,
  pub maybe_failure_type: Option<LoginChallengeFailure>,
  pub maybe_user: Option<SessionUserInfo>,
}

#[derive(Debug, Serialize)]
pub struct DesktopLoginError {
  pub status: Option<u16>,
  pub message: String,
  pub retryable: bool,
}

impl DesktopLoginError {
  fn local(message: &str) -> Self {
    Self {
      status: None,
      message: message.to_owned(),
      retryable: false,
    }
  }

  pub(super) fn from_client(origin: &str, error: LoginChallengeClientError) -> Self {
    warn!(
      "Website login failed: origin={} status={:?} reason={}",
      origin, error.status, error.message
    );
    Self {
      retryable: error
        .status
        .map(|s| s == 429 || s >= 500)
        .unwrap_or(error.message == "Unable to reach the login server"),
      status: error.status,
      message: format!("{}: {} (HTTP {:?})", origin, error.message, error.status),
    }
  }
}

pub(super) async fn current_login_session(
  client: &LoginChallengeClient,
  jar: &Arc<CookieStoreMutex>,
) -> Result<Option<SessionUserInfo>, DesktopLoginError> {
  let credentials = {
    let store = jar
      .store
      .lock()
      .map_err(|_| DesktopLoginError::local("HTTP cookie store unavailable"))?;
    get_credentials_from_cookie_store(&store, &client.api_url())
      .map_err(|_| DesktopLoginError::local("Unable to read session cookie"))?
  };
  let Some(signed) = credentials.session else {
    return Ok(None);
  };
  let session = match client.session(signed.as_str()).await {
    Ok(session) => session,
    Err(error) if error.status == Some(401) => return Ok(None),
    Err(error) => return Err(DesktopLoginError::from_client(&client.api_origin(), error)),
  };
  Ok(
    session
      .user
      .filter(|_| session.success && session.logged_in),
  )
}

pub(super) async fn password_auth(
  host: &ApiHost,
  manager: &StorytellerCredentialManager,
  jar: &Arc<CookieStoreMutex>,
  login: Option<PasswordLoginRequest>,
  signup: Option<PasswordSignupRequest>,
) -> Result<SessionUserInfo, DesktopLoginError> {
  let client = LoginChallengeClient::new(host)
    .map_err(|e| DesktopLoginError::from_client(&host.to_api_hostname_and_scheme(), e))?;
  let response = match (login, signup) {
    (Some(request), None) => client.password_login(&request).await,
    (None, Some(request)) => client.password_signup(&request).await,
    _ => return Err(DesktopLoginError::local("Invalid authentication request")),
  }
  .map_err(|e| DesktopLoginError::from_client(&client.api_origin(), e))?;
  let (response, cookie) = response;
  if !response.success {
    return Err(DesktopLoginError::local(
      "Sign-in failed. Check your account details and try again.",
    ));
  }
  let signed = response
    .signed_session
    .ok_or_else(|| DesktopLoginError::local("Login server did not issue a session"))?;
  let cookie =
    cookie.ok_or_else(|| DesktopLoginError::local("Login server did not set a session cookie"))?;
  let (cookie, user) = verify_session(&client, &signed, cookie).await?;
  install_session_cookie(&client, &signed, cookie, manager, jar)?;
  persist_session_cookie(jar).await?;
  Ok(user)
}

pub(super) fn http_cookie_jar(app: &AppHandle) -> Result<Arc<CookieStoreMutex>, DesktopLoginError> {
  Ok(
    app
      .try_state::<Http>()
      .ok_or_else(|| DesktopLoginError::local("HTTP cookie store unavailable"))?
      .cookies_jar
      .clone(),
  )
}

pub(super) async fn begin_challenge(
  host: &ApiHost,
  state: &DesktopLoginBridgeState,
) -> Result<DesktopLoginChallenge, DesktopLoginError> {
  let client = LoginChallengeClient::new(host)
    .map_err(|e| DesktopLoginError::from_client(&host.to_api_hostname_and_scheme(), e))?;
  let created = client
    .create()
    .await
    .map_err(|e| DesktopLoginError::from_client(&client.api_origin(), e))?;
  if !created.success
    || !client.allows_verification_url(&created.verification_url)
    || created.device_token.len() != 43
    || created.expires_at <= Utc::now()
  {
    return Err(DesktopLoginError::local(
      "Invalid login challenge or website/API environment mismatch",
    ));
  }
  let mut pending = state.pending.lock().await;
  pending.retain(|_, value| value.expires_at > Utc::now());
  if pending.len() >= MAX_PENDING_CHALLENGES {
    return Err(DesktopLoginError::local("Too many pending login attempts"));
  }
  let challenge_id = generate_random_uuid();
  pending.insert(
    challenge_id.clone(),
    PendingChallenge {
      device_token: created.device_token,
      expires_at: created.expires_at,
      client,
    },
  );
  Ok(DesktopLoginChallenge {
    challenge_id,
    verification_url: created.verification_url,
    confirmation_code: created.confirmation_code,
    expires_at: created.expires_at,
    poll_interval_seconds: created.poll_interval_seconds.max(5),
  })
}

pub(super) async fn poll_challenge(
  state: &DesktopLoginBridgeState,
  manager: &StorytellerCredentialManager,
  jar: &Arc<CookieStoreMutex>,
  challenge_id: &str,
) -> Result<DesktopLoginOutcome, DesktopLoginError> {
  let challenge = {
    let mut pending = state.pending.lock().await;
    let challenge = pending.get(challenge_id).cloned().ok_or_else(|| {
      DesktopLoginError::local("Login attempt was cancelled or is no longer available")
    })?;
    if challenge.expires_at <= Utc::now() {
      pending.remove(challenge_id);
      return Ok(expired());
    }
    challenge
  };
  let origin = challenge.client.api_origin();
  let polled = challenge
    .client
    .poll(&challenge.device_token)
    .await
    .map_err(|e| DesktopLoginError::from_client(&origin, e))?;
  if !polled.response.success || polled.response.status == LoginChallengeState::Unknown {
    return Err(DesktopLoginError::local("Unrecognized login response"));
  }
  if polled.response.status != LoginChallengeState::Redeemed {
    if polled.response.status == LoginChallengeState::Failed {
      state.pending.lock().await.remove(challenge_id);
    }
    return Ok(DesktopLoginOutcome {
      status: polled.response.status,
      maybe_failure_type: polled.response.maybe_failure_type,
      maybe_user: None,
    });
  }
  let signed = polled
    .response
    .maybe_signed_session
    .ok_or_else(|| DesktopLoginError::local("Login server did not issue a session"))?;
  let set_cookie = polled
    .session_set_cookie
    .ok_or_else(|| DesktopLoginError::local("Login server did not set a session cookie"))?;
  let (cookie, user) = verify_session(&challenge.client, &signed, set_cookie).await?;
  {
    let pending = state.pending.lock().await;
    // A cancellation during either HTTP request must prevent local installation.
    if !pending.contains_key(challenge_id) {
      return Err(DesktopLoginError::local("Login attempt was cancelled"));
    }
    if challenge.expires_at <= Utc::now() {
      return Ok(expired());
    }
    install_session_cookie(&challenge.client, &signed, cookie, manager, jar)?;
  }
  // Keep the challenge for idempotent IPC retries; it expires on its original deadline.
  persist_session_cookie(jar).await?;
  info!("Website login complete: origin={}", origin);
  Ok(DesktopLoginOutcome {
    status: LoginChallengeState::Redeemed,
    maybe_failure_type: None,
    maybe_user: Some(user),
  })
}

pub(super) async fn cancel_challenge(state: &DesktopLoginBridgeState, challenge_id: &str) {
  state.pending.lock().await.remove(challenge_id);
}

async fn verify_session(
  client: &LoginChallengeClient,
  signed: &str,
  set_cookie: String,
) -> Result<(RawCookie<'static>, SessionUserInfo), DesktopLoginError> {
  let cookie = RawCookie::parse(set_cookie)
    .map_err(|_| DesktopLoginError::local("Invalid session cookie"))?
    .into_owned();
  if cookie.name() != "session" || cookie.value() != signed {
    return Err(DesktopLoginError::local(
      "Session cookie did not match the redeemed session",
    ));
  }
  // Validate on the SAME native API host before publishing any new credentials.
  let session = client
    .session(&signed)
    .await
    .map_err(|e| DesktopLoginError::from_client(&client.api_origin(), e))?;
  let user = session
    .user
    .filter(|_| session.success && session.logged_in)
    .ok_or_else(|| DesktopLoginError::local("The redeemed session could not authenticate"))?;
  Ok((cookie, user))
}

fn install_session_cookie(
  client: &LoginChallengeClient,
  signed: &str,
  cookie: RawCookie<'static>,
  manager: &StorytellerCredentialManager,
  jar: &Arc<CookieStoreMutex>,
) -> Result<(), DesktopLoginError> {
  let mut store = jar
    .store
    .lock()
    .map_err(|_| DesktopLoginError::local("HTTP cookie store unavailable"))?;
  let mut candidate = store.clone();
  candidate.store_response_cookies([cookie].into_iter(), &client.api_url());
  let credentials = get_credentials_from_cookie_store(&candidate, &client.api_url())
    .map_err(|_| DesktopLoginError::local("Unable to read session cookie"))?;
  if credentials.session.as_ref().map(|c| c.as_str()) != Some(signed) {
    return Err(DesktopLoginError::local(
      "Session cookie does not apply to the configured API host",
    ));
  }
  manager
    .set_credentials(&credentials)
    .map_err(|_| DesktopLoginError::local("Unable to store native login credentials"))?;
  *store = candidate;
  Ok(())
}

async fn persist_session_cookie(jar: &Arc<CookieStoreMutex>) -> Result<(), DesktopLoginError> {
  let saved = jar
    .request_save()
    .map_err(|_| DesktopLoginError::local("Unable to persist login cookie"))?;
  tokio::task::spawn_blocking(move || saved.recv())
    .await
    .map_err(|_| DesktopLoginError::local("Unable to persist login cookie"))?
    .map_err(|_| DesktopLoginError::local("Unable to persist login cookie"))?;
  Ok(())
}

fn expired() -> DesktopLoginOutcome {
  DesktopLoginOutcome {
    status: LoginChallengeState::Failed,
    maybe_failure_type: Some(LoginChallengeFailure::Expired),
    maybe_user: None,
  }
}

#[cfg(test)]
#[path = "storyteller_login_bridge_tests.rs"]
mod login_bridge_tests;
