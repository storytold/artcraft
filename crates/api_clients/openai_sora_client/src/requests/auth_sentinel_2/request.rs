use uuid_utils::uuid::generate_random_uuid;
use serde_derive::Serialize;

// TODO: Support more of these.
const SENTINEL_FLOW: &str = "sora_init";
const SENTINEL_FLOW_OLD: &str = "sora_create_task";

#[derive(Debug, Serialize)]
pub struct SentinelRequest {
  /// "Proof of Work" token
  #[serde(rename = "p")]
  pub (crate) p: String,

  /// Random UUID
  #[serde(rename = "id")]
  pub (crate) id: String,

  /// Frontend UI flow
  #[serde(rename = "flow")]
  pub (crate) flow: String,
}

impl SentinelRequest {
  pub fn new(pow_token: String) -> Self {
    let id = generate_random_uuid();
    Self {
      p: pow_token, 
      id, 
      flow: SENTINEL_FLOW.to_string() 
    }
  }
}
