use crate::common::responses::user_details_light::UserDetailsLight;
use enums::by_table::users::user_feature_flag::UserFeatureFlag;
use serde_derive::Serialize;
use std::collections::BTreeSet;
use tokens::tokens::users::UserToken;
use utoipa::ToSchema;

#[derive(Serialize, Copy, Clone, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum FakeYouPlan {
  Free,
  Basic,
  Standard,
  Pro,
}

#[derive(Serialize, Copy, Clone, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum StorytellerStreamPlan {
  Free,
  Basic,
  Standard,
  Pro,
}

#[derive(Serialize, ToSchema)]
pub struct SessionUserInfo {
  pub core_info: UserDetailsLight,

  pub user_token: UserToken,
  pub username: String,
  pub display_name: String,
  pub email_gravatar_hash: String,
  
  pub onboarding: SessionOnboardingState,

  // TODO(bt,2024-03-30): Remove legacy feature flag
  #[deprecated(note = "DO NOT USE. Use `maybe_feature_flags` instead! The flag you're looking for is `studio`.")]
  pub can_access_studio: bool,

  /// Collection of feature / rollout flags
  /// This is the proper place to detect if a user has access to some rollout (non-paywall) feature.
  /// NB: The BTreeSet maintains order so React doesn't introduce re-render state bugs when order changes
  pub maybe_feature_flags: BTreeSet<UserFeatureFlag>,

  // Premium plans:
  #[deprecated(note = "DO NOT USE. This was never used and is 100% meaningless.")]
  pub fakeyou_plan: FakeYouPlan,

  #[deprecated(note = "DO NOT USE. This was never used and is 100% meaningless.")]
  pub storyteller_stream_plan: StorytellerStreamPlan,

  // Usage permissions:
  pub can_use_tts: bool,
  pub can_use_w2l: bool,
  pub can_delete_own_tts_results: bool,
  pub can_delete_own_w2l_results: bool,
  pub can_delete_own_account: bool,

  // Contribution permissions:
  pub can_upload_tts_models: bool,
  pub can_upload_w2l_templates: bool,
  pub can_delete_own_tts_models: bool,
  pub can_delete_own_w2l_templates: bool,

  // Moderation permissions:
  pub can_approve_w2l_templates: bool,
  pub can_edit_other_users_profiles: bool,
  pub can_edit_other_users_tts_models: bool,
  pub can_edit_other_users_w2l_templates: bool,
  pub can_delete_other_users_tts_models: bool,
  pub can_delete_other_users_tts_results: bool,
  pub can_delete_other_users_w2l_templates: bool,
  pub can_delete_other_users_w2l_results: bool,
  pub can_ban_users: bool,
  pub can_delete_users: bool,
}

#[derive(Serialize, ToSchema)]
pub struct SessionOnboardingState {
  /// If true, the user hasn't set their email.
  pub email_not_set: bool,
  
  /// If true, the user hasn't confirmed their email.
  pub email_not_confirmed: bool,

  /// If true, the user hasn't set their password.
  pub password_not_set: bool,
  
  /// If true, the user hasn't set their username (the username they have is random).
  pub username_not_customized: bool,
}

#[derive(Serialize, ToSchema)]
pub struct SessionInfoSuccessResponse {
  pub success: bool,
  pub logged_in: bool,
  pub user: Option<SessionUserInfo>,
}
