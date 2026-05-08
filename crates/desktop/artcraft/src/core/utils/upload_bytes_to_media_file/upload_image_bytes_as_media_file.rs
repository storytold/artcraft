use log::info;

use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::endpoints::media_files::upload_image_media_file_from_bytes::{
  upload_image_media_file_from_bytes, ImageType, UploadImageBytesArgs,
};
use artcraft_client::utils::api_host::ApiHost;
use tokens::tokens::media_files::MediaFileToken;

use crate::core::commands::enqueue::generate_error::GenerateError;

/// Upload raw image bytes to ArtCraft, returning the resulting MediaFileToken.
///
/// This is NOT marked as an intermediate system file — the image will appear
/// in the user's gallery.
pub async fn upload_image_bytes_as_media_file(
  creds: &StorytellerCredentialSet,
  api_host: &ApiHost,
  image_bytes: Vec<u8>,
) -> Result<MediaFileToken, GenerateError> {
  info!("Uploading image bytes ({} bytes) as media file...", image_bytes.len());

  let result = upload_image_media_file_from_bytes(UploadImageBytesArgs {
    api_host,
    maybe_creds: Some(creds),
    image_bytes,
    image_type: ImageType::Png,
    is_intermediate_system_file: false,
  }).await.map_err(|err| {
    log::error!("Failed to upload image bytes as media file: {:?}", err);
    GenerateError::from(err)
  })?;

  info!("Uploaded image bytes as media file: {}", result.media_file_token.as_str());

  Ok(result.media_file_token)
}
