// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::sync::Arc;

use actix_web::web::Path;
use actix_web::{web, HttpRequest};
use chrono::{DateTime, Utc};
use log::warn;

use crate::http_server::common_responses::user_avatars::default_avatar_color_from_username::default_avatar_color_from_username;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::common_responses::user_avatars::default_avatar_from_username::default_avatar_from_username;
use enums::by_table::tts_models::tts_model_type::TtsModelType;
use enums::common::visibility::Visibility;
use migration::text_to_speech::get_tts_model_info_migration::get_tts_model_info_migration;
use mysql_queries::column_types::vocoder_type::VocoderType;
use redis_common::redis_cache_keys::RedisCacheKeys;
use tokens::tokens::model_weights::ModelWeightToken;
use tts_common::text_pipelines::guess_pipeline::guess_text_pipeline_heuristic;
use tts_common::text_pipelines::text_pipeline_type::TextPipelineType;

use crate::state::server_state::ServerState;
use crate::util::title_to_url_slug::title_to_url_slug;
// =============== Request ===============

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct GetTtsModelPathInfo {
  token: String,
}

// =============== Success Response ===============

#[derive(Serialize)]
pub struct GetTtsModelSuccessResponse {
  pub success: bool,
  pub model: TtsModelInfo,
}

/// Publicly exposed TTS model fields.
#[derive(Serialize)]
pub struct TtsModelInfo {
  pub model_token: String,
  pub tts_model_type: TtsModelType,

  /// Named text pipeline/algorithm, eg. "legacy_fakeyou", "english_v1", "spanish_v2", etc.
  ///
  /// >> NB: text_pipeline_type may not always be present in the database, but if absent we'll
  /// inform the frontend (and inference pipeline) of our best guess according to a heuristic.
  pub text_pipeline_type: Option<TextPipelineType>,
  pub text_pipeline_type_guess: TextPipelineType,
  pub text_preprocessing_algorithm: String,

  /// [vocoders 1]
  /// This is the new type of vocoder configuration. Users can choose a custom trained
  /// vocoder to associate with their model. The tokens reference the `vocoder_models`
  /// table.
  pub maybe_custom_vocoder: Option<CustomVocoderInfo>,

  /// [vocoders 2]
  /// This is the old type of vocoder configuration, which leverages old pretrained
  /// vocoders that we manually uploaded. There aren't many good options for users to
  /// choose here, so this should be treated as a legacy option going forward. We'll
  /// likely be stuck with this configuration for some time, however, due to the large
  /// collection of legacy models we have.
  pub maybe_default_pretrained_vocoder: Option<VocoderType>,

  pub creator_user_token: String,
  pub creator_username: String,
  pub creator_display_name: String,
  pub creator_gravatar_hash: String,
  pub creator_default_avatar_index: u8,
  pub creator_default_avatar_color_index: u8,

  pub title: String,
  pub description_markdown: String,
  pub description_rendered_html: String,

  pub ietf_language_tag: String,
  pub ietf_primary_language_subtag: String,

  pub is_front_page_featured: bool,
  pub is_twitch_featured: bool,

  pub maybe_suggested_unique_bot_command: Option<String>,

  pub user_ratings: UserRatingsStats,

  pub creator_set_visibility: Visibility,

  pub is_locked_from_use: bool,
  pub is_locked_from_user_modification: bool,

  /// We've migrated tts_models records (prefixed with TM:) to model_weights records (prefixed with weight_)
  /// This is the new token for old TTS records, assuming the user called the legacy API with a legacy token.
  /// If this endpoint is called with a new model_weight token, we simply return the canonical token here.
  pub maybe_migration_new_model_weights_token: Option<ModelWeightToken>,

  /// Optional SEO-friendly URL slug for the model weight.
  /// This is so we can tell Google the canonical new URL for the model.
  pub maybe_url_slug: Option<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  /// NB: Moderator fields are sensitive and should only be displayed for moderators!
  pub maybe_moderator_fields: Option<TtsModelModeratorFieldInfo>,
}

/// New vocoder configuration options.
#[derive(Serialize)]
pub struct CustomVocoderInfo {
  pub vocoder_token: String,
  pub vocoder_title: String,
  pub creator_user_token: String,
  pub creator_username: String,
  pub creator_display_name: String,
  pub creator_gravatar_hash: String,
}

