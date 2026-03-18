use chrono::{DateTime, Utc};
use sqlx::MySql;
use sqlx::pool::PoolConnection;

use enums::by_table::model_weights::weights_types::WeightsType;
use enums::by_table::voice_conversion_models::voice_conversion_model_type::VoiceConversionModelType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use mysql_queries::queries::model_weights::list::list_model_weights_for_voice_conversion::{list_model_weights_for_voice_conversion, ModelWeightForVoiceConversion};
use mysql_queries::queries::voice_conversion::models::list_voice_conversion_models::{list_voice_conversion_models_with_connection, VoiceConversionModelRecordForList};
use tokens::tokens::users::UserToken;

/// List VC models
/// This is for the voice conversion model list page.
/// Since we're listing, we have to use a flag to determine which query to perform.
pub async fn list_vc_models_for_migration(
  mysql_connection: &mut PoolConnection<MySql>,
  use_weights_table: bool,
) -> AnyhowResult<Vec<VcModelForList>> {
  // NB: This is temporary migration code as we switch from the `voice_conversion_models` table to the `model_weights` table.
  if use_weights_table {
    let models = list_model_weights_for_voice_conversion(
      mysql_connection).await?;

    Ok(models.into_iter()
        .map(|model| VcModelForList::ModelWeight(model))
        .collect())

  } else {
    let models = list_voice_conversion_models_with_connection(
      mysql_connection, None).await?;

    Ok(models.into_iter()
        .map(|model| VcModelForList::LegacyVoiceConversion(model))
        .collect())
  }
}

/// Union over the legacy table and the new table to support an easier migration.
/// This enum can hold a record of either type and present a unified accessor interface.
#[derive(Clone)]
pub enum VcModelForList {
  /// Old type from the `voice_conversion_models` table, on the way out
  LegacyVoiceConversion(VoiceConversionModelRecordForList),
  /// New type, replacing the `voice_conversion_models` table.
  ModelWeight(ModelWeightForVoiceConversion),
}

impl VcModelForList {
  pub fn token(&self) -> &str {
    match self {
      VcModelForList::LegacyVoiceConversion(ref model) => model.token.as_str(),
      VcModelForList::ModelWeight(ref model) => model.token.as_str(),
    }
  }

  pub fn legacy_voice_conversion_model_type(&self) -> Option<VoiceConversionModelType> {
    match self {
      VcModelForList::LegacyVoiceConversion(ref model) => Some(model.model_type),
      VcModelForList::ModelWeight(ref model) => match model.weight_type {
        WeightsType::SoVitsSvc => Some(VoiceConversionModelType::SoVitsSvc),
        WeightsType::RvcV2 => Some(VoiceConversionModelType::RvcV2),
        // NB: The following weights are not voice conversion models.
        WeightsType::HifiganTacotron2 => None,
        WeightsType::StableDiffusion15 => None,
        WeightsType::StableDiffusionXL => None,
        WeightsType::Tacotron2 => None,
        WeightsType::LoRA => None,
        WeightsType::VallE => None,
        WeightsType::ComfyUi => None,
        WeightsType::GptSoVits => None,
      },
    }
  }

  pub fn is_voice_conversion_model(&self) -> bool {
    self.legacy_voice_conversion_model_type().is_some()
  }

  pub fn title(&self) -> &str {
    match self {
      VcModelForList::LegacyVoiceConversion(ref model) => &model.title,
      VcModelForList::ModelWeight(ref model) => &model.title,
    }
  }

  pub fn ietf_language_tag(&self) -> &str {
    match self {
      VcModelForList::LegacyVoiceConversion(ref model) => &model.ietf_language_tag,
      VcModelForList::ModelWeight(ref model) => &model.ietf_language_tag,
    }
  }

  pub fn ietf_primary_language_subtag(&self) -> &str {
    match self {
      VcModelForList::LegacyVoiceConversion(ref model) => &model.ietf_primary_language_subtag,
      VcModelForList::ModelWeight(ref model) => &model.ietf_primary_language_subtag,
    }
  }

  pub fn creator_user_token(&self) -> &UserToken {
    match self {
      VcModelForList::LegacyVoiceConversion(ref model) => &model.creator_user_token,
      VcModelForList::ModelWeight(ref model) => &model.creator_user_token,
    }
  }

  pub fn creator_username(&self) -> &str {
    match self {
      VcModelForList::LegacyVoiceConversion(ref model) => &model.creator_username,
      VcModelForList::ModelWeight(ref model) => &model.creator_username,
    }
  }

  pub fn creator_display_name(&self) -> &str {
    match self {
      VcModelForList::LegacyVoiceConversion(ref model) => &model.creator_display_name,
      VcModelForList::ModelWeight(ref model) => &model.creator_display_name,
    }
  }

  pub fn creator_gravatar_hash(&self) -> &str {
    match self {
      VcModelForList::LegacyVoiceConversion(ref model) => &model.creator_gravatar_hash,
      VcModelForList::ModelWeight(ref model) => &model.creator_gravatar_hash,
    }
  }

  pub fn creator_set_visibility(&self) -> Visibility{
    match self {
      VcModelForList::LegacyVoiceConversion(ref model) => model.creator_set_visibility,
      VcModelForList::ModelWeight(ref model) => model.creator_set_visibility,
    }
  }

  pub fn created_at(&self) -> &DateTime<Utc> {
    match self {
      VcModelForList::LegacyVoiceConversion(ref model) => &model.created_at,
      VcModelForList::ModelWeight(ref model) => &model.created_at,
    }
  }

  pub fn updated_at(&self) -> &DateTime<Utc> {
    match self {
      VcModelForList::LegacyVoiceConversion(ref model) => &model.updated_at,
      VcModelForList::ModelWeight(ref model) => &model.updated_at,
    }
  }
}
