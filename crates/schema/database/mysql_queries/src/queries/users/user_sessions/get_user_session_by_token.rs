// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]

use anyhow::anyhow;
use log::warn;
use sqlx::{Executor, MySql};
use sqlx::pool::PoolConnection;

use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::users::UserToken;

use crate::helpers::boolean_converters::{i8_to_bool, nullable_i8_to_bool_default_false, nullable_i8_to_optional_bool};

const ADMIN_ROLE_SLUG: &str = "admin";

#[derive(Clone, Serialize, Deserialize)]
pub struct SessionUserRecord {
  pub user_token: UserToken,
  pub username: String,
  pub display_name: String,

  pub email_address: String,
  pub email_gravatar_hash: String,
  
  // ===== ONBOARDING STATE ===== //

  pub email_confirmed: bool,
  pub email_confirmed_by_google: bool,
  pub email_is_synthetic: bool,
  pub is_without_password: bool,
  pub username_is_not_customized: bool,

  // ===== PREMIUM FEATURES ===== //

  pub maybe_stripe_customer_id: Option<String>,
  pub maybe_loyalty_program_key: Option<String>,

  // ===== PREFERENCES ===== //

  pub disable_gravatar: bool,
  pub auto_play_audio_preference: Option<bool>,
  pub preferred_tts_result_visibility: Visibility,
  pub preferred_w2l_result_visibility: Visibility,
  pub auto_play_video_preference: Option<bool>,

  // ===== FEATURE FLAGS ===== //

  // Optional comma-separated list of parseable `UserFeatureFlag` enum features
  pub maybe_feature_flags: Option<String>,

  pub can_access_studio: bool,

  // ===== ROLE ===== //

  pub user_role_slug: String,
  pub is_banned: bool,

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

impl SessionUserRecord {
  // TODO(bt, 2022-12-20): Convert all users of the bare record to using `UserToken`, then get rid of this method.
  pub fn get_strongly_typed_user_token(&self) -> UserToken {
    self.user_token.clone()
  }

