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

use crate::column_types::vocoder_type::VocoderType;
use crate::helpers::boolean_converters::{i8_to_bool, nullable_i8_to_bool};

#[derive(Serialize)]
pub struct TtsResultRecordForResponse {
  pub tts_result_token: String,
  pub raw_inference_text: String,

  pub tts_model_token: String,
  pub tts_model_title: Option<String>, // TODO: Shouldn't be Option.

  pub maybe_pretrained_vocoder_used: Option<VocoderType>,

  pub maybe_creator_user_token: Option<UserToken>,
  pub maybe_creator_username: Option<String>,
  pub maybe_creator_display_name: Option<String>,
  pub maybe_creator_gravatar_hash: Option<String>,

  pub maybe_model_creator_user_token: Option<String>,
  pub maybe_model_creator_username: Option<String>,
  pub maybe_model_creator_display_name: Option<String>,
  pub maybe_model_creator_gravatar_hash: Option<String>,

  pub public_bucket_wav_audio_path: String,
  pub public_bucket_spectrogram_path: String,

  pub creator_set_visibility: Visibility,

  // Worker hostname that generated the audio. Has the value "unknown" if null.
  pub generated_by_worker: String,

  // If the request was originally targeted to a special "debug" worker.
  pub is_debug_request: bool,

  pub file_size_bytes: u32,
  pub duration_millis: u32,

  //pub model_is_mod_approved: bool, // converted
  //pub maybe_mod_user_token: Option<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  pub maybe_moderator_fields: Option<TtsResultModeratorFields>,
}

/// "Moderator-only fields" that we wouldn't want to expose to ordinary users.
/// It's the web endpoint controller's responsibility to clear these for non-mods.
#[derive(Serialize)]
pub struct TtsResultModeratorFields {
  pub model_creator_is_banned: bool,
  pub result_creator_is_banned_if_user: bool,
  pub result_creator_ip_address: String,
  pub result_creator_deleted_at: Option<DateTime<Utc>>,
  pub mod_deleted_at: Option<DateTime<Utc>>,
}

#[derive(Serialize)]
pub struct TtsResultRecordRaw {
  pub tts_result_token: String, // from field `tts_results.token`
  pub raw_inference_text: String,

  pub tts_model_token: String,
  pub tts_model_title: Option<String>,

  pub maybe_pretrained_vocoder_used: Option<String>,

  pub maybe_creator_is_banned: Option<i8>,
  pub maybe_creator_user_token: Option<UserToken>,
  pub maybe_creator_username: Option<String>,
  pub maybe_creator_display_name: Option<String>,
  pub maybe_creator_gravatar_hash: Option<String>,

  pub maybe_model_creator_is_banned: Option<i8>,
  pub maybe_model_creator_user_token: Option<String>,
  pub maybe_model_creator_username: Option<String>,
  pub maybe_model_creator_display_name: Option<String>,
  pub maybe_model_creator_gravatar_hash: Option<String>,

  pub public_bucket_wav_audio_path: String,
  pub public_bucket_spectrogram_path: String,

  pub creator_set_visibility: String,

  pub generated_by_worker: Option<String>,

  pub is_debug_request: i8,

  pub file_size_bytes: i32,
  pub duration_millis: i32,

  //pub model_is_mod_approved: i8, // needs convert
  //pub maybe_mod_user_token: Option<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  // Moderator fields
  pub creator_ip_address: String,
  pub user_deleted_at: Option<DateTime<Utc>>,
  pub mod_deleted_at: Option<DateTime<Utc>>,
}

