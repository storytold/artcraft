use log::{error, info};

use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::endpoints::media_files::upload_image_media_file_from_bytes::{
  upload_image_media_file_from_bytes, ImageType, UploadImageBytesArgs,
};
use artcraft_client::utils::api_host::ApiHost;
use images::mask_images::normalize_image_bytes_to_flux_mask::normalize_image_bytes_to_flux_mask;
use tokens::tokens::media_files::MediaFileToken;

use crate::core::commands::enqueue::generate_error::GenerateError;

/// Upload raw mask image bytes to ArtCraft, returning the resulting MediaFileToken.
///
/// The mask bytes are first normalized via `normalize_image_bytes_to_flux_mask`
/// (transparent pixels → black/ignore, opaque pixels → white/interest region),
/// then uploaded as an intermediate system file (hidden from the user's gallery).
pub async fn upload_mask_image_bytes_as_media_file(
  creds: &StorytellerCredentialSet,
  api_host: &ApiHost,
  mask_image_bytes: &[u8],
) -> Result<MediaFileToken, GenerateError> {
  info!("Normalizing mask image bytes ({} bytes)...", mask_image_bytes.len());

  let normalized = normalize_image_bytes_to_flux_mask(mask_image_bytes)
    .map_err(|err| {
      error!("Failed to normalize mask image bytes: {:?}", err);
      GenerateError::AnyhowError(anyhow::anyhow!("Failed to normalize mask image bytes"))
    })?;

  info!("Uploading normalized mask ({} bytes) as intermediate system file...", normalized.0.len());

  let result = upload_image_media_file_from_bytes(UploadImageBytesArgs {
    api_host,
    maybe_creds: Some(creds),
    image_bytes: normalized.0,
    image_type: ImageType::Png,
    is_intermediate_system_file: true,
  }).await.map_err(|err| {
    error!("Failed to upload mask image bytes: {:?}", err);
    GenerateError::from(err)
  })?;

  info!("Uploaded mask as media file: {}", result.media_file_token.as_str());

  Ok(result.media_file_token)
}
