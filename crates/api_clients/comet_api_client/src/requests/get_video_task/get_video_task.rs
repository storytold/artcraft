use log::info;

use crate::creds::comet_api_key::CometApiKey;
use crate::error::categorize_comet_error::categorize_get_video_task_error;
use crate::error::comet_client_error::CometClientError;
use crate::error::comet_error::CometError;
use crate::error::comet_generic_api_error::CometGenericApiError;
use crate::requests::comet_host::COMET_API_BASE_URL;
use crate::requests::get_video_task::request_types::VideoTaskRawResponse;
use crate::requests::video_task_status::CometVideoTaskStatus;

// ── Public args ──

pub struct GetVideoTaskArgs<'a> {
  pub api_key: &'a CometApiKey,

  /// The task id returned by the creation endpoint, eg. "task_abc123".
  pub task_id: &'a str,
}

// ── Public response ──

/// Snapshot of a video task's state.
///
/// Poll every 10-20 seconds until [`CometVideoTaskStatus::is_terminal`];
/// most tasks finish within 1-3 minutes.
#[derive(Clone, Debug)]
pub struct CometVideoTask {
  pub task_id: String,

  pub status: CometVideoTaskStatus,

  /// The Seedance model used, as echoed by the API.
  pub maybe_model: Option<String>,

  /// 0-100 completion percentage.
  pub maybe_progress: Option<u8>,

  /// Signed download URL, present only when the task completed. The
  /// signature is time-limited — download or re-host the file promptly.
  pub maybe_video_url: Option<String>,

  /// Unix timestamp (seconds).
  pub maybe_created_at: Option<i64>,

  /// Unix timestamp (seconds) when the task finished.
  pub maybe_completed_at: Option<i64>,
}

/// Fetch the current state of a video task (`GET /v1/videos/{id}`).
pub async fn get_video_task(args: GetVideoTaskArgs<'_>) -> Result<CometVideoTask, CometError> {
  let url = format!("{COMET_API_BASE_URL}/v1/videos/{}", args.task_id);

  let client = reqwest::Client::builder()
    .build()
    .map_err(CometClientError::ReqwestClientError)?;

  let response = client.get(&url)
    .bearer_auth(args.api_key.as_str())
    .send()
    .await
    .map_err(CometGenericApiError::ReqwestError)?;

  let status_code = response.status();
  let body = response.text()
    .await
    .map_err(CometGenericApiError::ReqwestError)?;

  if !status_code.is_success() {
    return Err(categorize_get_video_task_error(status_code, body, args.task_id));
  }

  let raw: VideoTaskRawResponse = serde_json::from_str(&body)
    .map_err(|err| CometGenericApiError::SerdeResponseParseErrorWithBody(err, body.clone()))?;

  info!("Comet video task {}: status {} (progress: {:?})", raw.id, raw.status, raw.progress);

  Ok(CometVideoTask {
    task_id: raw.id,
    status: raw.status,
    maybe_model: raw.model,
    maybe_progress: raw.progress,
    maybe_video_url: raw.video_url,
    maybe_created_at: raw.created_at,
    maybe_completed_at: raw.completed_at,
  })
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::error::comet_specific_api_error::CometSpecificApiError;
  use crate::requests::get_video_content::get_video_content::{
    probe_video_failure_reason, ProbeVideoFailureReasonArgs,
  };
  use crate::test_utils::load_api_key;

  /// Historical task ids from real generations, kept for diagnosing how
  /// CometAPI reports terminal states. Several of these failed content
  /// moderation ("VIOLATION").
  const KNOWN_TASK_IDS: &[&str] = &[
    "task_ZISEWaXgmyqXWiesd287qTyAZLapbwz8",
    "task_ZvwV2nhp08ng4krT16CPxtHZ2SgABElj",
    "task_GZPVhcnIZKLJBqsCGTBvMiUFN9uDnwJv",
    "task_iGnAQ5lwqhMltxhN5k9yATAjs7AgjV39",
    "task_hGhShys2Wi2gPf2qUkuQ38VKIytWAw1d",
    "task_t84NmrcT3k8s6Il4xJeKtfxXipA3n8RQ",
    "task_6OhdGVFZjHNtOKKx8Ewz37mENaVIhC3X",
  ];

  /// Live test: makes a REAL network request (no generation cost — the task
  /// id is bogus, so this exercises auth + the TaskNotFound error path).
  /// Run manually with:
  ///   cargo test -p comet_api_client live_get_video_task -- --ignored --nocapture
  #[ignore]
  #[tokio::test]
  async fn live_get_video_task_unknown_id() {
    let api_key = load_api_key();

    let result = get_video_task(GetVideoTaskArgs {
      api_key: &api_key,
      task_id: "task_does_not_exist_artcraft_test",
    }).await;

    match result {
      Err(CometError::ApiSpecific(CometSpecificApiError::TaskNotFound { task_id, .. })) => {
        assert_eq!(task_id, "task_does_not_exist_artcraft_test");
      }
      other => panic!("Expected TaskNotFound, got: {:?}", other),
    }
  }

  /// Live diagnostic: polls the known historical tasks and prints their full
  /// state, including the failure reason recovered from the content
  /// endpoint for failed tasks. Free (read-only GETs, no generation cost),
  /// but hits the real API. Run manually with:
  ///   cargo test -p comet_api_client live_poll_known_task_ids -- --ignored --nocapture
  ///
  /// NB: The poll endpoint reports failures as a bare `status: "failed"`.
  /// The ONLY way to learn WHY is `GET /v1/videos/{id}/content`, whose error
  /// message leaks the underlying provider status (eg. "VIOLATION" for
  /// content-moderation rejections — these run to progress 100 and then
  /// fail when the finished output is moderated).
  #[ignore]
  #[tokio::test]
  async fn live_poll_known_task_ids() {
    let api_key = load_api_key();

    for task_id in KNOWN_TASK_IDS {
      println!("===== {task_id}");

      let task = match get_video_task(GetVideoTaskArgs { api_key: &api_key, task_id }).await {
        Ok(task) => task,
        Err(err) => {
          println!("  poll error: {err}");
          continue;
        }
      };

      println!("  status:       {}", task.status);
      println!("  model:        {}", task.maybe_model.as_deref().unwrap_or("?"));
      println!("  progress:     {:?}", task.maybe_progress);
      println!("  created_at:   {:?}", task.maybe_created_at);
      println!("  completed_at: {:?}", task.maybe_completed_at);
      println!("  video_url:    {}", task.maybe_video_url.as_deref().unwrap_or("(none)"));

      if task.status.is_failure() {
        match probe_video_failure_reason(ProbeVideoFailureReasonArgs { api_key: &api_key, task_id }).await {
          Ok(Some(reason)) => {
            println!("  failure reason (via /content):");
            println!("    raw message:       {}", reason.raw_message);
            println!("    underlying status: {}", reason.maybe_underlying_status.as_deref().unwrap_or("(unparsed)"));
            println!("    content violation: {}", reason.is_content_violation());
            println!("    error type:        {}", reason.maybe_error_type.as_deref().unwrap_or("(none)"));
            println!("    request id:        {}", reason.maybe_request_id.as_deref().unwrap_or("(none)"));
          }
          Ok(None) => println!("  failure probe: content unexpectedly downloadable"),
          Err(err) => println!("  failure probe error: {err}"),
        }
      }
      println!();
    }
  }
}
