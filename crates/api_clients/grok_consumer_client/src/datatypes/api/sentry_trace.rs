use uuid::Uuid;

/// "sentry trace" data from the <meta> tags
#[derive(Debug, Clone)]
pub struct SentryTrace(pub (crate) String);

impl SentryTrace {

  /// Generate the format of trace sent in the HTTP request headers
  pub fn to_http_request_header(&self) -> String {
    // Python reference:
    //   f'{self.sentry_trace}-{str(uuid4()).replace("-", "")[:16]}-0',
    // Inner bit:
    //   str(uuid4()).replace("-", "")[:16]
    let sentry_start = &self.0;
    let sentry_uuid = Uuid::new_v4().to_string();
    let sentry_inner = sentry_uuid.replace("-", "")[..16].to_string();

    format!("{sentry_start}-{sentry_inner}-0")
  }
}

#[cfg(test)]
mod tests {
  use crate::datatypes::api::sentry_trace::SentryTrace;

  #[test]
  fn test_real_trace() {
    let short = SentryTrace("d6d7c55e4a489c0dabaed06e5c7b257b".to_string());
    let header = short.to_http_request_header();
    assert_eq!(header.len(), 51);
  }

  #[test]
  fn test_invalid_trace() {
    let short = SentryTrace("".to_string());
    let header = short.to_http_request_header();
    assert_eq!(header.len(), 19); // header is invalid, we're just making sure Rust doesn't panic
  }
}
