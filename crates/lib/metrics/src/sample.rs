#[derive(Clone, Debug)]
pub struct RequestSample {
  /// Low-cardinality route pattern from actix (`req.match_pattern()`), e.g.
  /// `/v1/users/{user_token}/profile`. Falls back to `"unmatched"` when
  /// the request hit no route.
  pub route: String,
  /// HTTP method as a static-style string, e.g. `"GET"`.
  pub method: String,
  pub status_code: u16,
  pub duration_ms: f64,
  /// Unix epoch seconds at the moment the sample was recorded.
  pub timestamp_secs: i64,
}
