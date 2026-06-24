use artcraft_api_defs::omni_api::generate_requests::omni_api_image_generate_request::OmniApiImageGenerateRequest;
use tokens::tokens::users::UserToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::omni_api::shared_utils::media_uploads::upload_url_to_media_file::{upload_url_to_media_file, MediaUploadKind};
use crate::state::server_state::ServerState;

/// Download any URL image inputs, store them as media files owned by the API
/// user, and fold the resulting tokens into the request's media-token fields so
/// the rest of the handler can treat them as ordinary media tokens.
///
/// `check_request` has already guaranteed the URL and media-token fields are
/// mutually exclusive, so populating the token field here is always safe.
pub async fn ingest_url_inputs(
  request: &mut OmniApiImageGenerateRequest,
  server_state: &ServerState,
  user_token: &UserToken,
  ip_address: &str,
) -> Result<(), CommonWebError> {
  if let Some(urls) = request.image_urls.take() {
    let mut tokens = Vec::with_capacity(urls.len());
    for url in &urls {
      tokens.push(
        upload_url_to_media_file(server_state, user_token, ip_address, url, MediaUploadKind::Image).await?,
      );
    }
    request.image_media_tokens = Some(tokens);
  }

  Ok(())
}
