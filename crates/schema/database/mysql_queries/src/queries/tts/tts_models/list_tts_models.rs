use anyhow::anyhow;
use chrono::{DateTime, Utc};
use log::{info, warn};
use sqlx::{Error, MySql, MySqlPool};
use sqlx::pool::PoolConnection;

use enums_db::common::visibility::Visibility;
use errors::AnyhowResult;

use crate::helpers::boolean_converters::i8_to_bool;

// FIXME: This is the old style of query scoping and shouldn't be copied.

// TODO/FIXME : This struct is returned publicly in some endpoints!
#[derive(Serialize, Clone)]
pub struct TtsModelRecordForList {
  pub model_token: String,
  pub tts_model_type: String,

  pub title: String,

  pub ietf_language_tag: String,
  pub ietf_primary_language_subtag: String,

  pub creator_user_token: String,
  pub creator_username: String,
  pub creator_display_name: String,
  pub creator_gravatar_hash: String,

  pub is_locked_from_use: bool,

  pub is_front_page_featured: bool,
  pub is_twitch_featured: bool,

  pub maybe_suggested_unique_bot_command: Option<String>,

  pub user_ratings_positive_count: u32,
  pub user_ratings_negative_count: u32,
  pub user_ratings_total_count: u32, // NB: Does not include "neutral" ratings.

