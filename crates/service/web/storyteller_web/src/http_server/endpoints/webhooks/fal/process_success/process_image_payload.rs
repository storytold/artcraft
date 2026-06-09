use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::webhooks::fal::process_success::resolve_file_metadata::resolve_file_metadata;
use crate::state::server_state::ServerState;
use crate::util::http_download_url_to_bytes::http_download_url_to_bytes;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use fal_client::webhook_payload::hydrated::hydrated_webhook_contents::ImageData;
use hashing::sha256::sha256_hash_bytes::sha256_hash_bytes;
use images::encoding::webp_bytes_to_png_bytes::webp_bytes_to_png_bytes;
use images::image_info::image_info::ImageInfo;
use log::{info, warn};
use enums::common::generation_provider::GenerationProvider;
use mimetypes::mimetype_info::file_extension::FileExtension;
use mysql_queries::queries::generic_inference::api_providers::fal::get_inference_job_by_fal_id::FalJobDetails;
use mysql_queries::queries::media_files::create::insert_builder::media_file_insert_builder::MediaFileInsertBuilder;
use tokens::tokens::media_files::MediaFileToken;

const PREFIX : Option<&str> = Some("artcraft_");

pub async fn process_image_payload(
  image_data: &ImageData,
  job: &FalJobDetails,
  server_state: &ServerState,
) -> Result<MediaFileToken, CommonWebError> {
  let image_url = image_data.url
      .as_deref()
      .ok_or_else(|| {
        warn!("No `url` in image payload");
        CommonWebError::server_error_with_message("no `url` in image payload")
      })?;

  // Download with a retry if the first attempt returns suspiciously few bytes.
  let mut file_bytes = http_download_url_to_bytes(image_url)
      .await
      .map_err(|err| {
        warn!("Failed to download image from {}: {:?}", image_url, err);
        CommonWebError::from_error(err)
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
          warn!("Failed to download image on retry from {}: {:?}", image_url, err);
          CommonWebError::from_error(err)
        })?;
  }

  // Resolve mime type: magic bytes first, fal content_type as fallback.
  let metadata = resolve_file_metadata(&file_bytes, image_data.content_type.as_deref())
      .ok_or_else(|| {
        warn!(
          "Could not determine file type for image (bytes: {}, fal content_type: {:?})",
          file_bytes.len(),
          image_data.content_type,
        );
        CommonWebError::server_error_with_message(
          &format!("Could not determine file type for image (bytes: {}, fal content_type: {:?})",
            file_bytes.len(), image_data.content_type))
      })?;

  info!("File type: {}, extension: {:?}, source: {:?}",
    metadata.mime_type, metadata.file_extension, metadata.source);

  match metadata.file_extension {
    FileExtension::Webp => {
      info!("Artcraft can't handle WebP images yet; converting to PNG...");

      let converted = webp_bytes_to_png_bytes(&file_bytes)
          .map_err(|e| {
            warn!("Failed to convert WebP to PNG: {:?}", e);
            CommonWebError::from_error(e)
          })?;

      let converted_metadata = resolve_file_metadata(&converted, Some("image/png"))
          .ok_or_else(|| {
            warn!("Failed to determine file type after WebP→PNG conversion");
            CommonWebError::server_error_with_message(
              "Failed to determine file type after WebP→PNG conversion")
          })?;

      info!("Converted file type: {}, extension: {:?}",
        converted_metadata.mime_type, converted_metadata.file_extension);

      upload_single_image_bytes(
        job,
        server_state,
        &converted,
        &converted_metadata.mime_type,
        converted_metadata.file_extension,
      ).await
    }
    _ => {
      upload_single_image_bytes(
        job,
        server_state,
        &file_bytes,
        &metadata.mime_type,
        metadata.file_extension,
      ).await
    }
  }
}

async fn upload_single_image_bytes(
  job: &FalJobDetails,
  server_state: &ServerState,
  file_bytes: &[u8],
  mime_type: &str,
  file_extension: FileExtension,
) -> Result<MediaFileToken, CommonWebError> {

  let media_file_type = MediaFileType::try_from_mime_type(mime_type)
      .ok_or_else(|| {
        warn!("Unsupported media file type: {}", mime_type);
        CommonWebError::server_error_with_message(
          &format!("Unsupported media file type: {}", mime_type))
      })?;

  let extension_with_period = file_extension.extension_with_period();

  let file_size_bytes = file_bytes.len();
  let file_hash = sha256_hash_bytes(&file_bytes)
      .map_err(|e| {
        warn!("Failed to hash image bytes: {:?}", e);
        CommonWebError::from_anyhow_error(e)
      })?;
  let image_info = ImageInfo::decode_image_from_bytes(&file_bytes)
      .map_err(|e| {
        warn!("Failed to decode image info: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  let public_upload_path = MediaFileBucketPath::generate_new(PREFIX, Some(&extension_with_period));

  info!("Uploading media to bucket path: {}", public_upload_path.get_full_object_path_str());

  server_state.public_bucket_client.upload_file_with_content_type_process(
    public_upload_path.get_full_object_path_str(),
    file_bytes.as_ref(),
    mime_type)
      .await
      .map_err(|e| {
        warn!("Failed to upload image to bucket: {:?}", e);
        CommonWebError::from_anyhow_error(e)
      })?;

  let media_token = MediaFileInsertBuilder::new()
      .checksum_sha2(&file_hash)
      .creator_ip_address(&job.creator_ip_address)
      .file_size_bytes(file_size_bytes as u64)
      .frame_height(image_info.height())
      .frame_width(image_info.width())
      .maybe_creator_anonymous_visitor(job.maybe_creator_anonymous_visitor_token.as_ref())
      .maybe_creator_user(job.maybe_creator_user_token.as_ref())
      .maybe_generation_provider(Some(GenerationProvider::Artcraft))
      .maybe_prompt_token(job.maybe_prompt_token.as_ref())
      .maybe_platform_type(job.maybe_platform_type)
      .media_file_class(MediaFileClass::Image)
      .media_file_origin_category(MediaFileOriginCategory::Inference)
      .media_file_type(media_file_type)
      .mime_type(mime_type)
      .public_bucket_directory_hash(&public_upload_path)
      .insert_pool(&server_state.mysql_pool)
      .await
      .map_err(|err| {
        warn!("Failed to insert image media file record: {:?}", err);
        CommonWebError::from_error(err)
      })?;

  info!("Image media file uploaded with token: {}", media_token);

  Ok(media_token)
}
