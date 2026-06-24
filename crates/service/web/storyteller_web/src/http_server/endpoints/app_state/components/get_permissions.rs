use crate::http_server::user_lookup::user_session::session_utils::lookup::user_session_extended::{UserSessionExtended, UserSessionRoleAndPermissions};
use enums::by_table::users::user_feature_flag::UserFeatureFlag;
use std::collections::BTreeSet;
use utoipa::ToSchema;

#[derive(Serialize, ToSchema, Clone)]
pub struct AppStatePermissions {
  /// Moderation flag.
  /// Use this to determine if an account can act on other accounts.
  pub is_moderator: bool,

  /// Collection of feature / rollout flags
  /// This is the proper place to detect if a user has access to some rollout (non-paywall) feature.
  /// NB: The BTreeSet maintains order so React doesn't introduce re-render state bugs when order changes
  pub feature_flags: BTreeSet<UserFeatureFlag>,

  /// Legacy feature flags. Do not use.
  #[deprecated(note = "DO NOT USE. This is only to port old logic.")]
  pub legacy_permission_flags: AppStateLegacyPermissionFlags,
}

#[derive(Serialize, ToSchema, Clone)]
pub struct AppStateLegacyPermissionFlags {
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

pub fn get_permissions(
  maybe_user: Option<&UserSessionExtended>
) -> AppStatePermissions {
  match maybe_user {
    None => LOGGED_OUT_PERMISSIONS.clone(),
    Some(user) => AppStatePermissions {
      is_moderator: is_moderator(&user.role),
      feature_flags: user.feature_flags.clone_flags(),
      legacy_permission_flags: AppStateLegacyPermissionFlags {
        can_use_tts: user.role.can_use_tts,
        can_use_w2l: user.role.can_use_w2l,
        can_delete_own_tts_results: user.role.can_delete_own_tts_results,
        can_delete_own_w2l_results: user.role.can_delete_own_w2l_results,
        can_delete_own_account: user.role.can_delete_own_account,
        can_upload_tts_models: user.role.can_upload_tts_models,
        can_upload_w2l_templates: user.role.can_upload_w2l_templates,
        can_delete_own_tts_models: user.role.can_delete_own_tts_models,
        can_delete_own_w2l_templates: user.role.can_delete_own_w2l_templates,
        can_approve_w2l_templates: user.role.can_approve_w2l_templates,
        can_edit_other_users_profiles: user.role.can_edit_other_users_profiles,
        can_edit_other_users_tts_models: user.role.can_edit_other_users_tts_models,
        can_edit_other_users_w2l_templates: user.role.can_edit_other_users_w2l_templates,
        can_delete_other_users_tts_models: user.role.can_delete_other_users_tts_models,
        can_delete_other_users_tts_results: user.role.can_delete_other_users_tts_results,
        can_delete_other_users_w2l_templates: user.role.can_delete_other_users_w2l_templates,
        can_delete_other_users_w2l_results: user.role.can_delete_other_users_w2l_results,
        can_ban_users: user.role.can_ban_users,
        can_delete_users: user.role.can_delete_users,
      },
    },
  }
}

const LOGGED_OUT_PERMISSIONS : AppStatePermissions  = AppStatePermissions {
  is_moderator: false,
  feature_flags: BTreeSet::new(),
  legacy_permission_flags: AppStateLegacyPermissionFlags {
    can_use_tts: false,
    can_use_w2l: false,
    can_delete_own_tts_results: false,
    can_delete_own_w2l_results: false,
    can_delete_own_account: false,
    can_upload_tts_models: false,
    can_upload_w2l_templates: false,
    can_delete_own_tts_models: false,
    can_delete_own_w2l_templates: false,
    can_approve_w2l_templates: false,
    can_edit_other_users_profiles: false,
    can_edit_other_users_tts_models: false,
    can_edit_other_users_w2l_templates: false,
    can_delete_other_users_tts_models: false,
    can_delete_other_users_tts_results: false,
    can_delete_other_users_w2l_templates: false,
    can_delete_other_users_w2l_results: false,
    can_ban_users: false,
    can_delete_users: false,
  },
};

fn is_moderator(role: &UserSessionRoleAndPermissions) -> bool {
  match role.user_role_slug.as_str() {
    "admin" => true,
    "administrator" => true,
    "mod" => true,
    "moderator" => true,
    _ => false,
  }
}
