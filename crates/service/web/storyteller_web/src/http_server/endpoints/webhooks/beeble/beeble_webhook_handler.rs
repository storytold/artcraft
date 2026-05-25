use std::io::Write;
use std::sync::Arc;

use actix_web::web::Bytes;
use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::{error, info, warn};
use sqlx::pool::PoolConnection;
use sqlx::MySql;
use tempfile::NamedTempFile;

use beeble_client::webhook_api::beeble_webhook_payload::{
  parse_beeble_webhook, BeebleWebhookPayload, BeebleWebhookStatus,
};
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::debug_logs::debug_log_type::DebugLogType;
use enums::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::generation_provider::GenerationProvider;
use ffmpeg_utils::ffprobe::ffprobe_get_info::ffprobe_get_info;
use filesys::path_to_string::path_to_string;
use hashing::sha256::sha256_hash_bytes::sha256_hash_bytes;
use http_server_common::response::response_success_helpers::SimpleGenericJsonSuccess;
use mysql_queries::queries::debug_logs::insert_debug_log::{insert_debug_log, InsertDebugLogArgs};
use mysql_queries::queries::generic_inference::api_providers::beeble::get_inference_job_by_beeble_id::{
  get_inference_job_by_beeble_id_from_connection, BeebleJobDetails,
};
use mysql_queries::queries::generic_inference::api_providers::fal::mark_fal_generic_inference_job_successfully_done::{
  mark_fal_generic_inference_job_successfully_done, MarkJobArgs,
};
use mysql_queries::queries::generic_inference::job::mark_job_failed_by_token::{
  mark_job_failed_by_token_from_connection, MarkJobFailedByTokenFromConnectionArgs,
};
use mysql_queries::queries::media_files::create::insert_builder::media_file_insert_builder::MediaFileInsertBuilder;
use pager::notification::notification_details_builder::NotificationDetailsBuilder;
use pager::notification::notification_urgency::NotificationUrgency;
use thumbnail_generator::task_client::thumbnail_task::{ThumbnailTaskBuilder, ThumbnailTaskInputMimeType};
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::webhooks::fal::process_success::resolve_file_metadata::resolve_file_metadata;
use crate::state::server_state::ServerState;
use crate::util::http_download_url_to_bytes::http_download_url_to_bytes;

const VIDEO_BUCKET_PREFIX: Option<&str> = Some("artcraft_");

// =============== Handler ===============

