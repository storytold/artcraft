use actix_web::web::Json;
use enums::by_table::debug_logs::debug_log_type::DebugLogType;
use fal_client::webhook_payload::hydrated::hydrated_webhook_contents::WebhookSuccessData;
use http_server_common::response::response_success_helpers::SimpleGenericJsonSuccess;
use log::{info, warn};
use mysql_queries::queries::debug_logs::insert_debug_log::{insert_debug_log, InsertDebugLogArgs};
use mysql_queries::queries::generic_inference::api_providers::fal::get_inference_job_by_fal_id::get_inference_job_by_fal_id_from_connection;
use mysql_queries::queries::generic_inference::api_providers::fal::mark_fal_generic_inference_job_successfully_done::{mark_fal_generic_inference_job_successfully_done, MarkJobArgs};
use pager::client::pager::Pager;
use sqlx::pool::PoolConnection;
use sqlx::MySql;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;

use super::process_image_payload::process_image_payload;
use super::process_images_payload::process_images_payload;
use super::process_model_glb_payload::process_model_glb_payload;
use super::process_model_mesh_payload::process_model_mesh_payload;
use super::process_video_payload::process_video_payload;

pub async fn handle_successful_fal_webhook(
  server_state: &ServerState,
  mysql_connection: &mut PoolConnection<MySql>,
  request_id: &str,
  success_data: &WebhookSuccessData,
  raw_body: &str,
  pager: &Pager,
) -> Result<Json<SimpleGenericJsonSuccess>, CommonWebError> {

  let db_result = get_inference_job_by_fal_id_from_connection(
    request_id,
    mysql_connection,
  ).await;

  let job = match db_result {
    Ok(Some(record)) => record,
    Ok(None) => {
      warn!("Could not find job record by fal request_id: {}", request_id);
      return Err(CommonWebError::NotFound)
    },
    Err(err) => {
      warn!("Error querying job record for request_id {}: {:?}", request_id, err);
      return Err(CommonWebError::from_anyhow_error(err));
    }
  };

  info!("Fal webhook job record for request_id {}: {:?}", request_id, job);

  // Insert debug log for the webhook payload.
  if let Some(debug_log_event_token) = &job.maybe_debug_log_event_token {
    if let Err(err) = insert_debug_log(InsertDebugLogArgs {
      apriori_debug_log_event_token: Some(debug_log_event_token),
      maybe_creator_user_token: job.maybe_creator_user_token.as_ref(),
      debug_log_type: DebugLogType::FalWebhook,
      message: raw_body,
      mysql_executor: &mut **mysql_connection,
      phantom: Default::default(),
    }).await {
      warn!("Failed to insert Fal webhook debug log: {:?}", err);
    }
  }

  let mut maybe_media_token = None;
  let mut maybe_batch_token = None;

  if let Some(ref extracted) = success_data.extracted_contents {
    if let Some(ref image_data) = extracted.image {
      info!("Handling image payload for request_id {} / job {:?}", request_id, job.job_token);
      let token = process_image_payload(image_data, &job, server_state).await?;
      if maybe_media_token.is_none() {
        maybe_media_token = Some(token);
      }
    }

    if let Some(ref images_data) = extracted.images {
      info!("Handling images payload for request_id {} / job {:?}", request_id, job.job_token);
      let (media_token, batch_token) = process_images_payload(images_data, &job, server_state, pager).await?;
      if maybe_media_token.is_none() {
        maybe_media_token = media_token;
      }
      if maybe_batch_token.is_none() {
        maybe_batch_token = batch_token;
      }
    }

    if let Some(ref video_data) = extracted.video {
      info!("Handling video payload for request_id {} / job {:?}", request_id, job.job_token);
      let token = process_video_payload(video_data, &job, server_state).await?;
      if maybe_media_token.is_none() {
        maybe_media_token = Some(token);
      }
    }

    if let Some(ref model_glb_data) = extracted.model_glb {
      info!("Handling model_glb payload for request_id {} / job {:?}", request_id, job.job_token);
      let token = process_model_glb_payload(model_glb_data, extracted.thumbnail.as_ref(), &job, server_state).await?;
      if maybe_media_token.is_none() {
        maybe_media_token = Some(token);
      }
    } else if let Some(ref model_mesh_data) = extracted.model_mesh {
      info!("Handling model_mesh payload for request_id {} / job {:?}", request_id, job.job_token);
      let token = process_model_mesh_payload(model_mesh_data, &job, server_state).await?;
      if maybe_media_token.is_none() {
        maybe_media_token = Some(token);
      }
    }
  }

  if let Some(media_token) = maybe_media_token {
    info!("Media file token for request_id {}: {:?}", request_id, media_token);
    mark_fal_generic_inference_job_successfully_done(MarkJobArgs {
      job_token: &job.job_token,
      media_file_token: &media_token,
      maybe_batch_token: maybe_batch_token.as_ref(),
      mysql_executor: &mut **mysql_connection,
      phantom: Default::default(),
    }).await.map_err(|err| {
      warn!("Error marking job as successfully done for request_id {}: {:?}", request_id, err);
      CommonWebError::from_anyhow_error(err)
    })?;
  } else {
    warn!("No media token found in payload for request_id {} / job {:?}", request_id, job.job_token);
  }

  Ok(SimpleGenericJsonSuccess::wrapped(true))
}
