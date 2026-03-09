use crate::api::image_list_ref::ImageListRef;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_splat::generate_splat_request::GenerateSplatRequest;
use tokens::tokens::media_files::MediaFileToken;

#[derive(Debug, Clone)]
pub struct PlanArtcraftMarble0p1Plus<'a> {
  pub prompt: Option<&'a str>,
  pub reference_image: Option<&'a MediaFileToken>,
  pub idempotency_token: String,
}

pub fn plan_generate_splat_artcraft_marble_0p1_plus<'a>(
  request: &'a GenerateSplatRequest<'a>,
) -> Result<PlanArtcraftMarble0p1Plus<'a>, ArtcraftRouterError> {
  let reference_image = resolve_single_image_ref(request.reference_images)?;

  Ok(PlanArtcraftMarble0p1Plus {
    prompt: request.prompt,
    reference_image,
    idempotency_token: request.get_or_generate_idempotency_token(),
  })
}

fn resolve_single_image_ref<'a>(
  image_list_ref: Option<ImageListRef<'a>>,
) -> Result<Option<&'a MediaFileToken>, ArtcraftRouterError> {
  match image_list_ref {
    None => Ok(None),
    Some(ImageListRef::MediaFileTokens(tokens)) => {
      Ok(tokens.first())
    }
    Some(ImageListRef::Urls(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    }
  }
}
