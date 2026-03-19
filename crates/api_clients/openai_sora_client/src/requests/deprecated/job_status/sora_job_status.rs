use crate::constants::user_agent::CLIENT_USER_AGENT;
use crate::creds::sora_credential_set::SoraCredentialSet;
use crate::creds::sora_jwt_bearer_token::SoraJwtBearerToken;
use crate::error::sora_client_error::SoraClientError;
use crate::error::sora_error::SoraError;
use crate::error::sora_generic_api_error::SoraGenericApiError;
use crate::requests::common::task_id::TaskId;
use crate::utils_internal::classify_general_http_status_code_and_body::classify_general_http_status_code_and_body;
use anyhow::anyhow;
use errors::AnyhowResult;
use log::{debug, error, warn};
use serde_derive::{Deserialize, Serialize};
use std::fmt::{Debug, Display};
use std::{fs::File, io::Write, path::Path};
use url::Url;
use wreq::Client;

// NB(2025-10-02): The new URL is:
// https://sora.chatgpt.com/backend/v2/list_tasks?limit=20
const SORA_STATUS_URL: &str = "https://sora.com/backend/video_gen";


#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
pub enum TaskStatus {
  Queued,
  Running,
  Succeeded,
  Failed,
  Unknown(String),
}

impl TaskStatus {
  pub fn from_str(s: &str) -> Self {
    match s {
      "queued" => TaskStatus::Queued,
      "running" => TaskStatus::Running,
      "succeeded" => TaskStatus::Succeeded,
      "failed" => TaskStatus::Failed,
      _ => TaskStatus::Unknown(s.to_string()),
    }
  }
}

#[derive(Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub struct VideoGenStatusResponse {
  pub task_responses: Vec<TaskResponse>,
  pub last_id: String,
  pub has_more: bool,
}

#[derive(Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub struct TaskResponse {
  pub id: TaskId,
  pub user: String,
  pub created_at: String,
  pub status: String,
  pub progress_pct: Option<f64>,
  pub progress_pos_in_queue: Option<i32>,
  pub estimated_queue_wait_time: Option<i32>,
  pub queue_status_message: Option<String>,
  pub priority: i32,
  pub r#type: String,
  pub prompt: Option<String>,
  pub n_variants: i32,
  pub n_frames: i32,
  pub height: i32,
  pub width: i32,
  pub model: Option<String>,
  pub operation: String,
  pub inpaint_items: Option<Vec<InpaintItem>>,
  pub preset_id: Option<String>,
  pub caption: Option<String>,
  //pub actions: Option<serde_json::Value>,
  //pub interpolation: Option<serde_json::Value>,
  //pub sdedit: Option<serde_json::Value>,
  //pub remix_config: Option<serde_json::Value>,
  pub quality: Option<String>,
  pub generations: Vec<Generation>,
  pub num_unsafe_generations: i32,
  pub title: String,
  //pub moderation_result: ModerationResult,
  pub failure_reason: Option<String>,
  pub needs_user_review: bool,
}

#[derive(Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub struct Generation {
  pub id: String,
  pub task_id: TaskId,
  pub created_at: String,
  pub deleted_at: Option<String>,
  pub url: String,
  pub seed: Option<i64>,
  pub can_download: Option<bool>,
  pub download_status: Option<String>,
  pub is_favorite: Option<bool>,
  pub is_liked: Option<bool>,
  pub is_public: Option<bool>,
  pub is_archived: Option<bool>,
  pub is_featured: Option<bool>,
  pub has_feedback: Option<bool>,
  pub like_count: Option<i32>,
  //pub cloudflare_metadata: Option<serde_json::Value>,
  pub cf_thumbnail_url: Option<String>,
  pub encodings: Encodings,
  pub width: i32,
  pub height: i32,
  pub n_frames: i32,
  pub prompt: String,
  pub title: String,
  pub actions: Option<serde_json::Value>,
  pub inpaint_items: Option<Vec<InpaintItem>>,
  //pub interpolation: Option<serde_json::Value>,
  //pub sdedit: Option<serde_json::Value>,
  pub operation: String,
  pub model: Option<String>,
  pub preset_id: Option<String>,
  //pub user: User,
  //pub moderation_result: ModerationResult,
  //pub paragen_status: Option<serde_json::Value>,
  pub task_type: String,
  pub remix_config: Option<serde_json::Value>,
  pub quality: Option<String>,
}

