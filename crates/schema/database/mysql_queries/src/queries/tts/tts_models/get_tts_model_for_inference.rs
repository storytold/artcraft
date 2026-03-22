// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use chrono::{DateTime, Utc};
use log::warn;
use sqlx;
use sqlx::MySqlPool;

use enums_db::common::vocoder_type::VocoderType;

use crate::helpers::boolean_converters::i8_to_bool;

// TODO: Can probably just reuse another query.

#[derive(Clone)]
pub struct TtsModelForInferenceRecord {
  pub model_token: String,
  pub tts_model_type: String,

  /// NB: text_pipeline_type may not always be present in the database.
  pub text_pipeline_type: Option<String>,

  /// Whether to multiply the mel outputs before being vocoded.
  pub use_default_mel_multiply_factor: bool,
  pub maybe_custom_mel_multiply_factor: Option<f64>,

  /// [vocoders 1]
  /// This is the new type of vocoder configuration. Users can choose a custom trained
  /// vocoder to associate with their model. The tokens reference the `vocoder_models`
  /// table.
  pub maybe_custom_vocoder: Option<CustomVocoderFields>,

  /// [vocoders 2]
  /// This is the old type of vocoder configuration, which leverages old pretrained
  /// vocoders that we manually uploaded. There aren't many good options for users to
  /// choose here, so this should be treated as a legacy option going forward. We'll
  /// likely be stuck with this configuration for some time, however, due to the large
  /// collection of legacy models we have.
  pub maybe_default_pretrained_vocoder: Option<String>,

  pub creator_user_token: String,
  pub creator_username: String,
  pub creator_display_name: String,

  pub title: String,
  pub private_bucket_hash: String,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
  pub mod_deleted_at: Option<DateTime<Utc>>,
  pub user_deleted_at: Option<DateTime<Utc>>,
}

#[derive(Clone)]
pub struct CustomVocoderFields {
  pub vocoder_token: String,
  pub vocoder_type: VocoderType,
  pub vocoder_title: String,
  pub vocoder_private_bucket_hash: String,
}

#[derive(Clone, Debug)]
pub enum TtsModelForInferenceError {
  ModelNotFound,
  ModelDeleted,
  DatabaseError { reason: String },
}

impl std::fmt::Display for TtsModelForInferenceError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      TtsModelForInferenceError::ModelNotFound => write!(f, "ModelNotFound"),
      TtsModelForInferenceError::ModelDeleted => write!(f, "ModelDeleted"),
      TtsModelForInferenceError::DatabaseError { reason} =>
        write!(f, "Database error: {:?}", reason),
    }
  }
}

impl std::error::Error for TtsModelForInferenceError {}

pub async fn get_tts_model_for_inference(
  pool: &MySqlPool,
  model_token: &str
) -> Result<TtsModelForInferenceRecord, TtsModelForInferenceError>
{
  // NB: Lookup failure is Err(RowNotFound).
  // NB: Since this is publicly exposed, we don't query sensitive data.
  let maybe_model = sqlx::query_as!(
      InternalTtsModelForInferenceRecordRaw,
        r#"
SELECT
    tts.token as model_token,
    tts.tts_model_type,
    tts.text_pipeline_type,

    tts.use_default_mel_multiply_factor,
    tts.maybe_custom_mel_multiply_factor,

    tts.maybe_default_pretrained_vocoder,

    tts.maybe_custom_vocoder_token,
    vocoder.vocoder_type as `maybe_custom_vocoder_type: enums_db::common::vocoder_type::VocoderType`,
    vocoder.title as maybe_custom_vocoder_title,
    vocoder.private_bucket_hash as maybe_custom_vocoder_private_bucket_hash,

    tts.creator_user_token,
    users.username as creator_username,
    users.display_name as creator_display_name,
    tts.title,
    tts.private_bucket_hash,
    tts.created_at,
    tts.updated_at,
    tts.user_deleted_at,
    tts.mod_deleted_at

FROM tts_models as tts

JOIN users
    ON users.token = tts.creator_user_token

LEFT OUTER JOIN vocoder_models AS vocoder
    ON vocoder.token = tts.maybe_custom_vocoder_token

WHERE tts.token = ?
        "#,
      &model_token
    )
      .fetch_one(pool)
      .await; // TODO: This will return error if it doesn't exist

  let model : InternalTtsModelForInferenceRecordRaw = match maybe_model {
    Ok(model) => model,
    Err(err) => {
      match err {
        sqlx::Error::RowNotFound => {
          return Err(TtsModelForInferenceError::ModelNotFound);
        },
        _ => {
          warn!("tts model query error: {:?}", err);
          return Err(TtsModelForInferenceError::DatabaseError {
            reason: format!("Mysql error: {:?}", err)
          });
        }
      }
    }
  };

  if model.mod_deleted_at.is_some() || model.user_deleted_at.is_some() {
    return Err(TtsModelForInferenceError::ModelDeleted);
  }

  Ok(TtsModelForInferenceRecord {
    model_token: model.model_token,
    tts_model_type: model.tts_model_type,
    text_pipeline_type: model.text_pipeline_type,
    use_default_mel_multiply_factor: i8_to_bool(model.use_default_mel_multiply_factor),
    maybe_custom_mel_multiply_factor: model.maybe_custom_mel_multiply_factor,
    maybe_custom_vocoder: match model.maybe_custom_vocoder_token {
      // NB: We're relying on a single field's presence to infer that the others vocoder fields
      // are also there. If for some reason they aren't, fail open.
      None => None,
      Some(vocoder_token) => Some(CustomVocoderFields {
        vocoder_token,
        vocoder_type: model.maybe_custom_vocoder_type.ok_or(
          TtsModelForInferenceError::DatabaseError { reason: "custom_vocoder_type field error".to_string() })?,
        vocoder_title: model.maybe_custom_vocoder_title.ok_or(
          TtsModelForInferenceError::DatabaseError { reason: "custom_vocoder_title field error".to_string() })?,
        vocoder_private_bucket_hash: model.maybe_custom_vocoder_private_bucket_hash.ok_or(
          TtsModelForInferenceError::DatabaseError { reason: "vocoder_private_bucket_hash field error".to_string() })?,
      })
    },
    maybe_default_pretrained_vocoder: model.maybe_default_pretrained_vocoder,
    creator_user_token: model.creator_user_token,
    creator_username: model.creator_username,
    creator_display_name: model.creator_display_name,
    title: model.title,
    private_bucket_hash: model.private_bucket_hash,
    created_at: model.created_at,
    updated_at: model.updated_at,
    mod_deleted_at: model.mod_deleted_at,
    user_deleted_at: model.user_deleted_at,
  })
}

struct InternalTtsModelForInferenceRecordRaw {
  model_token: String,
  tts_model_type: String,

  text_pipeline_type: Option<String>,

  use_default_mel_multiply_factor: i8, // NB: bool
  maybe_custom_mel_multiply_factor: Option<f64>,

  // Joined custom vocoder fields
  maybe_custom_vocoder_token: Option<String>,
  maybe_custom_vocoder_type: Option<VocoderType>,
  maybe_custom_vocoder_title: Option<String>,
  maybe_custom_vocoder_private_bucket_hash: Option<String>,

  // Legacy vocoder config
  maybe_default_pretrained_vocoder: Option<String>,

  creator_user_token: String,
  creator_username: String,
  creator_display_name: String,

  title: String,
  private_bucket_hash: String,
  created_at: DateTime<Utc>,
  updated_at: DateTime<Utc>,
  mod_deleted_at: Option<DateTime<Utc>>,
  user_deleted_at: Option<DateTime<Utc>>,
}

