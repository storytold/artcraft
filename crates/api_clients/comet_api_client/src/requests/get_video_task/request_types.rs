use serde_derive::Deserialize;

use crate::requests::video_task_status::CometVideoTaskStatus;

/// Over-the-wire response from `GET /v1/videos/{id}`.
#[derive(Clone, Debug, Deserialize)]
pub struct VideoTaskRawResponse {
  /// Task identifier.
  pub id: String,

  /// Always "video".
  pub object: Option<String>,

  /// The Seedance model used, eg. "doubao-seedance-2-0".
  pub model: Option<String>,

  /// Lifecycle status.
  pub status: CometVideoTaskStatus,

  /// 0-100 completion percentage.
  pub progress: Option<u8>,

  /// Signed download URL. Present only when `status` is "completed".
  /// NB: the signature is time-limited — download or re-host the file
  /// before it expires.
  pub video_url: Option<String>,

  /// Unix timestamp (seconds).
  pub created_at: Option<i64>,

  /// Unix timestamp (seconds) when the task finished.
  pub completed_at: Option<i64>,
}

#[cfg(test)]
mod tests {
  use super::*;

  // Documented response shapes from
  // https://apidoc.cometapi.com/api/video/seedance/query.md

  const REAL_IN_PROGRESS_RESPONSE: &str = r#"
{
  "id": "task_abc123",
  "object": "video",
  "model": "doubao-seedance-2-0",
  "status": "in_progress",
  "progress": 30,
  "created_at": 1777385418,
  "completed_at": 1777385485
}
    "#;

  const REAL_COMPLETED_RESPONSE: &str = r#"
{
  "id": "task_abc123",
  "object": "video",
  "model": "doubao-seedance-2-0",
  "status": "completed",
  "progress": 100,
  "created_at": 1777385418,
  "completed_at": 1777385526,
  "video_url": "https://example.com/seedance-output.mp4"
}
    "#;

  const REAL_FAILED_RESPONSE: &str = r#"
{
  "id": "task_abc123",
  "object": "video",
  "model": "doubao-seedance-2-0",
  "status": "failed",
  "progress": 0,
  "created_at": 1777385418,
  "completed_at": 1777385526
}
    "#;

  #[test]
  fn parse_real_in_progress_response() {
    let response: VideoTaskRawResponse = serde_json::from_str(REAL_IN_PROGRESS_RESPONSE)
      .expect("should parse");

    assert_eq!(response.id, "task_abc123");
    assert_eq!(response.status, CometVideoTaskStatus::InProgress);
    assert_eq!(response.progress, Some(30));
    assert_eq!(response.video_url, None);
    assert!(!response.status.is_terminal());
  }

  #[test]
  fn parse_real_completed_response() {
    let response: VideoTaskRawResponse = serde_json::from_str(REAL_COMPLETED_RESPONSE)
      .expect("should parse");

    assert_eq!(response.status, CometVideoTaskStatus::Completed);
    assert_eq!(response.progress, Some(100));
    assert_eq!(response.video_url.as_deref(), Some("https://example.com/seedance-output.mp4"));
    assert_eq!(response.completed_at, Some(1777385526));
    assert!(response.status.is_success());
  }

  #[test]
  fn parse_real_failed_response() {
    let response: VideoTaskRawResponse = serde_json::from_str(REAL_FAILED_RESPONSE)
      .expect("should parse");

    assert_eq!(response.status, CometVideoTaskStatus::Failed);
    assert_eq!(response.video_url, None);
    assert!(response.status.is_terminal());
    assert!(response.status.is_failure());
  }
}
