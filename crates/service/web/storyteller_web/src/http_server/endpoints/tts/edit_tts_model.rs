// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::sync::Arc;

use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};
use language_tags::LanguageTag;
use log::{error, info, warn};
use sqlx::MySqlPool;

use crate::configs::supported_languages_for_models::get_canonicalized_language_tag_for_model;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;
use artcraft_api_defs::common::responses::simple_generic_json_success::SimpleGenericJsonSuccess;
use enums::common::visibility::Visibility;
use http_server_common::request::get_request_ip::get_request_ip;
use markdown::simple_markdown_to_html::simple_markdown_to_html;
use mysql_queries::column_types::vocoder_type::VocoderType;
use mysql_queries::queries::tts::tts_models::edit_tts_model_details::{edit_tts_model_details_as_author, edit_tts_model_details_as_mod};
use mysql_queries::queries::tts::tts_models::edit_tts_model_moderator_details::edit_tts_model_moderator_details;
use mysql_queries::queries::tts::tts_models::get_tts_model::get_tts_model_by_token;
use redis_common::redis_cache_keys::RedisCacheKeys;
use tts_common::text_pipelines::text_pipeline_type::TextPipelineType;
use user_input_common::check_for_slurs::contains_slurs;

const DEFAULT_IETF_LANGUAGE_TAG : &str = "en-US";
const DEFAULT_IETF_PRIMARY_LANGUAGE_SUBTAG : &str = "en";

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct EditTtsModelPathInfo {
  model_token: String,
}

#[derive(Deserialize)]
pub struct EditTtsModelRequest {
  // ========== Author + Moderator options ==========

  pub title: Option<String>,
  pub description_markdown: Option<String>,
  pub creator_set_visibility: Option<String>,

  // This controls how text will be pre-processed before it is handed off to the TTS
  // synthesizer model. Different pipelines treat graphemes, acronyms, arpabet, language
  // specifics, and integer encodings in their own way.
  // Note that the text pipeline option won't be set by default on new model uploads (for
  // now), and that most existing models will have null values here.
  pub text_pipeline_type: Option<TextPipelineType>,

  // [vocoders 1]
  // This is the new type of vocoder configuration. Users can choose a custom trained
  // vocoder to associate with their model. These tokens reference the `vocoder_models`
  // table.
  pub maybe_custom_vocoder_token: Option<String>,

  // [vocoders 2]
  // This is the old type of vocoder configuration, which leverages old pretrained
  // vocoders that we manually uploaded. There aren't many good options for users to
  // choose here, so this should be treated as a legacy option going forward. We'll
  // likely be stuck with this configuration for some time, however, due to the large
  // collection of legacy models we have.
  pub maybe_default_pretrained_vocoder: Option<VocoderType>,

  // NB: We calculate 'ietf_primary_language_subtag' from this value.
  pub ietf_language_tag: Option<String>,

  // ========== Moderator options (protection) ==========

  pub is_public_listing_approved: Option<bool>,
  pub is_locked_from_user_modification: Option<bool>,
  pub is_locked_from_use: Option<bool>,
  pub maybe_mod_comments: Option<String>,

  // ========== Moderator options (front page, Discord, Twitch, etc.) ==========

  pub is_front_page_featured: Option<bool>,
  pub is_twitch_featured: Option<bool>,

  // NB: We take "empty string" to mean removal.
  pub maybe_suggested_unique_bot_command: Option<String>,

