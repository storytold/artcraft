use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::events::functional_events::show_provider_login_modal_event::ShowProviderLoginModalEvent;
use crate::services::grok::state::grok_credential_manager::GrokCredentialManager;
use grok_client::credentials::grok_cookies::GrokCookies;
use grok_client::credentials::grok_full_credentials::GrokFullCredentials;
use grok_client::error::grok_client_error::GrokClientError;
use grok_client::error::grok_error::GrokError;
use grok_client::recipes::request_client_secrets::{request_client_secrets, RequestClientSecretsArgs};
use log::{error, info, warn};
use tauri::AppHandle;
use crate::core::artcraft_error::ArtcraftError;

pub async fn get_or_update_grok_full_credentials(grok_credential_manager: &GrokCredentialManager) -> Result<GrokFullCredentials, ArtcraftError> {
  if let Some(creds) = grok_credential_manager.maybe_copy_full_credentials()? {
    return Ok(creds);
  }

  let cookies = match grok_credential_manager.maybe_copy_cookie_store()? {
    Some(cookies) => cookies.to_cookie_string(),
    None => {
      return Err(GrokError::Client(GrokClientError::NoCookiesPresent).into())
    }
  };

  let cookies = GrokCookies::new(cookies);

  info!("Requesting Grok client secrets...");

  let upgraded = request_client_secrets(RequestClientSecretsArgs {
    cookies: &cookies,
  }).await;

  match upgraded {
    Err(err) => {
      error!("Failed to fetch Grok client secrets: {}", err); // NB: Fall-through
      return Err(ArtcraftError::from(err));
    }
    Ok(secrets) => {
      info!("Grok client secrets successfully upgraded...");
      let full_creds = GrokFullCredentials::from_cookies_and_client_secrets(cookies, secrets);
      grok_credential_manager.replace_full_credentials(full_creds.clone())?;
      info!("Persisting grok credentials to disk...");
      grok_credential_manager.persist_to_disk()?;
      return Ok(full_creds)
    }
  }

  warn!("Grok upgrade failed. Try logging in again...");
}
