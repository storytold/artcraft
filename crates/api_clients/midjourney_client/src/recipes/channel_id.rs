use crate::credentials::midjourney_user_id::MidjourneyUserId;

#[derive(Debug, Clone)]
pub enum ChannelId {
  /// Channel based on the user ID.
  /// This is what Midjourney uses by default.
  UserId(MidjourneyUserId),

  // Bare string ID
  Raw(String),
}

impl ChannelId {
  pub fn to_string(&self) -> String {
    match self {
      Self::UserId(user_id) => format!("singleplayer_{}", user_id.0),
      Self::Raw(id) => id.clone(),
    }
  }
}
