// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use anyhow::anyhow;
use chrono::{DateTime, Utc};
use log::warn;
use sqlx::MySqlPool;

use enums_db::common::visibility::Visibility;
use enums_db::common::vocoder_type::VocoderType;
use errors::AnyhowResult;

use crate::helpers::boolean_converters::i8_to_bool;

// FIXME: This is the old style of query scoping and shouldn't be copied.
//  The moderator-only fields are good practice, though.

// NB: Do not publicly expose this type.
pub struct VocoderModelRecord {
  pub vocoder_token: String,
  pub vocoder_type: VocoderType,

  pub title: String,
  pub description_markdown: String,
  pub description_rendered_html: String,

  pub is_staff_recommended: bool,

  pub creator_user_token: String,
  pub creator_username: String,
  pub creator_display_name: String,
  pub creator_gravatar_hash: String,

  pub creator_set_visibility: Visibility,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  pub maybe_moderator_fields: Option<VocoderModelRecordModFields>,
}

// NB: Do not publicly expose this type.
/// "Moderator-only fields" that we wouldn't want to expose to ordinary users.
/// It's the web endpoint controller's responsibility to clear these for non-mods.
pub struct VocoderModelRecordModFields {
  pub creator_is_banned: bool,
  pub creator_ip_address_creation: String,
  pub creator_ip_address_last_update: String,

  pub is_mod_disabled_from_public_use: bool,
  pub is_mod_disabled_from_author_use: bool,
  pub is_mod_author_editing_locked: bool,

  pub user_deleted_at: Option<DateTime<Utc>>,
  pub mod_deleted_at: Option<DateTime<Utc>>,
}

// FIXME: This is the old style of query scoping and shouldn't be copied.
//  The moderator-only fields are good practice, though.

pub async fn get_vocoder_model_by_token(
  vocoder_model_token: &str,
  can_see_deleted: bool,
  mysql_pool: &MySqlPool
) -> AnyhowResult<Option<VocoderModelRecord>> {

  let maybe_record = if can_see_deleted {
    select_including_deleted(vocoder_model_token, mysql_pool).await
  } else {
    select_without_deleted(vocoder_model_token, mysql_pool).await
  };

  let model : InternalVocoderModelRecordRaw = match maybe_record {
    Ok(model) => model,
    Err(ref err) => match err {
      sqlx::Error::RowNotFound => {
        warn!("vocoder model not found: {:?}", &err);
        return Ok(None);
      },
      _ => {
        warn!("vocoder model query error: {:?}", &err);
        return Err(anyhow!("database error"));
      }
    }
  };

  Ok(Some(VocoderModelRecord {
    vocoder_token: model.vocoder_token,
    vocoder_type: model.vocoder_type,
    creator_user_token: model.creator_user_token,
    creator_username: model.creator_username,
    creator_display_name: model.creator_display_name,
    creator_gravatar_hash: model.creator_gravatar_hash,
    title: model.title,
    description_markdown: model.description_markdown,
    description_rendered_html: model.description_rendered_html,
    is_staff_recommended: i8_to_bool(model.is_staff_recommended),
    creator_set_visibility: model.creator_set_visibility,
    created_at: model.created_at,
    updated_at: model.updated_at,
    maybe_moderator_fields: Some(VocoderModelRecordModFields {
      creator_is_banned: i8_to_bool(model.creator_is_banned),
      creator_ip_address_creation: model.creator_ip_address_creation,
      creator_ip_address_last_update: model.creator_ip_address_last_update,
      is_mod_disabled_from_public_use: i8_to_bool(model.is_mod_disabled_from_public_use),
      is_mod_disabled_from_author_use: i8_to_bool(model.is_mod_disabled_from_author_use),
      is_mod_author_editing_locked: i8_to_bool(model.is_mod_author_editing_locked),
      user_deleted_at: model.user_deleted_at,
      mod_deleted_at: model.mod_deleted_at,
    }),
  }))
}

