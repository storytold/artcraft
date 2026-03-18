use chrono::{DateTime, Utc};
use serde_derive::{Deserialize, Serialize};
use sqlx::MySql;
use sqlx::pool::PoolConnection;

use enums::by_table::tts_models::tts_model_type::TtsModelType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use mysql_queries::column_types::vocoder_type::VocoderType;
use mysql_queries::queries::model_weights::get::get_weight_for_legacy_tts_info::{get_weight_for_legacy_tts_info_with_connection, ModelWeightForLegacyTtsInfo};
use mysql_queries::queries::model_weights::get::get_weight_for_legacy_tts_info_with_legacy_tts_token::get_weight_for_legacy_tts_info_with_legacy_tts_token_with_connection;
use mysql_queries::queries::tts::tts_models::get_tts_model::{get_tts_model_by_token_using_connection, TtsModelRecord};
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::tts_models::TtsModelToken;

/// Get TTS model
/// This is for the tts model info page
pub async fn get_tts_model_info_migration(
  token: &str,
  mysql_connection: &mut PoolConnection<MySql>,
  can_see_deleted: bool,
  use_weights_table: bool,
) -> AnyhowResult<Option<TtsModelInfoMigrationWrapper>> {
  // NB: This is temporary migration code as we switch from the `tts_models` table to the `model_weights` table.
  if use_weights_table {

    let maybe_model;

    if token.starts_with(TtsModelToken::token_prefix()) {
      let token = TtsModelToken::new_from_str(token);

      maybe_model = get_weight_for_legacy_tts_info_with_legacy_tts_token_with_connection(
        &token,
        can_see_deleted,
        mysql_connection
      ).await?;
    } else {
      let token = ModelWeightToken::new_from_str(token);

      maybe_model = get_weight_for_legacy_tts_info_with_connection(
        &token,
        can_see_deleted,
        mysql_connection
      ).await?;
    }

    Ok(maybe_model.map(|model| TtsModelInfoMigrationWrapper::ModelWeight(model)))

  } else {
    let maybe_model = get_tts_model_by_token_using_connection(
      &token,
      true,
      mysql_connection
    ).await?;

    Ok(maybe_model.map(|model| TtsModelInfoMigrationWrapper::LegacyTts(model)))
  }
}

/// Union over the legacy table and the new table to support an easier migration.
/// This enum can hold a record of either type and present a unified accessor interface.
#[derive(Clone, Serialize, Deserialize)]
pub enum TtsModelInfoMigrationWrapper {
  /// Old type from the `tts_models` table, on the way out
  LegacyTts(TtsModelRecord),
  /// New type, replacing the `tts_models` table.
  ModelWeight(ModelWeightForLegacyTtsInfo),
}

impl TtsModelInfoMigrationWrapper {
  pub fn token(&self) -> &str {
    match self {
      Self::LegacyTts(ref model) => model.model_token.as_str(),
      Self::ModelWeight(ref model) => model.token.as_str(),
    }
  }

  pub fn maybe_migration_new_model_weights_token(&self) -> Option<&ModelWeightToken> {
    match self {
      Self::LegacyTts(ref model) => model.maybe_migration_new_model_weights_token.as_ref(),
      Self::ModelWeight(ref model) => Some(&model.token),
    }
  }

  pub fn title(&self) -> &str {
    match self {
      Self::LegacyTts(ref model) => &model.title,
      Self::ModelWeight(ref model) => &model.title,
    }
  }

  pub fn ietf_language_tag(&self) -> &str {
    match self {
      Self::LegacyTts(ref model) => &model.ietf_language_tag,
      Self::ModelWeight(ref model) => model.maybe_ietf_language_tag.as_deref().unwrap_or("en"),
    }
  }

  pub fn ietf_primary_language_subtag(&self) -> &str {
    match self {
      Self::LegacyTts(ref model) => &model.ietf_primary_language_subtag,
      Self::ModelWeight(ref model) => model.maybe_ietf_primary_language_subtag.as_deref().unwrap_or("en"),
    }
  }

