// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use anyhow::anyhow;
use chrono::{DateTime, Utc};
use log::warn;
use sqlx::MySqlPool;

use enums_db::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::users::UserToken;
use tokens::tokens::voice_conversion_models::VoiceConversionModelToken;
use tokens::tokens::voice_conversion_results::VoiceConversionResultToken;

use crate::helpers::boolean_converters::{i8_to_bool, nullable_i8_to_bool};

// TODO(bt, 2023-09-07): I lazily copied this code from `get_tts_result` and didn't validate the query or the fields.
//  Once this is used in production flows, this should be spot checked.

pub struct VoiceConversionResult {
  pub voice_conversion_result_token: VoiceConversionResultToken,

  pub voice_conversion_model_token: VoiceConversionModelToken,
  pub voice_conversion_model_title: Option<String>, // TODO: Shouldn't be Option.

  pub maybe_creator_user_token: Option<UserToken>,
  pub maybe_creator_username: Option<String>,
  pub maybe_creator_display_name: Option<String>,
  pub maybe_creator_gravatar_hash: Option<String>,

  pub maybe_model_creator_user_token: Option<UserToken>,
  pub maybe_model_creator_username: Option<String>,
  pub maybe_model_creator_display_name: Option<String>,
  pub maybe_model_creator_gravatar_hash: Option<String>,

  pub public_bucket_hash: String,

  pub creator_set_visibility: Visibility,

  // Worker hostname that generated the audio. Has the value "unknown" if null.
  pub generated_by_worker: String,

  // If the request was originally targeted to a special "debug" worker.
  pub is_debug_request: bool,

  pub file_size_bytes: u32,
  pub duration_millis: u32,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  pub maybe_moderator_fields: Option<VoiceConversionResultModeratorFields>,
}

/// "Moderator-only fields" that we wouldn't want to expose to ordinary users.
/// It's the web endpoint controller's responsibility to clear these for non-mods.
#[derive(Serialize)]
pub struct VoiceConversionResultModeratorFields {
  pub model_creator_is_banned: bool,
  pub result_creator_is_banned_if_user: bool,
  pub result_creator_ip_address: String,
  pub result_creator_deleted_at: Option<DateTime<Utc>>,
  pub mod_deleted_at: Option<DateTime<Utc>>,
}

#[derive(Serialize)]
pub struct VoiceConversionResultRecordRaw {
  pub voice_conversion_result_token: VoiceConversionResultToken,

  pub voice_conversion_model_token: VoiceConversionModelToken,
  pub voice_conversion_model_title: Option<String>,

  pub maybe_creator_is_banned: Option<i8>,
  pub maybe_creator_user_token: Option<UserToken>,
  pub maybe_creator_username: Option<String>,
  pub maybe_creator_display_name: Option<String>,
  pub maybe_creator_gravatar_hash: Option<String>,

  pub maybe_model_creator_is_banned: Option<i8>,
  pub maybe_model_creator_user_token: Option<UserToken>,
  pub maybe_model_creator_username: Option<String>,
  pub maybe_model_creator_display_name: Option<String>,
  pub maybe_model_creator_gravatar_hash: Option<String>,

  pub public_bucket_hash: String,

  pub creator_set_visibility: String,

  pub generated_by_worker: Option<String>,

  pub is_debug_request: i8,

  pub file_size_bytes: i32,
  pub duration_millis: i32,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  // Moderator fields
  pub creator_ip_address: String,
  pub user_deleted_at: Option<DateTime<Utc>>,
  pub mod_deleted_at: Option<DateTime<Utc>>,
}

pub async fn get_voice_conversion_result(
  voice_conversion_result_token: &str,
  can_see_deleted: bool,
  mysql_pool: &MySqlPool
) -> AnyhowResult<Option<VoiceConversionResult>> {

  let maybe_record = if can_see_deleted {
    select_including_deleted(voice_conversion_result_token, mysql_pool).await
  } else {
    select_without_deleted(voice_conversion_result_token, mysql_pool).await
  };

  let ir : VoiceConversionResultRecordRaw = match maybe_record {
    Ok(inference_result) => inference_result,
    Err(ref err) => {
      match err {
        sqlx::Error::RowNotFound => {
          warn!("tts result not found: {:?}", &err);
          return Ok(None);
        },
        _ => {
          warn!("tts result query error: {:?}", &err);
          return Err(anyhow!("database error"));
        }
      }
    }
  };

  let ir_for_response = VoiceConversionResult {
    voice_conversion_result_token: ir.voice_conversion_result_token,

    voice_conversion_model_token: ir.voice_conversion_model_token,
    voice_conversion_model_title: ir.voice_conversion_model_title,

    maybe_creator_user_token: ir.maybe_creator_user_token,
    maybe_creator_username: ir.maybe_creator_username,
    maybe_creator_display_name: ir.maybe_creator_display_name,
    maybe_creator_gravatar_hash: ir.maybe_creator_gravatar_hash,

    maybe_model_creator_user_token: ir.maybe_model_creator_user_token,
    maybe_model_creator_username: ir.maybe_model_creator_username,
    maybe_model_creator_display_name: ir.maybe_model_creator_display_name,
    maybe_model_creator_gravatar_hash: ir.maybe_model_creator_gravatar_hash,

    // NB: Fail open/public since we're already looking at it
    public_bucket_hash: ir.public_bucket_hash,

    creator_set_visibility: Visibility::from_str(&ir.creator_set_visibility)
        .unwrap_or(Visibility::Public),

    generated_by_worker: ir.generated_by_worker.unwrap_or("unknown".to_string()),

    is_debug_request: i8_to_bool(ir.is_debug_request),

    file_size_bytes: if ir.file_size_bytes > 0 { ir.file_size_bytes as u32 } else { 0 },
    duration_millis: if ir.duration_millis > 0 { ir.duration_millis as u32 } else { 0 },

    created_at: ir.created_at,
    updated_at: ir.updated_at,

    maybe_moderator_fields: Some(VoiceConversionResultModeratorFields {
      model_creator_is_banned:
      nullable_i8_to_bool(ir.maybe_model_creator_is_banned, false),
      result_creator_is_banned_if_user:
      nullable_i8_to_bool(ir.maybe_creator_is_banned, false),
      result_creator_ip_address: ir.creator_ip_address,
      result_creator_deleted_at: ir.user_deleted_at,
      mod_deleted_at: ir.mod_deleted_at,
    }),
  };

  Ok(Some(ir_for_response))
}

