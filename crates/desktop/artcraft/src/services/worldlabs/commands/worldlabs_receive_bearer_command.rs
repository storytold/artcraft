use crate::core::commands::response::shorthand::{Response, SimpleResponse};
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::worldlabs::state::worldlabs_bearer_bridge::{WorldlabsBearerBridge, WorldlabsBearerBridgeInner};
use crate::services::worldlabs::state::worldlabs_credential_manager::WorldlabsCredentialManager;
use errors::AnyhowResult;
use log::{error, info};
use serde_derive::{Deserialize, Serialize};
use tauri::State;
use tokens::tokens::media_files::MediaFileToken;


#[derive(Deserialize, Debug)]
pub struct WorldlabsReceiveBearerRequest {
  /// REQUIRED.
  pub bearer_token: String,

  /// REQUIRED.
  pub refresh_token: String,
}

#[derive(Serialize)]
pub struct WorldlabsReceiveBearerResponse {
}

impl SerializeMarker for WorldlabsReceiveBearerResponse {}


#[tauri::command]
pub async fn worldlabs_receive_bearer_command(
  root: State<'_, AppDataRoot>,
  request: WorldlabsReceiveBearerRequest,
  bearer_bridge: State<'_, WorldlabsBearerBridge>,
) -> SimpleResponse {
  info!("worldlabs_receive_bearer_command called");

  info!("Request: {:?}", request);

  set_bearer(request, &bearer_bridge)
      .map_err(|err| {
        error!("Error setting bearer: {:?}", err);
        "error setting bearer"
      })?;

  Ok(().into())
}

fn set_bearer(
  request: WorldlabsReceiveBearerRequest,
  bearer_bridge: &WorldlabsBearerBridge,
) -> AnyhowResult<()> {

  bearer_bridge.set(WorldlabsBearerBridgeInner {
    bearer_token: request.bearer_token,
    refresh_token: request.refresh_token,
  })?;

  Ok(())
}
