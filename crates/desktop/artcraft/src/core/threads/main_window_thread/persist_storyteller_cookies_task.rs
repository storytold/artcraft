use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::app_startup_time::AppStartupTime;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use anyhow::anyhow;
use chrono::TimeDelta;
use errors::AnyhowResult;
use log::{error, info};
use reqwest::Url;
use artcraft_client::credentials::storyteller_avt_cookie::StorytellerAvtCookie;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::credentials::storyteller_session_cookie::StorytellerSessionCookie;
use tauri::{AppHandle, Manager};
use tauri_plugin_http::reqwest_cookie_store::CookieStore;
use tauri_plugin_http::Http;

const AVT_COOKIE_NAME: &str = "visitor";
const SESSION_COOKIE_NAME: &str = "session";

/// There's some kind of race condition that we need to wait for before inspecting cookies.
const RACE_CONDITION_WAIT_TIME: TimeDelta = TimeDelta::milliseconds(5000);

pub async fn persist_storyteller_cookies_task(app: &AppHandle, storyteller_credential_manager: &StorytellerCredentialManager, app_startup_time: &AppStartupTime) -> AnyhowResult<()> {
  //if app_startup_time.time_delta_since() < RACE_CONDITION_WAIT_TIME {
  //  // NB:     There's an issue when the "main window thread" inquires about the
  //  //     webview cookies shortly after app startup. When it attempts to dump the
  //  //     cookies within a few milliseconds of app launch, it deadlocks and the
  //  //     app never launches correctly. The entire webview goes blank and the app
  //  //     freezes. This hack seems to fix the problem.
  //  return Ok(())
  //}

  let maybe_http = app.try_state::<Http>();

  let http = match maybe_http {
    None => {
      error!("No HTTP plugin found");
      return Err(anyhow!("No HTTP plugin found"));
    },
    Some(http) => http,
  };

  match http.cookies_jar.store.lock() {
    Err(err) => {
      error!("Failed to lock cookie jar: {:?}", err);
      return Err(anyhow!("Failed to lock cookie jar"));
    },
    Ok(cookie_jar) => {
      sync_tauri_credentials(&cookie_jar, storyteller_credential_manager, &storyteller_cookie_url(app)?)?;
    },
  }

  Ok(())
}

pub(crate) fn sync_tauri_credentials(cookie_store: &CookieStore, storyteller_credential_manager: &StorytellerCredentialManager, api_url: &Url) -> AnyhowResult<()> {
  let current_http_plugin_credentials = get_credentials_from_cookie_store(cookie_store, api_url)?;

  let mut replace_credentials = true;

  let maybe_old_credentials = storyteller_credential_manager.get_credentials()?;

  if let Some(old_credentials) = maybe_old_credentials {
    if old_credentials.equals(&current_http_plugin_credentials) {
      replace_credentials = false;
    }
  }

  if replace_credentials {
    info!("Syncing ArtCraft credentials ...");
    storyteller_credential_manager.set_credentials(&current_http_plugin_credentials)?;
    // NB: tauri-plugin-http stores the credentials on disk, so we can defer to that for now.
    //storyteller_credential_manager.persist_all_to_disk()?;
  }

  Ok(())
}

pub fn get_credentials_from_cookie_store(cookie_jar: &CookieStore, api_url: &Url) -> AnyhowResult<StorytellerCredentialSet> {
  let mut avt_cookie = None;
  let mut session_cookie = None;

  // Only cookies applicable to our API origin can become ArtCraft credentials.
  for (name, value) in cookie_jar.get_request_values(api_url) {
    match name {
      AVT_COOKIE_NAME => avt_cookie = Some(StorytellerAvtCookie::new(value.to_owned())),
      SESSION_COOKIE_NAME => session_cookie = Some(StorytellerSessionCookie::new(value.to_owned())),
      _ => {},
    }
  }

  Ok(StorytellerCredentialSet::initialize(avt_cookie, session_cookie))
}

pub(crate) fn storyteller_cookie_url(app: &AppHandle) -> AnyhowResult<Url> {
  let config = app.try_state::<AppEnvConfigs>().ok_or_else(|| anyhow!("API configuration unavailable"))?;
  Ok(Url::parse(&format!("{}/", config.storyteller_host.to_api_hostname_and_scheme()))?)
}

#[cfg(test)]
mod login_bridge_tests {
  use super::*;
  use crate::core::state::data_dir::app_data_root::AppDataRoot;
  use tauri_plugin_http::reqwest_cookie_store::RawCookie;

  #[test]
  fn approved_response_cookie_reaches_native_credentials() {
    let directory = tempfile::tempdir().unwrap();
    let root = AppDataRoot::create_existing(directory.path()).unwrap();
    let manager = StorytellerCredentialManager::initialize_empty(&root);
    let mut jar = CookieStore::default();
    let url = Url::parse("https://api.storyteller.ai/v1/login_challenges/poll").unwrap();
    jar.store_response_cookies([RawCookie::parse("session=signed_backend_cookie; Secure; HttpOnly; Path=/; Max-Age=3600").unwrap().into_owned(), RawCookie::parse("visitor=existing_visitor; Secure; Path=/; Max-Age=3600").unwrap().into_owned()].into_iter(), &url);
    sync_tauri_credentials(&jar, &manager, &url).unwrap();
    let credentials = manager.get_credentials_required().unwrap();
    assert_eq!(credentials.session.unwrap().as_str(), "signed_backend_cookie");
    assert_eq!(credentials.avt.unwrap().as_str(), "existing_visitor");
    // Retrying the same successful poll is idempotent for native credentials too.
    sync_tauri_credentials(&jar, &manager, &url).unwrap();
    assert_eq!(manager.get_credentials_required().unwrap().session.unwrap().as_str(), "signed_backend_cookie");
  }

  #[test]
  fn unrelated_and_expired_cookies_cannot_become_artcraft_sessions() {
    let url = Url::parse("https://api.storyteller.ai/").unwrap();
    let mut jar = CookieStore::default();
    jar.store_response_cookies([RawCookie::parse("session=unrelated; Path=/; Max-Age=3600").unwrap().into_owned()].into_iter(), &Url::parse("https://unrelated.example/").unwrap());
    assert!(get_credentials_from_cookie_store(&jar, &url).unwrap().session.is_none());
    jar.store_response_cookies([RawCookie::parse("session=expired; Secure; Path=/; Max-Age=0").unwrap().into_owned()].into_iter(), &url);
    assert!(get_credentials_from_cookie_store(&jar, &url).unwrap().session.is_none());
  }

  #[test]
  fn configured_local_api_does_not_import_production_cookies() {
    let production = Url::parse("https://api.storyteller.ai/").unwrap();
    let local = Url::parse("http://localhost:12345/").unwrap();
    let mut jar = CookieStore::default();
    jar.store_response_cookies([RawCookie::parse("session=production; Secure; Path=/").unwrap().into_owned()].into_iter(), &production);
    assert!(get_credentials_from_cookie_store(&jar, &local).unwrap().session.is_none());
    jar.store_response_cookies([RawCookie::parse("session=development; Path=/").unwrap().into_owned()].into_iter(), &local);
    assert_eq!(get_credentials_from_cookie_store(&jar, &local).unwrap().session.unwrap().as_str(), "development");
    assert_eq!(get_credentials_from_cookie_store(&jar, &production).unwrap().session.unwrap().as_str(), "production");
  }
}
