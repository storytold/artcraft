use actix_web::web::Json;
use http_server_common::response::response_success_helpers::SimpleGenericJsonSuccess;
use log::{info, warn};
use mysql_queries::queries::generic_inference::fal::get_inference_job_by_fal_id::get_inference_job_by_fal_id;
use mysql_queries::queries::generic_inference::fal::mark_fal_generic_inference_job_successfully_done::{mark_fal_generic_inference_job_successfully_done, MarkJobArgs};
use serde_json::Value;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::state::server_state::ServerState;

use super::process_image_payload::process_image_payload;
use super::process_images_payload::process_images_payload;
use super::process_model_glb_payload::process_model_glb_payload;
use super::process_model_mesh_payload::process_model_mesh_payload;
use super::process_video_payload::process_video_payload;

pub async fn handle_successful_fal_webhook(
  server_state: &ServerState,
  request_id: &str,
  payload: &Value,
) -> Result<Json<SimpleGenericJsonSuccess>, AdvancedCommonWebError> {

  let db_result = get_inference_job_by_fal_id(
    request_id,
    &server_state.mysql_pool,
  ).await;

  let job = match db_result {
    Ok(Some(record)) => record,
    Ok(None) => {
      warn!("Could not find job record by fal request_id: {}", request_id);
      return Err(AdvancedCommonWebError::NotFound)
    },
    Err(err) => {
      warn!("Error querying job record for request_id {}: {:?}", request_id, err);
      return Err(AdvancedCommonWebError::from_anyhow_error(err));
    }
  };

  info!("Fal webhook job record for request_id {}: {:?}", request_id, job);

  let mut maybe_media_token = None;
  let mut maybe_batch_token = None;

  if let Some(payload_obj) = payload.as_object() {
    if payload_obj.contains_key("image") {
      info!("Handling image payload for request_id {} / job {:?}", request_id, job.job_token);
      let token = process_image_payload(payload_obj, &job, server_state).await?;
      maybe_media_token = Some(token);
    } else if payload_obj.contains_key("images") {
      (maybe_media_token, maybe_batch_token) = process_images_payload(payload_obj, &job, server_state).await?;
    } else if payload_obj.contains_key("video") {
      info!("Handling video payload for request_id {} / job {:?}", request_id, job.job_token);
      let token = process_video_payload(payload_obj, &job, server_state).await?;
      maybe_media_token = Some(token);
    } else if payload_obj.contains_key("model_glb") {
      info!("Handling model_glb payload for request_id {} / job {:?}", request_id, job.job_token);
      let token = process_model_glb_payload(payload_obj, &job, server_state).await?;
      maybe_media_token = Some(token);
    } else if payload_obj.contains_key("model_mesh") {
      info!("Handling model_mesh payload for request_id {} / job {:?}", request_id, job.job_token);
      let token = process_model_mesh_payload(payload_obj, &job, server_state).await?;
      maybe_media_token = Some(token);
    }
  }

  if let Some(media_token) = maybe_media_token {
    info!("Media file token for request_id {}: {:?}", request_id, media_token);
    mark_fal_generic_inference_job_successfully_done(MarkJobArgs {
      job_token: &job.job_token,
      media_file_token: &media_token,
      maybe_batch_token: maybe_batch_token.as_ref(),
      mysql_executor: &server_state.mysql_pool,
      phantom: Default::default(),
    }).await.map_err(|err| {
      warn!("Error marking job as successfully done for request_id {}: {:?}", request_id, err);
      AdvancedCommonWebError::from_anyhow_error(err)
    })?;
  } else {
    warn!("No media token found in payload for request_id {} / job {:?}", request_id, job.job_token);
  }

  Ok(SimpleGenericJsonSuccess::wrapped(true))
}
