use anyhow::anyhow;
use chrono::{DateTime, Utc};
use log::warn;
use sqlx::{Error, MySql, MySqlPool};
use sqlx::pool::PoolConnection;

use enums_db::by_table::voice_conversion_models::voice_conversion_model_type::VoiceConversionModelType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::users::UserToken;
use tokens::tokens::voice_conversion_models::VoiceConversionModelToken;

use crate::helpers::boolean_converters::i8_to_bool;

#[derive(Serialize, Clone)]
pub struct VoiceConversionModelRecordForList {
  pub token: VoiceConversionModelToken,
  pub model_type: VoiceConversionModelType,

  pub title: String,

  pub ietf_language_tag: String,
  pub ietf_primary_language_subtag: String,

  pub creator_user_token: UserToken,
  pub creator_username: String,
  pub creator_display_name: String,
  pub creator_gravatar_hash: String,

  pub is_front_page_featured: bool,

  pub creator_set_visibility: Visibility,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

// FIXME: This is the old style of query scoping and shouldn't be copied.

pub async fn list_voice_conversion_models(
  mysql_pool: &MySqlPool,
  scope_creator_username: Option<&str>,
) -> AnyhowResult<Vec<VoiceConversionModelRecordForList>> {
  let mut connection = mysql_pool.acquire().await?;
  list_voice_conversion_models_with_connection(&mut connection, scope_creator_username).await
}

pub async fn list_voice_conversion_models_with_connection(
  mysql_connection: &mut PoolConnection<MySql>,
  scope_creator_username: Option<&str>,
) -> AnyhowResult<Vec<VoiceConversionModelRecordForList>> {

  let maybe_models = match scope_creator_username {
    Some(username) => {
      list_voice_conversion_models_creator_scoped(mysql_connection, username)
        .await
    },
    None => {
      list_voice_conversion_models_for_all_creators(mysql_connection)
        .await
    },
  };

  let models : Vec<RawVoiceConversionModelRecord> = match maybe_models {
    Ok(models) => models,
    Err(err) => {
      return match err {
        Error::RowNotFound => {
          Ok(Vec::new())
        },
        _ => {
          warn!("vc model list query error: {:?}", err);
          Err(anyhow!("vc model list query error"))
        }
      }
    }
  };

  Ok(models.into_iter()
    .map(|model| {
      VoiceConversionModelRecordForList {
        token: model.token,
        model_type: model.model_type,
        creator_user_token: model.creator_user_token,
        creator_username: model.creator_username,
        creator_display_name: model.creator_display_name,
        creator_gravatar_hash: model.creator_gravatar_hash,
        title: model.title,
        ietf_language_tag: model.ietf_language_tag,
        ietf_primary_language_subtag: model.ietf_primary_language_subtag,
        is_front_page_featured: i8_to_bool(model.is_front_page_featured),
        creator_set_visibility: model.creator_set_visibility,
        created_at: model.created_at,
        updated_at: model.updated_at,
      }
    })
    .collect::<Vec<VoiceConversionModelRecordForList>>())
}

async fn list_voice_conversion_models_for_all_creators(
  mysql_connection: &mut PoolConnection<MySql>,
) -> Result<Vec<RawVoiceConversionModelRecord>, Error> {
  Ok(sqlx::query_as!(
      RawVoiceConversionModelRecord,
        r#"
SELECT
    vc.token as `token: tokens::tokens::voice_conversion_models::VoiceConversionModelToken`,
    vc.model_type as `model_type: enums_db::by_table::voice_conversion_models::voice_conversion_model_type::VoiceConversionModelType`,
    vc.creator_user_token as `creator_user_token: tokens::tokens::users::UserToken`,
    users.username as creator_username,
    users.display_name as creator_display_name,
    users.email_gravatar_hash as creator_gravatar_hash,
    vc.title,
    vc.ietf_language_tag,
    vc.ietf_primary_language_subtag,
    vc.is_front_page_featured,
    vc.creator_set_visibility as `creator_set_visibility: enums::common::visibility::Visibility`,
    vc.created_at,
    vc.updated_at
FROM voice_conversion_models as vc
JOIN users
    ON users.token = vc.creator_user_token
WHERE
    vc.user_deleted_at IS NULL
    AND vc.mod_deleted_at IS NULL
        "#)
      .fetch_all(&mut **mysql_connection)
      .await?)
}

async fn list_voice_conversion_models_creator_scoped(
  mysql_connection: &mut PoolConnection<MySql>,
  scope_creator_username: &str,
) -> Result<Vec<RawVoiceConversionModelRecord>, Error> {
  Ok(sqlx::query_as!(
      RawVoiceConversionModelRecord,
        r#"
SELECT
    vc.token as `token: tokens::tokens::voice_conversion_models::VoiceConversionModelToken`,
    vc.model_type as `model_type: enums_db::by_table::voice_conversion_models::voice_conversion_model_type::VoiceConversionModelType`,
    vc.creator_user_token as `creator_user_token: tokens::tokens::users::UserToken`,
    users.username as creator_username,
    users.display_name as creator_display_name,
    users.email_gravatar_hash as creator_gravatar_hash,
    vc.title,
    vc.ietf_language_tag,
    vc.ietf_primary_language_subtag,
    vc.is_front_page_featured,
    vc.creator_set_visibility as `creator_set_visibility: enums::common::visibility::Visibility`,
    vc.created_at,
    vc.updated_at
FROM voice_conversion_models as vc
JOIN users
    ON users.token = vc.creator_user_token
WHERE
    users.username = ?
    AND vc.user_deleted_at IS NULL
    AND vc.mod_deleted_at IS NULL
        "#,
      scope_creator_username)
      .fetch_all(&mut **mysql_connection)
      .await?)
}

struct RawVoiceConversionModelRecord {
  pub token: VoiceConversionModelToken,
  pub model_type: VoiceConversionModelType,

  pub title: String,

  pub ietf_language_tag: String,
  pub ietf_primary_language_subtag: String,

  pub creator_user_token: UserToken,
  pub creator_username: String,
  pub creator_display_name: String,
  pub creator_gravatar_hash: String,

  pub is_front_page_featured: i8, // bool

  pub creator_set_visibility: Visibility,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}
