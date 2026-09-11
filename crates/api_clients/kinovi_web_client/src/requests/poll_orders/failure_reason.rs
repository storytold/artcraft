use super::failure_type::FailureType;

/// A structured failure reason parsed from the raw Seedance2 Pro API response.
#[derive(Debug, Clone)]
pub struct FailureReason {
  /// The original reason string from the API.
  pub reason: String,

  /// The categorized failure type.
  pub failure_type: FailureType,
}

impl FailureReason {
  /// Parse a raw failure reason string into a structured `FailureReason`.
  ///
  /// First checks for exact string matches against known reasons,
  /// then falls back to case-insensitive substring matching.
  pub fn from_reason(reason: &str) -> Self {
    let failure_type = FailureType::classify_text(reason);
    FailureReason {
      reason: reason.to_string(),
      failure_type,
    }
  }
}

