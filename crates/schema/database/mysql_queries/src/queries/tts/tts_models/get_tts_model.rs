// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use anyhow::anyhow;
use chrono::{DateTime, Utc};
use log::warn;
use sqlx::{MySql, MySqlPool};
use sqlx::pool::PoolConnection;

use enums_db::by_table::tts_models::tts_model_type::TtsModelType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::model_weights::ModelWeightToken;
use crate::column_types::vocoder_type::VocoderType;
use crate::helpers::boolean_converters::i8_to_bool;

// FIXME: This is the old style of query scoping and shouldn't be copied.
//  The moderator-only fields are good practice, though.

#[derive(Serialize, Deserialize, Clone)]
pub struct TtsModelRecord {
  pub model_token: String,
  pub tts_model_type: TtsModelType,

  /// NB: text_pipeline_type may not always be present in the database.
  pub text_pipeline_type: Option<String>,
  pub text_preprocessing_algorithm: String,

  pub maybe_custom_vocoder: Option<CustomVocoderFields>,
  pub maybe_default_pretrained_vocoder: Option<VocoderType>,

  pub creator_user_token: String,
  pub creator_username: String,
  pub creator_display_name: String,
  pub creator_gravatar_hash: String,

  pub title: String,
  pub description_markdown: String,
  pub description_rendered_html: String,

  pub ietf_language_tag: String,
  pub ietf_primary_language_subtag: String,

  pub is_front_page_featured: bool,
  pub is_twitch_featured: bool,

  pub maybe_suggested_unique_bot_command: Option<String>,

  pub user_ratings_positive_count: u32,
  pub user_ratings_negative_count: u32,
  pub user_ratings_total_count: u32, // NB: Does not include "neutral" ratings.

  pub creator_set_visibility: Visibility,

  pub is_locked_from_use: bool,
  pub is_locked_from_user_modification: bool,

  pub maybe_migration_new_model_weights_token: Option<ModelWeightToken>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  pub maybe_moderator_fields: Option<TtsModelModeratorFields>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct CustomVocoderFields {
  pub vocoder_token: String,
  pub vocoder_title: String,
  pub creator_user_token: String,
  pub creator_username: String,
  pub creator_display_name: String,
  pub creator_gravatar_hash: String,
}

/// "Moderator-only fields" that we wouldn't want to expose to ordinary users.
/// It's the web endpoint controller's responsibility to clear these for non-mods.
#[derive(Serialize, Deserialize, Clone)]
pub struct TtsModelModeratorFields {
  // Moderator-set mel multiply factors
  pub use_default_mel_multiply_factor: bool,
  pub maybe_custom_mel_multiply_factor: Option<f64>,

