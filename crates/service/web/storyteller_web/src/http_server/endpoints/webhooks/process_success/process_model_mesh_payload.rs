use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::http_server::endpoints::webhooks::process_success::resolve_file_metadata::resolve_file_metadata;
use crate::state::server_state::ServerState;
use crate::util::http_download_url_to_bytes::http_download_url_to_bytes;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use fal_client::webhook_api::hydrated::hydrated_webhook_contents::ModelMeshData;
use hashing::sha256::sha256_hash_bytes::sha256_hash_bytes;
use log::{info, warn};
use mysql_queries::queries::generic_inference::fal::get_inference_job_by_fal_id::FalJobDetails;
use mysql_queries::queries::media_files::create::insert_builder::media_file_insert_builder::MediaFileInsertBuilder;
use tokens::tokens::media_files::MediaFileToken;

const PREFIX : Option<&str> = Some("artcraft_");

pub async fn process_model_mesh_payload(
  model_mesh_data: &ModelMeshData,
  job: &FalJobDetails,
  server_state: &ServerState,
) -> Result<MediaFileToken, AdvancedCommonWebError> {
  let mesh_url = model_mesh_data.url
      .as_deref()
      .ok_or_else(|| {
        warn!("No `url` in model mesh payload");
        AdvancedCommonWebError::server_error_with_message("no `url` in model mesh payload")
      })?;

  // Download with a retry if the first attempt returns suspiciously few bytes.
  let mut file_bytes = http_download_url_to_bytes(mesh_url)
      .await
      .map_err(|err| {
        warn!("Failed to download mesh from {}: {:?}", mesh_url, err);
        AdvancedCommonWebError::from_error(err)
      })?;

  if file_bytes.len() <= 10 {
    warn!(
      "Downloaded only {} bytes from {} — retrying once",
      file_bytes.len(),
      mesh_url,
    );
    file_bytes = http_download_url_to_bytes(mesh_url)
        .await
        .map_err(|err| {
          warn!("Failed to download mesh on retry from {}: {:?}", mesh_url, err);
          AdvancedCommonWebError::from_error(err)
        })?;
  }

  // Resolve mime type: magic bytes first, fal content_type as fallback.
  let metadata = resolve_file_metadata(&file_bytes, model_mesh_data.content_type.as_deref())
      .ok_or_else(|| {
        warn!(
          "Could not determine file type for mesh (bytes: {}, fal content_type: {:?})",
          file_bytes.len(),
          model_mesh_data.content_type,
        );
        AdvancedCommonWebError::server_error_with_message(
          &format!("Could not determine file type for mesh (bytes: {}, fal content_type: {:?})",
            file_bytes.len(), model_mesh_data.content_type))
      })?;

  let mime_type = metadata.mime_type.as_str();

  info!("Mime type of mesh: {}, source: {:?}", mime_type, metadata.source);

  let media_file_type = MediaFileType::try_from_mime_type(mime_type)
      .ok_or_else(|| {
        warn!("Unsupported media file type: {}", mime_type);
        AdvancedCommonWebError::server_error_with_message(
          &format!("Unsupported media file type: {}", mime_type))
      })?;

  let extension_with_period = metadata.file_extension.extension_with_period();

  let file_size_bytes = file_bytes.len();
  let file_hash = sha256_hash_bytes(&file_bytes)
      .map_err(|err| {
        warn!("Failed to hash mesh bytes: {:?}", err);
        AdvancedCommonWebError::from_anyhow_error(err)
      })?;

  let public_upload_path = MediaFileBucketPath::generate_new(PREFIX, Some(&extension_with_period));

  info!("Uploading media to bucket path: {}", public_upload_path.get_full_object_path_str());

  server_state.public_bucket_client.upload_file_with_content_type_process(
    public_upload_path.get_full_object_path_str(),
    file_bytes.as_ref(),
    &mime_type)
      .await
      .map_err(|err| {
        warn!("Failed to upload mesh to bucket: {:?}", err);
        AdvancedCommonWebError::from_anyhow_error(err)
      })?;

  let media_token = MediaFileInsertBuilder::new()
      .maybe_creator_user(job.maybe_creator_user_token.as_ref())
      .maybe_creator_anonymous_visitor(job.maybe_creator_anonymous_visitor_token.as_ref())
      .creator_ip_address(&job.creator_ip_address)
      .public_bucket_directory_hash(&public_upload_path)
      .media_file_class(MediaFileClass::Dimensional)
      .media_file_type(media_file_type)
      .media_file_origin_category(MediaFileOriginCategory::Inference)
      .maybe_engine_category(Some(MediaFileEngineCategory::Object))
      //.media_file_origin_product_category(MediaFileOriginProductCategory::Unknown)
      .mime_type(mime_type)
      .file_size_bytes(file_size_bytes as u64)
      .maybe_prompt_token(job.maybe_prompt_token.as_ref())
      .checksum_sha2(&file_hash)
      .insert_pool(&server_state.mysql_pool)
      .await
      .map_err(|err| {
        warn!("Failed to insert mesh media file record: {:?}", err);
        AdvancedCommonWebError::from_error(err)
      })?;

  info!("Mesh media file uploaded with token: {}", media_token);

  Ok(media_token)
}
