use std::path::PathBuf;

use chrono::{DateTime, Utc};
use sqlx::MySqlPool;

use bucket_paths::legacy::old_bespoke_paths::bucket_path_unifier::BucketPathUnifier;
use bucket_paths::legacy::typified_paths::public::weight_files::bucket_file_path::WeightFileBucketPath;
use enums::by_table::tts_models::tts_model_type::TtsModelType;
use mysql_queries::queries::model_weights::get::get_weight_for_legacy_tts_inference::{get_weight_for_legacy_tts_inference, ModelWeightForLegacyTtsInference};
use mysql_queries::queries::tts::tts_models::get_tts_model_for_inference_improved::{get_tts_model_for_inference_improved, CustomVocoderFields, TtsModelForInferenceError, TtsModelForInferenceRecord};
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::users::UserToken;

/// Get TTS model
/// This is for the inference inference job.
pub async fn get_tts_model_for_run_inference_migration(
  tts_model_token: &str,
  mysql_pool: &MySqlPool,
) -> Result<Option<TtsModelForRunInferenceMigrationWrapper>, TtsModelForInferenceError> {
  // NB: This is temporary migration code as we switch from the `tts_models` table to the `model_weights` table.
  if tts_model_token.starts_with(ModelWeightToken::token_prefix()) {
    let token = ModelWeightToken::new_from_str(tts_model_token);

    let maybe_model = get_weight_for_legacy_tts_inference(
      &token,
      mysql_pool
    ).await?;

    Ok(maybe_model.map(|model| TtsModelForRunInferenceMigrationWrapper::ModelWeight(model)))
  } else {

    let maybe_model = get_tts_model_for_inference_improved(
      mysql_pool,
      &tts_model_token,
    ).await?;

    Ok(maybe_model.map(|model| TtsModelForRunInferenceMigrationWrapper::LegacyTts(model)))
  }
}

/// Migration wrapper type.
/// Union over the legacy table and the new table to support an easier migration.
/// This enum can hold a record of either type and present a unified accessor interface.
#[derive(Clone)]
pub enum TtsModelForRunInferenceMigrationWrapper {
  /// Old type from the `tts_models` table, on the way out
  LegacyTts(TtsModelForInferenceRecord),
  /// New type, replacing the `tts_models` table.
  ModelWeight(ModelWeightForLegacyTtsInference),
}

impl TtsModelForRunInferenceMigrationWrapper {
  pub fn token(&self) -> &str {
    match self {
      Self::LegacyTts(ref model) => model.model_token.as_str(),
      Self::ModelWeight(ref model) => model.token.as_str(),
    }
  }

  pub fn title(&self) -> &str {
    match self {
      Self::LegacyTts(ref model) => &model.title,
      Self::ModelWeight(ref model) => &model.title,
    }
  }

  pub fn creator_user_token(&self) -> &UserToken {
    match self {
      Self::LegacyTts(ref model) => &model.creator_user_token,
      Self::ModelWeight(ref model) => &model.creator_user_token,
    }
  }

  pub fn creator_username(&self) -> &str {
    match self {
      Self::LegacyTts(ref model) => &model.creator_username,
      Self::ModelWeight(ref model) => &model.creator_username,
    }
  }

  pub fn creator_display_name(&self) -> &str {
    match self {
      Self::LegacyTts(ref model) => &model.creator_display_name,
      Self::ModelWeight(ref model) => &model.creator_display_name,
    }
  }

  pub fn created_at(&self) -> &DateTime<Utc> {
    match self {
      Self::LegacyTts(ref model) => &model.created_at,
      Self::ModelWeight(ref model) => &model.created_at,
    }
  }

  pub fn updated_at(&self) -> &DateTime<Utc> {
    match self {
      Self::LegacyTts(ref model) => &model.updated_at,
      Self::ModelWeight(ref model) => &model.updated_at,
    }
  }

  pub fn mod_deleted_at(&self) -> Option<&DateTime<Utc>> {
    match self {
      Self::LegacyTts(ref model) => model.mod_deleted_at.as_ref(),
      Self::ModelWeight(ref model) => model.mod_deleted_at.as_ref(),
    }
  }

