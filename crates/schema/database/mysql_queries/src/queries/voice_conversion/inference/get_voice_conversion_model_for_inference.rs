use chrono::{DateTime, Utc};
use log::warn;
use sqlx;
use sqlx::MySqlPool;

use enums_db::by_table::voice_conversion_models::voice_conversion_model_type::VoiceConversionModelType;
use tokens::tokens::voice_conversion_models::VoiceConversionModelToken;

use crate::helpers::boolean_converters::i8_to_bool;

#[derive(Clone)]
pub struct VoiceConversionModelForInference {
  pub token: VoiceConversionModelToken,
  pub model_type: VoiceConversionModelType,

  pub title: String,

  // (rvc_v2 models:) whether the model also has an associated index file.
  pub has_index_file: bool,

  pub private_bucket_hash: String,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
  pub mod_deleted_at: Option<DateTime<Utc>>,
  pub user_deleted_at: Option<DateTime<Utc>>,
}

#[derive(Clone, Debug)]
pub enum VoiceConversionModelForInferenceError {
  ModelDeleted,
  DatabaseError { reason: String },
}

impl std::fmt::Display for VoiceConversionModelForInferenceError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      VoiceConversionModelForInferenceError::ModelDeleted => write!(f, "ModelDeleted"),
      VoiceConversionModelForInferenceError::DatabaseError { reason} =>
        write!(f, "Database error: {:?}", reason),
    }
  }
}

impl std::error::Error for VoiceConversionModelForInferenceError {}


pub async fn get_voice_conversion_model_for_inference(
  pool: &MySqlPool,
  model_token: &str
) -> Result<Option<VoiceConversionModelForInference>, VoiceConversionModelForInferenceError>
{
  // NB: Lookup failure is Err(RowNotFound).
  // NB: Since this is publicly exposed, we don't query sensitive data.
  let maybe_model = sqlx::query_as!(
      InternalVoiceConversionModelForInferenceRaw,
        r#"
SELECT
    vc.token as `token: tokens::tokens::voice_conversion_models::VoiceConversionModelToken`,
    vc.model_type as `model_type: enums_db::by_table::voice_conversion_models::voice_conversion_model_type::VoiceConversionModelType`,

    vc.title,
    vc.has_index_file,
    vc.private_bucket_hash,

    vc.created_at,
    vc.updated_at,
    vc.user_deleted_at,
    vc.mod_deleted_at

FROM voice_conversion_models as vc

WHERE vc.token = ?
        "#,
      model_token
    )
      .fetch_one(pool)
      .await; // TODO: This will return error if it doesn't exist

  let model : InternalVoiceConversionModelForInferenceRaw = match maybe_model {
    Ok(model) => model,
    Err(err) => {
      match err {
        sqlx::Error::RowNotFound => {
          return Ok(None);
        },
        _ => {
          warn!("voice conversion model query error: {:?}", err);
          return Err(VoiceConversionModelForInferenceError::DatabaseError {
            reason: format!("Mysql error: {:?}", err)
          });
        }
      }
    }
  };

  if model.mod_deleted_at.is_some() || model.user_deleted_at.is_some() {
    return Err(VoiceConversionModelForInferenceError::ModelDeleted);
  }

  Ok(Some(VoiceConversionModelForInference {
    token: model.token,
    model_type: model.model_type,
    title: model.title,
    has_index_file: i8_to_bool(model.has_index_file),
    private_bucket_hash: model.private_bucket_hash,
    created_at: model.created_at,
    updated_at: model.updated_at,
    mod_deleted_at: model.mod_deleted_at,
    user_deleted_at: model.user_deleted_at,
  }))
}

struct InternalVoiceConversionModelForInferenceRaw {
  token: VoiceConversionModelToken,
  model_type: VoiceConversionModelType,

  title: String,

  //creator_user_token: UserToken,
  //creator_username: String,
  //creator_display_name: String,

  has_index_file: i8,

  private_bucket_hash: String,

  created_at: DateTime<Utc>,
  updated_at: DateTime<Utc>,
  mod_deleted_at: Option<DateTime<Utc>>,
  user_deleted_at: Option<DateTime<Utc>>,
}
