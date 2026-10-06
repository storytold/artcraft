use crate::creds::ark_api_key::ArkApiKey;
use crate::error::ark_error::ArkError;
use crate::requests::ark_host::ARK_AP_SOUTHEAST_BASE_URL;
use crate::requests::http::send_json;
use crate::requests::videos::video_task_types::{CreateVideoTaskRequest, CreateVideoTaskResponse};
use reqwest::Method;
use std::time::Duration;

/// Large base64 frames make the request body big; allow time to upload it.
const CREATE_VIDEO_TASK_TIMEOUT: Duration = Duration::from_secs(120);

/// `POST /contents/generations/tasks` (Seedance). Returns the task id to poll.
pub async fn create_video_task(
  api_key: &ArkApiKey,
  request: &CreateVideoTaskRequest,
) -> Result<CreateVideoTaskResponse, ArkError> {
  let url = format!("{}/contents/generations/tasks", ARK_AP_SOUTHEAST_BASE_URL);
  send_json(api_key, Method::POST, &url, Some(request), CREATE_VIDEO_TASK_TIMEOUT).await
}
