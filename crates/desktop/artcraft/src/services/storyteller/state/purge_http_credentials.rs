use anyhow::{anyhow, Result};
use reqwest::Url;
use tauri_plugin_http::reqwest_cookie_store::CookieStoreMutex;

use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;

pub(crate) async fn purge_http_credentials(jar: &CookieStoreMutex, manager: &StorytellerCredentialManager, api_url: &Url) -> Result<()> {
  {
    // The synchronization task uses this same jar lock before updating the
    // manager. Holding it through both removals prevents a stale sync snapshot.
    let mut store = jar.store.lock().map_err(|_| anyhow!("Failed to lock HTTP cookie jar"))?;
    let keys: Vec<_> = store.iter_any().filter(|cookie| matches!(cookie.name(), "session" | "visitor") && cookie.domain.matches(api_url)).filter_map(|cookie| {
      Some((cookie.domain.as_cow()?.into_owned(), cookie.path.to_string(), cookie.name().to_owned()))
    }).collect();
    for (domain, path, name) in keys { store.remove(&domain, &path, &name); }
    manager.clear_credentials()?;
    manager.delete_persisted_copies_on_disk()?;
  }
  jar.flush().await.map_err(|err| anyhow!("Failed to persist cleared HTTP cookies: {err}"))?;
  Ok(())
}

#[cfg(test)]
mod login_bridge_tests {
  use super::*;
  use crate::core::state::data_dir::app_data_root::AppDataRoot;
  use crate::core::threads::main_window_thread::persist_storyteller_cookies_task::sync_tauri_credentials;
  use tauri_plugin_http::reqwest_cookie_store::{CookieStore, RawCookie};

  #[tokio::test]
  async fn local_purge_survives_queued_save_sync_and_reload_without_server_logout() {
    let directory = tempfile::tempdir().unwrap();
    let root = AppDataRoot::create_existing(directory.path()).unwrap();
    let manager = StorytellerCredentialManager::initialize_empty(&root);
    let url = Url::parse("https://api.storyteller.ai/").unwrap();
    let mut store = CookieStore::default();
    for cookie in ["session=old; Domain=storyteller.ai; Path=/; Max-Age=3600", "session=path-session; Path=/v1; Max-Age=3600", "visitor=old-visitor; Path=/; Max-Age=3600", "theme=dark; Path=/; Max-Age=3600"] {
      store.store_response_cookies([RawCookie::parse(cookie).unwrap().into_owned()].into_iter(), &url);
    }
    store.store_response_cookies([RawCookie::parse("session=other; Path=/; Max-Age=3600").unwrap().into_owned()].into_iter(), &Url::parse("https://unrelated.example/").unwrap());
    sync_tauri_credentials(&store, &manager, &url).unwrap();
    manager.persist_all_to_disk().unwrap();
    let path = directory.path().join("cookies.json");
    let jar = CookieStoreMutex::new(path.clone(), store);
    let pending = jar.request_save().unwrap();
    purge_http_credentials(&jar, &manager, &url).await.unwrap();
    // The older writer may finish later, but must serialize the cleared jar.
    tokio::task::spawn_blocking(move || pending.recv_timeout(std::time::Duration::from_secs(2))).await.unwrap().unwrap();
    let reloaded: CookieStore = serde_json::from_slice(&std::fs::read(path).unwrap()).unwrap();
    sync_tauri_credentials(&reloaded, &manager, &url).unwrap();
    assert!(manager.get_credentials_required().unwrap().session.is_none());
    assert!(!root.credentials_dir().get_storyteller_session_cookie_file_path().exists());
    assert_eq!(reloaded.get_request_values(&url).collect::<Vec<_>>(), [("theme", "dark")]);
    assert_eq!(reloaded.get_request_values(&Url::parse("https://unrelated.example/").unwrap()).collect::<Vec<_>>(), [("session", "other")]);
    assert!(reloaded.get_request_values(&url.join("v1").unwrap()).all(|(name, _)| name != "session"));
  }
}
