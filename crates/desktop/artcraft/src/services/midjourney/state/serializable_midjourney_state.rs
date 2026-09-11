use crate::services::midjourney::state::midjourney_user_info::MidjourneyUserInfo;
use cookie_store::serialized_cookie_store::SerializableCookieStore;
use midjourney_client::credentials::midjourney_user_id::MidjourneyUserId;
use serde_derive::{Deserialize, Serialize};

pub (super) const SERIALIZABLE_MIDJOURNEY_STATE_VERSION: u32 = 1;

#[derive(Serialize, Deserialize)]
pub (super) struct SerializableMidjourneyState {
  pub (super) version: u32,
  
  #[serde(skip_serializing_if = "Option::is_none")]
  pub (super) user_cookies: Option<SerializableCookieStore>,
  
  #[serde(skip_serializing_if = "Option::is_none")]
  pub (super) user_info: Option<SerializableMidjourneyUserInfo>,
}

#[derive(Serialize, Deserialize)]
pub (super) struct SerializableMidjourneyUserInfo {
  #[serde(skip_serializing_if = "Option::is_none")]
  pub (super) user_id: Option<String>,
  
  #[serde(skip_serializing_if = "Option::is_none")]
  pub (super) email: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub (super) websocket_token: Option<String>,
}

impl SerializableMidjourneyUserInfo {
  pub fn to_user_info(&self) -> MidjourneyUserInfo {
    MidjourneyUserInfo {
      user_id: self.user_id
          .as_deref()
          .map(|id| MidjourneyUserId::from_str(id)),
      email: self.email.clone(),
      websocket_token: self.websocket_token.clone(),
    }
  }
}
