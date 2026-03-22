use chrono::{DateTime, Utc};
use log::warn;
use sqlx;
use sqlx::MySqlPool;

use enums_db::by_table::model_weights::weights_types::WeightsType;
use tokens::tokens::model_weights::ModelWeightToken;

use crate::helpers::boolean_converters::i8_to_bool;

#[derive(Clone)]
pub struct ModelWeightForVoiceConversionInference {
  pub token: ModelWeightToken,
  pub weights_type: WeightsType,

  pub title: String,

  // (rvc_v2 models:) whether the model also has an associated index file.
  pub has_index_file: bool,

  pub public_bucket_hash: String,
  pub maybe_public_bucket_prefix: Option<String>,
  pub maybe_public_bucket_extension: Option<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  pub mod_deleted_at: Option<DateTime<Utc>>,
  pub user_deleted_at: Option<DateTime<Utc>>,
}

#[derive(Clone, Debug)]
pub enum ModelWeightError {
  ModelDeleted,
  DatabaseError { reason: String },
}

impl std::fmt::Display for ModelWeightError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      ModelWeightError::ModelDeleted => write!(f, "ModelDeleted"),
      ModelWeightError::DatabaseError { reason} =>
        write!(f, "Database error: {:?}", reason),
    }
  }
}

impl std::error::Error for ModelWeightError {}


pub async fn get_model_weight_for_voice_conversion_inference(
  pool: &MySqlPool,
  model_weight_token: &ModelWeightToken
) -> Result<Option<ModelWeightForVoiceConversionInference>, ModelWeightError>
{
  // NB: Lookup failure is Err(RowNotFound).
  // NB: Since this is publicly exposed, we don't query sensitive data.
  let maybe_model = sqlx::query_as!(
      InternalRecord,
        r#"
SELECT
    w.token as `token: tokens::tokens::model_weights::ModelWeightToken`,
    w.weights_type as `weights_type: enums_db::by_table::model_weights::weights_types::WeightsType`,

    w.title,
    vc.has_index_file,

    w.public_bucket_hash,
    w.maybe_public_bucket_prefix,
    w.maybe_public_bucket_extension,

    w.created_at,
    w.updated_at,
    w.user_deleted_at,
    w.mod_deleted_at

FROM model_weights as w
JOIN model_weights_extension_voice_conversion_details as vc
ON vc.model_weights_token = w.token

WHERE w.token = ?
        "#,
      model_weight_token
    )
      .fetch_one(pool)
      .await; // TODO: This will return error if it doesn't exist

  let model : InternalRecord = match maybe_model {
    Ok(model) => model,
    Err(err) => {
      return match err {
        sqlx::Error::RowNotFound => {
          Ok(None)
        },
        _ => {
          warn!("voice conversion model query error: {:?}", err);
          Err(ModelWeightError::DatabaseError {
            reason: format!("Mysql error: {:?}", err)
          })
        }
      }
    }
  };

  if model.mod_deleted_at.is_some() || model.user_deleted_at.is_some() {
    return Err(ModelWeightError::ModelDeleted);
  }

  Ok(Some(ModelWeightForVoiceConversionInference {
    token: model.token,
    weights_type: model.weights_type,
    title: model.title,
    has_index_file: i8_to_bool(model.has_index_file),
    public_bucket_hash: model.public_bucket_hash,
    maybe_public_bucket_prefix: model.maybe_public_bucket_prefix,
    maybe_public_bucket_extension: model.maybe_public_bucket_extension,
    created_at: model.created_at,
    updated_at: model.updated_at,
    mod_deleted_at: model.mod_deleted_at,
    user_deleted_at: model.user_deleted_at,
  }))
}

struct InternalRecord {
  token: ModelWeightToken,
  weights_type: WeightsType,

  title: String,

  has_index_file: i8,

  public_bucket_hash: String,
  maybe_public_bucket_prefix: Option<String>,
  maybe_public_bucket_extension: Option<String>,

  created_at: DateTime<Utc>,
  updated_at: DateTime<Utc>,
  mod_deleted_at: Option<DateTime<Utc>>,
  user_deleted_at: Option<DateTime<Utc>>,
}