  pub creator_is_banned: bool,
  pub creator_ip_address_creation: String,
  pub creator_ip_address_last_update: String,
  pub user_deleted_at: Option<DateTime<Utc>>,
  pub mod_deleted_at: Option<DateTime<Utc>>,
}

// FIXME: This is the old style of query scoping and shouldn't be copied.
//  The moderator-only fields are good practice, though.


pub async fn get_tts_model_by_token(
  tts_model_token: &str,
  can_see_deleted: bool,
  mysql_pool: &MySqlPool
) -> AnyhowResult<Option<TtsModelRecord>> {
  let mut connection = mysql_pool.acquire().await?;
  get_tts_model_by_token_using_connection(tts_model_token, can_see_deleted, &mut connection).await
}

pub async fn get_tts_model_by_token_using_connection(
  tts_model_token: &str,
  can_see_deleted: bool,
  mysql_connection: &mut PoolConnection<MySql>
) -> AnyhowResult<Option<TtsModelRecord>> {

  let maybe_record = if can_see_deleted {
    select_including_deleted(tts_model_token, mysql_connection).await
  } else {
    select_without_deleted(tts_model_token, mysql_connection).await
  };

  let model : InternalTtsModelRecordRaw = match maybe_record {
    Ok(model) => model,
    Err(ref err) => {
      match err {
        sqlx::Error::RowNotFound => {
          warn!("tts model not found: {:?}", &err);
          return Ok(None);
        },
        _ => {
          warn!("tts model query error: {:?}", &err);
          return Err(anyhow!("database error"));
        }
      }
    }
  };

  let mut maybe_vocoder : Option<VocoderType> = None;
  if let Some(vocoder) = model.maybe_default_pretrained_vocoder.as_deref() {
    maybe_vocoder = Some(VocoderType::from_str(vocoder)?);
  }

  let model_for_response = TtsModelRecord {
    model_token: model.model_token,
    tts_model_type: model.tts_model_type,
    text_pipeline_type: model.text_pipeline_type,
    text_preprocessing_algorithm: model.text_preprocessing_algorithm,
    maybe_default_pretrained_vocoder: maybe_vocoder,
    maybe_custom_vocoder: match model.maybe_custom_vocoder_token {
      // NB: We're relying on a single field's presence to infer that the others vocoder fields
      // are also there. If for some reason they aren't, fail open.
      None => None,
      Some(vocoder_token) => Some(CustomVocoderFields {
        vocoder_token,
        vocoder_title: model.maybe_custom_vocoder_title.unwrap_or("".to_string()),
        creator_user_token: model.maybe_custom_vocoder_creator_user_token.unwrap_or("".to_string()),
        creator_username: model.maybe_custom_vocoder_creator_username.unwrap_or("".to_string()),
        creator_display_name: model.maybe_custom_vocoder_creator_display_name.unwrap_or("".to_string()),
        creator_gravatar_hash: model.maybe_custom_vocoder_creator_gravatar_hash.unwrap_or("".to_string()),
      })
    },
    creator_user_token: model.creator_user_token,
    creator_username: model.creator_username,
    creator_display_name: model.creator_display_name,
    creator_gravatar_hash: model.creator_gravatar_hash,
    title: model.title,
    description_markdown: model.description_markdown,
    description_rendered_html: model.description_rendered_html,
    // NB: Fail open/public with creator_set_visibility since we're already looking at it
    ietf_language_tag: model.ietf_language_tag,
    ietf_primary_language_subtag: model.ietf_primary_language_subtag,
    is_front_page_featured: i8_to_bool(model.is_front_page_featured),
    is_twitch_featured: i8_to_bool(model.is_twitch_featured),
    maybe_suggested_unique_bot_command: model.maybe_suggested_unique_bot_command,
    user_ratings_positive_count: model.user_ratings_positive_count,
    user_ratings_negative_count: model.user_ratings_negative_count,
    user_ratings_total_count: model.user_ratings_total_count,
    creator_set_visibility: Visibility::from_str(&model.creator_set_visibility)
        .unwrap_or(Visibility::Public),
    is_locked_from_use: i8_to_bool(model.is_locked_from_use),
    is_locked_from_user_modification: i8_to_bool(model.is_locked_from_user_modification),
    maybe_migration_new_model_weights_token: model.maybe_migration_new_model_weights_token
        .as_deref()
        .map(|token| ModelWeightToken::new_from_str(token)),
    created_at: model.created_at,
    updated_at: model.updated_at,
    maybe_moderator_fields: Some(TtsModelModeratorFields {
      use_default_mel_multiply_factor: i8_to_bool(model.use_default_mel_multiply_factor),
      maybe_custom_mel_multiply_factor: model.maybe_custom_mel_multiply_factor,
      creator_is_banned: i8_to_bool(model.creator_is_banned),
      creator_ip_address_creation: model.creator_ip_address_creation,
      creator_ip_address_last_update: model.creator_ip_address_last_update,
      user_deleted_at: model.user_deleted_at,
      mod_deleted_at: model.mod_deleted_at,
    }),
  };

  Ok(Some(model_for_response))
}

async fn select_including_deleted(
  tts_model_token: &str,
  mysql_connection: &mut PoolConnection<MySql>
) -> Result<InternalTtsModelRecordRaw, sqlx::Error> {
  sqlx::query_as!(
      InternalTtsModelRecordRaw,
        r#"
SELECT
    tts.token as model_token,
    tts.tts_model_type as `tts_model_type: enums_db::by_table::tts_models::tts_model_type::TtsModelType`,
    tts.text_pipeline_type,
    tts.text_preprocessing_algorithm,
    tts.maybe_default_pretrained_vocoder,

    tts.use_default_mel_multiply_factor,
    tts.maybe_custom_mel_multiply_factor,

    tts.creator_user_token,
    users.username as creator_username,
    users.display_name as creator_display_name,
    users.email_gravatar_hash as creator_gravatar_hash,
    users.is_banned as creator_is_banned,

    tts.title,
    tts.description_markdown,
    tts.description_rendered_html,

    tts.ietf_language_tag,
    tts.ietf_primary_language_subtag,

    tts.is_front_page_featured,
    tts.is_twitch_featured,

    tts.maybe_suggested_unique_bot_command,

    tts.user_ratings_positive_count,
    tts.user_ratings_negative_count,
    tts.user_ratings_total_count,

    tts.creator_set_visibility,

    tts.is_locked_from_use,
    tts.is_locked_from_user_modification,

    tts.maybe_migration_new_model_weights_token,

    tts.maybe_custom_vocoder_token,
    vocoder.title as maybe_custom_vocoder_title,
    vocoder_user.token as maybe_custom_vocoder_creator_user_token,
    vocoder_user.username as maybe_custom_vocoder_creator_username,
    vocoder_user.display_name as maybe_custom_vocoder_creator_display_name,
    vocoder_user.email_gravatar_hash as maybe_custom_vocoder_creator_gravatar_hash,

    tts.created_at,
    tts.updated_at,

    tts.creator_ip_address_creation,
    tts.creator_ip_address_last_update,
    tts.mod_deleted_at,
    tts.user_deleted_at

FROM tts_models as tts
JOIN users
    ON users.token = tts.creator_user_token

LEFT OUTER JOIN vocoder_models AS vocoder
    ON vocoder.token = tts.maybe_custom_vocoder_token
LEFT OUTER JOIN users AS vocoder_user
    ON vocoder_user.token = vocoder.creator_user_token

WHERE tts.token = ?
        "#,
      tts_model_token
    )
    .fetch_one(&mut **mysql_connection)
    .await // TODO: This will return error if it doesn't exist
}

async fn select_without_deleted(
  tts_model_token: &str,
  mysql_connection: &mut PoolConnection<MySql>
) -> Result<InternalTtsModelRecordRaw, sqlx::Error> {
  sqlx::query_as!(
      InternalTtsModelRecordRaw,
        r#"
SELECT
    tts.token as model_token,
    tts.tts_model_type as `tts_model_type: enums_db::by_table::tts_models::tts_model_type::TtsModelType`,
    tts.text_pipeline_type,
    tts.text_preprocessing_algorithm,
    tts.maybe_default_pretrained_vocoder,

    tts.use_default_mel_multiply_factor,
    tts.maybe_custom_mel_multiply_factor,

    tts.creator_user_token,
    users.username as creator_username,
    users.display_name as creator_display_name,
    users.email_gravatar_hash as creator_gravatar_hash,
    users.is_banned as creator_is_banned,

    tts.title,
    tts.description_markdown,
    tts.description_rendered_html,

    tts.ietf_language_tag,
    tts.ietf_primary_language_subtag,

    tts.is_front_page_featured,
    tts.is_twitch_featured,

    tts.maybe_suggested_unique_bot_command,

    tts.user_ratings_positive_count,
    tts.user_ratings_negative_count,
    tts.user_ratings_total_count,

    tts.creator_set_visibility,

    tts.is_locked_from_use,
    tts.is_locked_from_user_modification,

    tts.maybe_migration_new_model_weights_token,

    tts.maybe_custom_vocoder_token,
    vocoder.title as maybe_custom_vocoder_title,
    vocoder_user.token as maybe_custom_vocoder_creator_user_token,
    vocoder_user.username as maybe_custom_vocoder_creator_username,
    vocoder_user.display_name as maybe_custom_vocoder_creator_display_name,
    vocoder_user.email_gravatar_hash as maybe_custom_vocoder_creator_gravatar_hash,

    tts.created_at,
    tts.updated_at,

    tts.creator_ip_address_creation,
    tts.creator_ip_address_last_update,
    tts.mod_deleted_at,
    tts.user_deleted_at

FROM tts_models as tts
JOIN users
    ON users.token = tts.creator_user_token

LEFT OUTER JOIN vocoder_models AS vocoder
    ON vocoder.token = tts.maybe_custom_vocoder_token
LEFT OUTER JOIN users AS vocoder_user
    ON vocoder_user.token = vocoder.creator_user_token

WHERE
    tts.token = ?
    AND tts.user_deleted_at IS NULL
    AND tts.mod_deleted_at IS NULL
        "#,
      tts_model_token
    )
    .fetch_one(&mut **mysql_connection)
    .await // TODO: This will return error if it doesn't exist
}

#[derive(Serialize)]
struct InternalTtsModelRecordRaw {
  pub model_token: String,
  pub tts_model_type: TtsModelType,
  pub text_pipeline_type: Option<String>,
  pub maybe_default_pretrained_vocoder: Option<String>,
  pub text_preprocessing_algorithm: String,