async fn select_including_deleted(
  voice_conversion_result_token: &str,
  mysql_pool: &MySqlPool
) -> Result<VoiceConversionResultRecordRaw, sqlx::Error> {
  sqlx::query_as!(
      VoiceConversionResultRecordRaw,
        r#"
SELECT
    voice_conversion_results.token as `voice_conversion_result_token: tokens::tokens::voice_conversion_results::VoiceConversionResultToken`,

    voice_conversion_results.model_token as `voice_conversion_model_token: tokens::tokens::voice_conversion_models::VoiceConversionModelToken`,
    voice_conversion_models.title as voice_conversion_model_title,

    users.token as `maybe_creator_user_token: tokens::tokens::users::UserToken`,
    users.username as maybe_creator_username,
    users.display_name as maybe_creator_display_name,
    users.email_gravatar_hash as maybe_creator_gravatar_hash,
    users.is_banned as maybe_creator_is_banned,

    model_users.token as `maybe_model_creator_user_token: tokens::tokens::users::UserToken`,
    model_users.username as maybe_model_creator_username,
    model_users.display_name as maybe_model_creator_display_name,
    model_users.email_gravatar_hash as maybe_model_creator_gravatar_hash,
    model_users.is_banned as maybe_model_creator_is_banned,

    voice_conversion_results.public_bucket_hash,

    voice_conversion_results.creator_set_visibility,

    voice_conversion_results.generated_by_worker,
    voice_conversion_results.is_debug_request,

    voice_conversion_results.file_size_bytes,
    voice_conversion_results.duration_millis,
    voice_conversion_results.created_at,
    voice_conversion_results.updated_at,

    voice_conversion_results.creator_ip_address,
    voice_conversion_results.user_deleted_at,
    voice_conversion_results.mod_deleted_at

FROM voice_conversion_results
LEFT OUTER JOIN voice_conversion_models
  ON voice_conversion_results.model_token = voice_conversion_models.token
LEFT OUTER JOIN users
  ON voice_conversion_results.maybe_creator_user_token = users.token
LEFT OUTER JOIN users as model_users
  ON voice_conversion_models.creator_user_token = model_users.token
WHERE
    voice_conversion_results.token = ?
        "#,
      voice_conversion_result_token
    )
      .fetch_one(mysql_pool)
      .await // TODO: This will return error if it doesn't exist
}

async fn select_without_deleted(
  voice_conversion_result_token: &str,
  mysql_pool: &MySqlPool
) -> Result<VoiceConversionResultRecordRaw, sqlx::Error> {
  sqlx::query_as!(
      VoiceConversionResultRecordRaw,
        r#"
SELECT
    voice_conversion_results.token as `voice_conversion_result_token: tokens::tokens::voice_conversion_results::VoiceConversionResultToken`,

    voice_conversion_results.model_token as `voice_conversion_model_token: tokens::tokens::voice_conversion_models::VoiceConversionModelToken`,
    voice_conversion_models.title as voice_conversion_model_title,

    users.token as `maybe_creator_user_token: tokens::tokens::users::UserToken`,
    users.username as maybe_creator_username,
    users.display_name as maybe_creator_display_name,
    users.email_gravatar_hash as maybe_creator_gravatar_hash,
    users.is_banned as maybe_creator_is_banned,

    model_users.token as `maybe_model_creator_user_token: tokens::tokens::users::UserToken`,
    model_users.username as maybe_model_creator_username,
    model_users.display_name as maybe_model_creator_display_name,
    model_users.email_gravatar_hash as maybe_model_creator_gravatar_hash,
    model_users.is_banned as maybe_model_creator_is_banned,

    voice_conversion_results.public_bucket_hash,

    voice_conversion_results.creator_set_visibility,

    voice_conversion_results.generated_by_worker,
    voice_conversion_results.is_debug_request,

    voice_conversion_results.file_size_bytes,
    voice_conversion_results.duration_millis,
    voice_conversion_results.created_at,
    voice_conversion_results.updated_at,

    voice_conversion_results.creator_ip_address,
    voice_conversion_results.user_deleted_at,
    voice_conversion_results.mod_deleted_at

FROM voice_conversion_results
LEFT OUTER JOIN voice_conversion_models
  ON voice_conversion_results.model_token = voice_conversion_models.token
LEFT OUTER JOIN users
  ON voice_conversion_results.maybe_creator_user_token = users.token
LEFT OUTER JOIN users as model_users
  ON voice_conversion_models.creator_user_token = model_users.token
WHERE
    voice_conversion_results.token = ?
    AND voice_conversion_results.user_deleted_at IS NULL
    AND voice_conversion_results.mod_deleted_at IS NULL
        "#,
      voice_conversion_result_token
    )
      .fetch_one(mysql_pool)
      .await // TODO: This will return error if it doesn't exist
}
