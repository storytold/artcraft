use std::fmt;
use std::sync::Arc;

use actix_web::web::Path;
use actix_web::{web, HttpRequest};
use log::{error, warn};

use artcraft_api_defs::common::responses::simple_generic_json_success::SimpleGenericJsonSuccess;
use enums::common::visibility::Visibility;
use mysql_queries::queries::voice_designer::voices::get_voice::get_voice_by_token;
use mysql_queries::queries::voice_designer::voices::update_voice::{update_voice, UpdateVoiceArgs};
use tokens::tokens::zs_voices::ZsVoiceToken;

use crate::configs::supported_languages_for_models::get_canonicalized_language_tag_for_model;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;

#[derive(Deserialize)]
pub struct UpdateVoiceRequest {
  // ========== Author + Moderator options ==========

  pub title: Option<String>,
  pub creator_set_visibility: Option<String>,

  // NB: We calculate 'ietf_primary_language_subtag' from this value.
  pub ietf_language_tag: Option<String>,
}

#[derive(Serialize)]
pub struct UpdateVoiceResponse {
  pub success: bool,
}

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct UpdateVoicePathInfo {
  voice_token: String,
}

// =============== Error Response ===============
// NB: Not using derive_more::Display since Clion doesn't understand it.
// =============== Handler ===============

pub async fn update_voice_handler(
  http_request: HttpRequest,
  path: Path<UpdateVoicePathInfo>,
  request: web::Json<UpdateVoiceRequest>,
  server_state: web::Data<Arc<ServerState>>) -> Result<web::Json<SimpleGenericJsonSuccess>, CommonWebError>
{
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

  let voice_token = path.voice_token.clone();
  let is_mod = user_session.can_ban_users;

  let voice_lookup_result = get_voice_by_token(
    &ZsVoiceToken::new(voice_token.clone()),
    is_mod,
    &server_state.mysql_pool,
  ).await;

  let voice = match voice_lookup_result {
    Ok(Some(voice)) => voice,
    Ok(None) => {
      warn!("Voice not found: {:?}", voice_token);
      return Err(CommonWebError::NotFound);
    },
    Err(err) => {
      warn!("Error looking up voice: {:?}", err);
      return Err(CommonWebError::from_anyhow_error(err));
    }
  };

  // let is_creator = voice.maybe_creator_user_token == Some(user_session.user_token);
  let is_creator = voice.maybe_creator_user_token.as_ref()
      .map(|creator_user_token| creator_user_token == &user_session.user_token)
      .unwrap_or(false);

  if !is_creator && !is_mod {
    warn!("user is not allowed to edit this voice: {:?}", user_session.user_token);
    return Err(CommonWebError::NotAuthorized);
  }

  let mut title = None;
  let mut ietf_language_tag = None;
  let mut ietf_primary_language_subtag = None;
  let mut creator_set_visibility = Visibility::Public;

  if let Some(payload) = request.title.as_deref() {
    if user_input_common::check_for_slurs::contains_slurs(payload) {
      return Err(CommonWebError::BadInputWithSimpleMessage("title contains slurs".to_string()));
    }

    title = Some(payload.trim().to_string());
  }

  if let Some(tag) = request.ietf_language_tag.as_deref() {
    // eg. en, en-US, es-419, ja-JP, etc.
    let maybe_full_canonical_tag = get_canonicalized_language_tag_for_model(tag);

    // eg. en, es, ja, etc.
    let maybe_primary_language_subtag = maybe_full_canonical_tag
        .map(|t| language_tags::LanguageTag::parse(t)
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

  if let Some(visibility) = request.creator_set_visibility.as_deref() {
    creator_set_visibility = Visibility::from_str(visibility)
        .map_err(|_| CommonWebError::BadInputWithSimpleMessage("bad record visibility".to_string()))?;
  }


  let mut maybe_mod_user_token = None;

  if is_mod {
    maybe_mod_user_token = Some(user_session.user_token.as_str().to_string());
  }

  let query_result = update_voice(
    UpdateVoiceArgs {
      voice_token: &ZsVoiceToken::new(voice_token.clone()),
      voice_title: title.as_deref(),
      creator_set_visibility: &creator_set_visibility,
      maybe_mod_user_token: maybe_mod_user_token.as_deref(),
      ietf_language_tag: ietf_language_tag.as_deref(),
      ietf_primary_language_subtag: ietf_primary_language_subtag.as_deref(),
      mysql_pool: &server_state.mysql_pool
    }
  ).await;

  match query_result {
    Ok(_) => {},
    Err(err) => {
      warn!("Update Voice DB error: {:?}", err);
      return Err(CommonWebError::from_anyhow_error(err));
    }
  };

  Ok(web::Json(SimpleGenericJsonSuccess { success: true }))
}
