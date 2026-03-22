use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpRequest, HttpResponse};
use log::{error, warn};

use enums_db::common::visibility::Visibility;
use http_server_common::response::response_success_helpers::simple_json_success;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use mysql_queries::queries::voice_designer::voices::get_voice::get_voice_by_token;
use mysql_queries::queries::voice_designer::voices::update_voice::{update_voice, UpdateVoiceArgs};
use tokens::tokens::zs_voices::ZsVoiceToken;

use crate::configs::supported_languages_for_models::get_canonicalized_language_tag_for_model;
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

#[derive(Debug, Serialize)]
pub enum UpdateVoiceError {
  BadInput(String),
  NotFound,
  NotAuthorized,
  ServerError,
}

impl ResponseError for UpdateVoiceError {
  fn status_code(&self) -> StatusCode {
    match *self {
      UpdateVoiceError::BadInput(_) => StatusCode::BAD_REQUEST,
      UpdateVoiceError::NotFound => StatusCode::NOT_FOUND,
      UpdateVoiceError::NotAuthorized => StatusCode::UNAUTHORIZED,
      UpdateVoiceError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for UpdateVoiceError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

// =============== Handler ===============

pub async fn update_voice_handler(
  http_request: HttpRequest,
  path: Path<UpdateVoicePathInfo>,
  request: web::Json<UpdateVoiceRequest>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, UpdateVoiceError>
{
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        UpdateVoiceError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(UpdateVoiceError::NotAuthorized);
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
      return Err(UpdateVoiceError::NotFound);
    },
    Err(err) => {
      warn!("Error looking up voice: {:?}", err);
      return Err(UpdateVoiceError::ServerError);
    }
  };

  // let is_creator = voice.maybe_creator_user_token == Some(user_session.user_token);
  let is_creator = voice.maybe_creator_user_token.as_ref()
      .map(|creator_user_token| creator_user_token == &user_session.user_token)
      .unwrap_or(false);

  if !is_creator && !is_mod {
    warn!("user is not allowed to edit this voice: {:?}", user_session.user_token);
    return Err(UpdateVoiceError::NotAuthorized);
  }

  let mut title = None;
  let mut ietf_language_tag = None;
  let mut ietf_primary_language_subtag = None;
  let mut creator_set_visibility = Visibility::Public;

  if let Some(payload) = request.title.as_deref() {
    if user_input_common::check_for_slurs::contains_slurs(payload) {
      return Err(UpdateVoiceError::BadInput("title contains slurs".to_string()));
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
          UpdateVoiceError::BadInput("bad locale string".to_string())
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
        .map_err(|_| UpdateVoiceError::BadInput("bad record visibility".to_string()))?;
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
      return Err(UpdateVoiceError::ServerError);
    }
  };

  Ok(simple_json_success())
}
