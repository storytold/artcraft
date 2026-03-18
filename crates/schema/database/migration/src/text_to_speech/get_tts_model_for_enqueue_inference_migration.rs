use serde_derive::{Deserialize, Serialize};
use sqlx::MySql;
use sqlx::pool::PoolConnection;

use enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;
use enums::by_table::model_weights::weights_types::WeightsType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use mysql_queries::queries::model_weights::get::get_weight_for_legacy_tts_enqueue::{get_weight_for_legacy_tts_enqueue_with_connection, ModelWeightForLegacyTtsEnqueue};
use mysql_queries::queries::tts::tts_models::get_tts_model::{get_tts_model_by_token_using_connection, TtsModelRecord};
use tokens::tokens::model_weights::ModelWeightToken;

/// Get TTS model
/// This is for the tts inference page.
pub async fn get_tts_model_for_enqueue_inference_migration(
  token: &str,
  mysql_connection: &mut PoolConnection<MySql>,
  can_see_deleted: bool,
) -> AnyhowResult<Option<TtsModelForEnqueueInferenceMigrationWrapper>> {
  // NB: This is temporary migration code as we switch from the `tts_models` table to the `model_weights` table.
  let use_weights_table = token.starts_with(ModelWeightToken::token_prefix());

  if use_weights_table {
    let token = ModelWeightToken::new_from_str(token);

    let maybe_model = get_weight_for_legacy_tts_enqueue_with_connection(
      &token,
      can_see_deleted,
      mysql_connection
    ).await?;

    Ok(maybe_model.map(|model| TtsModelForEnqueueInferenceMigrationWrapper::ModelWeight(model)))

  } else {

    let maybe_model = get_tts_model_by_token_using_connection(
      &token,
      true,
      mysql_connection
    ).await?;

    Ok(maybe_model.map(|model| TtsModelForEnqueueInferenceMigrationWrapper::LegacyTts(model)))
  }
}

/// Union over the legacy table and the new table to support an easier migration.
/// This enum can hold a record of either type and present a unified accessor interface.
#[derive(Clone, Serialize, Deserialize)]
pub enum TtsModelForEnqueueInferenceMigrationWrapper {
  /// Old type from the `tts_models` table, on the way out
  LegacyTts(TtsModelRecord),
  /// New type, replacing the `tts_models` table.
  ModelWeight(ModelWeightForLegacyTtsEnqueue),
}

impl TtsModelForEnqueueInferenceMigrationWrapper {
  pub fn token(&self) -> &str {
    match self {
      Self::LegacyTts(ref model) => model.model_token.as_str(),
      Self::ModelWeight(ref model) => model.token.as_str(),
    }
  }

  pub fn creator_user_token(&self) -> &str {
    match self {
      Self::LegacyTts(ref model) => &model.creator_user_token,
      Self::ModelWeight(ref model) => model.creator_user_token.as_str(),
    }
  }

  pub fn creator_set_visibility(&self) -> Visibility{
    match self {
      Self::LegacyTts(ref model) => model.creator_set_visibility,
      Self::ModelWeight(ref model) => model.creator_set_visibility,
    }
  }

  pub fn job_type(&self) -> InferenceJobType {
    match self {
      Self::LegacyTts(_) => InferenceJobType::Tacotron2,
      Self::ModelWeight(ref model) => match model.weights_type {
        WeightsType::Tacotron2 => InferenceJobType::Tacotron2,
        WeightsType::GptSoVits => InferenceJobType::GptSovits,
        _ => InferenceJobType::Tacotron2,
      }
    }
  }
}
