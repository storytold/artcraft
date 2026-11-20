use crate::core::commands::response::shorthand::{Response, ResponseOrErrorMessage};
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::services::grok::state::grok_credential_manager::GrokCredentialManager;
use crate::services::grok::util::get_or_upgrade_grok_full_credentials::get_or_update_grok_full_credentials;
use errors::AnyhowResult;
use grok_consumer_client::credentials::grok_full_credentials::GrokFullCredentials;
use grok_consumer_client::credentials::grok_user_data::GrokUserData;
use log::{error, info, warn};
use serde_derive::Serialize;
use tauri::State;

#[derive(Serialize)]
pub struct GrokGetCredentialInfoResponse {
  pub maybe_email: Option<String>,
  pub can_clear_state: bool,
}

impl SerializeMarker for GrokGetCredentialInfoResponse {}

#[tauri::command]
pub async fn grok_get_credential_info_command(
  creds_manager: State<'_, GrokCredentialManager>,
) -> ResponseOrErrorMessage<GrokGetCredentialInfoResponse> {
  info!("grok_get_credential_info_command called");

  let info = get_info(&creds_manager)
      .await
      .map_err(|err| {
        error!("Error getting info: {:?}", err);
        "error getting info"
      })?;

  Ok(info.into())
}

async fn get_info(
  creds: &GrokCredentialManager,
) -> AnyhowResult<GrokGetCredentialInfoResponse> {
  let maybe_cookies = creds.maybe_copy_cookie_store()?;
  let maybe_full_credentials = creds.maybe_copy_full_credentials()?;
  let maybe_user_data = creds.maybe_copy_user_data()?;

  let can_clear_state = maybe_cookies.is_some()
      || maybe_full_credentials.is_some()
      || maybe_user_data.is_some();

  let mut maybe_email = email_from_full_credentials(maybe_full_credentials.as_ref())
      .or_else(|| email_from_user_data(maybe_user_data.as_ref()));

  // Best-effort: cookies exist but we still lack an email — try upgrading secrets.
  let needs_identity_upgrade = maybe_cookies.is_some()
      && maybe_email.is_none()
      && maybe_full_credentials.is_none();

  if needs_identity_upgrade {
    match get_or_update_grok_full_credentials(creds).await {
      Ok(full_creds) => {
        maybe_email = email_from_full_credentials(Some(&full_creds));
      }
      Err(err) => {
        warn!(
          "Best-effort Grok secrets upgrade failed while reading credential info: {:?}",
          err
        );
      }
    }
  }

  Ok(GrokGetCredentialInfoResponse {
    maybe_email,
    can_clear_state,
  })
}

fn email_from_full_credentials(
  maybe_full_credentials: Option<&GrokFullCredentials>,
) -> Option<String> {
  maybe_full_credentials
      .and_then(|full_creds| full_creds.client_secrets.user_email.as_ref())
      .map(|email| email.to_string())
}

fn email_from_user_data(
  maybe_user_data: Option<&GrokUserData>,
) -> Option<String> {
  maybe_user_data
      .and_then(|data| data.user_email.as_ref())
      .map(|email| email.to_string())
}
