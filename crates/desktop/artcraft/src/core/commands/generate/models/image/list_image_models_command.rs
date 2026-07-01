//! Tauri command: list available image models.
//!
//! Maps the API-client response into command-specific types (see `response_types`),
//! retries the request up to `MAX_ATTEMPTS` times, and caches successful responses
//! in-memory for `CACHE_TTL`.

use std::sync::RwLock;
use std::time::{Duration, Instant};

use log::{debug, warn};
use once_cell::sync::Lazy;
use tauri::State;

use artcraft_client::endpoints::omni_gen::models::image::omni_gen_list_image_models::{omni_gen_list_image_models, OmniGenListImageModelsArgs, OmniGenImageModelsResponse};
use artcraft_client::utils::api_host::ApiHost;

use crate::core::commands::generate::models::image::response_types::ListImageModelsResponse;
use crate::core::commands::response::shorthand::ResponseOrErrorMessage;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;

const MAX_ATTEMPTS: u32 = 3;
const RETRY_BACKOFF: Duration = Duration::from_millis(250);
const CACHE_TTL: Duration = Duration::from_secs(60);

struct CacheEntry {
  response: ListImageModelsResponse,
  loaded_at: Instant,
}

static CACHE: Lazy<RwLock<Option<CacheEntry>>> = Lazy::new(|| RwLock::new(None));

fn cached_response() -> Option<ListImageModelsResponse> {
  let guard = CACHE.read().ok()?;
  let entry = guard.as_ref()?;
  if entry.loaded_at.elapsed() < CACHE_TTL {
    Some(entry.response.clone())
  } else {
    None
  }
}

fn store_response(response: ListImageModelsResponse) {
  if let Ok(mut guard) = CACHE.write() {
    *guard = Some(CacheEntry { response, loaded_at: Instant::now() });
  }
}

/// Fetch the models list, retrying up to `MAX_ATTEMPTS` times on failure.
async fn fetch_with_retry(api_host: &ApiHost) -> Result<OmniGenImageModelsResponse, String> {
  let mut last_error = "unknown error".to_string();
  for attempt in 1..=MAX_ATTEMPTS {
    match omni_gen_list_image_models(OmniGenListImageModelsArgs { api_host, maybe_creds: None, provider: None }).await {
      Ok(response) => return Ok(response),
      Err(err) => {
        last_error = err.to_string();
        warn!("list_image_models attempt {}/{} failed: {}", attempt, MAX_ATTEMPTS, last_error);
        if attempt < MAX_ATTEMPTS {
          tokio::time::sleep(RETRY_BACKOFF).await;
        }
      }
    }
  }
  Err(last_error)
}

#[tauri::command]
pub async fn list_image_models_command(
  app_env_configs: State<'_, AppEnvConfigs>,
) -> ResponseOrErrorMessage<ListImageModelsResponse> {
  if let Some(cached) = cached_response() {
    debug!("list_image_models_command: serving cached response");
    return Ok(cached.into());
  }

  match fetch_with_retry(&app_env_configs.storyteller_host).await {
    Ok(api_response) => {
      let response: ListImageModelsResponse = api_response.into();
      store_response(response.clone());
      Ok(response.into())
    }
    Err(error_message) => {
      warn!("list_image_models_command failed after {} attempts: {}", MAX_ATTEMPTS, error_message);
      Err(error_message.into())
    }
  }
}
