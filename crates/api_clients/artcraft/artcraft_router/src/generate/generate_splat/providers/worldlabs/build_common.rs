use worldlabs_api_client::api::api_types::world_labs_model::WorldLabsModel;
use worldlabs_api_client::api::requests::generate_world::http_request::WorldPrompt;

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_splat::generate_splat_request_builder::GenerateSplatRequestBuilder;
use crate::generate::generate_splat::providers::worldlabs::draft_common::WorldLabsSplatDraft;
use crate::generate::generate_splat::providers::worldlabs::request_common::WorldLabsSplatRequest;
use crate::generate::generate_splat::providers::worldlabs::resolve::{plan_splat_input, SplatInput};

/// Either a ready-to-send request (text input) or a draft that must upload
/// media assets first. Wrapped into the per-model states by each model's
/// `build.rs` shim.
#[derive(Clone, Debug)]
pub(crate) enum WorldLabsSplatDraftOrRequest {
  Draft(WorldLabsSplatDraft),
  Request(WorldLabsSplatRequest),
}

/// Build a World Labs splat draft-or-request from the builder. Text-only
/// prompts go DIRECT (no upload); any media input needs the draft phase to
/// re-upload the media as World Labs media assets.
pub(crate) fn build_worldlabs_splat(
  mut builder: GenerateSplatRequestBuilder,
  model: WorldLabsModel,
) -> Result<WorldLabsSplatDraftOrRequest, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;
  let prompt = builder.prompt.take();

  let input = plan_splat_input(
    builder.reference_images.take(),
    builder.reference_video.take(),
    builder.is_panoramic,
    prompt.is_some(),
    strategy,
  )?;

  match input {
    SplatInput::Text => {
      let world_prompt = WorldPrompt::Text {
        text_prompt: prompt,
        disable_recaption: builder.disable_recaption,
      };
      Ok(WorldLabsSplatDraftOrRequest::Request(WorldLabsSplatRequest { model, world_prompt }))
    }
    media_input => {
      Ok(WorldLabsSplatDraftOrRequest::Draft(WorldLabsSplatDraft {
        model,
        text_prompt: prompt,
        disable_recaption: builder.disable_recaption,
        input: media_input,
      }))
    }
  }
}
