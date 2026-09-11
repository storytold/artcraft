use midjourney_client::credentials::midjourney_user_id::MidjourneyUserId;
use midjourney_client::recipes::get_user_info::GetUserInfoResponse;
use crate::services::midjourney::state::serializable_midjourney_state::SerializableMidjourneyUserInfo;

#[derive(Clone)]
pub struct MidjourneyUserInfo {
  pub user_id: Option<MidjourneyUserId>,
  pub email: Option<String>,
  pub websocket_token: Option<String>,
}

impl MidjourneyUserInfo {
  pub fn to_serializable(&self) -> SerializableMidjourneyUserInfo {
    SerializableMidjourneyUserInfo {
      user_id: self.user_id
          .as_ref()
          .map(|id| id.to_string()),
      email: self.email.clone(),
      websocket_token: self.websocket_token.clone(),
    }
  }
  
  pub fn from_api_response(response: GetUserInfoResponse) -> Self {
    Self {
      user_id: response.user_id,
      email: response.email,
      websocket_token: response.websocket_token,
    }
  }
}
