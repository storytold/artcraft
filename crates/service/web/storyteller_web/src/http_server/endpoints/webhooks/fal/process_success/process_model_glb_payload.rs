use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::webhooks::fal::process_success::resolve_file_metadata::resolve_file_metadata;
use crate::state::server_state::ServerState;
use crate::util::http_download_url_to_bytes::http_download_url_to_bytes;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use fal_client::webhook_payload::hydrated::hydrated_webhook_contents::{ModelGlbData, ThumbnailData};
use hashing::sha256::sha256_hash_bytes::sha256_hash_bytes;
use log::{info, warn};
use enums::common::generation_provider::GenerationProvider;
use mysql_queries::queries::generic_inference::api_providers::fal::get_inference_job_by_fal_id::FalJobDetails;
use mysql_queries::queries::media_files::create::insert_builder::media_file_insert_builder::MediaFileInsertBuilder;
use mysql_queries::queries::media_files::edit::set_media_file_cover_image::{set_media_file_cover_image, UpdateArgs};
use tokens::tokens::media_files::MediaFileToken;

const PREFIX : Option<&str> = Some("artcraft_");

/*
  Example payload, from Hunyuan 3d 3.0,

  {
    "model_glb": {
      "url": "https://v3b.fal.media/files/b/0a8afeff/8uc6VVLTpmVrupLqxxwOg_model.glb",
      "content_type": "model/gltf-binary",
      "file_name": "model.glb",
      "file_size": 33644324
    },
    "thumbnail": {
      "url": "https://v3b.fal.media/files/b/0a8afeff/s7BBSABb-ltoRM-N4Mnq3_preview.png",
      "content_type": "image/png",
      "file_name": "preview.png",
      "file_size": 45365
    },
    "model_urls": {
      "glb": {
        "url": "https://v3b.fal.media/files/b/0a8afeff/8uc6VVLTpmVrupLqxxwOg_model.glb",
        "content_type": "model/gltf-binary",
        "file_name": "model.glb",
        "file_size": 33644324
      },
      "fbx": null,
      "obj": {
        "url": "https://v3b.fal.media/files/b/0a8afeff/vU5vk02zWOJ9656Eq5QkP_model.obj",
        "content_type": "text/plain",
        "file_name": "model.obj",
        "file_size": 26522376
      },
      "usdz": null
    },
    "seed": null
  }

*/

