use serde_json::Value;

/// A single error detail item from a FAL webhook error payload.
///
/// See: https://fal.ai/docs/documentation/model-apis/errors
#[derive(Debug, Clone)]
pub struct FalErrorDetail {
  /// Human-readable error message. Should not be parsed for logic.
  pub msg: Option<String>,

  /// Machine-readable error type (e.g. "image_too_small", "image_too_large").
  pub error_type: Option<String>,
}

/// Attempt to parse the "detail" array from a FAL webhook payload.
///
/// The payload may contain a "detail" key with an array of error objects,
/// each having optional "msg" and "type" fields.
///
/// Returns an empty vec if the "detail" key is missing or not an array.
pub fn parse_fal_error_details(payload: &Value) -> Vec<FalErrorDetail> {
  let detail_array = match payload.get("detail").and_then(|v| v.as_array()) {
    Some(arr) => arr,
    None => return Vec::new(),
  };

  detail_array
    .iter()
    .map(|item| FalErrorDetail {
      msg: item.get("msg").and_then(|v| v.as_str()).map(|s| s.to_string()),
      error_type: item.get("type").and_then(|v| v.as_str()).map(|s| s.to_string()),
    })
    .collect()
}

/// Build a human-readable summary of the error details for logging and alerting.
pub fn summarize_fal_error_details(details: &[FalErrorDetail]) -> String {
  if details.is_empty() {
    return "No error details provided.".to_string();
  }

  details
    .iter()
    .enumerate()
    .map(|(i, detail)| {
      let error_type = detail.error_type.as_deref().unwrap_or("unknown");
      let msg = detail.msg.as_deref().unwrap_or("no message");
      format!("[{}] type={}, msg={}", i + 1, error_type, msg)
    })
    .collect::<Vec<_>>()
    .join("\n")
}

#[cfg(test)]
mod tests {
  use super::*;
  use serde_json::json;

  #[test]
  fn parse_typical_error_detail() {
    let payload = json!({
      "detail": [
        {
          "loc": ["body", "image_url"],
          "msg": "Image too small",
          "type": "image_too_small",
          "url": "https://docs.fal.ai/errors/#image_too_small",
          "ctx": { "min_height": 512, "min_width": 512 }
        }
      ]
    });

    let details = parse_fal_error_details(&payload);
    assert_eq!(details.len(), 1);
    assert_eq!(details[0].msg.as_deref(), Some("Image too small"));
    assert_eq!(details[0].error_type.as_deref(), Some("image_too_small"));
  }

  #[test]
  fn parse_multiple_error_details() {
    let payload = json!({
      "detail": [
        { "msg": "First error", "type": "err_one" },
        { "msg": "Second error", "type": "err_two" }
      ]
    });

    let details = parse_fal_error_details(&payload);
    assert_eq!(details.len(), 2);
    assert_eq!(details[0].error_type.as_deref(), Some("err_one"));
    assert_eq!(details[1].error_type.as_deref(), Some("err_two"));
  }

  #[test]
  fn parse_missing_detail_field() {
    let payload = json!({ "images": [] });
    let details = parse_fal_error_details(&payload);
    assert!(details.is_empty());
  }

  #[test]
  fn parse_detail_not_array() {
    let payload = json!({ "detail": "some string" });
    let details = parse_fal_error_details(&payload);
    assert!(details.is_empty());
  }

  #[test]
  fn parse_detail_with_missing_fields() {
    let payload = json!({
      "detail": [
        { "msg": "Only message" },
        { "type": "only_type" },
        {}
      ]
    });

    let details = parse_fal_error_details(&payload);
    assert_eq!(details.len(), 3);
    assert_eq!(details[0].msg.as_deref(), Some("Only message"));
    assert_eq!(details[0].error_type, None);
    assert_eq!(details[1].msg, None);
    assert_eq!(details[1].error_type.as_deref(), Some("only_type"));
    assert_eq!(details[2].msg, None);
    assert_eq!(details[2].error_type, None);
  }

  #[test]
  fn summarize_empty() {
    assert_eq!(summarize_fal_error_details(&[]), "No error details provided.");
  }

  #[test]
  fn summarize_single() {
    let details = vec![FalErrorDetail {
      msg: Some("Image too small".to_string()),
      error_type: Some("image_too_small".to_string()),
    }];
    let summary = summarize_fal_error_details(&details);
    assert_eq!(summary, "[1] type=image_too_small, msg=Image too small");
  }
}
