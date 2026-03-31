use crate::state::server_state::ServerState;
use crate::util::http_download_url_to_bytes::http_download_url_to_bytes;
use anyhow::anyhow;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use errors::AnyhowResult;
use hashing::sha256::sha256_hash_bytes::sha256_hash_bytes;
use log::{info, warn};
use mimetypes::mimetype_info::mimetype_info::MimetypeInfo;
use mysql_queries::queries::generic_inference::fal::get_inference_job_by_fal_id::FalJobDetails;
use mysql_queries::queries::media_files::create::insert_builder::media_file_insert_builder::MediaFileInsertBuilder;
use serde_json::{Map, Value};
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

#[derive(Deserialize, Debug)]
pub struct FalMediaPayload {
  pub content_type: Option<String>,
  pub file_name: Option<String>,
  pub file_size: Option<usize>,
  pub url: Option<String>,
}

pub async fn handle_model_glb_payload(
  payload: &Map<String, Value>,
  job: &FalJobDetails,
  server_state: &ServerState,
) -> AnyhowResult<MediaFileToken> {
  
  let model_glb_value = payload.get("model_glb")
      .ok_or_else(|| anyhow!("no `model_mesh` key in payload"))?;

  info!("Fal Model Glb Payload: {:?}", model_glb_value);
  
  let mesh: FalMediaPayload = serde_json::from_value(model_glb_value.clone())?;

  let mesh_url = mesh.url
      .as_deref()
      .ok_or_else(|| anyhow!("no `url` in image payload"))?;
  
  //let mime_type = mesh.content_type
  //    .as_deref()
  //    .ok_or_else(|| anyhow!("no `content_type` in mesh payload"))?;

  let file_bytes = http_download_url_to_bytes(mesh_url)
      .await
      .map_err(|e| anyhow!("Failed to download mesh: {:?}", e))?;
  
  let mimetype_info = MimetypeInfo::get_for_bytes(&file_bytes)
      .ok_or_else(|| anyhow!("Failed to get mimetype info"))?;
  
  let mime_type = mimetype_info.mime_type();
  
  info!("Mime type of mesh: {}", mime_type);

  let media_file_type = MediaFileType::try_from_mime_type(mime_type)
      .ok_or_else(|| anyhow!("Unsupported media file type: {}", mime_type))?;

  let extension_with_period = mimetype_info.file_extension()
      .map(|ext| ext.extension_with_period())
      .ok_or_else(|| anyhow!("Failed to get file extension from mimetype info"))?;

  let file_size_bytes = file_bytes.len();
  let file_hash = sha256_hash_bytes(&file_bytes)?;

  let public_upload_path = MediaFileBucketPath::generate_new(PREFIX, Some(&extension_with_period));

  info!("Uploading media to bucket path: {}", public_upload_path.get_full_object_path_str());

  server_state.public_bucket_client.upload_file_with_content_type_process(
    public_upload_path.get_full_object_path_str(),
    file_bytes.as_ref(),
    &mime_type)
      .await?;

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
      .await?;
  
  info!("Glb media file uploaded with token: {}", media_token);
  
  let result = try_to_attach_thumbnail(
    payload,
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
  payload: &Map<String, Value>,
  job: &FalJobDetails,
  server_state: &ServerState,
  glb_media_token: &MediaFileToken,
) -> AnyhowResult<()> {

  let thumbnail_value = payload.get("thumbnail")
      .ok_or_else(|| anyhow!("no `thumbnail` key in payload"))?;

  info!("Fal Thumbnail Payload: {:?}", thumbnail_value);

  let thumbnail : FalMediaPayload = serde_json::from_value(thumbnail_value.clone())?;

  let mesh_url = thumbnail.url
      .as_deref()
      .ok_or_else(|| anyhow!("no `url` in image payload"))?;

  let file_bytes = http_download_url_to_bytes(mesh_url)
      .await
      .map_err(|e| anyhow!("Failed to download image: {:?}", e))?;

  let mimetype_info = MimetypeInfo::get_for_bytes(&file_bytes)
      .ok_or_else(|| anyhow!("Failed to get mimetype info"))?;

  let mime_type = mimetype_info.mime_type();

  info!("Mime type of image: {}", mime_type);

  let media_file_type = MediaFileType::try_from_mime_type(mime_type)
      .ok_or_else(|| anyhow!("Unsupported media file type: {}", mime_type))?;

  let extension_with_period = mimetype_info.file_extension()
      .map(|ext| ext.extension_with_period())
      .ok_or_else(|| anyhow!("Failed to get file extension from mimetype info"))?;

  let file_size_bytes = file_bytes.len();
  let file_hash = sha256_hash_bytes(&file_bytes)?;

  let public_upload_path = MediaFileBucketPath::generate_new(PREFIX, Some(&extension_with_period));

  info!("Uploading cover image media to bucket path: {}", public_upload_path.get_full_object_path_str());

  server_state.public_bucket_client.upload_file_with_content_type_process(
    public_upload_path.get_full_object_path_str(),
    file_bytes.as_ref(),
    &mime_type)
      .await?;

  let thumbnail_media_token = MediaFileInsertBuilder::new()
      .maybe_creator_user(job.maybe_creator_user_token.as_ref())
      .maybe_creator_anonymous_visitor(job.maybe_creator_anonymous_visitor_token.as_ref())
      .creator_ip_address(&job.creator_ip_address)
      .public_bucket_directory_hash(&public_upload_path)
      .media_file_class(MediaFileClass::Image)
      .media_file_type(media_file_type)
      .media_file_origin_category(MediaFileOriginCategory::Processed)
      //.maybe_engine_category(Some(MediaFileEngineCategory::Object))
      //.media_file_origin_product_category(MediaFileOriginProductCategory::Unknown)
      .mime_type(mime_type)
      .file_size_bytes(file_size_bytes as u64)
      .maybe_prompt_token(job.maybe_prompt_token.as_ref())
      .is_intermediate_system_file(true)
      .checksum_sha2(&file_hash)
      .insert_pool(&server_state.mysql_pool)
      .await?;

  let query_result = set_media_file_cover_image(UpdateArgs {
    media_file_token: glb_media_token,
    maybe_cover_image_media_file_token: Some(&thumbnail_media_token),
    mysql_pool: &server_state.mysql_pool,
  }).await;

  Ok(())
}