  pub fn user_deleted_at(&self) -> Option<&DateTime<Utc>> {
    match self {
      Self::LegacyTts(ref model) => model.user_deleted_at.as_ref(),
      Self::ModelWeight(ref model) => model.user_deleted_at.as_ref(),
    }
  }

  pub fn tts_model_type(&self) -> TtsModelType {
    match self {
      Self::LegacyTts(ref model) => model.tts_model_type,
      Self::ModelWeight(ref _model) => TtsModelType::Tacotron2, // NB: Always TT2
    }
  }

  pub fn maybe_default_pretrained_vocoder(&self) -> Option<&str> {
    match self {
      Self::LegacyTts(ref model) => model.maybe_default_pretrained_vocoder.as_deref(),
      Self::ModelWeight(ref model) => model.maybe_default_pretrained_vocoder.as_deref(),
    }
  }

  /* NB(bt, 2024-01-20): Breakdown of the text_pipeline_type values in the DB:
  mysql> select text_pipeline_type , count(*) from tts_models group by text_pipeline_type ;
    +--------------------+----------+
    | text_pipeline_type | count(*) |
    +--------------------+----------+
    | NULL               |     4406 |
    | legacy_fakeyou     |     2572 |
    | english_v1         |     1548 |
    | spanish_v2         |      194 |
    +--------------------+----------+
   */
  pub fn text_pipeline_type(&self) -> Option<&str> {
    match self {
      Self::LegacyTts(ref model) => model.text_pipeline_type.as_deref(),
      Self::ModelWeight(ref model) => model.maybe_text_pipeline_type.as_deref(),
    }
  }

  pub fn use_default_mel_multiply_factor(&self) -> bool {
    match self {
      Self::LegacyTts(ref model) => model.use_default_mel_multiply_factor,
      Self::ModelWeight(ref model) => model.use_default_mel_multiply_factor,
    }
  }

  pub fn maybe_custom_mel_multiply_factor(&self) -> Option<f64> {
    match self {
      Self::LegacyTts(ref model) => model.maybe_custom_mel_multiply_factor,
      Self::ModelWeight(ref model) => model.maybe_custom_mel_multiply_factor,
    }
  }

  pub fn maybe_custom_vocoder(&self) -> Option<&CustomVocoderFields> {
    match self {
      Self::LegacyTts(ref model) => model.maybe_custom_vocoder.as_ref(),
      Self::ModelWeight(ref model) => model.maybe_custom_vocoder.as_ref(),
    }
  }

  /// Which bucket to download the weights from
  pub fn is_private_bucket(&self) -> bool {
    match self {
      Self::LegacyTts(ref _model) => true,
      Self::ModelWeight(ref _model) => false,
    }
  }

  /// Path to the weights in the bucket
  /// The old and new schemes are quite different.
  pub fn bucket_object_path(&self, bucket_path_unifier: &BucketPathUnifier) -> PathBuf {
    match self {
      Self::LegacyTts(ref model) => bucket_path_unifier.tts_synthesizer_path(&model.private_bucket_hash),
      Self::ModelWeight(ref model) => {
        let path = WeightFileBucketPath::from_object_hash(
          &model.public_bucket_hash,
          model.maybe_public_bucket_prefix.as_deref(),
          model.maybe_public_bucket_extension.as_deref());

        PathBuf::from(path.get_full_object_path_str())
      },
    }
  }

  // NB: Just for vits, which we never supported anyway
  pub fn vits_traced_synthesizer_object_path(&self, bucket_path_unifier: &BucketPathUnifier) -> PathBuf {
    match self {
      Self::LegacyTts(ref model) => bucket_path_unifier.tts_traced_synthesizer_path(&model.private_bucket_hash),
      Self::ModelWeight(ref _model) => PathBuf::from("VITS_UNSUPPORTED_FOR_MODEL_WEIGHTS"),
    }
  }
}
