use crate::state::server_state::ServerState;
use crate::util::http_download_url_to_bytes::http_download_url_to_bytes;
use anyhow::anyhow;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use errors::AnyhowResult;
use filesys::path_to_string::path_to_string;
use hashing::sha256::sha256_hash_bytes::sha256_hash_bytes;
use log::{error, info};
use mimetypes::mimetype_info::mimetype_info::MimetypeInfo;
use mysql_queries::queries::generic_inference::fal::get_inference_job_by_fal_id::FalJobDetails;
use mysql_queries::queries::media_files::create::insert_builder::media_file_insert_builder::MediaFileInsertBuilder;
use serde_json::{Map, Value};
use std::io::Write;
use tempfile::NamedTempFile;
use thumbnail_generator::task_client::thumbnail_task::{ThumbnailTaskBuilder, ThumbnailTaskInputMimeType};
use tokens::tokens::media_files::MediaFileToken;
use videos::ffprobe_get_info::ffprobe_get_info;

const PREFIX : Option<&str> = Some("artcraft_");

#[derive(Deserialize, Debug)]
pub struct FalWebhookVideo {
  pub content_type: Option<String>,
  pub file_name: Option<String>,
  pub file_size: Option<usize>,
  pub height: Option<usize>, // NB: Might not be on videos
  pub width: Option<usize>, // NB: Might not be on videos
  pub url: Option<String>,
}

pub async fn handle_video_payload(
  payload: &Map<String, Value>,
  job: &FalJobDetails,
  server_state: &ServerState,
) -> AnyhowResult<MediaFileToken> {
  
  let video_value = payload.get("video")
      .ok_or_else(|| anyhow!("no `image` key in payload"))?;

  info!("Fal Video Payload: {:?}", video_value);
  
  let video: FalWebhookVideo = serde_json::from_value(video_value.clone())?;
  
  let video_url = video.url
      .as_deref()
      .ok_or_else(|| anyhow!("no `url` in video payload"))?;
  
  //let mime_type = image.content_type
  //    .as_deref()
  //    .ok_or_else(|| anyhow!("no `content_type` in image payload"))?;

  let file_bytes = http_download_url_to_bytes(video_url)
      .await
      .map_err(|e| anyhow!("Failed to download image: {:?}", e))?;
  
  let mimetype_info = MimetypeInfo::get_for_bytes(&file_bytes)
      .ok_or_else(|| anyhow!("Failed to get mimetype info"))?;
  
  let mime_type = mimetype_info.mime_type();

  let media_file_type = MediaFileType::try_from_mime_type(mime_type)
      .ok_or_else(|| anyhow!("Unsupported media file type: {}", mime_type))?;

  let extension_with_period = mimetype_info.file_extension()
      .map(|ext| ext.extension_with_period())
      .ok_or_else(|| anyhow!("Failed to get file extension from mimetype info"))?;

  let file_size_bytes = file_bytes.len();
  let file_hash = sha256_hash_bytes(&file_bytes)?;

  let mut maybe_duration_millis = None;
  let mut maybe_frame_width = None;
  let mut maybe_frame_height = None;
  
  if let Ok(mut file) = NamedTempFile::new() {
    // NB: Fallible 
    let _r = file.write_all(&file_bytes);
    
    if let Ok(video_info) = ffprobe_get_info(&file.path()) {
      maybe_duration_millis = video_info.duration
          .as_ref()
          .map(|duration| duration.millis as u64);
      
      maybe_frame_width = video_info.dimensions
          .as_ref()
          .map(|ref dims| dims.width as u32);

      maybe_frame_height = video_info.dimensions
          .as_ref()
          .map(|dims| dims.height as u32);
    }
  }

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
      .media_file_class(MediaFileClass::Video)
      .media_file_type(media_file_type)
      .media_file_origin_category(MediaFileOriginCategory::Inference)
      //.media_file_origin_product_category(MediaFileOriginProductCategory::Unknown)
      .mime_type(mime_type)
      .file_size_bytes(file_size_bytes as u64)
      .maybe_frame_width(maybe_frame_width)
      .maybe_frame_height(maybe_frame_height)
      .maybe_duration_millis(maybe_duration_millis)
      .checksum_sha2(&file_hash)
      .insert_pool(&server_state.mysql_pool)
      .await?;
  
  info!("Video media file uploaded with token: {}", media_token);

  let thumbnail_task_result =
      ThumbnailTaskBuilder::new_for_source_mimetype(ThumbnailTaskInputMimeType::MP4)
          .with_bucket(server_state.public_bucket_client.bucket_name().as_str())
          .with_path(&*path_to_string(public_upload_path.to_full_object_pathbuf()))
          .with_output_suffix("thumb")
          .with_event_id(&media_token.to_string())
          .send_all()
          .await;

  if let Err(err) = thumbnail_task_result {
    // Fail open
    error!("Failed to create some/all thumbnail tasks: {:?}", err);
  }

  Ok(media_token)
}
