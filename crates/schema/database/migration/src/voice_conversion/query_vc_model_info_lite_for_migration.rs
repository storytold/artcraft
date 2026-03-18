use sqlx::{MySql, MySqlPool};
use sqlx::pool::PoolConnection;

use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::by_table::generic_inference_jobs::inference_model_type::InferenceModelType;
use enums::by_table::model_weights::weights_types::WeightsType;
use enums::by_table::voice_conversion_models::voice_conversion_model_type::VoiceConversionModelType;
use errors::AnyhowResult;
use mysql_queries::queries::model_weights::model_weight_info_lite::get_model_weight_info_lite::get_model_weight_info_lite_with_connection;
use mysql_queries::queries::model_weights::model_weight_info_lite::model_weight_info_lite::ModelWeightInfoLite;
use mysql_queries::queries::voice_conversion::model_info_lite::get_voice_conversion_model_info_lite::get_voice_conversion_model_info_lite_with_connection;
use mysql_queries::queries::voice_conversion::model_info_lite::model_info_lite::VoiceConversionModelInfoLite;
use tokens::tokens::model_weights::ModelWeightToken;

/// Query "light info" for models.
/// This is typically used for in-memory token-to-type caches.
pub async fn query_vc_model_info_lite_for_migration(model_token: &str, mysql_pool: &MySqlPool) -> AnyhowResult<Option<VcModelLite>> {
  let mut connection = mysql_pool.acquire().await?;
  query_vc_model_info_lite_for_migration_with_connection(model_token, &mut connection).await
}

/// Query "light info" for models.
/// This is typically used for in-memory token-to-type caches.
pub async fn query_vc_model_info_lite_for_migration_with_connection(
  model_token: &str,
  mysql_connection: &mut PoolConnection<MySql>
) -> AnyhowResult<Option<VcModelLite>> {
  // NB: This is temporary migration code as we switch from the `voice_conversion_models` table to the `model_weights` table.
  if model_token.starts_with(ModelWeightToken::token_prefix()) {
    let model_weights_token = ModelWeightToken::new_from_str(model_token);

    let maybe_model = get_model_weight_info_lite_with_connection(
      &model_weights_token, mysql_connection).await?;

    Ok(maybe_model.map(|model| VcModelLite::ModelWeight(model)))

  } else {
    let maybe_vc_model = get_voice_conversion_model_info_lite_with_connection(
      model_token, mysql_connection).await?;

    Ok(maybe_vc_model.map(|model| VcModelLite::LegacyVoiceConversion(model)))
  }
}


/// Union over the legacy table and the new table to support an easier migration.
/// This enum can hold a record of either type and present a unified accessor interface.
#[derive(Clone, Debug)]
pub enum VcModelLite {
  /// Old type from the `voice_conversion_models` table, on the way out
  LegacyVoiceConversion(VoiceConversionModelInfoLite),
  /// New type, replacing the `voice_conversion_models` table.
  ModelWeight(ModelWeightInfoLite),
}

impl VcModelLite {
  pub fn get_model_token(&self) -> &str {
    match self {
      VcModelLite::LegacyVoiceConversion(ref model) => model.token.as_str(),
      VcModelLite::ModelWeight(ref model) => model.token.as_str(),
    }
  }

  pub fn get_inference_category(&self) -> Option<InferenceCategory> {
    match self {
      VcModelLite::LegacyVoiceConversion(ref model) => match model.model_type {
        VoiceConversionModelType::RvcV2 => Some(InferenceCategory::VoiceConversion),
        VoiceConversionModelType::SoftVc => Some(InferenceCategory::VoiceConversion),
        VoiceConversionModelType::SoVitsSvc => Some(InferenceCategory::VoiceConversion),
      }
      VcModelLite::ModelWeight(ref model) => match model.weights_type {
        WeightsType::SoVitsSvc => Some(InferenceCategory::VoiceConversion),
        WeightsType::RvcV2 => Some(InferenceCategory::VoiceConversion),
        WeightsType::Tacotron2 => Some(InferenceCategory::TextToSpeech),
        WeightsType::StableDiffusion15 => None, // TODO(bt,2023-12-18): New category for image generation
        WeightsType::StableDiffusionXL => None, // TODO(bt,2023-12-18): New category for image generation
        WeightsType::HifiganTacotron2 => None, // NB: Not used directly in inference. Included by other models.
        WeightsType::LoRA => None, // NB: not used directly in inference. Included in other models.
        WeightsType::VallE => None, // TODO(bt,2023-12-18): Does this mean speaker weights?
        WeightsType::ComfyUi => None, // NB: not used directly in inference. Included in other models.
        WeightsType::GptSoVits => None, // TODO: Fixme
      }
    }
  }

  pub fn get_inference_model_type(&self) -> Option<InferenceModelType> {
    match self {
      VcModelLite::LegacyVoiceConversion(ref model) => match model.model_type {
        VoiceConversionModelType::RvcV2 => Some(InferenceModelType::RvcV2),
        VoiceConversionModelType::SoftVc => None, // NB: Not supported.
        VoiceConversionModelType::SoVitsSvc => Some(InferenceModelType::SoVitsSvc),
      }
      VcModelLite::ModelWeight(ref model) => match model.weights_type {
        WeightsType::SoVitsSvc => Some(InferenceModelType::SoVitsSvc),
        WeightsType::RvcV2 => Some(InferenceModelType::RvcV2),
        WeightsType::Tacotron2 => Some(InferenceModelType::Tacotron2),
        WeightsType::StableDiffusion15 => None, // TODO(bt, 2023-12-18): New model type for image generation
        WeightsType::StableDiffusionXL => None, // TODO(bt, 2023-12-18): New model type for image generation
        WeightsType::HifiganTacotron2 => None, // NB: Not used directly in inference. Included by other models.
        WeightsType::LoRA => None, // NB: not used directly in inference. Included in other models.
        WeightsType::VallE => None, // TODO(bt,2023-12-18): Does this mean speaker weights?
        WeightsType::ComfyUi => None, // NB: not used directly in inference. Included in other models.
        WeightsType::GptSoVits => None, // TODO: Fixme
      }
    }
  }
}


