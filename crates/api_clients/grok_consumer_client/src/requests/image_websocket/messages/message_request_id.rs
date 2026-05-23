use serde::Deserialize;

/// This could intercept any message with a "request_id"
/// We're going to try to use these to end the image prompting early.
/// If we're not careful, we might accidentally ingest completed image messages this way.
#[derive(Deserialize, Clone, Debug)]
pub struct MessageRequestId {
  /// UUID.
  /// Probably an identifier for the original request/prompt.
  pub request_id: String, // Option<String>,
}
