/// A request observation captured by the HTTP middleware. Aggregated into
/// two metrics per `(route, method, status_code)` group: a distribution
/// over `duration_ms` values, and a count.
#[derive(Clone, Debug)]
pub struct RequestSample {
  /// Low-cardinality route pattern from actix (`req.match_pattern()`), e.g.
  /// `/v1/users/{user_token}/profile`. Falls back to `"unmatched"` when
  /// the request hit no route.
  pub route: String,
  pub method: String,
  pub status_code: u16,
  pub duration_ms: f64,
  pub timestamp_secs: i64,
}

/// A single hit on a domain counter. Aggregated into a `count` metric per
/// `(metric, tags_set)` group.
#[derive(Clone, Debug)]
pub struct CounterSample {
  pub metric: String,
  pub tags: Vec<String>,
  pub timestamp_secs: i64,
}

/// A single observation of a domain value. Aggregated into a `distribution`
/// metric per `(metric, tags_set)` group so Datadog can compute percentiles
/// server-side.
#[derive(Clone, Debug)]
pub struct ObservationSample {
  pub metric: String,
  pub value: f64,
  pub tags: Vec<String>,
  pub timestamp_secs: i64,
}

/// Wire-level sample union pushed onto the queue.
#[derive(Clone, Debug)]
pub enum Sample {
  Request(RequestSample),
  Counter(CounterSample),
  Observation(ObservationSample),
}
