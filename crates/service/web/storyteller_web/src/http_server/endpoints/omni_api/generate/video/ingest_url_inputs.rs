use artcraft_api_defs::omni_api::generate_requests::omni_api_video_generate_request::OmniApiVideoGenerateRequest;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::omni_api::shared_utils::media_uploads::upload_url_to_media_file::{upload_url_to_media_file, MediaUploadKind};
use crate::state::server_state::ServerState;

/// Download any URL media inputs, store them as media files owned by the API
/// user, and fold the resulting tokens into the request's media-token fields so
/// the rest of the handler can treat them as ordinary media tokens.
///
/// `check_request` has already guaranteed each URL and media-token field is
/// mutually exclusive, so populating the token field here is always safe.
pub async fn ingest_url_inputs(
  request: &mut OmniApiVideoGenerateRequest,
  server_state: &ServerState,
  user_token: &UserToken,
  ip_address: &str,
) -> Result<(), CommonWebError> {
  if let Some(url) = request.start_frame_image_url.take() {
    request.start_frame_image_media_token = Some(
      upload_url_to_media_file(server_state, user_token, ip_address, &url, MediaUploadKind::Image).await?,
    );
  }

  if let Some(url) = request.end_frame_image_url.take() {
    request.end_frame_image_media_token = Some(
      upload_url_to_media_file(server_state, user_token, ip_address, &url, MediaUploadKind::Image).await?,
    );
  }

  if let Some(urls) = request.reference_image_urls.take() {
    request.reference_image_media_tokens =
      Some(upload_all(server_state, user_token, ip_address, &urls, MediaUploadKind::Image).await?);
  }

  if let Some(urls) = request.reference_video_urls.take() {
    request.reference_video_media_tokens =
      Some(upload_all(server_state, user_token, ip_address, &urls, MediaUploadKind::Video).await?);
  }

  if let Some(urls) = request.reference_audio_urls.take() {
    request.reference_audio_media_tokens =
      Some(upload_all(server_state, user_token, ip_address, &urls, MediaUploadKind::Audio).await?);
  }

  Ok(())
}

async fn upload_all(
  server_state: &ServerState,
  user_token: &UserToken,
  ip_address: &str,
  urls: &[String],
  kind: MediaUploadKind,
) -> Result<Vec<MediaFileToken>, CommonWebError> {
  let mut tokens = Vec::with_capacity(urls.len());
  for url in urls {
    tokens.push(upload_url_to_media_file(server_state, user_token, ip_address, url, kind).await?);
  }
  Ok(tokens)
}
