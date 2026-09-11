use chrono::{DateTime, Utc};
use serde_derive::Deserialize;

#[derive(Debug, Deserialize)]
pub (crate) struct SentinelResponse {
  pub (crate) token: Option<String>,
  pub (crate) turnstile: Option<SentinelTurnstile>,

  // NB: appears to be integer seconds.
  // Not required for the sentinel token flow, but helps with renew.
  pub (crate) expire_after: Option<u32>,

  // NB: appears to be Unix timestamp in seconds.
  // Not required for the sentinel token flow, but helps with renew.
  pub (crate) expire_at: Option<u64>,
}

#[derive(Debug, Deserialize)]
pub (crate) struct SentinelTurnstile {
  pub (crate) dx: Option<String>,
}
