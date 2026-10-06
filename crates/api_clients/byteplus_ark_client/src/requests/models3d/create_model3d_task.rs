use crate::creds::ark_api_key::ArkApiKey;
use crate::error::ark_error::ArkError;
use crate::requests::ark_host::ARK_AP_SOUTHEAST_BASE_URL;
use crate::requests::http::send_json;
use crate::requests::models3d::model3d_task_types::{CreateModel3dTaskRequest, CreateModel3dTaskResponse};
use reqwest::Method;
use std::time::Duration;

/// Base64 reference images make the request body large; allow time to upload it.
const CREATE_MODEL3D_TASK_TIMEOUT: Duration = Duration::from_secs(120);

/// `POST /contents/generations/tasks` for Hyper3D Rodin and Hitem3D. Returns the task id; poll it
/// with `get_video_task` (3D and video tasks share the endpoint) until `content.file_url` is set.
pub async fn create_model3d_task(
  api_key: &ArkApiKey,
  request: &CreateModel3dTaskRequest,
) -> Result<CreateModel3dTaskResponse, ArkError> {
  let url = format!("{}/contents/generations/tasks", ARK_AP_SOUTHEAST_BASE_URL);
  send_json(api_key, Method::POST, &url, Some(request), CREATE_MODEL3D_TASK_TIMEOUT).await
}
