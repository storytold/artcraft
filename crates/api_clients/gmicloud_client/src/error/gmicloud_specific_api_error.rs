use std::fmt;

/// Well-known server-side errors with specific causes.
#[derive(Debug)]
pub enum GmiCloudSpecificApiError {
  /// The API key is invalid or expired.
  Unauthorized,

  /// The request was rejected due to content policy.
  ContentPolicyViolation(String),

  /// The input image was rejected because it may contain a real person.
  ContentContainsRealPerson(String),

  /// The account has insufficient credits or a billing issue.
  BillingError { status_code: u16, body: String },
}

impl fmt::Display for GmiCloudSpecificApiError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}
