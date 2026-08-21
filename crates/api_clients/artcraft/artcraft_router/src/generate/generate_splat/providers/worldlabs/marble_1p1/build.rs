use worldlabs_api_client::api::api_types::world_labs_model::WorldLabsModel;

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_splat::generate_splat_request_builder::GenerateSplatRequestBuilder;
use crate::generate::generate_splat::providers::worldlabs::build_common::{
  build_worldlabs_splat, WorldLabsSplatDraftOrRequest,
};
use crate::generate::generate_splat::providers::worldlabs::marble_1p1::draft::WorldLabsMarble1p1DraftState;
use crate::generate::generate_splat::providers::worldlabs::marble_1p1::request::WorldLabsMarble1p1RequestState;
use crate::generate::generate_splat::splat_generation_draft::SplatGenerationDraftRequest;
use crate::generate::generate_splat::splat_generation_draft_or_request::SplatGenerationDraftOrRequest;
use crate::generate::generate_splat::splat_generation_request::SplatGenerationRequest;

pub fn build_worldlabs_marble_1p1(builder: GenerateSplatRequestBuilder) -> Result<SplatGenerationDraftOrRequest, ArtcraftRouterError> {
  match build_worldlabs_splat(builder, WorldLabsModel::Marble1p1)? {
    WorldLabsSplatDraftOrRequest::Request(request) => {
      let state = WorldLabsMarble1p1RequestState { request };
      Ok(SplatGenerationDraftOrRequest::Request(SplatGenerationRequest::WorldLabsMarble1p1(state)))
    }
    WorldLabsSplatDraftOrRequest::Draft(draft) => {
      let state = WorldLabsMarble1p1DraftState { draft };
      Ok(SplatGenerationDraftOrRequest::Draft(SplatGenerationDraftRequest::WorldLabsMarble1p1(state)))
    }
  }
}