  // Moderator-set mel multiply factors
  // These fields are misleadingly named just in case a competitor is snooping the javascript.
  pub use_default_m_factor: Option<bool>,
  pub maybe_custom_m_factor: Option<f64>,
}
// NB: Not using derive_more::Display since Clion doesn't understand it.
pub async fn edit_tts_model_handler(
  http_request: HttpRequest,
  path: Path<EditTtsModelPathInfo>,
  request: Json<EditTtsModelRequest>,
  server_state: web::Data<Arc<ServerState>>) -> Result<Json<SimpleGenericJsonSuccess>, CommonWebError>
{
  // NB: Disable if we've migrated to model_weights
  if server_state.flags.switch_tts_to_model_weights {
    warn!("Migration to model_weights for tts. Cannot delete old model.");
    return Err(CommonWebError::server_error_with_message("TTS migrated to model_weights; legacy edit endpoint disabled"));
  }

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(CommonWebError::NotAuthorized);
    }
  };

  // NB: First permission check.
  // Only mods should see deleted models (both user_* and mod_* deleted).
  let is_mod_that_can_see_deleted = user_session.can_delete_other_users_tts_models;

  let model_lookup_result = get_tts_model_by_token(
    &path.model_token,
    is_mod_that_can_see_deleted,
    &server_state.mysql_pool).await;

  let model_record = match model_lookup_result {
    Ok(Some(result)) => {
      info!("Found model: {}", result.model_token);
      result
    },
    Ok(None) => {
      warn!("could not find model");
      return Err(CommonWebError::NotFound);
    },
    Err(err) => {
      warn!("error looking up model: {:?}", err);
      return Err(CommonWebError::NotFound);
    },
  };

  // NB: Second set of permission checks
  let is_author = &model_record.creator_user_token == user_session.user_token.as_str();
  let is_mod = user_session.can_edit_other_users_tts_models ;

  if !is_author && !is_mod {
    warn!("user is not allowed to edit model: {:?}", user_session.user_token);
    return Err(CommonWebError::NotAuthorized);
  }

  if !is_mod {
    if model_record.is_locked_from_user_modification || model_record.is_locked_from_use {
      return Err(CommonWebError::NotAuthorized);
    }
  }

  // =============================================
  // Author + Mod fields.
  // These fields must be present on all requests.
  // =============================================

  let mut title = None;
  let mut description_markdown = None;
  let mut description_html = None;
  let mut ietf_language_tag = None;
  let mut ietf_primary_language_subtag = None;

  let mut creator_set_visibility = Visibility::Public;
  let mut maybe_default_pretrained_vocoder =
      model_record.maybe_default_pretrained_vocoder;

  if let Some(payload) = request.title.as_deref() {
    if contains_slurs(payload) {
      return Err(CommonWebError::BadInputWithSimpleMessage("title contains slurs".to_string()));
    }

    title = Some(payload.trim().to_string());
  }

  if let Some(markdown) = request.description_markdown.as_deref() {
    if contains_slurs(markdown) {
      return Err(CommonWebError::BadInputWithSimpleMessage("description contains slurs".to_string()));
    }

    let markdown = markdown.trim().to_string();
    let html = simple_markdown_to_html(&markdown);

    description_markdown = Some(markdown);
    description_html = Some(html);
  }

  if let Some(tag) = request.ietf_language_tag.as_deref() {
    // eg. en, en-US, es-419, ja-JP, etc.
    let maybe_full_canonical_tag = get_canonicalized_language_tag_for_model(tag);

    // eg. en, es, ja, etc.
    let maybe_primary_language_subtag = maybe_full_canonical_tag
        .map(|t| LanguageTag::parse(t)
            .map(|language_tag| language_tag.primary_language().to_string())
        )
        .transpose()
        .map_err(|e| {
          error!("Error parsing language tag '{}': {:?}", tag, e);
          CommonWebError::BadInputWithSimpleMessage("bad locale string".to_string())
        })?;

    if let Some(full_tag) = maybe_full_canonical_tag {
      if let Some(primary_subtag) = maybe_primary_language_subtag.as_deref() {
        ietf_language_tag = Some(full_tag.to_string());
        ietf_primary_language_subtag = Some(primary_subtag.to_string());
      }
    }
  }

  let ietf_language_tag = ietf_language_tag
      .unwrap_or(DEFAULT_IETF_LANGUAGE_TAG.to_string());

  let ietf_primary_language_subtag = ietf_primary_language_subtag
      .unwrap_or(DEFAULT_IETF_PRIMARY_LANGUAGE_SUBTAG.to_string());

  if let Some(visibility) = request.creator_set_visibility.as_deref() {
    creator_set_visibility = Visibility::from_str(visibility)
        .map_err(|_| CommonWebError::BadInputWithSimpleMessage("bad record visibility".to_string()))?;
  }

  let text_pipeline_type = request.text_pipeline_type
      .map(|pipeline_type| pipeline_type.to_db_variant())
      .map(|pipeline_type| pipeline_type.to_str());

  if let Some(vocoder) = request.maybe_default_pretrained_vocoder {
    maybe_default_pretrained_vocoder = Some(vocoder);
  }

  let ip_address = get_request_ip(&http_request);

  let query_result = if is_author {
    // We need to store the IP address details.
    edit_tts_model_details_as_author(
      &server_state.mysql_pool,
      &model_record.model_token,
      title.as_deref(),
      description_markdown.as_deref(),
      description_html.as_deref(),
      &ietf_language_tag,
      &ietf_primary_language_subtag,
      creator_set_visibility,
      maybe_default_pretrained_vocoder,
      request.maybe_custom_vocoder_token.as_deref(),
      text_pipeline_type,
      &ip_address,
    ).await
  } else {
    // We need to store the moderator details.
    edit_tts_model_details_as_mod(
      &server_state.mysql_pool,
      &model_record.model_token,
      title.as_deref(),
      description_markdown.as_deref(),
      description_html.as_deref(),
      &ietf_language_tag,
      &ietf_primary_language_subtag,
      creator_set_visibility,
      maybe_default_pretrained_vocoder,
      request.maybe_custom_vocoder_token.as_deref(),
      text_pipeline_type,
      user_session.user_token.as_str(),
    ).await
  };

  // =============================================
  // Mod-only fields.
  // =============================================

  // TODO: This is lazy and suboptimal af to UPDATE again.
  //  The reason we're doing this is because `sqlx` only does static type checking of queries
  //  with string literals. It does not support dynamic query building, thus the PREDICATES
  //  MUST BE HELD CONSTANT (at least in type signature). :(
  if is_mod {
    update_mod_details(
      &request,
      user_session.user_token.as_str(),
      &model_record.model_token,
      &server_state.mysql_pool
    ).await?;
  }

  match query_result {
    Ok(_) => {},
    Err(err) => {
      warn!("Update W2L model edit DB error: {:?}", err);
      return Err(CommonWebError::from_error(err));
    }
  };

  // Best effort to clear any redis cache
  if let Ok(mut redis_ttl_cache) = server_state.redis_ttl_cache.get_connection() {
    let cache_key = RedisCacheKeys::get_tts_model_endpoint(&path.model_token);
    let _r = redis_ttl_cache.delete_from_cache(&cache_key).ok();
  }

  Ok(Json(SimpleGenericJsonSuccess { success: true }))
}

