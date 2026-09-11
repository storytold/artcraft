use crate::core::commands::response::shorthand::{Response, ResponseOrErrorMessage};
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::services::midjourney::state::midjourney_credential_manager::MidjourneyCredentialManager;
use errors::AnyhowResult;
use log::{error, info};
use serde_derive::Serialize;
use tauri::State;

#[derive(Serialize)]
pub struct MidjourneyGetCredentialInfoResponse {
  pub maybe_email: Option<String>,
  pub can_clear_state: bool,
}

impl SerializeMarker for MidjourneyGetCredentialInfoResponse {}

#[tauri::command]
pub async fn midjourney_get_credential_info_command(
  creds_manager: State<'_, MidjourneyCredentialManager>,
) -> ResponseOrErrorMessage<MidjourneyGetCredentialInfoResponse> {
  info!("midjourney_get_credential_info_command called");

  let info = get_info(&creds_manager)
      .map_err(|err| {
        error!("Error getting info: {:?}", err);
        "error getting info"
      })?;

  Ok(info.into())
}

fn get_info(
  creds: &MidjourneyCredentialManager,
) -> AnyhowResult<MidjourneyGetCredentialInfoResponse> {
  let mut can_clear_state = true;
  
  let maybe_cookies = creds.maybe_copy_cookie_store()?;
  let maybe_user_info = creds.maybe_copy_user_info()?;
  
  if maybe_cookies.is_none()  && maybe_user_info.is_none() {
    can_clear_state = false;
  }
  
  let maybe_email = maybe_user_info
      .map(|info| info.email.clone())
      .flatten();
  
  Ok(MidjourneyGetCredentialInfoResponse {
    maybe_email,
    can_clear_state,
  })
}