  pub creator_set_visibility: Visibility,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

// FIXME: This is the old style of query scoping and shouldn't be copied.

pub async fn list_tts_models(
  mysql_pool: &MySqlPool,
  scope_creator_username: Option<&str>,
  require_mod_approved: bool
) -> AnyhowResult<Vec<TtsModelRecordForList>> {
  let mut connection = mysql_pool.acquire().await?;
  list_tts_models_with_connection(&mut connection, scope_creator_username, require_mod_approved).await
}

pub async fn list_tts_models_with_connection(
  mysql_connection: &mut PoolConnection<MySql>,
  scope_creator_username: Option<&str>,
  require_mod_approved: bool
) -> AnyhowResult<Vec<TtsModelRecordForList>> {

  let maybe_models = match scope_creator_username {
    Some(username) => {
      list_tts_models_creator_scoped(mysql_connection, username, require_mod_approved)
        .await
    },
    None => {
      list_tts_models_for_all_creators(mysql_connection, require_mod_approved)
        .await
    },
  };

  let models : Vec<InternalRawTtsModelRecordForList> = match maybe_models {
    Ok(models) => models,
    Err(err) => {
      return match err {
        Error::RowNotFound => {
          Ok(Vec::new())
        },
        _ => {
          warn!("tts model list query error: {:?}", err);
          Err(anyhow!("tts model list query error"))
        }
      }
    }
  };

  Ok(models.into_iter()
    .map(|model| {
      TtsModelRecordForList {
        model_token: model.model_token,
        tts_model_type: model.tts_model_type,
        creator_user_token: model.creator_user_token,
        creator_username: model.creator_username,
        creator_display_name: model.creator_display_name,
        creator_gravatar_hash: model.creator_gravatar_hash,
        title: model.title,
        ietf_language_tag: model.ietf_language_tag,
        ietf_primary_language_subtag: model.ietf_primary_language_subtag,
        is_locked_from_use: i8_to_bool(model.is_locked_from_use),
        is_front_page_featured: i8_to_bool(model.is_front_page_featured),
        is_twitch_featured: i8_to_bool(model.is_twitch_featured),
        maybe_suggested_unique_bot_command: model.maybe_suggested_unique_bot_command,
        user_ratings_positive_count: model.user_ratings_positive_count,
        user_ratings_negative_count: model.user_ratings_negative_count,
        user_ratings_total_count: model.user_ratings_total_count,
        creator_set_visibility: model.creator_set_visibility,
        created_at: model.created_at,
        updated_at: model.updated_at,
      }
    })
    .collect::<Vec<TtsModelRecordForList>>())
}

async fn list_tts_models_for_all_creators(
  mysql_connection: &mut PoolConnection<MySql>,
  allow_mod_disabled: bool
) -> Result<Vec<InternalRawTtsModelRecordForList>, Error> {
  // TODO: There has to be a better way.
  //  Sqlx doesn't like anything except string literals.
  let maybe_models = if !allow_mod_disabled {
    info!("listing tts models for everyone; mod-approved only");
    sqlx::query_as!(
      InternalRawTtsModelRecordForList,
        r#"
SELECT
    tts.token as model_token,
    tts.tts_model_type,
    tts.creator_user_token,
    users.username as creator_username,
    users.display_name as creator_display_name,
    users.email_gravatar_hash as creator_gravatar_hash,
    tts.title,
    tts.ietf_language_tag,
    tts.ietf_primary_language_subtag,
    tts.is_locked_from_use,
    tts.is_front_page_featured,
    tts.is_twitch_featured,
    tts.maybe_suggested_unique_bot_command,
    tts.user_ratings_positive_count,
    tts.user_ratings_negative_count,
    tts.user_ratings_total_count,
    tts.creator_set_visibility as `creator_set_visibility: enums_db::common::visibility::Visibility`,
    tts.created_at,
    tts.updated_at
FROM tts_models as tts
JOIN users
    ON users.token = tts.creator_user_token
WHERE
    tts.is_locked_from_use IS FALSE
    AND tts.user_deleted_at IS NULL
    AND tts.mod_deleted_at IS NULL
        "#)
      .fetch_all(&mut **mysql_connection)
      .await?
  } else {
    info!("listing tts models for everyone; all");
    sqlx::query_as!(
      InternalRawTtsModelRecordForList,
        r#"
SELECT
    tts.token as model_token,
    tts.tts_model_type,
    tts.creator_user_token,
    users.username as creator_username,
    users.display_name as creator_display_name,
    users.email_gravatar_hash as creator_gravatar_hash,
    tts.title,
    tts.ietf_language_tag,
    tts.ietf_primary_language_subtag,
    tts.is_locked_from_use,
    tts.is_front_page_featured,
    tts.is_twitch_featured,
    tts.maybe_suggested_unique_bot_command,
    tts.user_ratings_positive_count,
    tts.user_ratings_negative_count,
    tts.user_ratings_total_count,
    tts.creator_set_visibility as `creator_set_visibility: enums_db::common::visibility::Visibility`,
    tts.created_at,
    tts.updated_at
FROM tts_models as tts
JOIN users
    ON users.token = tts.creator_user_token
WHERE
    tts.user_deleted_at IS NULL
    AND tts.mod_deleted_at IS NULL
        "#)
      .fetch_all(&mut **mysql_connection)
      .await?
  };

  Ok(maybe_models)
}

async fn list_tts_models_creator_scoped(
  mysql_connection: &mut PoolConnection<MySql>,
  scope_creator_username: &str,
  allow_mod_disabled: bool
) -> Result<Vec<InternalRawTtsModelRecordForList>, Error> {
  // TODO: There has to be a better way.
  //  Sqlx doesn't like anything except string literals.
  let maybe_models = if !allow_mod_disabled {
    info!("listing tts models for user; mod-approved only");
    sqlx::query_as!(
      InternalRawTtsModelRecordForList,
        r#"
SELECT
    tts.token as model_token,
    tts.tts_model_type,
    tts.creator_user_token,
    users.username as creator_username,
    users.display_name as creator_display_name,
    users.email_gravatar_hash as creator_gravatar_hash,
    tts.title,
    tts.ietf_language_tag,
    tts.ietf_primary_language_subtag,
    tts.is_locked_from_use,
    tts.is_front_page_featured,
    tts.is_twitch_featured,
    tts.maybe_suggested_unique_bot_command,
    tts.user_ratings_positive_count,
    tts.user_ratings_negative_count,
    tts.user_ratings_total_count,
    tts.creator_set_visibility as `creator_set_visibility: enums_db::common::visibility::Visibility`,
    tts.created_at,
    tts.updated_at
FROM tts_models as tts
JOIN users
ON
    users.token = tts.creator_user_token
WHERE
    users.username = ?
    AND tts.is_locked_from_use IS FALSE
    AND tts.user_deleted_at IS NULL
    AND tts.mod_deleted_at IS NULL
        "#,
      scope_creator_username)
      .fetch_all(&mut **mysql_connection)
      .await?
  } else {
    info!("listing tts models for user; all");
    sqlx::query_as!(
      InternalRawTtsModelRecordForList,
        r#"
SELECT
    tts.token as model_token,
    tts.tts_model_type,
    tts.creator_user_token,
    users.username as creator_username,
    users.display_name as creator_display_name,
    users.email_gravatar_hash as creator_gravatar_hash,
    tts.title,
    tts.ietf_language_tag,
    tts.ietf_primary_language_subtag,
    tts.is_locked_from_use,
    tts.is_front_page_featured,
    tts.is_twitch_featured,
    tts.maybe_suggested_unique_bot_command,
    tts.user_ratings_positive_count,
    tts.user_ratings_negative_count,
    tts.user_ratings_total_count,
    tts.creator_set_visibility as `creator_set_visibility: enums_db::common::visibility::Visibility`,
    tts.created_at,
    tts.updated_at
FROM tts_models as tts
JOIN users
ON
    users.token = tts.creator_user_token
WHERE
    users.username = ?
    AND tts.user_deleted_at IS NULL
    AND tts.mod_deleted_at IS NULL
        "#,
      scope_creator_username)
      .fetch_all(&mut **mysql_connection)
      .await?
  };

  Ok(maybe_models)
}

struct InternalRawTtsModelRecordForList {
  pub model_token: String,
  pub tts_model_type: String,

  pub title: String,

  pub ietf_language_tag: String,
  pub ietf_primary_language_subtag: String,

  pub creator_user_token: String,
  pub creator_username: String,
  pub creator_display_name: String,
  pub creator_gravatar_hash: String,

  pub is_locked_from_use: i8, // bool

  pub is_front_page_featured: i8, // bool
  pub is_twitch_featured: i8, // bool

  pub maybe_suggested_unique_bot_command: Option<String>,

  pub user_ratings_positive_count: u32,
  pub user_ratings_negative_count: u32,
  pub user_ratings_total_count: u32, // NB: Does not include "neutral" ratings.

  pub creator_set_visibility: Visibility,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}
