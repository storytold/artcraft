use crate::core::commands::response::shorthand::{Response, ResponseOrErrorMessage};
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::services::midjourney::state::midjourney_credential_manager::MidjourneyCredentialManager;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use errors::AnyhowResult;
use log::{error, info};
use serde_derive::Serialize;
use tauri::State;

#[derive(Serialize)]
pub struct SoraGetCredentialInfoResponse {
  pub maybe_email: Option<String>,
  pub can_clear_state: bool,
}

impl SerializeMarker for SoraGetCredentialInfoResponse {}

#[tauri::command]
pub async fn sora_get_credential_info_command(
  sora_creds_manager: State<'_, SoraCredentialManager>,
) -> ResponseOrErrorMessage<SoraGetCredentialInfoResponse> {
  info!("sora_get_credential_info_command called");

  let info = get_info(&sora_creds_manager)
      .map_err(|err| {
        error!("Error getting info: {:?}", err);
        "error getting info"
      })?;

  Ok(info.into())
}

fn get_info(
  sora_creds_manager: &SoraCredentialManager,
) -> AnyhowResult<SoraGetCredentialInfoResponse> {
  
  let maybe_creds = sora_creds_manager.get_credentials()?;

  let mut can_clear_state = maybe_creds.is_some();
  let mut maybe_email = None;
  
  if let Some(creds) = maybe_creds {
    if let Some(jwt) = &creds.jwt_bearer_token {
      maybe_email = Some(jwt.jwt_claims().email.clone());
    }
    
    // TODO: This was cargo culted from Midjourney. Probably not quite right.
    //  We probably need an Option<T> for cookie rather than an empty / partial string as 
    //  well as timestamps, invalidation states, etc.
    if creds.jwt_bearer_token.is_none() && creds.sora_sentinel.is_none() {
      can_clear_state = false;
    }
  }
  
  Ok(SoraGetCredentialInfoResponse {
    maybe_email,
    can_clear_state,
  })
}
