use std::io::Read;
use std::sync::Arc;

use actix_multipart::form::tempfile::TempFile;
use actix_multipart::form::text::Text;
use actix_multipart::form::MultipartForm;
use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::{error, info, warn};
use serde_derive::Deserialize;
use utoipa::ToSchema;

use artcraft_api_defs::internal::minimax_jobs::mark_minimax_job_success::MarkMinimaxJobSuccessResponse;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::generation_provider::GenerationProvider;
use ffmpeg_utils::ffprobe::ffprobe_get_info::ffprobe_get_info;
use filesys::path_to_string::path_to_string;
use hashing::sha256::sha256_hash_bytes::sha256_hash_bytes;
use mimetypes::mimetype_for_bytes::get_mimetype_for_bytes;
use mimetypes::mimetype_to_extension::mimetype_to_extension;
use mysql_queries::queries::generic_inference::first_party::minimax_h3::get_first_party_minimax_h3_job_by_token::{
  get_first_party_minimax_h3_job_by_token, FirstPartyMinimaxH3JobDetails, GetFirstPartyMinimaxH3JobByTokenArgs,
};
use mysql_queries::queries::generic_inference::first_party::minimax_h3::mark_first_party_minimax_h3_job_succeeded::{
  mark_first_party_minimax_h3_job_succeeded, MarkFirstPartyMinimaxH3JobSucceededArgs,
};
use mysql_queries::queries::media_files::create::insert_builder::media_file_insert_builder::MediaFileInsertBuilder;
use thumbnail_generator::task_client::thumbnail_task::{ThumbnailTaskBuilder, ThumbnailTaskInputMimeType};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::require_internal_api_key::require_internal_api_key;
use crate::state::server_state::ServerState;

const BUCKET_PATH_PREFIX: Option<&str> = Some("artcraft_");

#[derive(Deserialize)]
pub struct MarkMinimaxJobSuccessPathInfo {
  job_token: InferenceJobToken,
}

/// Form-multipart request fields for the minimax job success endpoint.
#[derive(MultipartForm, ToSchema)]
#[multipart(duplicate_field = "deny")]
pub struct MarkMinimaxJobSuccessForm {
  /// The generated video file bytes.
  #[multipart(limit = "1 GiB")]
  #[schema(value_type = Vec<u8>, format = Binary)]
  file: TempFile,

  /// Optional: video duration in milliseconds. Probed from the file if absent.
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<u64>, format = Binary)]
  duration_millis: Option<Text<u64>>,

  /// Optional: video frame width in pixels. Probed from the file if absent.
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<u32>, format = Binary)]
  width: Option<Text<u32>>,

  /// Optional: video frame height in pixels. Probed from the file if absent.
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<u32>, format = Binary)]
  height: Option<Text<u32>>,

  /// Optional: total wall-clock runtime of the job, in milliseconds.
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<u64>, format = Binary)]
  execution_duration_millis: Option<Text<u64>>,

  /// Optional: inference-only runtime of the job, in milliseconds.
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<u64>, format = Binary)]
  inference_duration_millis: Option<Text<u64>>,
}

