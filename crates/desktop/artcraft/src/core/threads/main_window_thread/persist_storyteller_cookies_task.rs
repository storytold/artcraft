use crate::core::state::app_startup_time::AppStartupTime;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use anyhow::anyhow;
use chrono::TimeDelta;
use errors::AnyhowResult;
use log::{error, info};
use once_cell::sync::Lazy;
use reqwest::Url;
use artcraft_client::credentials::storyteller_avt_cookie::StorytellerAvtCookie;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::credentials::storyteller_session_cookie::StorytellerSessionCookie;
use tauri::{AppHandle, Manager};
use tauri_plugin_http::reqwest_cookie_store::CookieStore;
use tauri_plugin_http::Http;

const STORYTELLER_ROOT_COOKIE_URL_STR: &str = "https://api.storyteller.ai/";

static STORYTELLER_ROOT_COOKIE_URL: Lazy<Url> = Lazy::new(|| {
  Url::parse(STORYTELLER_ROOT_COOKIE_URL_STR).expect("URL should parse")
});

const AVT_COOKIE_NAME : &str = "visitor";
const SESSION_COOKIE_NAME : &str = "session";

/// There's some kind of race condition that we need to wait for before inspecting cookies.
const RACE_CONDITION_WAIT_TIME: TimeDelta = TimeDelta::milliseconds(5000);

pub async fn persist_storyteller_cookies_task(
  app: &AppHandle,
  storyteller_credential_manager: &StorytellerCredentialManager,
  app_startup_time: &AppStartupTime,
) -> AnyhowResult<()> {

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
    }
    Some(http) => http,
  };
  
  match http.cookies_jar.store.lock() {
    Err(err) => {
      error!("Failed to lock cookie jar: {:?}", err);
      return Err(anyhow!("Failed to lock cookie jar"));
    }
    Ok(cookie_jar) => {
      sync_tauri_credentials(&cookie_jar, storyteller_credential_manager)?;
    }
  }
  
  Ok(())
}

fn sync_tauri_credentials(
  cookie_store: &CookieStore,
  storyteller_credential_manager: &StorytellerCredentialManager,
) -> AnyhowResult<()> {
  let current_http_plugin_credentials = get_credentials_from_cookie_store(cookie_store)?;

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

pub fn get_credentials_from_cookie_store(cookie_jar: &CookieStore) -> AnyhowResult<StorytellerCredentialSet> {
  let mut avt_cookie = None;
  let mut session_cookie = None;

  for cookie in cookie_jar.iter_unexpired() {
    if let Some(avt) = StorytellerAvtCookie::maybe_from_cookie(&cookie) {
      avt_cookie = Some(avt);
    } else if let Some(session) = StorytellerSessionCookie::maybe_from_cookie(&cookie) {
      session_cookie = Some(session);
    }
  }

  Ok(StorytellerCredentialSet::initialize(
    avt_cookie,
    session_cookie,
  ))
}
