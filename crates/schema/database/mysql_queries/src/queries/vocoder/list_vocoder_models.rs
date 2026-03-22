// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use anyhow::anyhow;
use chrono::{DateTime, Utc};
use log::{info, warn};
use sqlx::MySqlPool;

use enums_db::common::vocoder_type::VocoderType;
use errors::AnyhowResult;

use crate::helpers::boolean_converters::i8_to_bool;

// FIXME: This is the old style of query scoping and shouldn't be copied.
//  But I'm in a hurry...

// NB: Do not publicly expose this type.
pub struct VocoderModelListItem {
  pub vocoder_token: String,
  pub vocoder_type: VocoderType,

  pub title: String,
  pub is_staff_recommended: bool,

  pub creator_user_token: String,
  pub creator_username: String,
  pub creator_display_name: String,
  pub creator_gravatar_hash: String,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  // Moderator fields
  pub moderator_fields: VocoderModelListItemModFields,
}

// NB: Do not publicly expose this type.
pub struct VocoderModelListItemModFields {
  pub is_mod_disabled_from_public_use: bool,
  pub is_mod_disabled_from_author_use: bool,
  pub is_mod_author_editing_locked: bool,
  pub user_deleted_at: Option<DateTime<Utc>>,
  pub mod_deleted_at: Option<DateTime<Utc>>,
}

// FIXME: This is the old style of query scoping and shouldn't be copied.
//  But I'm in a hurry...

pub async fn list_vocoder_models(
  mysql_pool: &MySqlPool,
  scope_creator_username: Option<&str>,
  can_see_deleted_and_hidden: bool,
) -> AnyhowResult<Vec<VocoderModelListItem>> {

  let maybe_models = match scope_creator_username {
    Some(username) => {
      list_vocoder_models_creator_scoped(mysql_pool, username, can_see_deleted_and_hidden)
          .await
    },
    None => {
      list_vocoder_models_for_all_creators(mysql_pool, can_see_deleted_and_hidden)
          .await
    },
  };

  let models : Vec<InternalVocoderModelListItemRaw> = match maybe_models {
    Ok(models) => models,
    Err(err) => return match err {
      _RowNotFound => {
        Ok(Vec::new())
      },
      _ => {
        warn!("vocoder model list query error: {:?}", err);
        Err(anyhow!("vocoder model list query error"))
      }
    }
  };

  Ok(models.into_iter()
      .map(|model| {
        VocoderModelListItem {
          vocoder_token: model.vocoder_token,
          vocoder_type: model.vocoder_type,
          title: model.title,
          is_staff_recommended: i8_to_bool(model.is_staff_recommended),
          creator_user_token: model.creator_user_token,
          creator_username: model.creator_username,
          creator_display_name: model.creator_display_name,
          creator_gravatar_hash: model.creator_gravatar_hash,
          created_at: model.created_at,
          updated_at: model.updated_at,
          moderator_fields: VocoderModelListItemModFields {
            is_mod_disabled_from_public_use: i8_to_bool(model.is_mod_disabled_from_public_use),
            is_mod_disabled_from_author_use: i8_to_bool(model.is_mod_disabled_from_author_use),
            is_mod_author_editing_locked: i8_to_bool(model.is_mod_author_editing_locked),
            user_deleted_at: model.user_deleted_at,
            mod_deleted_at: model.mod_deleted_at,
          }
        }
      })
      .collect::<Vec<VocoderModelListItem>>())
}