/// Internal (worker-facing): mark a first-party Minimax job as successful and
/// upload the generated video. Mirrors what the Fal webhook does when videos
/// complete: upload to the public bucket, create the media file record, fire
/// thumbnail tasks, then mark the job `complete_success`.
#[utoipa::path(
  post,
  tag = "Internal (Minimax Jobs)",
  path = "/v1/internal/minimax_jobs/job/{job_token}/success",
  params(
    ("job_token" = String, Path, description = "The inference job token"),
    (
      "request" = MarkMinimaxJobSuccessForm,
      description = "Multipart form: `file` (video bytes) plus optional `duration_millis` / `width` / `height` metadata."
    ),
  ),
  responses(
    (status = 200, description = "Success", body = MarkMinimaxJobSuccessResponse),
    (status = 400, description = "Bad input (unreadable or non-video file)"),
    (status = 401, description = "Missing or invalid internal API key"),
    (status = 404, description = "No such minimax job"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn mark_minimax_job_success_handler(
  http_request: HttpRequest,
  path: web::Path<MarkMinimaxJobSuccessPathInfo>,
  MultipartForm(mut form): MultipartForm<MarkMinimaxJobSuccessForm>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<MarkMinimaxJobSuccessResponse>, CommonWebError> {

  require_internal_api_key(&http_request, &server_state)?;

  let job_token = &path.job_token;

  // ==================== LOOK UP JOB ==================== //

  // NB: The connection is scoped so we don't hold a pool slot across the
  // (slow) bucket upload below.
  let maybe_job = {
    let mut mysql_connection = server_state.mysql_pool.acquire().await?;

    get_first_party_minimax_h3_job_by_token(GetFirstPartyMinimaxH3JobByTokenArgs {
      job_token,
      mysql_executor: &mut *mysql_connection,
      phantom: Default::default(),
    }).await.map_err(|err| {
      error!("Error looking up minimax job {}: {:?}", job_token, err);
      CommonWebError::from_error(err)
    })?
  };

  let Some(job) = maybe_job else {
    warn!("No such minimax job: {}", job_token);
    return Err(CommonWebError::NotFound);
  };

  // ==================== READ + VALIDATE FILE ==================== //

  let mut file_bytes = Vec::new();
  form.file.file.read_to_end(&mut file_bytes)
    .map_err(|err| {
      error!("Problem reading uploaded video file: {:?}", err);
      CommonWebError::server_error_with_message("problem reading uploaded video file")
    })?;

  if file_bytes.is_empty() {
    return Err(CommonWebError::BadInputWithSimpleMessage("empty video file".to_string()));
  }

  let mime_type = get_mimetype_for_bytes(&file_bytes)
    .map(|mime_type| mime_type.to_string())
    .ok_or_else(|| {
      warn!("Could not determine mimetype for uploaded video ({} bytes)", file_bytes.len());
      CommonWebError::BadInputWithSimpleMessage("could not determine video mimetype".to_string())
    })?;

  let media_file_type = MediaFileType::try_from_mime_type(&mime_type)
    .ok_or_else(|| {
      warn!("Unsupported media file type: {}", mime_type);
      CommonWebError::BadInputWithSimpleMessage("unsupported media file type".to_string())
    })?;

  let extension_with_period = mimetype_to_extension(&mime_type)
    .map(|extension| format!(".{extension}"))
    .ok_or_else(|| {
      warn!("Could not determine file extension for mimetype: {}", mime_type);
      CommonWebError::server_error_with_message("could not determine file extension")
    })?;

  let file_size_bytes = file_bytes.len();
  let file_hash = sha256_hash_bytes(&file_bytes)
    .map_err(|err| {
      error!("Failed to hash video bytes: {:?}", err);
      CommonWebError::from_anyhow_error(err)
    })?;

  // ==================== VIDEO METADATA ==================== //

  // Prefer worker-supplied metadata; probe the file for anything missing.
  let mut maybe_duration_millis = form.duration_millis.map(|text| text.0);
  let mut maybe_frame_width = form.width.map(|text| text.0);
  let mut maybe_frame_height = form.height.map(|text| text.0);

  let needs_probe = maybe_duration_millis.is_none()
    || maybe_frame_width.is_none()
    || maybe_frame_height.is_none();

  if needs_probe {
    if let Ok(video_info) = ffprobe_get_info(&form.file.file.path()) {
      if maybe_duration_millis.is_none() {
        maybe_duration_millis = video_info.duration
          .as_ref()
          .map(|duration| duration.millis as u64);
      }
      if maybe_frame_width.is_none() {
        maybe_frame_width = video_info.dimensions
          .as_ref()
          .map(|dims| dims.width as u32);
      }
      if maybe_frame_height.is_none() {
        maybe_frame_height = video_info.dimensions
          .as_ref()
          .map(|dims| dims.height as u32);
      }
    }
  }

  // ==================== UPLOAD + MEDIA FILE RECORD ==================== //

  let public_upload_path = MediaFileBucketPath::generate_new(BUCKET_PATH_PREFIX, Some(&extension_with_period));

  info!("Uploading media to bucket path: {}", public_upload_path.get_full_object_path_str());

  server_state.public_bucket_client.upload_file_with_content_type_process(
    public_upload_path.get_full_object_path_str(),
    file_bytes.as_ref(),
    &mime_type)
      .await
      .map_err(|err| {
        warn!("Failed to upload video to bucket: {:?}", err);
        CommonWebError::from_anyhow_error(err)
      })?;

  let media_token = insert_media_file_record(
    &server_state,
    &job,
    &file_hash,
    file_size_bytes,
    maybe_duration_millis,
    maybe_frame_width,
    maybe_frame_height,
    media_file_type,
    &mime_type,
    &public_upload_path,
  ).await?;

  info!("Minimax video media file uploaded with token: {}", media_token);

  // ==================== THUMBNAILS ==================== //

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

  // ==================== MARK JOB DONE ==================== //

  mark_first_party_minimax_h3_job_succeeded(MarkFirstPartyMinimaxH3JobSucceededArgs {
    job_token: &job.job_token,
    media_file_token: &media_token,
    maybe_execution_duration_millis: form.execution_duration_millis.map(|text| text.0),
    maybe_inference_duration_millis: form.inference_duration_millis.map(|text| text.0),
    mysql_executor: &server_state.mysql_pool,
    phantom: Default::default(),
  }).await.map_err(|err| {
    error!("Error marking minimax job {} succeeded: {:?}", job_token, err);
    CommonWebError::from_error(err)
  })?;

  info!("Minimax job {} marked as complete_success with media file {}", job.job_token, media_token);

  Ok(Json(MarkMinimaxJobSuccessResponse {
    success: true,
    media_file_token: media_token,
    maybe_duration_millis,
    maybe_width: maybe_frame_width,
    maybe_height: maybe_frame_height,
  }))
}

async fn insert_media_file_record(
  server_state: &ServerState,
  job: &FirstPartyMinimaxH3JobDetails,
  file_hash: &str,
  file_size_bytes: usize,
  maybe_duration_millis: Option<u64>,
  maybe_frame_width: Option<u32>,
  maybe_frame_height: Option<u32>,
  media_file_type: MediaFileType,
  mime_type: &str,
  public_upload_path: &MediaFileBucketPath,
) -> Result<MediaFileToken, CommonWebError> {
  MediaFileInsertBuilder::new()
      .checksum_sha2(file_hash)
      .creator_ip_address(&job.creator_ip_address)
      .file_size_bytes(file_size_bytes as u64)
      .maybe_creator_anonymous_visitor(job.maybe_creator_anonymous_visitor_token.as_ref())
      .maybe_creator_user(job.maybe_creator_user_token.as_ref())
      .maybe_duration_millis(maybe_duration_millis)
      .maybe_frame_height(maybe_frame_height)
      .maybe_frame_width(maybe_frame_width)
      .maybe_generation_provider(Some(GenerationProvider::Artcraft))
      .maybe_prompt_token(job.maybe_prompt_token.as_ref())
      .maybe_source_job_token(Some(&job.job_token))
      .maybe_platform_type(job.maybe_platform_type)
      .media_file_class(MediaFileClass::Video)
      .media_file_origin_category(MediaFileOriginCategory::Inference)
      .media_file_type(media_file_type)
      .mime_type(mime_type)
      .public_bucket_directory_hash(public_upload_path)
      .insert_pool(&server_state.mysql_pool)
      .await
      .map_err(|err| {
        warn!("Failed to insert video media file record: {:?}", err);
        CommonWebError::from_error(err)
      })
}