pub async fn beeble_webhook_handler(
  http_request: HttpRequest,
  request_body_bytes: Bytes,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<SimpleGenericJsonSuccess>, CommonWebError> {

  // Step 1: Parse bytes into a UTF-8 string and log it.
  let raw_body = String::from_utf8(request_body_bytes.to_vec())
      .map_err(|err| {
        error!("Beeble webhook: could not decode request body to UTF-8: {:?}", err);
        enqueue_parse_error_alert(&server_state, &http_request, "UTF-8 decode failed", &err, None);
        CommonWebError::from_error(err)
      })?;

  info!("Received Beeble webhook body: {}", raw_body);

  // Step 2: Parse into BeebleWebhookPayload.
  let payload = parse_beeble_webhook(&raw_body)
      .map_err(|err| {
        error!("Beeble webhook: could not parse webhook payload: {:?}", err);
        enqueue_parse_error_alert(&server_state, &http_request, "JSON parse failed", &err, Some(&raw_body));
        CommonWebError::from_error(err)
      })?;

  let job_id = payload.id.as_str();

  info!("Beeble webhook job_id: {} (status: {:?})", job_id, payload.status);

  // Step 3: Acquire a MySQL connection.
  let mut mysql_connection = server_state.mysql_pool.acquire().await?;

  // Step 4: Look up the job by external third-party ID.
  let job = match get_inference_job_by_beeble_id_from_connection(job_id, &mut mysql_connection).await {
    Ok(Some(record)) => record,
    Ok(None) => {
      warn!("Could not find job record by Beeble job_id: {}", job_id);
      return Err(CommonWebError::NotFound);
    }
    Err(err) => {
      error!("Error querying job record for Beeble job_id {}: {:?}", job_id, err);
      return Err(CommonWebError::from_anyhow_error(err));
    }
  };

  info!("Beeble webhook job record for job_id {}: {:?}", job_id, job);

  // Insert debug log for the webhook payload.
  if let Some(debug_log_event_token) = &job.maybe_debug_log_event_token {
    if let Err(err) = insert_debug_log(InsertDebugLogArgs {
      apriori_debug_log_event_token: Some(debug_log_event_token),
      maybe_creator_user_token: job.maybe_creator_user_token.as_ref(),
      debug_log_type: DebugLogType::BeebleWebhook,
      message: &raw_body,
      mysql_executor: &mut *mysql_connection,
      phantom: Default::default(),
    }).await {
      warn!("Failed to insert Beeble webhook debug log: {:?}", err);
    }
  }

  // Step 5: Branch on status.
  let result = match payload.status {
    BeebleWebhookStatus::Completed => {
      handle_completed(&server_state, &mut mysql_connection, job_id, &payload, &job).await
    }
    BeebleWebhookStatus::Failed => {
      handle_failed(&mut mysql_connection, job_id, &payload, &job).await
    }
    BeebleWebhookStatus::Unknown => {
      warn!("Beeble webhook received unknown status for job_id {}", job_id);
      Err(CommonWebError::server_error_with_message(
        &format!("Beeble webhook received unknown status for job_id {}", job_id),
      ))
    }
  };

  if let Err(ref err) = result {
    if err.is_server_error() {
      error!("Beeble webhook error for job_id {}: {:?}", job_id, err);

      let description = format!(
        "Beeble webhook failed for job_id: {}\n\nError: {:?}\n\nWebhook JSON Payload: {}",
        job_id, err, raw_body,
      );

      let mut builder = if let Some(cause_arc) = err.clone_cause_arc() {
        NotificationDetailsBuilder::from_error(cause_arc)
            .set_title(format!("Beeble webhook processing failed (job_id: {})", job_id))
      } else {
        NotificationDetailsBuilder::from_title(
          format!("Beeble webhook processing failed (job_id: {})", job_id)
        )
      };

      builder = builder
          .set_description(Some(description))
          .set_third_party_id(Some(job_id.to_string()))
          .set_urgency(Some(NotificationUrgency::High))
          .set_http_method(Some(http_request.method().to_string()))
          .set_http_path(Some(http_request.path().to_string()));

      if let Err(pager_err) = server_state.pager.enqueue_page(builder.build()) {
        error!("Failed to enqueue Beeble webhook pager alert: {:?}", pager_err);
      }
    }
  }

  result
}

// =============== Private helpers ===============

async fn handle_completed(
  server_state: &ServerState,
  mysql_connection: &mut PoolConnection<MySql>,
  job_id: &str,
  payload: &BeebleWebhookPayload,
  job: &BeebleJobDetails,
) -> Result<Json<SimpleGenericJsonSuccess>, CommonWebError> {
  let output = payload.output.as_ref().ok_or_else(|| {
    warn!("Beeble webhook completed but no output for job_id {}", job_id);
    CommonWebError::server_error_with_message("Beeble webhook completed but output is missing")
  })?;

  let render_url = output.render.as_deref().ok_or_else(|| {
    warn!("Beeble webhook completed but no render URL for job_id {}", job_id);
    CommonWebError::server_error_with_message("Beeble webhook completed but render URL is missing")
  })?;

  info!("Downloading Beeble render video from {} for job_id {}", render_url, job_id);

  // Download and process the primary render video.
  let render_media_token = download_and_upload_video(render_url, job, server_state).await?;

  info!("Render video uploaded with token {} for job_id {}", render_media_token, job_id);

  // Download and process the alpha video if present.
  if let Some(ref alpha_url) = output.alpha {
    info!("Downloading Beeble alpha video from {} for job_id {}", alpha_url, job_id);
    match download_and_upload_video(alpha_url, job, server_state).await {
      Ok(alpha_token) => {
        info!("Alpha video uploaded with token {} for job_id {}", alpha_token, job_id);
      }
      Err(err) => {
        // Fail open for alpha — the render is the primary artifact.
        warn!("Failed to process alpha video for job_id {}: {:?}", job_id, err);
      }
    }
  }

  // Mark the job as successfully done with the render video's media token.
  mark_fal_generic_inference_job_successfully_done(MarkJobArgs {
    job_token: &job.job_token,
    media_file_token: &render_media_token,
    maybe_batch_token: None,
    mysql_executor: &mut **mysql_connection,
    phantom: Default::default(),
  }).await.map_err(|err| {
    warn!("Error marking job as successfully done for job_id {}: {:?}", job_id, err);
    CommonWebError::from_anyhow_error(err)
  })?;

  info!("Job {} marked as successfully done for Beeble job_id {}", job.job_token, job_id);

  Ok(SimpleGenericJsonSuccess::wrapped(true))
}

async fn handle_failed(
  mysql_connection: &mut PoolConnection<MySql>,
  job_id: &str,
  payload: &BeebleWebhookPayload,
  job: &BeebleJobDetails,
) -> Result<Json<SimpleGenericJsonSuccess>, CommonWebError> {
  let public_failure_reason = payload.error
      .as_deref()
      .unwrap_or("Unknown Beeble error")
      .to_string();

  let internal_failure_reason = format!(
    "Beeble job_id={}, error={:?}",
    job_id,
    payload.error,
  );

  info!(
    "Marking job {} as failed for Beeble job_id {}. Reason: {}",
    job.job_token.as_str(),
    job_id,
    public_failure_reason,
  );

  if let Err(err) = mark_job_failed_by_token_from_connection(MarkJobFailedByTokenFromConnectionArgs {
    mysql_connection,
    job_token: &job.job_token,
    maybe_public_failure_reason: Some(&public_failure_reason),
    internal_debugging_failure_reason: &internal_failure_reason,
    maybe_frontend_failure_category: Some(FrontendFailureCategory::GenerationFailed),
  }).await {
    error!(
      "Error marking job {} as failed for Beeble job_id {}: {:?}",
      job.job_token.as_str(),
      job_id,
      err,
    );
    return Err(CommonWebError::from_anyhow_error(err));
  }

  info!(
    "Job {} marked as failed for Beeble job_id {}.",
    job.job_token.as_str(),
    job_id,
  );

  Ok(SimpleGenericJsonSuccess::wrapped(true))
}

async fn download_and_upload_video(
  video_url: &str,
  job: &BeebleJobDetails,
  server_state: &ServerState,
) -> Result<MediaFileToken, CommonWebError> {
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

  // Resolve mime type from magic bytes, with no fallback content_type from Beeble.
  let metadata = resolve_file_metadata(&file_bytes, None)
      .ok_or_else(|| {
        warn!(
          "Could not determine file type for Beeble video (bytes: {})",
          file_bytes.len(),
        );
        CommonWebError::server_error_with_message(
          &format!("Could not determine file type for Beeble video (bytes: {})", file_bytes.len()))
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
    let _r = file.write_all(&file_bytes);

    if let Ok(video_info) = ffprobe_get_info(&file.path()) {
      maybe_duration_millis = video_info.duration
          .as_ref()
          .map(|duration| duration.millis as u64);

      maybe_frame_width = video_info.dimensions
          .as_ref()
          .map(|dims| dims.width as u32);

      maybe_frame_height = video_info.dimensions
          .as_ref()
          .map(|dims| dims.height as u32);
    }
  }

  let public_upload_path = MediaFileBucketPath::generate_new(VIDEO_BUCKET_PREFIX, Some(&extension_with_period));

  info!("Uploading media to bucket path: {}", public_upload_path.get_full_object_path_str());

  server_state.public_bucket_client.upload_file_with_content_type_process(
    public_upload_path.get_full_object_path_str(),
    file_bytes.as_ref(),
    mime_type)
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
      .media_file_origin_product_category(MediaFileOriginProductCategory::VideoEdit)
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

  // let thumbnail_task_result =
  //     ThumbnailTaskBuilder::new_for_source_mimetype(ThumbnailTaskInputMimeType::MP4)
  //         .with_bucket(server_state.public_bucket_client.bucket_name().as_str())
  //         .with_path(&*path_to_string(public_upload_path.to_full_object_pathbuf()))
  //         .with_output_suffix("thumb")
  //         .with_event_id(&media_token.to_string())
  //         .send_all()
  //         .await;
  // if let Err(err) = thumbnail_task_result {
  //   // Fail open
  //   error!("Failed to create some/all thumbnail tasks: {:?}", err);
  // }

  Ok(media_token)
}

/// Send a pager alert for early parse failures (before we have a job_id).
fn enqueue_parse_error_alert<E: std::fmt::Debug>(
  server_state: &ServerState,
  http_request: &HttpRequest,
  context: &str,
  err: &E,
  maybe_raw_body: Option<&str>,
) {
  let description = match maybe_raw_body {
    Some(body) => format!("Error: {:?}\n\nBeeble Webhook JSON Payload: {}", err, body),
    None => format!("Beeble Error: {:?}", err),
  };

  let notification = NotificationDetailsBuilder::from_title(
        format!("Beeble webhook parse failure: {}", context))
      .set_description(Some(description))
      .set_urgency(Some(NotificationUrgency::High))
      .set_http_method(Some(http_request.method().to_string()))
      .set_http_path(Some(http_request.path().to_string()))
      .build();

  if let Err(pager_err) = server_state.pager.enqueue_page(notification) {
    error!("Failed to enqueue Beeble webhook parse error alert: {:?}", pager_err);
  }
}
