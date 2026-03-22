use anyhow::anyhow;
use chrono::{DateTime, Utc};
use log::warn;
use sqlx::{MySql, MySqlPool};
use sqlx::pool::PoolConnection;

use enums_db::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::users::UserToken;

use crate::helpers::boolean_converters::i8_to_bool;

// TODO: Make non-`Serialize` and make the HTTP endpoints do the work
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct UserProfileResult {
  pub user_token: UserToken,
  pub username: String,
  pub display_name: String,
  pub email_gravatar_hash: String,
  pub profile_markdown: String,
  pub profile_rendered_html: String,
  pub user_role_slug: String,
  pub disable_gravatar: bool,

  // NB: Legacy top-level moderator field
  #[deprecated = "use moderator fields instead"]
  pub is_banned: bool,

  // Social
  pub discord_username: Option<String>,
  pub twitch_username: Option<String>,
  pub twitter_username: Option<String>,
  pub patreon_username: Option<String>,
  pub github_username: Option<String>,
  pub cashapp_username: Option<String>,
  pub website_url: Option<String>,

  // Preferences; NB: included for get_profile_handler legacy reasons
  pub preferred_tts_result_visibility: Visibility,
  pub preferred_w2l_result_visibility: Visibility,

  pub created_at: DateTime<Utc>,

  // NB: Moderator fields must be cleared by HTTP handlers for non-mods
  #[serde(skip_serializing_if = "Option::is_none")]
  pub maybe_moderator_fields: Option<UserProfileModeratorFields>,
}

// TODO: Make non-`Serialize` and make the HTTP endpoints do the work
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct UserProfileModeratorFields {
  pub is_banned: bool,
  pub email_address: String,
  pub maybe_mod_comments: Option<String>,
  pub maybe_mod_user_token: Option<String>,
  pub maybe_feature_flags: Option<String>,
}

struct RawUserProfileRecord {
  user_token: UserToken,
  email_address: String,
  username: String,
  email_gravatar_hash: String,
  display_name: String,
  profile_markdown: String,
  profile_rendered_html: String,
  user_role_slug: String,
  disable_gravatar: i8,
  discord_username: Option<String>,
  twitch_username: Option<String>,
  twitter_username: Option<String>,
  patreon_username: Option<String>,
  github_username: Option<String>,
  cashapp_username: Option<String>,
  website_url: Option<String>,
  created_at: DateTime<Utc>,

  // Preferences; NB: included for get_profile_handler legacy reasons
  preferred_tts_result_visibility: Visibility,
  preferred_w2l_result_visibility: Visibility,

  // Mod fields
  is_banned: i8,
  maybe_feature_flags: Option<String>,
  maybe_mod_comments: Option<String>,
  maybe_mod_user_token: Option<String>,
}

//#[deprecated = "Use the PoolConnection method"]
pub async fn get_user_profile_by_username(
  username: &str,
  mysql_pool: &MySqlPool
) -> AnyhowResult<Option<UserProfileResult>> {
  let mut connection = mysql_pool.acquire().await?;
  get_user_profile_by_username_from_connection(username, &mut connection).await
}

pub async fn get_user_profile_by_username_from_connection<'a>(
  username: &str,
  connection: &'a mut PoolConnection<MySql>
) -> AnyhowResult<Option<UserProfileResult>> {
  let maybe_profile_record = sqlx::query_as!(
      RawUserProfileRecord,
        r#"
SELECT
    users.token as `user_token: tokens::tokens::users::UserToken`,
    email_address,
    username,
    display_name,
    email_gravatar_hash,
    profile_markdown,
    profile_rendered_html,
    user_role_slug,
    disable_gravatar,
    preferred_tts_result_visibility as `preferred_tts_result_visibility: enums_db::common::visibility::Visibility`,
    preferred_w2l_result_visibility as `preferred_w2l_result_visibility: enums_db::common::visibility::Visibility`,
    discord_username,
    twitch_username,
    twitter_username,
    patreon_username,
    github_username,
    cashapp_username,
    website_url,
    is_banned,
    maybe_mod_comments,
    maybe_mod_user_token,
    maybe_feature_flags,
    created_at
FROM users
WHERE
    users.username = ?
    AND users.user_deleted_at IS NULL
    AND users.mod_deleted_at IS NULL
        "#,
        username,
    )
      .fetch_one(&mut **connection)
      .await;

  let profile_record : RawUserProfileRecord = match maybe_profile_record {
    Ok(profile_record) => profile_record,
    Err(err) => {
      return match err {
        sqlx::Error::RowNotFound => {
          Ok(None)
        },
        _ => {
          warn!("User profile query error: {:?}", err);
          Err(anyhow!("query error"))
        }
      }
    }
  };

  let profile_for_response = UserProfileResult {
    user_token: profile_record.user_token,
    username: profile_record.username,
    display_name: profile_record.display_name,
    email_gravatar_hash: profile_record.email_gravatar_hash,
    profile_markdown: profile_record.profile_markdown,
    profile_rendered_html: profile_record.profile_rendered_html,
    user_role_slug: profile_record.user_role_slug,
    is_banned: i8_to_bool(profile_record.is_banned),
    disable_gravatar: i8_to_bool(profile_record.disable_gravatar),
    discord_username: profile_record.discord_username,
    twitch_username: profile_record.twitch_username,
    twitter_username: profile_record.twitter_username,
    patreon_username: profile_record.patreon_username,
    github_username: profile_record.github_username,
    cashapp_username: profile_record.cashapp_username,
    website_url: profile_record.website_url,
    preferred_tts_result_visibility: profile_record.preferred_tts_result_visibility,
    preferred_w2l_result_visibility: profile_record.preferred_w2l_result_visibility,
    created_at: profile_record.created_at,
    maybe_moderator_fields: Some(UserProfileModeratorFields {
      is_banned: i8_to_bool(profile_record.is_banned),
      email_address: profile_record.email_address,
      maybe_mod_comments: profile_record.maybe_mod_comments,
      maybe_mod_user_token: profile_record.maybe_mod_user_token,
      maybe_feature_flags: profile_record.maybe_feature_flags,
    })
  };

  Ok(Some(profile_for_response))
}