#[derive(Serialize)]
pub struct UserRatingsStats {
  pub positive_count: u32,
  pub negative_count: u32,
  /// Total count does not take into account "neutral" ratings.
  pub total_count: u32,
}

/// "Moderator-only fields" that we wouldn't want to expose to ordinary users.
/// It's the web endpoint controller's responsibility to clear these for non-mods.
#[derive(Serialize)]
pub struct TtsModelModeratorFieldInfo {
  // Moderator-set mel multiply factors
  // These fields are misleadingly named just in case a competitor is snooping the javascript.
  pub use_default_m_factor: bool,
  pub maybe_custom_m_factor: Option<f64>,

  pub creator_is_banned: bool,
  pub creator_ip_address_creation: String,
  pub creator_ip_address_last_update: String,
  pub user_deleted_at: Option<DateTime<Utc>>,
  pub mod_deleted_at: Option<DateTime<Utc>>,
}

// =============== Error Response ===============
// NB: Not using derive_more::Display since Clion doesn't understand it.
// =============== Handler ===============

pub async fn get_tts_model_handler(
  http_request: HttpRequest,
  path: Path<GetTtsModelPathInfo>,
  server_state: web::Data<Arc<ServerState>>) -> Result<web::Json<GetTtsModelSuccessResponse>, CommonWebError>
{
  let mut mysql_connection = server_state.mysql_pool.acquire()
      .await
      .map_err(|e| {
        warn!("Could not acquire DB pool: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  let mut show_deleted_models = false;
  let mut is_moderator = false;
  let mut is_original_author = false;

  if let Some(user_session) = &maybe_user_session {
    // NB: Moderators can see deleted models
    // Original creators cannot see them (unless they're moderators!)
    show_deleted_models = user_session.can_delete_other_users_tts_models;
    // Moderators get to see all the fields.
    is_moderator = user_session.can_delete_other_users_tts_results
        || user_session.can_edit_other_users_tts_models;
  }

  let model_token = path.token.clone();

  let switch_to_weights_flag = server_state.flags.switch_tts_to_model_weights;

  let get_tts_model = move || {
    // NB: async closures are not yet stable in Rust, so we include an async block.
    async move {
      get_tts_model_info_migration(
        &model_token,
        &mut mysql_connection,
        show_deleted_models,
        switch_to_weights_flag,
      ).await
    }
  };

  let model_query_result  = match server_state.redis_ttl_cache.get_connection() {
    Err(err) => {
      warn!("Error loading Redis connection from TTL cache (calling DB instead): {:?}", err);
      get_tts_model().await
    }
    Ok(mut redis_ttl_cache) => {
      let cache_key = RedisCacheKeys::get_tts_model_for_info_migration_endpoint(&path.token);
      redis_ttl_cache.lazy_load_if_not_cached(&cache_key, move || {
        get_tts_model()
      }).await
    }
  };

  let model = match model_query_result {
    Err(e) => {
      warn!("query error: {:?}", e);
      return Err(CommonWebError::from_anyhow_error(e));
    }
    Ok(None) => return Err(CommonWebError::NotFound),
    Ok(Some(model)) => model,
  };

  if let Some(user_session) = &maybe_user_session {
    is_original_author = user_session.user_token.as_str().to_string() == model.creator_user_token();
  }

  // NB(bt, 2024-01-20): Removing to make porting easier.
  //if let Some(moderator_fields) = model.maybe_moderator_fields.as_ref() {
  //  // NB: The moderator fields will always be present before removal
  //  // We don't want non-mods seeing stuff made by banned users.
  //  if moderator_fields.creator_is_banned && !is_moderator {
  //    return Err(CommonWebError::NotFound);
  //  }
  //}

  // NB(bt, 2024-01-20): Removing to make porting easier.
  //if !is_moderator {
  //  model.maybe_moderator_fields = None;
  //}

  let text_pipeline_type = model.text_pipeline_type()
      .as_deref()
      .and_then(|pipeline_type| {
        // If there's an error deserializing, turn it to None instead of 500ing. The column is
        // nullable by default, and legacy records have no type.
        TextPipelineType::from_str(pipeline_type).ok()
      })
      .map(|pipeline_type| {
        // NB(bt, 2022-07-27): For now, we're being intentionally misleading and obscuring our text
        //  pipelines so that UberDuck doesn't catch on about Espeak. Only uploaders and mods will
        //  see the original value.
        if is_moderator || is_original_author {
          pipeline_type.to_api_variant_for_authors_and_mods()
        } else {
          pipeline_type.to_api_variant_for_anyone()
        }
      });

  // TODO: Use language to infer as well.
  let text_pipeline_type_guess =
      guess_text_pipeline_heuristic(Some(*model.created_at()));

  // Map to public response type.
  let response = GetTtsModelSuccessResponse {
    success: true,
    model: TtsModelInfo {
      model_token: model.token().to_string(),
      tts_model_type: model.tts_model_type(),
      text_pipeline_type,
      text_pipeline_type_guess,
      // NB(bt, 2024-01-20): We won't be needing these much longer.
      maybe_custom_vocoder: None,
      //maybe_custom_vocoder: match model.maybe_custom_vocoder {
      //  None => None,
      //  Some(vocoder) => Some(CustomVocoderInfo {
      //    vocoder_token: vocoder.vocoder_token,
      //    vocoder_title: vocoder.vocoder_title,
      //    creator_user_token: vocoder.creator_user_token,
      //    creator_username: vocoder.creator_username,
      //    creator_display_name: vocoder.creator_display_name,
      //    creator_gravatar_hash: vocoder.creator_gravatar_hash,
      //  })
      //},
      maybe_default_pretrained_vocoder: model.maybe_default_pretrained_vocoder(),
      text_preprocessing_algorithm: model.text_preprocessing_algorithm().to_string(),
      creator_user_token: model.creator_user_token().to_string(),
      creator_username: model.creator_username().to_string(), // NB: Cloned because of ref use for avatar below
      creator_display_name: model.creator_display_name().to_string(),
      creator_gravatar_hash: model.creator_gravatar_hash().to_string(),
      creator_default_avatar_index: default_avatar_from_username(&model.creator_username().to_string()),
      creator_default_avatar_color_index: default_avatar_color_from_username(&model.creator_username().to_string()),
      maybe_url_slug: title_to_url_slug(model.title()),
      title: model.title().to_string(),
      description_markdown: model.description_markdown().to_string(),
      description_rendered_html: model.description_rendered_html().to_string(),
      ietf_language_tag: model.ietf_language_tag().to_string(),
      ietf_primary_language_subtag: model.ietf_primary_language_subtag().to_string(),
      is_front_page_featured: model.is_front_page_featured(),
      is_twitch_featured: model.is_twitch_featured(),
      maybe_suggested_unique_bot_command: model.maybe_suggested_unique_bot_command().map(|s| s.to_string()),
      user_ratings: UserRatingsStats {
        positive_count: model.user_ratings_positive_count(),
        negative_count: model.user_ratings_negative_count(),
        total_count: model.user_ratings_total_count(),
      },
      creator_set_visibility: model.creator_set_visibility(),
      is_locked_from_use: model.is_locked_from_use(),
      is_locked_from_user_modification: model.is_locked_from_user_modification(),
      maybe_migration_new_model_weights_token: model.maybe_migration_new_model_weights_token()
          .map(|t| t.clone()),
      created_at: *model.created_at(),
      updated_at: *model.updated_at(),
      maybe_moderator_fields: None,
      // NB(bt, 2024-01-20): We won't be needing these much longer.
      //maybe_moderator_fields: model.maybe_moderator_fields.map(|mod_fields| {
      //  TtsModelModeratorFieldInfo {
      //    use_default_m_factor: mod_fields.use_default_mel_multiply_factor,
      //    maybe_custom_m_factor: mod_fields.maybe_custom_mel_multiply_factor,
      //    creator_is_banned: mod_fields.creator_is_banned,
      //    creator_ip_address_creation: mod_fields.creator_ip_address_creation,
      //    creator_ip_address_last_update: mod_fields.creator_ip_address_last_update,
      //    user_deleted_at: mod_fields.user_deleted_at,
      //    mod_deleted_at: mod_fields.mod_deleted_at,
      //  }
      //})
    },
  };

  Ok(web::Json(response))
}
