use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_splat::plan::artcraft::plan_generate_splat_artcraft_marble_0p1_plus::PlanArtcraftMarble0p1Plus;
use crate::generate::generate_splat::generate_splat_response::{
  ArtcraftSplatResponsePayload, GenerateSplatResponse,
};
use artcraft_api_defs::generate::splat::generate_worldlabs_marble_0p1_plus_splat::GenerateWorldlabsMarble0p1PlusSplatRequest;
use artcraft_client::endpoints::generate::splat::generate_worldlabs_marble_0p1_plus_splat::generate_worldlabs_marble_0p1_plus_splat;

pub async fn execute_artcraft_marble_0p1_plus(
  plan: &PlanArtcraftMarble0p1Plus<'_>,
  artcraft_client: &RouterArtcraftClient,
) -> Result<GenerateSplatResponse, ArtcraftRouterError> {
  let request = GenerateWorldlabsMarble0p1PlusSplatRequest {
    uuid_idempotency_token: plan.idempotency_token.clone(),
    image_media_file_token: plan.reference_image.cloned(),
    prompt: plan.prompt.map(|p| p.to_string()),
  };

  let response = generate_worldlabs_marble_0p1_plus_splat(
    &artcraft_client.api_host,
    Some(&artcraft_client.credentials),
    request,
  )
    .await
    .map_err(|err| ArtcraftRouterError::Provider(ProviderError::Storyteller(err)))?;

  Ok(GenerateSplatResponse::Artcraft(ArtcraftSplatResponsePayload {
    inference_job_token: response.inference_job_token,
  }))
}