async fn select_including_deleted(
  vocoder_model_token: &str,
  mysql_pool: &MySqlPool
) -> Result<InternalVocoderModelRecordRaw, sqlx::Error> {
  sqlx::query_as!(
      InternalVocoderModelRecordRaw,
        r#"
SELECT
    vocoder.token as vocoder_token,
    vocoder.vocoder_type as `vocoder_type: enums_db::common::vocoder_type::VocoderType`,

    vocoder.creator_user_token,
    users.username as creator_username,
    users.display_name as creator_display_name,
    users.email_gravatar_hash as creator_gravatar_hash,
    users.is_banned as creator_is_banned,

    vocoder.title,
    vocoder.description_markdown,
    vocoder.description_rendered_html,
    vocoder.is_staff_recommended,

    vocoder.is_mod_disabled_from_public_use,
    vocoder.is_mod_disabled_from_author_use,
    vocoder.is_mod_author_editing_locked,

    vocoder.creator_set_visibility as `creator_set_visibility: enums_db::common::visibility::Visibility`,

    vocoder.created_at,
    vocoder.updated_at,

    vocoder.creator_ip_address_creation,
    vocoder.creator_ip_address_last_update,
    vocoder.mod_deleted_at,
    vocoder.user_deleted_at

FROM vocoder_models as vocoder
JOIN users
    ON users.token = vocoder.creator_user_token
WHERE
    vocoder.token = ?
        "#,
      vocoder_model_token
    )
      .fetch_one(mysql_pool)
      .await
}

async fn select_without_deleted(
  vocoder_model_token: &str,
  mysql_pool: &MySqlPool
) -> Result<InternalVocoderModelRecordRaw, sqlx::Error> {
  sqlx::query_as!(
      InternalVocoderModelRecordRaw,
        r#"
SELECT
    vocoder.token as vocoder_token,
    vocoder.vocoder_type as `vocoder_type: enums_db::common::vocoder_type::VocoderType`,

    vocoder.creator_user_token,
    users.username as creator_username,
    users.display_name as creator_display_name,
    users.email_gravatar_hash as creator_gravatar_hash,
    users.is_banned as creator_is_banned,

    vocoder.title,
    vocoder.description_markdown,
    vocoder.description_rendered_html,
    vocoder.is_staff_recommended,

    vocoder.is_mod_disabled_from_public_use,
    vocoder.is_mod_disabled_from_author_use,
    vocoder.is_mod_author_editing_locked,

    vocoder.creator_set_visibility as `creator_set_visibility: enums_db::common::visibility::Visibility`,

    vocoder.created_at,
    vocoder.updated_at,

    vocoder.creator_ip_address_creation,
    vocoder.creator_ip_address_last_update,
    vocoder.mod_deleted_at,
    vocoder.user_deleted_at

FROM vocoder_models as vocoder
JOIN users
    ON users.token = vocoder.creator_user_token
WHERE
    vocoder.token = ?
    AND vocoder.user_deleted_at IS NULL
    AND vocoder.mod_deleted_at IS NULL
        "#,
      vocoder_model_token
    )
      .fetch_one(mysql_pool)
      .await
}

struct InternalVocoderModelRecordRaw {
  pub vocoder_token: String,
  pub vocoder_type: VocoderType,

  pub title: String,
  pub description_markdown: String,
  pub description_rendered_html: String,

  pub is_staff_recommended: i8,

  pub creator_user_token: String,
  pub creator_username: String,
  pub creator_display_name: String,
  pub creator_gravatar_hash: String,

  pub creator_set_visibility: Visibility,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  // Moderator fields
  pub creator_is_banned: i8,
  pub creator_ip_address_creation: String,
  pub creator_ip_address_last_update: String,

  pub is_mod_disabled_from_public_use: i8,
  pub is_mod_disabled_from_author_use: i8,
  pub is_mod_author_editing_locked: i8,

  pub user_deleted_at: Option<DateTime<Utc>>,
  pub mod_deleted_at: Option<DateTime<Utc>>,
}