async fn update_mod_details(
  request: &Json<EditTtsModelRequest>,
  moderator_user_token: &str,
  tts_model_token: &str,
  mysql_pool: &MySqlPool
) -> Result<(), CommonWebError> {

  let is_public_listing_approved= request.is_public_listing_approved.unwrap_or(false);
  let is_locked_from_user_modification = request.is_locked_from_user_modification.unwrap_or(false);
  let is_locked_from_use = request.is_locked_from_use.unwrap_or(false);

  let is_front_page_featured = request.is_front_page_featured.unwrap_or(false);
  let is_twitch_featured = request.is_twitch_featured.unwrap_or(false);

  // Commands must be non-empty, alphanumeric, and lowercase.
  let mut maybe_suggested_unique_bot_command = None;
  if let Some(command) = request.maybe_suggested_unique_bot_command.as_deref() {
    // Clear empty commands to null.
    let command = command.trim().to_lowercase();

    let is_alphanumeric = command.chars().all(|c| c.is_ascii_alphanumeric());

    if !command.is_empty() && is_alphanumeric {
      maybe_suggested_unique_bot_command = Some(command);
    }
  }

  let use_default_mel_multiply_factor = request.use_default_m_factor.unwrap_or(false);
  let maybe_custom_mel_multiply_factor = request.maybe_custom_m_factor;

  let query_result = edit_tts_model_moderator_details(
    &mysql_pool,
    tts_model_token,
    is_public_listing_approved,
    is_locked_from_user_modification,
    is_locked_from_use,
    maybe_suggested_unique_bot_command.as_deref(),
    is_front_page_featured,
    is_twitch_featured,
    moderator_user_token,
    request.maybe_mod_comments.as_deref(),
    use_default_mel_multiply_factor,
    maybe_custom_mel_multiply_factor,
  ).await;

  match query_result {
    Ok(_) => Ok(()),
    Err(err) => {
      warn!("Update TTS model (mod details) DB error: {:?}", err);
      Err(CommonWebError::from_error(err))
    }
  }
}