#[cfg(test)]
mod tests {

  mod legacy_voice_conversion_models {
    use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
    use enums::by_table::generic_inference_jobs::inference_model_type::InferenceModelType;
    use enums::by_table::voice_conversion_models::voice_conversion_model_type::VoiceConversionModelType;
    use mysql_queries::queries::voice_conversion::model_info_lite::model_info_lite::VoiceConversionModelInfoLite;
    use tokens::tokens::voice_conversion_models::VoiceConversionModelToken;

    use crate::voice_conversion::query_vc_model_info_lite_for_migration::VcModelLite;

    fn default_model() -> VoiceConversionModelInfoLite {
      // NB: We could implement/derive the default trait, but this works just as well for now.
      VoiceConversionModelInfoLite {
        token: VoiceConversionModelToken::new_from_str("vcm_entropy"),
        model_type: VoiceConversionModelType::RvcV2,
      }
    }

    #[test]
    fn get_model_token() {
      let model = default_model();
      assert_eq!(VcModelLite::LegacyVoiceConversion(model).get_model_token(), "vcm_entropy");
    }

    #[test]
    fn get_inference_category() {
      let mut model = default_model();
      model.model_type = VoiceConversionModelType::RvcV2;
      assert_eq!(VcModelLite::LegacyVoiceConversion(model).get_inference_category(), Some(InferenceCategory::VoiceConversion));

      let mut model = default_model();
      model.model_type = VoiceConversionModelType::SoVitsSvc;
      assert_eq!(VcModelLite::LegacyVoiceConversion(model).get_inference_category(), Some(InferenceCategory::VoiceConversion));

      let mut model = default_model();
      model.model_type = VoiceConversionModelType::SoftVc;
      assert_eq!(VcModelLite::LegacyVoiceConversion(model).get_inference_category(), Some(InferenceCategory::VoiceConversion));
    }

    #[test]
    fn get_inference_model_type() {
      let mut model = default_model();
      model.model_type = VoiceConversionModelType::RvcV2;
      assert_eq!(VcModelLite::LegacyVoiceConversion(model).get_inference_model_type(), Some(InferenceModelType::RvcV2));

      let mut model = default_model();
      model.model_type = VoiceConversionModelType::SoVitsSvc;
      assert_eq!(VcModelLite::LegacyVoiceConversion(model).get_inference_model_type(), Some(InferenceModelType::SoVitsSvc));

      let mut model = default_model();
      model.model_type = VoiceConversionModelType::SoftVc;
      assert_eq!(VcModelLite::LegacyVoiceConversion(model).get_inference_model_type(), None);
    }
  }

  mod new_model_weights {
    use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
    use enums::by_table::generic_inference_jobs::inference_model_type::InferenceModelType;
    use enums::by_table::model_weights::weights_types::WeightsType;
    use mysql_queries::queries::model_weights::model_weight_info_lite::model_weight_info_lite::ModelWeightInfoLite;
    use tokens::tokens::model_weights::ModelWeightToken;

    use crate::voice_conversion::query_vc_model_info_lite_for_migration::VcModelLite;

    fn default_model() -> ModelWeightInfoLite {
      // NB: We could implement/derive the default trait, but this works just as well for now.
      ModelWeightInfoLite {
        token: ModelWeightToken::new_from_str("weight_entropy"),
        weights_type: WeightsType::RvcV2,
      }
    }

    #[test]
    fn get_model_token() {
      let model = default_model();
      assert_eq!(VcModelLite::ModelWeight(model).get_model_token(), "weight_entropy");
    }

    #[test]
    fn get_inference_category() {
      let mut model = default_model();
      model.weights_type = WeightsType::RvcV2;
      assert_eq!(VcModelLite::ModelWeight(model).get_inference_category(), Some(InferenceCategory::VoiceConversion));

      let mut model = default_model();
      model.weights_type = WeightsType::SoVitsSvc;
      assert_eq!(VcModelLite::ModelWeight(model).get_inference_category(), Some(InferenceCategory::VoiceConversion));

      let mut model = default_model();
      model.weights_type = WeightsType::Tacotron2;
      assert_eq!(VcModelLite::ModelWeight(model).get_inference_category(), Some(InferenceCategory::TextToSpeech));

      let mut model = default_model();
      model.weights_type = WeightsType::StableDiffusion15;
      assert_eq!(VcModelLite::ModelWeight(model).get_inference_category(), None);
    }

    #[test]
    fn get_inference_model_type() {
      let mut model = default_model();
      model.weights_type = WeightsType::RvcV2;
      assert_eq!(VcModelLite::ModelWeight(model).get_inference_model_type(), Some(InferenceModelType::RvcV2));

      let mut model = default_model();
      model.weights_type = WeightsType::SoVitsSvc;
      assert_eq!(VcModelLite::ModelWeight(model).get_inference_model_type(), Some(InferenceModelType::SoVitsSvc));

      let mut model = default_model();
      model.weights_type = WeightsType::StableDiffusion15;
      assert_eq!(VcModelLite::ModelWeight(model).get_inference_model_type(), None);
    }
  }
}
