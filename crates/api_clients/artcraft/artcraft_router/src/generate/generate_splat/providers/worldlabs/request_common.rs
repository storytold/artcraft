use std::time::Duration;

use worldlabs_api_client::api::api_types::world_labs_model::WorldLabsModel;
use worldlabs_api_client::api::requests::generate_world::generate_world::{
  generate_world, GenerateWorldArgs,
};
use worldlabs_api_client::api::requests::generate_world::http_request::WorldPrompt;
use worldlabs_api_client::pricing::check_pricing::InputType;

use crate::client::router_worldlabs_client::RouterWorldLabsClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_splat::generate_splat_response::{
  GenerateSplatResponse, WorldLabsSplatResponsePayload,
};

/// How long to wait for the World Labs generate call to accept the request.
/// The call only starts the generation; status is polled separately via the
/// returned operation ID.
const GENERATE_REQUEST_TIMEOUT: Duration = Duration::from_secs(60);

/// A fully materialized World Labs generation request, shared by all marble
/// model request states. Media references (if any) have already been
/// uploaded as World Labs media assets by the draft phase.
#[derive(Clone, Debug)]
pub struct WorldLabsSplatRequest {
  pub model: WorldLabsModel,
  pub world_prompt: WorldPrompt,
}

impl WorldLabsSplatRequest {
  pub async fn send(&self, client: &RouterWorldLabsClient) -> Result<GenerateSplatResponse, ArtcraftRouterError> {
    let response = generate_world(GenerateWorldArgs {
      creds: &client.creds,
      world_prompt: self.world_prompt.clone(),
      display_name: None,
      model: self.model,
      seed: None,
      tags: None,
      permission: None,
      request_timeout: Some(GENERATE_REQUEST_TIMEOUT),
    })
      .await
      .map_err(|err| ArtcraftRouterError::Provider(ProviderError::WorldLabs(err)))?;

    Ok(GenerateSplatResponse::WorldLabs(WorldLabsSplatResponsePayload {
      operation_id: response.operation_id.as_str().to_string(),
      done: response.done,
    }))
  }

  /// The pricing input type of the assembled prompt.
  pub(crate) fn input_type(&self) -> InputType {
    match &self.world_prompt {
      WorldPrompt::Text { .. } => InputType::Text,
      WorldPrompt::Image { is_pano, .. } => {
        if is_pano.unwrap_or(false) {
          InputType::ImagePanorama
        } else {
          InputType::ImageNonPanorama
        }
      }
      WorldPrompt::MultiImage { .. } => InputType::MultiImage,
      WorldPrompt::Video { .. } => InputType::Video,
    }
  }
}
