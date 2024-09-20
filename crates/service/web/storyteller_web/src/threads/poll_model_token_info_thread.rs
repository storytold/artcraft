use std::time::Duration;

use log::{debug, error, info};
use sqlx::MySqlPool;

use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::by_table::generic_inference_jobs::inference_model_type::InferenceModelType;
use enums::by_table::model_weights::weights_types::WeightsType;
use enums::by_table::voice_conversion_models::voice_conversion_model_type::VoiceConversionModelType;
use errors::AnyhowResult;
use mysql_queries::queries::model_weights::model_weight_info_lite::list_model_weight_info_lite::list_model_weight_info_lite;
use mysql_queries::queries::voice_conversion::model_info_lite::list_voice_conversion_model_info_lite::list_voice_conversion_model_info_lite;

use crate::state::memory_cache::model_token_to_info_cache::{ModelInfoForInferenceJob, ModelTokenToInfoCache};

pub async fn poll_model_token_info_thread(
  model_token_info_cache: ModelTokenToInfoCache,
  mysql_pool: MySqlPool,
) {
  let startup_wait = easyenv::get_env_duration_seconds_or_default(
    "POLL_MODEL_TOKEN_STARTUP_WAIT_DURATION_SECS", Duration::from_secs(5));

  let between_wait = easyenv::get_env_duration_seconds_or_default(
    "POLL_MODEL_TOKEN_BETWEEN_WAIT_DURATION_SECS", Duration::from_secs(2));

  let error_wait = easyenv::get_env_duration_seconds_or_default(
    "POLL_MODEL_TOKEN_ERROR_WAIT_DURATION_SECS", Duration::from_secs(60));

  let interval_wait = easyenv::get_env_duration_seconds_or_default(
    "POLL_MODEL_TOKEN_INTERVAL_SECS", Duration::from_secs(10 * 60));

  tokio::time::sleep(startup_wait).await;

  loop {
    let token_info_items = match query_voice_conversion_models(&mysql_pool).await {
      Ok(infos) => infos,
      Err(err) => {
        error!("Error polling voice conversion model token info: {:?}", err);
        tokio::time::sleep(error_wait).await;
        continue;
      }
    };

    let database_count = token_info_items.len();

    info!("Job found {} model token info items from database.", database_count);

    if let Err(err) = model_token_info_cache.insert_many(token_info_items) {
      error!("Error inserting model token info: {:?}", err);
    }

    tokio::time::sleep(between_wait).await;

    let token_info_items = match query_model_weight_models(&mysql_pool).await {
      Ok(infos) => infos,
      Err(err) => {
        error!("Error polling model weight token info: {:?}", err);
        tokio::time::sleep(error_wait).await;
        continue;
      }
    };

    let database_count = token_info_items.len();

    info!("Job found {} model token info items from database.", database_count);

    if let Err(err) = model_token_info_cache.insert_many(token_info_items) {
      error!("Error inserting model token info: {:?}", err);
    }

    tokio::time::sleep(interval_wait).await;
  }
}

async fn query_voice_conversion_models(mysql_pool: &MySqlPool)
  -> AnyhowResult<Vec<(String, ModelInfoForInferenceJob)>>
{
  debug!("Job fetching voice conversion model token info...");

  let token_infos =
      list_voice_conversion_model_info_lite(&mysql_pool).await?;

  let mut token_info_items = Vec::with_capacity(token_infos.len());

  for token_info in token_infos.into_iter() {
    let model_type = match token_info.model_type {
      VoiceConversionModelType::RvcV2 => InferenceModelType::RvcV2,
      VoiceConversionModelType::SoVitsSvc => InferenceModelType::SoVitsSvc,
      VoiceConversionModelType::SoftVc => {
        continue // NB: SoftVC is not supported.
      },
    };

    let info = ModelInfoForInferenceJob {
      job_inference_category: InferenceCategory::VoiceConversion,
      job_model_type: model_type,
    };

    token_info_items.push((token_info.token.to_string(), info));
  }

  Ok(token_info_items)
}

async fn query_model_weight_models(mysql_pool: &MySqlPool)
  -> AnyhowResult<Vec<(String, ModelInfoForInferenceJob)>>
{
  debug!("Job fetching model weight token info...");

  let token_infos =
      list_model_weight_info_lite(&mysql_pool).await?;

  let mut token_info_items = Vec::with_capacity(token_infos.len());

  for token_info in token_infos.into_iter() {
    let (inference_category, inference_model_type) = match token_info.weights_type {
      WeightsType::RvcV2 => (InferenceCategory::VoiceConversion, InferenceModelType::RvcV2),
      WeightsType::SoVitsSvc => (InferenceCategory::VoiceConversion, InferenceModelType::SoVitsSvc),
      WeightsType::Tacotron2 => (InferenceCategory::TextToSpeech, InferenceModelType::Tacotron2),
      WeightsType::HifiganTacotron2 => continue, // Not supported for inference
      WeightsType::StableDiffusion15 => continue, // TODO(bt,2023-12-18): Not yet set up with enums for inference
      WeightsType::StableDiffusionXL => continue, // TODO(bt,2023-12-18): Not yet set up with enums for inference
      WeightsType::LoRA => continue, // TODO(bt,2023-12-18): Not yet set up with enums for inference
      WeightsType::VallE => continue, // TODO(bt,2023-12-18): ??? We have vall-e weights?? Not sure what this means yet.
      WeightsType::ComfyUi => continue, // Not supported for inference
      WeightsType::GptSoVits => continue, // TODO: FIXME
    };

    let info = ModelInfoForInferenceJob {
      job_inference_category: inference_category,
      job_model_type: inference_model_type,
    };

    token_info_items.push((token_info.token.to_string(), info));
  }

  Ok(token_info_items)
}
