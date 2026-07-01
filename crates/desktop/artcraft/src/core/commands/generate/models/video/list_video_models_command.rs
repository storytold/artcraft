//! Tauri command: list available video models.
//!
//! Maps the API-client response into command-specific types (see `response_types`),
//! retries the request up to `MAX_ATTEMPTS` times, and caches successful responses
//! in-memory for `CACHE_TTL`.

use std::sync::RwLock;
use std::time::{Duration, Instant};

use log::{debug, warn};
use once_cell::sync::Lazy;
use tauri::State;

use artcraft_client::endpoints::omni_gen::models::video::omni_gen_list_video_models::{omni_gen_list_video_models, OmniGenListVideoModelsArgs, OmniGenVideoModelsResponse};
use artcraft_client::utils::api_host::ApiHost;

use crate::core::commands::generate::models::video::response_types::ListVideoModelsResponse;
use crate::core::commands::response::shorthand::ResponseOrErrorMessage;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;

const MAX_ATTEMPTS: u32 = 3;
const RETRY_BACKOFF: Duration = Duration::from_millis(250);
const CACHE_TTL: Duration = Duration::from_secs(60);

struct CacheEntry {
  response: ListVideoModelsResponse,
  loaded_at: Instant,
}

static CACHE: Lazy<RwLock<Option<CacheEntry>>> = Lazy::new(|| RwLock::new(None));

fn cached_response() -> Option<ListVideoModelsResponse> {
  let guard = CACHE.read().ok()?;
  let entry = guard.as_ref()?;
  if entry.loaded_at.elapsed() < CACHE_TTL {
    Some(entry.response.clone())
  } else {
    None
  }
}

fn store_response(response: ListVideoModelsResponse) {
  if let Ok(mut guard) = CACHE.write() {
    *guard = Some(CacheEntry { response, loaded_at: Instant::now() });
  }
}

/// Fetch the models list, retrying up to `MAX_ATTEMPTS` times on failure.
async fn fetch_with_retry(api_host: &ApiHost) -> Result<OmniGenVideoModelsResponse, String> {
  let mut last_error = "unknown error".to_string();
  for attempt in 1..=MAX_ATTEMPTS {
    match omni_gen_list_video_models(OmniGenListVideoModelsArgs { api_host, maybe_creds: None, provider: None }).await {
      Ok(response) => return Ok(response),
      Err(err) => {
        last_error = err.to_string();
        warn!("list_video_models attempt {}/{} failed: {}", attempt, MAX_ATTEMPTS, last_error);
        if attempt < MAX_ATTEMPTS {
          tokio::time::sleep(RETRY_BACKOFF).await;
        }
      }
    }
  }
  Err(last_error)
}

#[tauri::command]
pub async fn list_video_models_command(
  app_env_configs: State<'_, AppEnvConfigs>,
) -> ResponseOrErrorMessage<ListVideoModelsResponse> {
  if let Some(cached) = cached_response() {
    debug!("list_video_models_command: serving cached response");
    return Ok(cached.into());
  }

  match fetch_with_retry(&app_env_configs.storyteller_host).await {
    Ok(api_response) => {
      let response: ListVideoModelsResponse = api_response.into();
      store_response(response.clone());
      Ok(response.into())
    }
    Err(error_message) => {
      warn!("list_video_models_command failed after {} attempts: {}", MAX_ATTEMPTS, error_message);
      Err(error_message.into())
    }
  }
}
