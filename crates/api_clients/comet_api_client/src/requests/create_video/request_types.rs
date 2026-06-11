use serde_derive::Deserialize;

use crate::requests::video_task_status::CometVideoTaskStatus;

/// Over-the-wire response from `POST /v1/videos`.
///
/// The docs show both `id` and `task_id` carrying the same task identifier;
/// `task_id` is treated as an optional mirror of `id`.
#[derive(Clone, Debug, Deserialize)]
pub struct CreateVideoRawResponse {
  /// Task identifier, eg. "task_abc123". Use this with the poll endpoint.
  pub id: String,

  /// Mirror of `id`.
  pub task_id: Option<String>,

  /// Always "video".
  pub object: Option<String>,

  /// The model that will fulfil the task, eg. "doubao-seedance-2-0".
  pub model: Option<String>,

  /// Initial lifecycle status, typically "queued".
  pub status: CometVideoTaskStatus,

  /// 0-100 completion percentage.
  pub progress: Option<u8>,

  /// Unix timestamp (seconds).
  pub created_at: Option<i64>,
}

#[cfg(test)]
mod tests {
  use super::*;

  /// Documented response shape from
  /// https://apidoc.cometapi.com/api/video/seedance/create.md
  const REAL_CREATE_RESPONSE: &str = r#"
{
  "id": "task_abc123",
  "task_id": "task_abc123",
  "object": "video",
  "model": "doubao-seedance-2-0",
  "status": "queued",
  "progress": 0,
  "created_at": 1776681149
}
    "#;

  #[test]
  fn parse_real_create_response() {
    let response: CreateVideoRawResponse = serde_json::from_str(REAL_CREATE_RESPONSE)
      .expect("should parse");

    assert_eq!(response.id, "task_abc123");
    assert_eq!(response.task_id.as_deref(), Some("task_abc123"));
    assert_eq!(response.object.as_deref(), Some("video"));
    assert_eq!(response.model.as_deref(), Some("doubao-seedance-2-0"));
    assert_eq!(response.status, CometVideoTaskStatus::Queued);
    assert_eq!(response.progress, Some(0));
    assert_eq!(response.created_at, Some(1776681149));
  }

  #[test]
  fn parse_minimal_response() {
    // Only `id` and `status` are load-bearing; everything else is optional
    // so schema drift doesn't break enqueuing.
    let response: CreateVideoRawResponse = serde_json::from_str(
      r#"{"id":"task_xyz","status":"queued"}"#,
    ).expect("should parse");

    assert_eq!(response.id, "task_xyz");
    assert_eq!(response.status, CometVideoTaskStatus::Queued);
    assert_eq!(response.task_id, None);
  }
}