#[derive(Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub struct Encodings {
  pub source: Source,
  pub md: Option<serde_json::Value>,
  pub ld: Option<serde_json::Value>,
  pub thumbnail: Thumbnail,
  pub spritesheet: Option<serde_json::Value>,
}

#[derive(Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub struct Source {
  pub path: String,
  pub size: Option<i32>,
  pub width: Option<i32>,
  pub height: Option<i32>,
  pub duration_secs: Option<f64>,
  pub ssim: Option<f64>,
}

#[derive(Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub struct Thumbnail {
  pub path: String,
  pub size: Option<i32>,
}

//#[derive(Deserialize, Clone, Debug)]
//#[serde(rename_all = "snake_case")]
//pub struct User {
//  pub id: String,
//  pub username: String,
//}

#[derive(Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub struct InpaintItem {
  pub crop_bounds: Option<String>,
  pub r#type: String,
  pub preset_id: Option<String>,
  pub generation_id: Option<String>,
  pub upload_media_id: Option<String>,
  pub frame_index: i32,
  pub source_start_frame: i32,
}

//#[derive(Deserialize, Clone, Debug)]
//#[serde(rename_all = "snake_case")]
//pub struct ModerationResult {
//  pub r#type: String,
//  pub results_by_frame_index: serde_json::Value,
//  pub code: Option<String>,
//  pub is_output_rejection: bool,
//  pub task_id: TaskId,
//}

pub struct StatusRequest {
  pub limit: Option<u32>,
  pub before: Option<String>,
}

impl StatusRequest {
  pub fn new(limit: Option<u32>, before: Option<String>) -> Self {
    let limit = limit.unwrap_or(100);
    Self { limit: Some(limit), before }
  }
}

/// Gets the status of image generation tasks from Sora API
pub async fn get_image_gen_status(status_request: &StatusRequest, credentials: &SoraCredentialSet) -> Result<VideoGenStatusResponse, SoraError> {

  let bearer_header = match credentials.jwt_bearer_token.as_ref()  {
    Some(bearer) => bearer.to_authorization_header_value(),
    None => {
      warn!("No JWT bearer token in client - cannot fetch image gen status!");
      return Err(SoraClientError::NoBearerTokenForRequest.into());
    },
  };

  let client = Client::new();

  let mut url = Url::parse(SORA_STATUS_URL)
      .map_err(|err| {
        SoraClientError::UrlParseError(err)
      })?;

  // Add query parameters
  if let Some(limit) = status_request.limit {
    url.query_pairs_mut().append_pair("limit", &limit.to_string());
  }

  if let Some(before) = &status_request.before {
    url.query_pairs_mut().append_pair("before", &before);
  }

  let http_request = client.get(url.as_str())
      .header("User-Agent", CLIENT_USER_AGENT)
      .header("Cookie", credentials.cookies.as_str())
      .header("Authorization", bearer_header)
      .header("Content-Type", "application/json");

  let http_request = http_request.build()
      .map_err(|err| {
        SoraClientError::WreqClientError(err)
      })?;

  let response = client.execute(http_request)
      .await
      .map_err(|err| {
        error!("Client failed to fetch sora image gen status: {:?}", err);
        SoraGenericApiError::WreqError(err)
      })?;

  let status = response.status();

  let response_body = &response.text()
      .await
      .map_err(|err| {
        error!("Client failed to read sora image gen status: {:?}", err);
        SoraGenericApiError::WreqError(err)
      })?;

  debug!("response_body: {}", response_body);

  if !status.is_success() {
    error!("The sora status request failed; status = {:?} ; response body = {}", status, response_body);
    let error = classify_general_http_status_code_and_body(status, &response_body);
    return Err(error);
  }

  let maybe_response = serde_json::from_str::<VideoGenStatusResponse>(response_body);

  match maybe_response {
    Ok(response) => Ok(response),
    Err(err) => {
      warn!("Failed to parse status response: {:?}", err);
      Err(SoraGenericApiError::SerdeResponseParseErrorWithBody(
        err, response_body.to_string()).into())
    }
  }
}

