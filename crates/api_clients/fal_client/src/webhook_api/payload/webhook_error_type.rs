use serde::Deserialize;

/// Machine-readable error type from FAL webhook error payloads.
///
/// These are the `type` field values from the `detail` array in FAL error responses.
/// See: https://fal.ai/docs/documentation/model-apis/errors
#[derive(Clone, Debug, Eq, PartialEq, Hash, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum WebhookErrorType {
  FileTooLarge,
  InternalServerError,
  GenerationTimeout,
  DownstreamServiceError,
  DownstreamServiceUnavailable,
  ContentPolicyViolation,
  NoMediaGenerated,
  ImageTooSmall,
  ImageTooLarge,
  ImageLoadError,
  FileDownloadError,
  FaceDetectionError,
  GreaterThan,
  GreaterThanEqual,
  LessThan,
  LessThanEqual,
  MultipleOf,
  SequenceTooShort,
  SequenceTooLong,
  OneOf,
  FeatureNotSupported,
  InvalidArchive,
  ArchiveFileCountBelowMinimum,
  ArchiveFileCountExceedsMaximum,
  InvalidApiKey,

  /// Catch-all for unrecognized error types from FAL.
  #[serde(untagged)]
  Unknown(String),
}

impl WebhookErrorType {
  pub fn from_str(value: &str) -> Self {
    serde_json::from_value(serde_json::Value::String(value.to_string()))
        .unwrap_or_else(|_| Self::Unknown(value.to_string()))
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn deserialize_known_types() {
    let cases = vec![
      ("\"file_too_large\"", WebhookErrorType::FileTooLarge),
      ("\"internal_server_error\"", WebhookErrorType::InternalServerError),
      ("\"generation_timeout\"", WebhookErrorType::GenerationTimeout),
      ("\"downstream_service_error\"", WebhookErrorType::DownstreamServiceError),
      ("\"downstream_service_unavailable\"", WebhookErrorType::DownstreamServiceUnavailable),
      ("\"content_policy_violation\"", WebhookErrorType::ContentPolicyViolation),
      ("\"no_media_generated\"", WebhookErrorType::NoMediaGenerated),
      ("\"image_too_small\"", WebhookErrorType::ImageTooSmall),
      ("\"image_too_large\"", WebhookErrorType::ImageTooLarge),
      ("\"image_load_error\"", WebhookErrorType::ImageLoadError),
      ("\"file_download_error\"", WebhookErrorType::FileDownloadError),
      ("\"face_detection_error\"", WebhookErrorType::FaceDetectionError),
      ("\"greater_than\"", WebhookErrorType::GreaterThan),
      ("\"greater_than_equal\"", WebhookErrorType::GreaterThanEqual),
      ("\"less_than\"", WebhookErrorType::LessThan),
      ("\"less_than_equal\"", WebhookErrorType::LessThanEqual),
      ("\"multiple_of\"", WebhookErrorType::MultipleOf),
      ("\"sequence_too_short\"", WebhookErrorType::SequenceTooShort),
      ("\"sequence_too_long\"", WebhookErrorType::SequenceTooLong),
      ("\"one_of\"", WebhookErrorType::OneOf),
      ("\"feature_not_supported\"", WebhookErrorType::FeatureNotSupported),
      ("\"invalid_archive\"", WebhookErrorType::InvalidArchive),
      ("\"archive_file_count_below_minimum\"", WebhookErrorType::ArchiveFileCountBelowMinimum),
      ("\"archive_file_count_exceeds_maximum\"", WebhookErrorType::ArchiveFileCountExceedsMaximum),
      ("\"invalid_api_key\"", WebhookErrorType::InvalidApiKey),
    ];

    for (json, expected) in cases {
      let deserialized: WebhookErrorType = serde_json::from_str(json).unwrap();
      assert_eq!(deserialized, expected, "failed for {}", json);
    }
  }

  #[test]
  fn deserialize_unknown_type() {
    let deserialized: WebhookErrorType = serde_json::from_str("\"some_new_error_type\"").unwrap();
    assert_eq!(deserialized, WebhookErrorType::Unknown("some_new_error_type".to_string()));
  }

  #[test]
  fn from_str_known() {
    assert_eq!(WebhookErrorType::from_str("content_policy_violation"), WebhookErrorType::ContentPolicyViolation);
    assert_eq!(WebhookErrorType::from_str("face_detection_error"), WebhookErrorType::FaceDetectionError);
  }

  #[test]
  fn from_str_unknown() {
    assert_eq!(WebhookErrorType::from_str("brand_new_type"), WebhookErrorType::Unknown("brand_new_type".to_string()));
  }
}