pub async fn select_tts_result_by_token(
  tts_result_token: &str,
  can_see_deleted: bool,
  mysql_pool: &MySqlPool
) -> AnyhowResult<Option<TtsResultRecordForResponse>> {

  let maybe_record = if can_see_deleted {
    select_including_deleted(tts_result_token, mysql_pool).await
  } else {
    select_without_deleted(tts_result_token, mysql_pool).await
  };

  let ir : TtsResultRecordRaw = match maybe_record {
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

  let mut pretrained_vocoder = None;
  if let Some(vocoder) = ir.maybe_pretrained_vocoder_used.as_deref() {
    pretrained_vocoder = Some(VocoderType::from_str(vocoder)?);
  }

  let ir_for_response = TtsResultRecordForResponse {
    tts_result_token: ir.tts_result_token,

    raw_inference_text: ir.raw_inference_text,

    tts_model_token: ir.tts_model_token,
    tts_model_title: ir.tts_model_title,

    maybe_pretrained_vocoder_used: pretrained_vocoder,

    maybe_creator_user_token: ir.maybe_creator_user_token,
    maybe_creator_username: ir.maybe_creator_username,
    maybe_creator_display_name: ir.maybe_creator_display_name,
    maybe_creator_gravatar_hash: ir.maybe_creator_gravatar_hash,

    maybe_model_creator_user_token: ir.maybe_model_creator_user_token,
    maybe_model_creator_username: ir.maybe_model_creator_username,
    maybe_model_creator_display_name: ir.maybe_model_creator_display_name,
    maybe_model_creator_gravatar_hash: ir.maybe_model_creator_gravatar_hash,

    //model_is_mod_approved: if ir.model_is_mod_approved == 0 { false } else { true },

    public_bucket_wav_audio_path: ir.public_bucket_wav_audio_path,
    public_bucket_spectrogram_path: ir.public_bucket_spectrogram_path,

    // NB: Fail open/public since we're already looking at it
    creator_set_visibility: Visibility::from_str(&ir.creator_set_visibility)
        .unwrap_or(Visibility::Public),

    generated_by_worker: ir.generated_by_worker.unwrap_or("unknown".to_string()),

    is_debug_request: i8_to_bool(ir.is_debug_request),

    file_size_bytes: if ir.file_size_bytes > 0 { ir.file_size_bytes as u32 } else { 0 },
    duration_millis: if ir.duration_millis > 0 { ir.duration_millis as u32 } else { 0 },

    created_at: ir.created_at,
    updated_at: ir.updated_at,

    maybe_moderator_fields: Some(TtsResultModeratorFields {
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
  tts_result_token: &str,
  mysql_pool: &MySqlPool
) -> Result<TtsResultRecordRaw, sqlx::Error> {
  sqlx::query_as!(
      TtsResultRecordRaw,
        r#"
SELECT
    tts_results.token as tts_result_token,

    tts_results.raw_inference_text,

    tts_results.model_token as tts_model_token,
    tts_models.title as tts_model_title,

    tts_results.maybe_pretrained_vocoder_used,

    users.token as `maybe_creator_user_token: tokens::tokens::users::UserToken`,
    users.username as maybe_creator_username,
    users.display_name as maybe_creator_display_name,
    users.email_gravatar_hash as maybe_creator_gravatar_hash,
    users.is_banned as maybe_creator_is_banned,

    model_users.token as maybe_model_creator_user_token,
    model_users.username as maybe_model_creator_username,
    model_users.display_name as maybe_model_creator_display_name,
    model_users.email_gravatar_hash as maybe_model_creator_gravatar_hash,
    model_users.is_banned as maybe_model_creator_is_banned,

    tts_results.public_bucket_wav_audio_path,
    tts_results.public_bucket_spectrogram_path,

    tts_results.creator_set_visibility,

    tts_results.generated_by_worker,
    tts_results.is_debug_request,

    tts_results.file_size_bytes,
    tts_results.duration_millis,
    tts_results.created_at,
    tts_results.updated_at,

    tts_results.creator_ip_address,
    tts_results.user_deleted_at,
    tts_results.mod_deleted_at

FROM tts_results
LEFT OUTER JOIN tts_models
  ON tts_results.model_token = tts_models.token
LEFT OUTER JOIN users
  ON tts_results.maybe_creator_user_token = users.token
LEFT OUTER JOIN users as model_users
  ON tts_models.creator_user_token = model_users.token
WHERE
    tts_results.token = ?
        "#,
      tts_result_token
    )
    .fetch_one(mysql_pool)
    .await // TODO: This will return error if it doesn't exist
}

async fn select_without_deleted(
  tts_result_token: &str,
  mysql_pool: &MySqlPool
) -> Result<TtsResultRecordRaw, sqlx::Error> {
  sqlx::query_as!(
      TtsResultRecordRaw,
        r#"
SELECT
    tts_results.token as tts_result_token,

    tts_results.raw_inference_text,

    tts_results.model_token as tts_model_token,
    tts_models.title as tts_model_title,

    tts_results.maybe_pretrained_vocoder_used,

    users.token as `maybe_creator_user_token: tokens::tokens::users::UserToken`,
    users.username as maybe_creator_username,
    users.display_name as maybe_creator_display_name,
    users.email_gravatar_hash as maybe_creator_gravatar_hash,
    users.is_banned as maybe_creator_is_banned,

    model_users.token as maybe_model_creator_user_token,
    model_users.username as maybe_model_creator_username,
    model_users.display_name as maybe_model_creator_display_name,
    model_users.email_gravatar_hash as maybe_model_creator_gravatar_hash,
    model_users.is_banned as maybe_model_creator_is_banned,

    tts_results.public_bucket_wav_audio_path,
    tts_results.public_bucket_spectrogram_path,

    tts_results.creator_set_visibility,

    tts_results.generated_by_worker,
    tts_results.is_debug_request,

    tts_results.file_size_bytes,
    tts_results.duration_millis,
    tts_results.created_at,
    tts_results.updated_at,

    tts_results.creator_ip_address,
    tts_results.user_deleted_at,
    tts_results.mod_deleted_at

FROM tts_results
LEFT OUTER JOIN tts_models
  ON tts_results.model_token = tts_models.token
LEFT OUTER JOIN users
  ON tts_results.maybe_creator_user_token = users.token
LEFT OUTER JOIN users as model_users
  ON tts_models.creator_user_token = model_users.token
WHERE
    tts_results.token = ?
    AND tts_results.user_deleted_at IS NULL
    AND tts_results.mod_deleted_at IS NULL
        "#,
      tts_result_token
    )
    .fetch_one(mysql_pool)
    .await // TODO: This will return error if it doesn't exist
}
