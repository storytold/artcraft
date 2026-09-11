use worldlabs_api_client::api::api_types::world_labs_model::WorldLabsModel;

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_splat::generate_splat_request_builder::GenerateSplatRequestBuilder;
use crate::generate::generate_splat::providers::worldlabs::build_common::{
  build_worldlabs_splat, WorldLabsSplatDraftOrRequest,
};
use crate::generate::generate_splat::providers::worldlabs::marble_1p0::draft::WorldLabsMarble1p0DraftState;
use crate::generate::generate_splat::providers::worldlabs::marble_1p0::request::WorldLabsMarble1p0RequestState;
use crate::generate::generate_splat::splat_generation_draft::SplatGenerationDraftRequest;
use crate::generate::generate_splat::splat_generation_draft_or_request::SplatGenerationDraftOrRequest;
use crate::generate::generate_splat::splat_generation_request::SplatGenerationRequest;

pub fn build_worldlabs_marble_1p0(builder: GenerateSplatRequestBuilder) -> Result<SplatGenerationDraftOrRequest, ArtcraftRouterError> {
  match build_worldlabs_splat(builder, WorldLabsModel::Marble1p0)? {
    WorldLabsSplatDraftOrRequest::Request(request) => {
      let state = WorldLabsMarble1p0RequestState { request };
      Ok(SplatGenerationDraftOrRequest::Request(SplatGenerationRequest::WorldLabsMarble1p0(state)))
    }
    WorldLabsSplatDraftOrRequest::Draft(draft) => {
      let state = WorldLabsMarble1p0DraftState { draft };
      Ok(SplatGenerationDraftOrRequest::Draft(SplatGenerationDraftRequest::WorldLabsMarble1p0(state)))
    }
  }
}