  pub fn creator_user_token(&self) -> &str {
    match self {
      Self::LegacyTts(ref model) => &model.creator_user_token,
      Self::ModelWeight(ref model) => model.creator_user_token.as_str(),
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

  pub fn creator_gravatar_hash(&self) -> &str {
    match self {
      Self::LegacyTts(ref model) => &model.creator_gravatar_hash,
      Self::ModelWeight(ref model) => &model.creator_gravatar_hash,
    }
  }

  pub fn creator_set_visibility(&self) -> Visibility{
    match self {
      Self::LegacyTts(ref model) => model.creator_set_visibility,
      Self::ModelWeight(ref model) => model.creator_set_visibility,
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

  // Not supported in the new table
  pub fn is_front_page_featured(&self) -> bool {
    match self {
      Self::LegacyTts(ref model) => model.is_front_page_featured,
      Self::ModelWeight(ref _model) => false,
    }
  }

  // Not supported in the new table
  pub fn is_twitch_featured(&self) -> bool {
    match self {
      Self::LegacyTts(ref model) => model.is_twitch_featured,
      Self::ModelWeight(ref _model) => false,
    }
  }

  // Not supported in the new table
  pub fn is_locked_from_use(&self) -> bool {
    match self {
      Self::LegacyTts(ref model) => model.is_locked_from_use,
      Self::ModelWeight(ref _model) => false,
    }
  }

  // Not supported in the new table
  pub fn is_locked_from_user_modification(&self) -> bool {
    match self {
      Self::LegacyTts(ref model) => model.is_locked_from_user_modification,
      Self::ModelWeight(ref _model) => false,
    }
  }

  // Not supported in the new table
  pub fn user_ratings_positive_count(&self) -> u32 {
    match self {
      Self::LegacyTts(ref model) => model.user_ratings_positive_count,
      Self::ModelWeight(ref _model) => 0,
    }
  }

  // Not supported in the new table
  pub fn user_ratings_negative_count(&self) -> u32 {
    match self {
      Self::LegacyTts(ref model) => model.user_ratings_negative_count,
      Self::ModelWeight(ref _model) => 0,
    }
  }

  // Not supported in the new table
  pub fn user_ratings_total_count(&self) -> u32 {
    match self {
      Self::LegacyTts(ref model) => model.user_ratings_total_count,
      Self::ModelWeight(ref _model) => 0,
    }
  }

  // Not supported in the new table
  pub fn maybe_suggested_unique_bot_command(&self) -> Option<&str> {
    match self {
      Self::LegacyTts(ref model) => model.maybe_suggested_unique_bot_command.as_deref(),
      Self::ModelWeight(ref _model) => None,
    }
  }

  pub fn tts_model_type(&self) -> TtsModelType {
    match self {
      Self::LegacyTts(ref model) => model.tts_model_type,
      Self::ModelWeight(ref _model) => TtsModelType::Tacotron2, // NB: Always TT2
    }
  }

  pub fn description_markdown(&self) -> &str {
    match self {
      Self::LegacyTts(ref model) => &model.description_markdown,
      Self::ModelWeight(ref model) => &model.maybe_description_markdown.as_deref().unwrap_or(""),
    }
  }

  pub fn description_rendered_html(&self) -> &str {
    match self {
      Self::LegacyTts(ref model) => &model.description_rendered_html,
      Self::ModelWeight(ref model) => &model.maybe_description_rendered_html.as_deref().unwrap_or(""),
    }
  }

  pub fn maybe_default_pretrained_vocoder(&self) -> Option<VocoderType> {
    match self {
      Self::LegacyTts(ref model) => model.maybe_default_pretrained_vocoder,
      Self::ModelWeight(ref model) => model.maybe_default_pretrained_vocoder,
    }
  }

  pub fn text_preprocessing_algorithm(&self) -> &str {
    match self {
      Self::LegacyTts(ref model) => &model.text_preprocessing_algorithm,
      Self::ModelWeight(ref _model) => "basic", // NB: All records in the DB are "basic"
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
}
