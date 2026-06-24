use chrono::{DateTime, Utc};
use enums::common::payments_namespace::PaymentsNamespace;
use enums::common::visibility::Visibility;
use tokens::tokens::users::UserToken;

use crate::http_server::user_lookup::user_session::session_utils::lookup::user_session_feature_flags::UserSessionFeatureFlags;

#[derive(Clone, Default)]
pub struct UserSessionExtended {
    pub user_token: String,
    pub user_token_typed: UserToken,
    pub user: UserSessionUserDetails,
    pub premium: UserSessionPremiumPlanInfo,
    pub preferences: UserSessionPreferences,
    pub role: UserSessionRoleAndPermissions,
    pub feature_flags: UserSessionFeatureFlags,
}

#[derive(Clone, Default)]
pub struct UserSessionUserDetails {
    pub username: String,
    pub display_name: String,
    pub email_address: String,
    pub email_confirmed: bool,
    pub email_gravatar_hash: String,
}

#[derive(Clone, Default)]
pub struct UserSessionPremiumPlanInfo {
    pub maybe_stripe_customer_id: Option<String>,
    pub maybe_loyalty_program_key: Option<String>,
    pub subscription_plans: Vec<UserSessionSubscriptionPlan>,
}

#[derive(Clone)]
pub struct UserSessionSubscriptionPlan {
    /// The category or namespace for the product, eg "artcraft" or "fakeyou"
    pub subscription_namespace: PaymentsNamespace,

    /// The key for the product in our internal system (not a stripe id),
    /// eg. "artcraft_basic", "fakeyou_en_pro", or "stream_package_plus".
    /// These depend on the namespace, so they're stringly-encoded.
    pub subscription_product_slug: String,

    /// This is the authoritative timestamp for when the subscription expires.
    /// If a session is cached, there may be *expired* premium plans in this list.
    /// The caller must check that the date of each plan is after the current time.
    pub subscription_expires_at: DateTime<Utc>,
}

impl Default for UserSessionSubscriptionPlan {
    fn default() -> Self {
        Self {
            subscription_expires_at: chrono::MIN_DATETIME,
            ..Default::default()
        }
    }
}

#[derive(Clone, Default)]
pub struct UserSessionPreferences {
    pub disable_gravatar: bool,
    pub auto_play_audio_preference: Option<bool>,
    pub preferred_tts_result_visibility: Visibility,
    pub preferred_w2l_result_visibility: Visibility,
    pub auto_play_video_preference: Option<bool>,
}

#[derive(Clone, Default)]
pub struct UserSessionRoleAndPermissions {
    // ===== ROLE ===== //
    pub user_role_slug: String,
    pub is_banned: bool,

    // ===== FEATURE FLAGS / ROLLOUT ===== //
    // Whether the user can access Storyteller Studio features.
    pub can_access_studio: bool,

    // ===== PERMISSIONS FLAGS ===== //
    // Usage
    pub can_use_tts: bool,
    pub can_use_w2l: bool,
    pub can_delete_own_tts_results: bool,
    pub can_delete_own_w2l_results: bool,
    pub can_delete_own_account: bool,

    // Contribution
    pub can_upload_tts_models: bool,
    pub can_upload_w2l_templates: bool,
    pub can_delete_own_tts_models: bool,
    pub can_delete_own_w2l_templates: bool,

    // Moderation
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