async fn list_vocoder_models_for_all_creators(
  mysql_pool: &MySqlPool,
  can_see_deleted_and_hidden: bool
) -> AnyhowResult<Vec<InternalVocoderModelListItemRaw>> {
  // NB: Sqlx doesn't like non-string literal queries, so we have to branch.
  // Repeating the query is ugly, but that's the best we can do without a
  // full-on query builder pattern.
  let maybe_models = if !can_see_deleted_and_hidden {
    info!("listing vocoder models for everyone; publicly visible only");
    sqlx::query_as!(
      InternalVocoderModelListItemRaw,
        r#"
SELECT
    vocoder.token as vocoder_token,
    vocoder.vocoder_type as `vocoder_type: enums_db::common::vocoder_type::VocoderType`,
    vocoder.creator_user_token,
    users.username as creator_username,
    users.display_name as creator_display_name,
    users.email_gravatar_hash as creator_gravatar_hash,
    vocoder.title,
    vocoder.is_staff_recommended,
    vocoder.is_mod_disabled_from_public_use,
    vocoder.is_mod_disabled_from_author_use,
    vocoder.is_mod_author_editing_locked,
    vocoder.created_at,
    vocoder.updated_at,
    vocoder.user_deleted_at,
    vocoder.mod_deleted_at
FROM vocoder_models as vocoder
JOIN users
    ON users.token = vocoder.creator_user_token
WHERE
    vocoder.is_mod_disabled_from_public_use IS FALSE
    AND vocoder.is_mod_disabled_from_author_use IS FALSE
    AND vocoder.user_deleted_at IS NULL
    AND vocoder.mod_deleted_at IS NULL
        "#)
        .fetch_all(mysql_pool)
        .await?
  } else {
    info!("listing tts models for everyone; all visibility states (undeleted only)");
    sqlx::query_as!(
      InternalVocoderModelListItemRaw,
        r#"
SELECT
    vocoder.token as vocoder_token,
    vocoder.vocoder_type as `vocoder_type: enums_db::common::vocoder_type::VocoderType`,
    vocoder.creator_user_token,
    users.username as creator_username,
    users.display_name as creator_display_name,
    users.email_gravatar_hash as creator_gravatar_hash,
    vocoder.title,
    vocoder.is_staff_recommended,
    vocoder.is_mod_disabled_from_public_use,
    vocoder.is_mod_disabled_from_author_use,
    vocoder.is_mod_author_editing_locked,
    vocoder.created_at,
    vocoder.updated_at,
    vocoder.user_deleted_at,
    vocoder.mod_deleted_at
FROM vocoder_models as vocoder
JOIN users
    ON users.token = vocoder.creator_user_token
        "#)
        .fetch_all(mysql_pool)
        .await?
  };

  Ok(maybe_models)
}

async fn list_vocoder_models_creator_scoped(
  mysql_pool: &MySqlPool,
  scope_creator_username: &str,
  can_see_deleted_and_hidden: bool
) -> AnyhowResult<Vec<InternalVocoderModelListItemRaw>> {
  // NB: Sqlx doesn't like non-string literal queries, so we have to branch.
  // Repeating the query is ugly, but that's the best we can do without a
  // full-on query builder pattern.
  let maybe_models = if !can_see_deleted_and_hidden {
    info!("listing tts models for user; mod-approved only");
    sqlx::query_as!(
      InternalVocoderModelListItemRaw,
        r#"
SELECT
    vocoder.token as vocoder_token,
    vocoder.vocoder_type as `vocoder_type: enums_db::common::vocoder_type::VocoderType`,
    vocoder.creator_user_token,
    users.username as creator_username,
    users.display_name as creator_display_name,
    users.email_gravatar_hash as creator_gravatar_hash,
    vocoder.title,
    vocoder.is_staff_recommended,
    vocoder.is_mod_disabled_from_public_use,
    vocoder.is_mod_disabled_from_author_use,
    vocoder.is_mod_author_editing_locked,
    vocoder.created_at,
    vocoder.updated_at,
    vocoder.user_deleted_at,
    vocoder.mod_deleted_at
FROM vocoder_models as vocoder
JOIN users
    ON users.token = vocoder.creator_user_token
WHERE
    users.username = ?
    AND vocoder.is_mod_disabled_from_public_use IS FALSE
    AND vocoder.is_mod_disabled_from_author_use IS FALSE
    AND vocoder.user_deleted_at IS NULL
    AND vocoder.mod_deleted_at IS NULL
        "#,
      scope_creator_username)
        .fetch_all(mysql_pool)
        .await?
  } else {
    info!("listing tts models for user; all");
    sqlx::query_as!(
      InternalVocoderModelListItemRaw,
        r#"
SELECT
    vocoder.token as vocoder_token,
    vocoder.vocoder_type as `vocoder_type: enums_db::common::vocoder_type::VocoderType`,
    vocoder.creator_user_token,
    users.username as creator_username,
    users.display_name as creator_display_name,
    users.email_gravatar_hash as creator_gravatar_hash,
    vocoder.title,
    vocoder.is_staff_recommended,
    vocoder.is_mod_disabled_from_public_use,
    vocoder.is_mod_disabled_from_author_use,
    vocoder.is_mod_author_editing_locked,
    vocoder.created_at,
    vocoder.updated_at,
    vocoder.user_deleted_at,
    vocoder.mod_deleted_at
FROM vocoder_models as vocoder
JOIN users
    ON users.token = vocoder.creator_user_token
WHERE
    users.username = ?
        "#,
      scope_creator_username)
        .fetch_all(mysql_pool)
        .await?
  };

  Ok(maybe_models)
}

struct InternalVocoderModelListItemRaw {
  pub vocoder_token: String,
  pub vocoder_type: VocoderType,

  pub title: String,
  pub is_staff_recommended: i8,

  pub creator_user_token: String,
  pub creator_username: String,
  pub creator_display_name: String,
  pub creator_gravatar_hash: String,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  // Moderator fields
  pub is_mod_disabled_from_public_use: i8,
  pub is_mod_disabled_from_author_use: i8,
  pub is_mod_author_editing_locked: i8,
  pub user_deleted_at: Option<DateTime<Utc>>,
  pub mod_deleted_at: Option<DateTime<Utc>>,
}
