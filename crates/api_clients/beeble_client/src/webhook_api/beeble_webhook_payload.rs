use serde_derive::Deserialize;

/// Raw deserialized webhook payload from Beeble.
#[derive(Deserialize, Debug, Clone)]
pub struct BeebleWebhookPayload {
  pub id: String,
  pub status: BeebleWebhookStatus,
  pub output: Option<BeebleWebhookOutput>,
  pub error: Option<String>,
  pub completed_at: Option<String>,
}

#[derive(Deserialize, Debug, Clone, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum BeebleWebhookStatus {
  Completed,
  Failed,
  /// Catch unknown variants gracefully.
  #[serde(other)]
  Unknown,
}

#[derive(Deserialize, Debug, Clone)]
pub struct BeebleWebhookOutput {
  pub render: Option<String>,
  pub source: Option<String>,
  pub alpha: Option<String>,
}

pub fn parse_beeble_webhook(raw_body: &str) -> Result<BeebleWebhookPayload, serde_json::Error> {
  serde_json::from_str(raw_body)
}

#[cfg(test)]
mod tests {
  use super::*;

  const SUCCESS_PAYLOAD: &str = r#"{
    "id": "swx_abc123",
    "status": "completed",
    "output": {
      "render": "https://cdn.beeble.ai/render.mp4",
      "source": "https://cdn.beeble.ai/source.mp4",
      "alpha": "https://cdn.beeble.ai/alpha.mp4"
    },
    "completed_at": "2026-02-23T10:05:00Z"
  }"#;

  const FAILURE_PAYLOAD: &str = r#"{
    "id": "swx_abc123",
    "status": "failed",
    "completed_at": "2026-02-23T10:05:00Z",
    "error": "Processing failed"
  }"#;

  const UNKNOWN_STATUS_PAYLOAD: &str = r#"{
    "id": "swx_xyz789",
    "status": "processing",
    "completed_at": null
  }"#;

  const NULL_OUTPUT_PAYLOAD: &str = r#"{
    "id": "swx_abc123",
    "status": "completed",
    "output": null,
    "completed_at": "2026-02-23T10:05:00Z"
  }"#;

  mod parse_tests {
    use super::*;

    #[test]
    fn parse_success_payload() {
      let payload = parse_beeble_webhook(SUCCESS_PAYLOAD).unwrap();
      assert_eq!(payload.id, "swx_abc123");
      assert_eq!(payload.status, BeebleWebhookStatus::Completed);
      assert!(payload.error.is_none());

      let output = payload.output.unwrap();
      assert_eq!(output.render.as_deref(), Some("https://cdn.beeble.ai/render.mp4"));
      assert_eq!(output.source.as_deref(), Some("https://cdn.beeble.ai/source.mp4"));
      assert_eq!(output.alpha.as_deref(), Some("https://cdn.beeble.ai/alpha.mp4"));
    }

    #[test]
    fn parse_failure_payload() {
      let payload = parse_beeble_webhook(FAILURE_PAYLOAD).unwrap();
      assert_eq!(payload.id, "swx_abc123");
      assert_eq!(payload.status, BeebleWebhookStatus::Failed);
      assert_eq!(payload.error.as_deref(), Some("Processing failed"));
      assert!(payload.output.is_none());
    }

    #[test]
    fn parse_unknown_status() {
      let payload = parse_beeble_webhook(UNKNOWN_STATUS_PAYLOAD).unwrap();
      assert_eq!(payload.id, "swx_xyz789");
      assert_eq!(payload.status, BeebleWebhookStatus::Unknown);
    }

    #[test]
    fn parse_null_output() {
      let payload = parse_beeble_webhook(NULL_OUTPUT_PAYLOAD).unwrap();
      assert_eq!(payload.id, "swx_abc123");
      assert_eq!(payload.status, BeebleWebhookStatus::Completed);
      assert!(payload.output.is_none());
    }

    #[test]
    fn parse_invalid_json() {
      let result = parse_beeble_webhook("not valid json");
      assert!(result.is_err());
    }
  }
}
