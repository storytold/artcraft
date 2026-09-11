use crate::core::state::data_dir::app_data_root::AppDataRoot;
use cookie_store::serialized_cookie_store::SerializableCookieStore;
use serde_derive::{Deserialize, Serialize};
use std::fs::read_to_string;

/// History
///  v1 - initial
pub (super) const SERIALIZABLE_GROK_STATE_VERSION: u32 = 1;

/// We only need to serialize Grok cookies.
/// Most of the other state (verification_token, etc.) can be pulled at runtime.
/// We will cache the `user_id` and `user_email`.
#[derive(Serialize, Deserialize)]
pub (super) struct GrokSerializableState {
  pub (super) version: u32,
  
  #[serde(skip_serializing_if = "Option::is_none")]
  pub (super) user_cookies: Option<SerializableCookieStore>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub (super) user_id: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub (super) user_email: Option<String>,
}

impl GrokSerializableState {
  pub fn read_from_disk(root: &AppDataRoot) -> anyhow::Result<Option<GrokSerializableState>> {
    let state_path = root.credentials_dir().get_grok_state_path();

    if !state_path.exists() {
      return Ok(None);
    }

    let contents = read_to_string(&state_path)?
        .trim()
        .to_string();

    let state: GrokSerializableState = serde_json::from_str(&contents)?;

    Ok(Some(state))
  }
}
