//! Downloads an image from a fal result payload, uploads it to the public
//! bucket, inserts an intermediate media file record, and sets it as the
//! cover image of another media file (e.g. a mesh or gaussian splat).

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::webhooks::fal::process_success::resolve_file_metadata::resolve_file_metadata;
use crate::state::server_state::ServerState;
use crate::util::http_download_url_to_bytes::http_download_url_to_bytes;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use hashing::sha256::sha256_hash_bytes::sha256_hash_bytes;
use log::{info, warn};
use mysql_queries::queries::generic_inference::api_providers::fal::get_inference_job_by_fal_id::FalJobDetails;
use mysql_queries::queries::media_files::create::specialized_insert::insert_cover_media_file::{insert_cover_media_file, InsertCoverMediaFileArgs};
use mysql_queries::queries::media_files::edit::set_media_file_cover_image::{set_media_file_cover_image, UpdateArgs};
use tokens::tokens::media_files::MediaFileToken;

const PREFIX : Option<&str> = Some("artcraft_");

pub(crate) struct AttachCoverImageArgs<'a> {
  pub image_url: &'a str,
  pub maybe_content_type: Option<&'a str>,
  /// Product category to tag the cover image record with, when the parent
  /// media file carries one (e.g. `WorldGeneration` for gaussian splats).
  pub maybe_origin_product_category: Option<MediaFileOriginProductCategory>,
  /// The media file the cover image is attached to.
  pub target_media_token: &'a MediaFileToken,
  pub job: &'a FalJobDetails,
  pub server_state: &'a ServerState,
}

/// Download a cover image from fal, upload it to the public bucket, insert an
/// intermediate media file record, and set it as the cover image of
/// `target_media_token`. Callers should fail open: a missing cover image is
/// not worth failing the whole webhook over.
pub(crate) async fn attach_cover_image(
  args: AttachCoverImageArgs<'_>,
) -> Result<(), CommonWebError> {
  let AttachCoverImageArgs {
    image_url,
    maybe_content_type,
    maybe_origin_product_category,
    target_media_token,
    job,
    server_state,
  } = args;

  // Download with a retry if the first attempt returns suspiciously few bytes.
  let mut file_bytes = http_download_url_to_bytes(image_url)
      .await
      .map_err(|err| {
        warn!("Failed to download cover image from {}: {:?}", image_url, err);
        CommonWebError::server_error_with_message(
          &format!("Failed to download cover image: {:?}", err))
      })?;

  if file_bytes.len() <= 10 {
    warn!(
      "Downloaded only {} bytes from {} — retrying once",
      file_bytes.len(),
      image_url,
    );
    file_bytes = http_download_url_to_bytes(image_url)
        .await
        .map_err(|err| {
          warn!("Failed to download cover image on retry from {}: {:?}", image_url, err);
          CommonWebError::server_error_with_message(
            &format!("Failed to download cover image on retry: {:?}", err))
        })?;
  }

  // Resolve mime type: magic bytes first, fal content_type as fallback.
  let metadata = resolve_file_metadata(&file_bytes, maybe_content_type)
      .ok_or_else(|| {
        warn!(
          "Could not determine file type for cover image (bytes: {}, fal content_type: {:?})",
          file_bytes.len(),
          maybe_content_type,
        );
        CommonWebError::server_error_with_message(
          &format!("Could not determine file type for cover image (bytes: {}, fal content_type: {:?})",
            file_bytes.len(), maybe_content_type))
      })?;

  let mime_type = metadata.mime_type.as_str();

  info!("Mime type of cover image: {}, source: {:?}", mime_type, metadata.source);

  let media_file_type = MediaFileType::try_from_mime_type(mime_type)
      .ok_or_else(|| {
        warn!("Unsupported cover image media file type: {}", mime_type);
        CommonWebError::server_error_with_message(
          &format!("Unsupported media file type: {}", mime_type))
      })?;

  let extension_with_period = metadata.file_extension.extension_with_period();

  let file_size_bytes = file_bytes.len();
  let file_hash = sha256_hash_bytes(&file_bytes)
      .map_err(|err| {
        warn!("Failed to hash cover image bytes: {:?}", err);
        CommonWebError::from_anyhow_error(err)
      })?;

  let public_upload_path = MediaFileBucketPath::generate_new(PREFIX, Some(&extension_with_period));

  info!("Uploading cover image media to bucket path: {}", public_upload_path.get_full_object_path_str());

  server_state.public_bucket_client.upload_file_with_content_type_process(
    public_upload_path.get_full_object_path_str(),
    file_bytes.as_ref(),
    &mime_type)
      .await
      .map_err(|err| {
        warn!("Failed to upload cover image to bucket: {:?}", err);
        CommonWebError::from_anyhow_error(err)
      })?;

  let cover_media_token = insert_cover_media_file(InsertCoverMediaFileArgs {
    maybe_creator_user_token: job.maybe_creator_user_token.as_ref(),
    maybe_creator_anonymous_visitor_token: job.maybe_creator_anonymous_visitor_token.as_ref(),
    creator_ip_address: &job.creator_ip_address,
    media_file_type,
    mime_type,
    file_size_bytes: file_size_bytes as u64,
    checksum_sha2: &file_hash,
    public_bucket_path: &public_upload_path,
    maybe_origin_product_category,
    maybe_prompt_token: job.maybe_prompt_token.as_ref(),
    maybe_platform_type: job.maybe_platform_type,
    mysql_executor: &server_state.mysql_pool,
    phantom: Default::default(),
  })
      .await
      .map_err(|err| {
        warn!("Failed to insert cover image media file record: {:?}", err);
        CommonWebError::from_error(err)
      })?;

  let query_result = set_media_file_cover_image(UpdateArgs {
    media_file_token: target_media_token,
    maybe_cover_image_media_file_token: Some(&cover_media_token),
    mysql_pool: &server_state.mysql_pool,
  }).await;

  if let Err(err) = query_result {
    warn!("Failed to set cover image on media file {}: {:?}", target_media_token, err);
  }

  Ok(())
}