pub async fn process_model_glb_payload(
  model_glb_data: &ModelGlbData,
  maybe_thumbnail_data: Option<&ThumbnailData>,
  job: &FalJobDetails,
  server_state: &ServerState,
) -> Result<MediaFileToken, CommonWebError> {
  let mesh_url = model_glb_data.url
      .as_deref()
      .ok_or_else(|| {
        warn!("No `url` in model glb payload");
        CommonWebError::server_error_with_message("no `url` in model glb payload")
      })?;

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
        .map_err(|e| {
          warn!("Failed to download mesh on retry from {}: {:?}", mesh_url, e);
          CommonWebError::server_error_with_message(
            &format!("Failed to download mesh on retry: {:?}", e))
        })?;
  }

  // Resolve mime type: magic bytes first, fal content_type as fallback.
  let metadata = resolve_file_metadata(&file_bytes, model_glb_data.content_type.as_deref())
      .ok_or_else(|| {
        warn!(
          "Could not determine file type for mesh (bytes: {}, fal content_type: {:?})",
          file_bytes.len(),
          model_glb_data.content_type,
        );
        CommonWebError::server_error_with_message(
          &format!("Could not determine file type for mesh (bytes: {}, fal content_type: {:?})",
            file_bytes.len(), model_glb_data.content_type))
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
      .map_err(|e| {
        warn!("Failed to hash mesh bytes: {:?}", e);
        CommonWebError::from_anyhow_error(e)
      })?;

  let public_upload_path = MediaFileBucketPath::generate_new(PREFIX, Some(&extension_with_period));

  info!("Uploading media to bucket path: {}", public_upload_path.get_full_object_path_str());

  server_state.public_bucket_client.upload_file_with_content_type_process(
    public_upload_path.get_full_object_path_str(),
    file_bytes.as_ref(),
    &mime_type)
      .await
      .map_err(|e| {
        warn!("Failed to upload mesh to bucket: {:?}", e);
        CommonWebError::from_anyhow_error(e)
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
      .maybe_platform_type(job.maybe_platform_type)
      .checksum_sha2(&file_hash)
      .insert_pool(&server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Failed to insert glb media file record: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  info!("Glb media file uploaded with token: {}", media_token);

  let result = try_to_attach_thumbnail(
    maybe_thumbnail_data,
    job,
    server_state,
    &media_token,
  ).await;

  // NB: Fail open
  if let Err(err) = result {
    warn!("Could not attach thumbnail as cover image to media file: {:?}", err);
  }

  Ok(media_token)
}

async fn try_to_attach_thumbnail(
  maybe_thumbnail_data: Option<&ThumbnailData>,
  job: &FalJobDetails,
  server_state: &ServerState,
  glb_media_token: &MediaFileToken,
) -> Result<(), CommonWebError> {
  let thumbnail_data = maybe_thumbnail_data
      .ok_or_else(|| {
        warn!("No thumbnail data in extracted contents");
        CommonWebError::server_error_with_message(
          "no thumbnail data in extracted contents")
      })?;

  info!("Fal Thumbnail Data: {:?}", thumbnail_data);

  let thumbnail_url = thumbnail_data.url
      .as_deref()
      .ok_or_else(|| {
        warn!("No `url` in thumbnail payload");
        CommonWebError::server_error_with_message("no `url` in thumbnail payload")
      })?;

  // Download with a retry if the first attempt returns suspiciously few bytes.
  let mut file_bytes = http_download_url_to_bytes(thumbnail_url)
      .await
      .map_err(|e| {
        warn!("Failed to download thumbnail image from {}: {:?}", thumbnail_url, e);
        CommonWebError::server_error_with_message(
          &format!("Failed to download thumbnail image: {:?}", e))
      })?;

  if file_bytes.len() <= 10 {
    warn!(
      "Downloaded only {} bytes from {} — retrying once",
      file_bytes.len(),
      thumbnail_url,
    );
    file_bytes = http_download_url_to_bytes(thumbnail_url)
        .await
        .map_err(|e| {
          warn!("Failed to download thumbnail on retry from {}: {:?}", thumbnail_url, e);
          CommonWebError::server_error_with_message(
            &format!("Failed to download thumbnail on retry: {:?}", e))
        })?;
  }

  // Resolve mime type: magic bytes first, fal content_type as fallback.
  let metadata = resolve_file_metadata(&file_bytes, thumbnail_data.content_type.as_deref())
      .ok_or_else(|| {
        warn!(
          "Could not determine file type for thumbnail (bytes: {}, fal content_type: {:?})",
          file_bytes.len(),
          thumbnail_data.content_type,
        );
        CommonWebError::server_error_with_message(
          &format!("Could not determine file type for thumbnail (bytes: {}, fal content_type: {:?})",
            file_bytes.len(), thumbnail_data.content_type))
      })?;

  let mime_type = metadata.mime_type.as_str();

  info!("Mime type of thumbnail image: {}, source: {:?}", mime_type, metadata.source);

  let media_file_type = MediaFileType::try_from_mime_type(mime_type)
      .ok_or_else(|| {
        warn!("Unsupported thumbnail media file type: {}", mime_type);
        CommonWebError::server_error_with_message(
          &format!("Unsupported media file type: {}", mime_type))
      })?;

  let extension_with_period = metadata.file_extension.extension_with_period();

  let file_size_bytes = file_bytes.len();
  let file_hash = sha256_hash_bytes(&file_bytes)
      .map_err(|e| {
        warn!("Failed to hash thumbnail bytes: {:?}", e);
        CommonWebError::from_anyhow_error(e)
      })?;

  let public_upload_path = MediaFileBucketPath::generate_new(PREFIX, Some(&extension_with_period));

  info!("Uploading cover image media to bucket path: {}", public_upload_path.get_full_object_path_str());

  server_state.public_bucket_client.upload_file_with_content_type_process(
    public_upload_path.get_full_object_path_str(),
    file_bytes.as_ref(),
    &mime_type)
      .await
      .map_err(|e| {
        warn!("Failed to upload thumbnail to bucket: {:?}", e);
        CommonWebError::from_anyhow_error(e)
      })?;

  let thumbnail_media_token = MediaFileInsertBuilder::new()
      .checksum_sha2(&file_hash)
      .creator_ip_address(&job.creator_ip_address)
      .file_size_bytes(file_size_bytes as u64)
      .is_intermediate_system_file(true)
      .maybe_creator_anonymous_visitor(job.maybe_creator_anonymous_visitor_token.as_ref())
      .maybe_creator_user(job.maybe_creator_user_token.as_ref())
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
      .map_err(|e| {
        warn!("Failed to insert thumbnail media file record: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  let query_result = set_media_file_cover_image(UpdateArgs {
    media_file_token: glb_media_token,
    maybe_cover_image_media_file_token: Some(&thumbnail_media_token),
    mysql_pool: &server_state.mysql_pool,
  }).await;

  if let Err(err) = query_result {
    warn!("Failed to set cover image on media file {}: {:?}", glb_media_token, err);
  }

  Ok(())
}
