use enums::common::generation::common_splat_model::CommonSplatModel as CommonSplatModelEnum;

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_splat::generate_splat_request_builder::GenerateSplatRequestBuilder;
use crate::generate::generate_splat::providers::artcraft::build_common::build_artcraft_omni_splat_request;
use crate::generate::generate_splat::providers::artcraft::marble_1p1::request::ArtcraftMarble1p1RequestState;
use crate::generate::generate_splat::splat_generation_draft_or_request::SplatGenerationDraftOrRequest;
use crate::generate::generate_splat::splat_generation_request::SplatGenerationRequest;

pub fn build_artcraft_marble_1p1(builder: GenerateSplatRequestBuilder) -> Result<SplatGenerationDraftOrRequest, ArtcraftRouterError> {
  let request = build_artcraft_omni_splat_request(builder, CommonSplatModelEnum::Marble1p1)?;
  let state = ArtcraftMarble1p1RequestState { request };
  Ok(SplatGenerationDraftOrRequest::Request(SplatGenerationRequest::ArtcraftMarble1p1(state)))
}