pub async fn save_generations_to_dir(generations: &[Generation], dir: &str) -> AnyhowResult<()> {
  let dir = Path::new(dir);
  if !dir.exists() {
    std::fs::create_dir_all(dir)?;
  }
  for generation in generations {
    let response = wreq::get(generation.url.clone()).send().await?;
    let image_bytes = response.bytes().await?;

    let url = Url::parse(&generation.url)?;
    let ext = url.path().split(".").last().unwrap_or("png");
    let path = Path::new(dir).join(format!("{}.{}", generation.id, ext));

    let mut file = File::create(path)?;
    file.write_all(&image_bytes)?;

    let thumbnail_url = generation.encodings.thumbnail.path.clone();
    let thumbnail_response = wreq::get(thumbnail_url).send().await?;
    let thumbnail_bytes = thumbnail_response.bytes().await?;
    let thumbnail_path = Path::new(dir).join(format!("{}_thumbnail.{}", generation.id, ext));
    let mut thumbnail_file = File::create(thumbnail_path)?;
    thumbnail_file.write_all(&thumbnail_bytes)?;
  }

  Ok(())
}

#[cfg(test)]
mod tests {
  use crate::creds::sora_credential_builder::SoraCredentialBuilder;
  use crate::recipes::wait_for_image_gen_status::wait_for_image_gen_status;
  use crate::requests::deprecated::job_status::sora_job_status::{get_image_gen_status, save_generations_to_dir, StatusRequest, VideoGenStatusResponse};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_utils::test_file_path::test_file_path;

  #[ignore]
  #[tokio::test]
  pub async fn test_deserialize_status_response() -> AnyhowResult<()> {
    let response = read_to_string(test_file_path("test_data/image_gen/test_status_response_long.json")?)?;
    let _response: VideoGenStatusResponse = serde_json::from_str(&response)?;
    Ok(())
  }

  #[ignore] // You can manually run "ignore" tests in the IDE, but they won't run in CI.
  #[tokio::test]
  pub async fn manual_test() -> AnyhowResult<()> {
    let sentinel = read_to_string(test_file_path("test_data/temp/sentinel.txt")?)?;
    let sentinel = sentinel.trim().to_string();

    let cookie = read_to_string(test_file_path("test_data/temp/cookie.txt")?)?;
    let cookie = cookie.trim().to_string();

    let bearer = read_to_string(test_file_path("test_data/temp/bearer.txt")?)?;
    let bearer = bearer.trim().to_string();

    let creds = SoraCredentialBuilder::new()
        .with_cookies(&cookie)
        .with_jwt_bearer_token(&bearer)
        .with_sora_sentinel(&sentinel)
        .build()?;

    // Get the task status for a specific task
    // let response = get_image_gen_status(&StatusRequest::new(None, Some("task_01jr9yvpfyetx9r7qvvx38scna".to_string())), &creds).await?;

    let response = get_image_gen_status(&StatusRequest::new(Some(50), None), &creds).await?;
    println!("task_id: {}", response.task_responses[0].id);

    let task_id = response.task_responses[0].id.clone();
    let task_response = wait_for_image_gen_status(
      &task_id.0,
      &creds,
      Some(10)
    ).await?;

    assert!(task_response.status == "succeeded");
    Ok(())
  }

  #[ignore]
  #[tokio::test]
  pub async fn test_save_generations_to_dir() -> AnyhowResult<()> {
    let response = read_to_string(test_file_path("test_data/image_gen/test_status_response_long.json")?)?;
    let response: VideoGenStatusResponse = serde_json::from_str(&response)?;
    save_generations_to_dir(&response.task_responses[0].generations, test_file_path("test_data/image_gen/generations")?.to_str().unwrap()).await?;
    Ok(())
  }
}