  pub fn is_mod(&self) -> bool {
    self.can_ban_users || self.user_role_slug == ADMIN_ROLE_SLUG
  }
}

pub async fn get_user_session_by_token_pooled_connection(
  mysql_connection: &mut PoolConnection<MySql>,
  session_token: &str,
) -> AnyhowResult<Option<SessionUserRecord>> {
  get_user_session_by_token(&mut **mysql_connection, session_token).await
}


pub async fn get_user_session_by_token<'e, 'c : 'e, E>(
  mysql_executor: E,
  session_token: &str,
) -> AnyhowResult<Option<SessionUserRecord>>
  where E: 'e + Executor<'c, Database = MySql>
{
  // NB: Lookup failure is Err(RowNotFound).
  let maybe_user_record = sqlx::query_as!(
      SessionUserRawDbRecord,
        r#"
SELECT
    users.token as user_token,
    users.username,
    users.display_name,

    users.email_address,
    users.email_gravatar_hash,
    
    users.email_confirmed,
    users.email_confirmed_by_google,
    users.email_is_synthetic,
    users.is_without_password,
    users.username_is_not_customized,

    users.maybe_stripe_customer_id,
    users.maybe_loyalty_program_key,

    users.disable_gravatar,
    users.auto_play_audio_preference,
    users.auto_play_video_preference,
    users.preferred_tts_result_visibility as `preferred_tts_result_visibility: enums::common::visibility::Visibility`,
    users.preferred_w2l_result_visibility as `preferred_w2l_result_visibility: enums::common::visibility::Visibility`,

    users.user_role_slug,
    users.is_banned,

    users.can_access_studio,
    users.maybe_feature_flags,

    user_roles.can_use_tts,
    user_roles.can_use_w2l,
    user_roles.can_delete_own_tts_results,
    user_roles.can_delete_own_w2l_results,
    user_roles.can_delete_own_account,

    user_roles.can_upload_tts_models,
    user_roles.can_upload_w2l_templates,
    user_roles.can_delete_own_tts_models,
    user_roles.can_delete_own_w2l_templates,

    user_roles.can_approve_w2l_templates,
    user_roles.can_edit_other_users_profiles,
    user_roles.can_edit_other_users_tts_models,
    user_roles.can_edit_other_users_w2l_templates,
    user_roles.can_delete_other_users_tts_models,
    user_roles.can_delete_other_users_tts_results,
    user_roles.can_delete_other_users_w2l_templates,
    user_roles.can_delete_other_users_w2l_results,
    user_roles.can_ban_users,
    user_roles.can_delete_users

FROM users
LEFT OUTER JOIN user_sessions
    ON users.token = user_sessions.user_token
LEFT OUTER JOIN user_roles
    ON users.user_role_slug = user_roles.slug
WHERE user_sessions.token = ?
    AND user_sessions.deleted_at IS NULL
    AND users.user_deleted_at IS NULL
    AND users.mod_deleted_at IS NULL
        "#,
        session_token,
    )
      .fetch_one(mysql_executor)
      .await; // TODO: This will return error if it doesn't exist

  match maybe_user_record {
    Ok(raw_user_record) => {
      let result_user_record = SessionUserRecord {
        user_token: UserToken::new(raw_user_record.user_token),
        username: raw_user_record.username,
        display_name: raw_user_record.display_name,
        email_address: raw_user_record.email_address,
        email_gravatar_hash: raw_user_record.email_gravatar_hash,
        // Onboarding
        email_confirmed: i8_to_bool(raw_user_record.email_confirmed),
        email_confirmed_by_google: i8_to_bool(raw_user_record.email_confirmed_by_google),
        email_is_synthetic: i8_to_bool(raw_user_record.email_is_synthetic),
        is_without_password: i8_to_bool(raw_user_record.is_without_password),
        username_is_not_customized: i8_to_bool(raw_user_record.username_is_not_customized),
        // Premium features
        maybe_stripe_customer_id: raw_user_record.maybe_stripe_customer_id,
        maybe_loyalty_program_key: raw_user_record.maybe_loyalty_program_key,
        // Preference
        disable_gravatar: i8_to_bool(raw_user_record.disable_gravatar),
        auto_play_audio_preference: nullable_i8_to_optional_bool(raw_user_record.auto_play_audio_preference),
        auto_play_video_preference: nullable_i8_to_optional_bool(raw_user_record.auto_play_video_preference),
        user_role_slug: raw_user_record.user_role_slug,
        preferred_tts_result_visibility: raw_user_record.preferred_tts_result_visibility,
        preferred_w2l_result_visibility: raw_user_record.preferred_w2l_result_visibility,

        is_banned: i8_to_bool(raw_user_record.is_banned),

        can_access_studio: i8_to_bool(raw_user_record.can_access_studio),
        maybe_feature_flags: raw_user_record.maybe_feature_flags,

        // Usage
        can_use_tts: nullable_i8_to_bool_default_false(raw_user_record.can_use_tts),
        can_use_w2l: nullable_i8_to_bool_default_false(raw_user_record.can_use_w2l),
        can_delete_own_tts_results: nullable_i8_to_bool_default_false(raw_user_record.can_delete_own_tts_results),
        can_delete_own_w2l_results: nullable_i8_to_bool_default_false(raw_user_record.can_delete_own_w2l_results),
        can_delete_own_account: nullable_i8_to_bool_default_false(raw_user_record.can_delete_own_account),
        // Contribution
        can_upload_tts_models: nullable_i8_to_bool_default_false(raw_user_record.can_upload_tts_models),
        can_upload_w2l_templates: nullable_i8_to_bool_default_false(raw_user_record.can_upload_w2l_templates),
        can_delete_own_tts_models: nullable_i8_to_bool_default_false(raw_user_record.can_delete_own_tts_models),
        can_delete_own_w2l_templates: nullable_i8_to_bool_default_false(raw_user_record.can_delete_own_w2l_templates),
        // Moderation
        can_approve_w2l_templates: nullable_i8_to_bool_default_false(raw_user_record.can_approve_w2l_templates),
        can_edit_other_users_profiles: nullable_i8_to_bool_default_false(raw_user_record.can_edit_other_users_profiles),
        can_edit_other_users_tts_models: nullable_i8_to_bool_default_false(raw_user_record.can_edit_other_users_tts_models),
        can_edit_other_users_w2l_templates: nullable_i8_to_bool_default_false(raw_user_record.can_edit_other_users_w2l_templates),
        can_delete_other_users_tts_models: nullable_i8_to_bool_default_false(raw_user_record.can_delete_other_users_tts_models),
        can_delete_other_users_tts_results: nullable_i8_to_bool_default_false(raw_user_record.can_delete_other_users_tts_results),
        can_delete_other_users_w2l_templates: nullable_i8_to_bool_default_false(raw_user_record.can_delete_other_users_w2l_templates),
        can_delete_other_users_w2l_results: nullable_i8_to_bool_default_false(raw_user_record.can_delete_other_users_w2l_results),
        can_ban_users: nullable_i8_to_bool_default_false(raw_user_record.can_ban_users),
        can_delete_users: nullable_i8_to_bool_default_false(raw_user_record.can_delete_users) ,
      };

      Ok(Some(result_user_record))
    },
    Err(err) => {
      match err {
        sqlx::Error::RowNotFound => {
          warn!("Valid cookie; invalid session: {}", session_token);
          Ok(None)
        },
        _ => {
          warn!("Session query error: {:?}", err);
          Err(anyhow!("session query error: {:?}", err))
        }
      }
    }
  }

}

struct SessionUserRawDbRecord {
  user_token: String,
  username: String,
  display_name: String,

  email_address: String,
  email_gravatar_hash: String,

  email_confirmed: i8,
  email_confirmed_by_google: i8,
  email_is_synthetic: i8,
  is_without_password: i8,
  username_is_not_customized: i8,

  maybe_stripe_customer_id: Option<String>,
  maybe_loyalty_program_key: Option<String>,

  disable_gravatar: i8,
  auto_play_audio_preference: Option<i8>,
  auto_play_video_preference: Option<i8>,
  preferred_tts_result_visibility: Visibility,
  preferred_w2l_result_visibility: Visibility,

  user_role_slug: String,
  is_banned: i8,

  // Feature / Rollout Flags
  can_access_studio: i8,

  maybe_feature_flags: Option<String>,

  // NB: These are `Option` due to the JOIN not being compile-time assured.
  // Usage
  can_use_tts: Option<i8>,
  can_use_w2l: Option<i8>,
  can_delete_own_tts_results: Option<i8>,
  can_delete_own_w2l_results: Option<i8>,
  can_delete_own_account: Option<i8>,

  // Contribution
  can_upload_tts_models: Option<i8>,
  can_upload_w2l_templates: Option<i8>,
  can_delete_own_tts_models: Option<i8>,
  can_delete_own_w2l_templates: Option<i8>,

  // Moderation
  can_approve_w2l_templates: Option<i8>,
  can_edit_other_users_profiles: Option<i8>,
  can_edit_other_users_tts_models: Option<i8>,
  can_edit_other_users_w2l_templates: Option<i8>,
  can_delete_other_users_tts_models: Option<i8>,
  can_delete_other_users_tts_results: Option<i8>,
  can_delete_other_users_w2l_templates: Option<i8>,
  can_delete_other_users_w2l_results: Option<i8>,
  can_ban_users: Option<i8>,
  can_delete_users: Option<i8>,
}