  pub use_default_mel_multiply_factor: i8,
  pub maybe_custom_mel_multiply_factor: Option<f64>,

  pub creator_user_token: String,
  pub creator_username: String,
  pub creator_display_name: String,
  pub creator_gravatar_hash: String,
  pub creator_is_banned: i8,

  pub title: String,
  pub description_markdown: String,
  pub description_rendered_html: String,

  pub ietf_language_tag: String,
  pub ietf_primary_language_subtag: String,

  pub is_front_page_featured: i8,
  pub is_twitch_featured: i8,

  pub maybe_suggested_unique_bot_command: Option<String>,

  pub user_ratings_positive_count: u32,
  pub user_ratings_negative_count: u32,
  pub user_ratings_total_count: u32, // NB: Does not include "neutral" ratings.

  pub creator_set_visibility: String,

  pub is_locked_from_use: i8,
  pub is_locked_from_user_modification: i8,

  pub maybe_migration_new_model_weights_token: Option<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  // Joined custom vocoder fields
  pub maybe_custom_vocoder_token: Option<String>,
  pub maybe_custom_vocoder_title: Option<String>,
  pub maybe_custom_vocoder_creator_user_token: Option<String>,
  pub maybe_custom_vocoder_creator_username: Option<String>,
  pub maybe_custom_vocoder_creator_display_name: Option<String>,
  pub maybe_custom_vocoder_creator_gravatar_hash: Option<String>,

  // Moderator fields
  pub creator_ip_address_creation: String,
  pub creator_ip_address_last_update: String,
  pub user_deleted_at: Option<DateTime<Utc>>,
  pub mod_deleted_at: Option<DateTime<Utc>>,
}
