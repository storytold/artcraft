use log::info;

use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::utils::api_host::ApiHost;
use tokens::tokens::media_files::MediaFileToken;

use crate::core::commands::enqueue::generate_error::{BadInputReason, GenerateError};
use crate::core::commands::generate::generate_image::tauri_generate_image_request::TauriGenerateImageRequest;
use crate::core::utils::upload_bytes_to_media_file::upload_image_bytes_as_media_file::upload_image_bytes_as_media_file;
use crate::core::utils::upload_bytes_to_media_file::upload_mask_image_bytes_as_media_file::upload_mask_image_bytes_as_media_file;

/// Resolved semantic media file tokens for canvas, scene, and inpainting mask.
///
/// Each field is populated either from an already-uploaded token on the request
/// or by uploading raw bytes on the fly.
pub struct SemanticMediaFiles {
  pub canvas_image_media_token: Option<MediaFileToken>,
  pub scene_image_media_token: Option<MediaFileToken>,
  pub inpainting_mask_image_media_token: Option<MediaFileToken>,
}

/// Resolve semantic media files from the request.
///
/// For each of (canvas, scene, mask): the request may supply a pre-uploaded
/// token XOR raw bytes. If both are supplied, returns an error. If raw bytes
/// are supplied, uploads them and returns the resulting token.
pub async fn parse_semantic_media_files(
  request: &TauriGenerateImageRequest,
  creds: &StorytellerCredentialSet,
  api_host: &ApiHost,
) -> Result<SemanticMediaFiles, GenerateError> {
  // Canvas image
  let canvas_image_media_token = resolve_image_field(
    "canvas_image",
    request.canvas_image_media_token.as_ref(),
    request.canvas_image_raw_bytes.as_deref(),
    creds,
    api_host,
  ).await?;

  // Scene image
  let scene_image_media_token = resolve_image_field(
    "scene_image",
    request.scene_image_media_token.as_ref(),
    request.scene_image_raw_bytes.as_deref(),
    creds,
    api_host,
  ).await?;

  // Inpainting mask
  let inpainting_mask_image_media_token = resolve_mask_field(
    request.inpainting_mask_image_media_token.as_ref(),
    request.inpainting_mask_image_raw_bytes.as_deref(),
    creds,
    api_host,
  ).await?;

  Ok(SemanticMediaFiles {
    canvas_image_media_token,
    scene_image_media_token,
    inpainting_mask_image_media_token,
  })
}

// ── Helpers ──

async fn resolve_image_field(
  field_name: &str,
  maybe_token: Option<&MediaFileToken>,
  maybe_raw_bytes: Option<&[u8]>,
  creds: &StorytellerCredentialSet,
  api_host: &ApiHost,
) -> Result<Option<MediaFileToken>, GenerateError> {
  if maybe_token.is_some() && maybe_raw_bytes.is_some() {
    return Err(GenerateError::BadInput(BadInputReason::WrongImageArguments(format!(
      "Cannot supply both {}_media_token and {}_raw_bytes",
      field_name, field_name
    ))));
  }

  if let Some(token) = maybe_token {
    return Ok(Some(token.clone()));
  }

  if let Some(raw_bytes) = maybe_raw_bytes {
    info!("Uploading {} raw bytes ({} bytes)...", field_name, raw_bytes.len());
    let token = upload_image_bytes_as_media_file(
      creds,
      api_host,
      raw_bytes.to_vec(),
    ).await?;
    return Ok(Some(token));
  }

  Ok(None)
}

async fn resolve_mask_field(
  maybe_token: Option<&MediaFileToken>,
  maybe_raw_bytes: Option<&[u8]>,
  creds: &StorytellerCredentialSet,
  api_host: &ApiHost,
) -> Result<Option<MediaFileToken>, GenerateError> {
  if maybe_token.is_some() && maybe_raw_bytes.is_some() {
    return Err(GenerateError::BadInput(BadInputReason::BothImageMaskMediaTokenAndBytesSupplied));
  }

  if let Some(token) = maybe_token {
    return Ok(Some(token.clone()));
  }

  if let Some(raw_bytes) = maybe_raw_bytes {
    info!("Uploading inpainting mask raw bytes ({} bytes)...", raw_bytes.len());
    let token = upload_mask_image_bytes_as_media_file(
      creds,
      api_host,
      raw_bytes,
    ).await?;
    return Ok(Some(token));
  }

  Ok(None)
}
