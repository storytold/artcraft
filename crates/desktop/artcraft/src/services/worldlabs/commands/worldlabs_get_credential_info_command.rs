use crate::core::commands::response::shorthand::{Response, ResponseOrErrorMessage};
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::services::worldlabs::state::worldlabs_credential_manager::WorldlabsCredentialManager;
use errors::AnyhowResult;
use log::{error, info};
use serde_derive::Serialize;
use tauri::State;
use worldlabs_consumer_client::credentials::jwt_claims::JwtClaims;
use worldlabs_consumer_client::error::world_labs_error::WorldLabsError;

#[derive(Serialize)]
pub struct WorldlabsGetCredentialInfoResponse {
  pub maybe_email: Option<String>,
  pub can_clear_state: bool,
}

impl SerializeMarker for WorldlabsGetCredentialInfoResponse {}

#[tauri::command]
pub async fn worldlabs_get_credential_info_command(
  creds_manager: State<'_, WorldlabsCredentialManager>,
) -> ResponseOrErrorMessage<WorldlabsGetCredentialInfoResponse> {
  info!("worldlabs_get_credential_info_command called");

  let info = get_info(&creds_manager)
      .map_err(|err| {
        error!("Error getting info: {:?}", err);
        "error getting info"
      })?;

  Ok(info.into())
}

fn get_info(
  creds: &WorldlabsCredentialManager,
) -> AnyhowResult<WorldlabsGetCredentialInfoResponse> {
  let mut can_clear_state = true;
  
  let maybe_cookies = creds.maybe_copy_cookie_store()?;
  let maybe_bearer = creds.maybe_copy_bearer_token()?;

  if maybe_cookies.is_none() && maybe_bearer.is_none() {
    can_clear_state = false;
  }

  let mut maybe_email = None;

  if let Some(bearer) = maybe_bearer {
    match bearer.parse_jwt_claims() {
      Ok(claims) => {
        maybe_email = claims.email;
      }
      Err(err) => {
        error!("Failed to parse JWT bearer claims: {}", err);
      }
    }
  }

  Ok(WorldlabsGetCredentialInfoResponse {
    maybe_email,
    can_clear_state,
  })
}
