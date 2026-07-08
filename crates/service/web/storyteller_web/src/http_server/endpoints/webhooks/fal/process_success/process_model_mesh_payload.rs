use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::webhooks::fal::process_success::resolve_file_metadata::resolve_file_metadata_with_file_name;
use crate::state::server_state::ServerState;
use crate::util::http_download_url_to_bytes::http_download_url_to_bytes;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use fal_client::webhook_payload::hydrated::hydrated_webhook_contents::{ModelMeshData, ModelObjData};
use hashing::sha256::sha256_hash_bytes::sha256_hash_bytes;
use log::{info, warn};
use enums::common::generation_provider::GenerationProvider;
use mysql_queries::queries::generic_inference::api_providers::fal::get_inference_job_by_fal_id::FalJobDetails;
use mysql_queries::queries::media_files::create::insert_builder::media_file_insert_builder::MediaFileInsertBuilder;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;

const PREFIX : Option<&str> = Some("artcraft_");

pub async fn process_model_mesh_payload(
  model_mesh_data: &ModelMeshData,
  job: &FalJobDetails,
  server_state: &ServerState,
) -> Result<MediaFileToken, CommonWebError> {
  let mesh_url = model_mesh_data.url
      .as_deref()
      .ok_or_else(|| {
        warn!("No `url` in model mesh payload");
        CommonWebError::server_error_with_message("no `url` in model mesh payload")
      })?;

  upload_mesh_file(UploadMeshFileArgs {
    mesh_url,
    maybe_content_type: model_mesh_data.content_type.as_deref(),
    maybe_file_name: model_mesh_data.file_name.as_deref(),
    maybe_batch_token: None,
    job,
    server_state,
  }).await
}

/// `model_obj` payloads (e.g. Hunyuan 3D v3.1 Rapid's OBJ output) have the
/// same file shape as `model_mesh` and get the same handling.
pub async fn process_model_obj_payload(
  model_obj_data: &ModelObjData,
  job: &FalJobDetails,
  server_state: &ServerState,
) -> Result<MediaFileToken, CommonWebError> {
  let mesh_url = model_obj_data.url
      .as_deref()
      .ok_or_else(|| {
        warn!("No `url` in model obj payload");
        CommonWebError::server_error_with_message("no `url` in model obj payload")
      })?;

  upload_mesh_file(UploadMeshFileArgs {
    mesh_url,
    maybe_content_type: model_obj_data.content_type.as_deref(),
    maybe_file_name: model_obj_data.file_name.as_deref(),
    maybe_batch_token: None,
    job,
    server_state,
  }).await
}

pub(crate) struct UploadMeshFileArgs<'a> {
  pub mesh_url: &'a str,
  pub maybe_content_type: Option<&'a str>,
  /// Used as a last-resort extension hint when neither magic bytes nor the
  /// fal content_type identify the file (common for FBX/OBJ meshes).
  pub maybe_file_name: Option<&'a str>,
  /// Set when the mesh is one of several files from a single generation
  /// (e.g. part splitting).
  pub maybe_batch_token: Option<&'a BatchGenerationToken>,
  pub job: &'a FalJobDetails,
  pub server_state: &'a ServerState,
}

/// Download a mesh file from fal, upload it to our public bucket, and insert
/// a media file record. Shared by the single-mesh payload handlers
/// (`model_mesh`, `model_obj`) and the multi-file `result_files` handler.
pub(crate) async fn upload_mesh_file(
  args: UploadMeshFileArgs<'_>,
) -> Result<MediaFileToken, CommonWebError> {
  let UploadMeshFileArgs {
    mesh_url,
    maybe_content_type,
    maybe_file_name,
    maybe_batch_token,
    job,
    server_state,
  } = args;

  // Download with a retry if the first attempt returns suspiciously few bytes.
  let mut file_bytes = http_download_url_to_bytes(mesh_url)
      .await
      .map_err(|err| {
        warn!("Failed to download mesh from {}: {:?}", mesh_url, err);
        CommonWebError::from_error(err)
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
          CommonWebError::from_error(err)
        })?;
  }

  // Resolve mime type: magic bytes first, fal content_type next, then the
  // file name's extension as a last resort.
  let metadata = resolve_file_metadata_with_file_name(&file_bytes, maybe_content_type, maybe_file_name)
      .ok_or_else(|| {
        warn!(
          "Could not determine file type for mesh (bytes: {}, fal content_type: {:?}, file_name: {:?})",
          file_bytes.len(),
          maybe_content_type,
          maybe_file_name,
        );
        CommonWebError::server_error_with_message(
          &format!("Could not determine file type for mesh (bytes: {}, fal content_type: {:?})",
            file_bytes.len(), maybe_content_type))
      })?;

  let mime_type = metadata.mime_type.as_str();

  info!("Mime type of mesh: {}, source: {:?}", mime_type, metadata.source);

  let media_file_type = MediaFileType::try_from_mime_type(mime_type)
      .ok_or_else(|| {
        warn!("Unsupported media file type: {}", mime_type);
        CommonWebError::server_error_with_message(
          &format!("Unsupported media file type: {}", mime_type))
      })?;

  let extension_with_period = metadata.file_extension.extension_with_period();

  let file_size_bytes = file_bytes.len();
  let file_hash = sha256_hash_bytes(&file_bytes)
      .map_err(|err| {
        warn!("Failed to hash mesh bytes: {:?}", err);
        CommonWebError::from_anyhow_error(err)
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
        CommonWebError::from_anyhow_error(err)
      })?;

  let media_token = MediaFileInsertBuilder::new()
      .checksum_sha2(&file_hash)
      .creator_ip_address(&job.creator_ip_address)
      .file_size_bytes(file_size_bytes as u64)
      .maybe_batch_generation_token(maybe_batch_token)
      .maybe_creator_anonymous_visitor(job.maybe_creator_anonymous_visitor_token.as_ref())
      .maybe_creator_user(job.maybe_creator_user_token.as_ref())
      .maybe_engine_category(Some(MediaFileEngineCategory::Object))
      .maybe_generation_provider(Some(GenerationProvider::Artcraft))
      .maybe_prompt_token(job.maybe_prompt_token.as_ref())
      .maybe_platform_type(job.maybe_platform_type)
      .media_file_class(MediaFileClass::Dimensional)
      .media_file_origin_category(MediaFileOriginCategory::Inference)
      .media_file_type(media_file_type)
      .mime_type(mime_type)
      .public_bucket_directory_hash(&public_upload_path)
      .insert_pool(&server_state.mysql_pool)
      .await
      .map_err(|err| {
        warn!("Failed to insert mesh media file record: {:?}", err);
        CommonWebError::from_error(err)
      })?;

  info!("Mesh media file uploaded with token: {}", media_token);

  Ok(media_token)
}
