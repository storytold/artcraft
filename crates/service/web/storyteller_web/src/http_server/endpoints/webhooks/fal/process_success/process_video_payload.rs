use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::webhooks::fal::process_success::resolve_file_metadata::resolve_file_metadata;
use crate::state::server_state::ServerState;
use crate::util::http_download_url_to_bytes::http_download_url_to_bytes;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use fal_client::webhook_payload::hydrated::hydrated_webhook_contents::VideoData;
use filesys::path_to_string::path_to_string;
use hashing::sha256::sha256_hash_bytes::sha256_hash_bytes;
use log::{error, info, warn};
use mysql_queries::queries::generic_inference::api_providers::fal::get_inference_job_by_fal_id::FalJobDetails;
use mysql_queries::queries::media_files::create::insert_builder::media_file_insert_builder::MediaFileInsertBuilder;
use std::io::Write;
use tempfile::NamedTempFile;
use enums::common::generation_provider::GenerationProvider;
use thumbnail_generator::task_client::thumbnail_task::{ThumbnailTaskBuilder, ThumbnailTaskInputMimeType};
use tokens::tokens::media_files::MediaFileToken;
use ffmpeg_utils::ffprobe::ffprobe_get_info::ffprobe_get_info;

const PREFIX : Option<&str> = Some("artcraft_");

pub async fn process_video_payload(
  video_data: &VideoData,
  job: &FalJobDetails,
  server_state: &ServerState,
) -> Result<MediaFileToken, CommonWebError> {
  let video_url = video_data.url
      .as_deref()
      .ok_or_else(|| {
        warn!("No `url` in video payload");
        CommonWebError::server_error_with_message("no `url` in video payload")
      })?;

  // Download with a retry if the first attempt returns suspiciously few bytes.
  let mut file_bytes = http_download_url_to_bytes(video_url)
      .await
      .map_err(|err| {
        warn!("Failed to download video from {}: {:?}", video_url, err);
        CommonWebError::from_error(err)
      })?;

  if file_bytes.len() <= 10 {
    warn!(
      "Downloaded only {} bytes from {} — retrying once",
      file_bytes.len(),
      video_url,
    );
    file_bytes = http_download_url_to_bytes(video_url)
        .await
        .map_err(|err| {
          warn!("Failed to download video on retry from {}: {:?}", video_url, err);
          CommonWebError::from_error(err)
        })?;
  }

  // Resolve mime type: magic bytes first, fal content_type as fallback.
  let metadata = resolve_file_metadata(&file_bytes, video_data.content_type.as_deref())
      .ok_or_else(|| {
        warn!(
          "Could not determine file type for video (bytes: {}, fal content_type: {:?})",
          file_bytes.len(),
          video_data.content_type,
        );
        CommonWebError::server_error_with_message(
          &format!("Could not determine file type for video (bytes: {}, fal content_type: {:?})",
            file_bytes.len(), video_data.content_type))
      })?;

  info!("File type: {}, extension: {:?}, source: {:?}",
    metadata.mime_type, metadata.file_extension, metadata.source);

  let mime_type = metadata.mime_type.as_str();

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
        warn!("Failed to hash video bytes: {:?}", e);
        CommonWebError::from_anyhow_error(e)
      })?;

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
      .await
      .map_err(|e| {
        warn!("Failed to upload video to bucket: {:?}", e);
        CommonWebError::from_anyhow_error(e)
      })?;

  let media_token = MediaFileInsertBuilder::new()
      .checksum_sha2(&file_hash)
      .creator_ip_address(&job.creator_ip_address)
      .file_size_bytes(file_size_bytes as u64)
      .maybe_creator_anonymous_visitor(job.maybe_creator_anonymous_visitor_token.as_ref())
      .maybe_creator_user(job.maybe_creator_user_token.as_ref())
      .maybe_duration_millis(maybe_duration_millis)
      .maybe_frame_height(maybe_frame_height)
      .maybe_frame_width(maybe_frame_width)
      .maybe_generation_provider(Some(GenerationProvider::Artcraft))
      .maybe_prompt_token(job.maybe_prompt_token.as_ref())
      .media_file_class(MediaFileClass::Video)
      .media_file_origin_category(MediaFileOriginCategory::Inference)
      .media_file_type(media_file_type)
      .mime_type(mime_type)
      .public_bucket_directory_hash(&public_upload_path)
      .insert_pool(&server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Failed to insert video media file record: {:?}", e);
        CommonWebError::from_error(e)
      })?;

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
