use enums::common::generation::common_splat_model::CommonSplatModel as CommonSplatModelEnum;

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_splat::generate_splat_request_builder::GenerateSplatRequestBuilder;
use crate::generate::generate_splat::providers::artcraft::build_common::build_artcraft_omni_splat_request;
use crate::generate::generate_splat::providers::artcraft::triposplat::request::ArtcraftTripoSplatRequestState;
use crate::generate::generate_splat::splat_generation_draft_or_request::SplatGenerationDraftOrRequest;
use crate::generate::generate_splat::splat_generation_request::SplatGenerationRequest;

pub fn build_artcraft_triposplat(builder: GenerateSplatRequestBuilder) -> Result<SplatGenerationDraftOrRequest, ArtcraftRouterError> {
  let request = build_artcraft_omni_splat_request(builder, CommonSplatModelEnum::TripoSplat)?;
  let state = ArtcraftTripoSplatRequestState { request };
  Ok(SplatGenerationDraftOrRequest::Request(SplatGenerationRequest::ArtcraftTripoSplat(state)))
}
