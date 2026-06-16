use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest};
use chrono::{DateTime, Utc};
use log::warn;

use crate::http_server::common_responses::user_details_lite::UserDetailsLight;
use mysql_queries::queries::voice_designer::voices::list_voices_by_username::list_zs_voices_by_username;
use tokens::tokens::zs_voices::ZsVoiceToken;

use crate::state::server_state::ServerState;

#[derive(Serialize, Clone)]
pub struct Voice {
  voice_token: ZsVoiceToken,
  title: String,

  ietf_language_tag: String,
  ietf_primary_language_subtag: String,

  creator: UserDetailsLight,

  creator_set_visibility: String,

  created_at: DateTime<Utc>,
  updated_at: DateTime<Utc>,
}


#[derive(Serialize)]
pub struct ListVoicesByUserSuccessResponse {
  pub success: bool,
  pub voices: Vec<Voice>,
}

#[derive(Debug)]
pub enum ListVoicesByUserError {
  NotAuthorized,
  ServerError,
}

impl fmt::Display for ListVoicesByUserError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

impl ResponseError for ListVoicesByUserError {
  fn status_code(&self) -> StatusCode {
    match *self {
      ListVoicesByUserError::NotAuthorized => StatusCode::UNAUTHORIZED,
      ListVoicesByUserError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }
}

pub async fn list_voices_by_session_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>
) -> Result<web::Json<ListVoicesByUserSuccessResponse>, ListVoicesByUserError> {

  let user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        ListVoicesByUserError::ServerError
      })?
      .ok_or_else(|| {
        warn!("not logged in");
        ListVoicesByUserError::NotAuthorized
      })?;

  let creator_user_token = user_session.user_token.as_str().to_string();
  let _is_mod = user_session.can_ban_users;

  // NB(bt,2024-01-18): Showing mods deleted files is actually kind of annoying!
  // We should focus on visibility-related controls instead.
  const CAN_SEE_DELETED : bool = false;

  let query_results = list_zs_voices_by_username(
    &server_state.mysql_pool,
    &user_session.username,
    CAN_SEE_DELETED,
  ).await.map_err(|e| {
    warn!("Error querying for voices: {:?}", e);
    ListVoicesByUserError::ServerError
  });
  let voices = match query_results {
    Ok(voices) => voices,
    Err(e) => {
      warn!("Error querying for voices: {:?}", e);
      return Err(ListVoicesByUserError::ServerError);
    }
  };

  let voices = voices.into_iter().map(|voice| {
    Voice {
      voice_token: voice.voice_token,
      title: voice.title,
      ietf_language_tag: voice.ietf_language_tag,
      ietf_primary_language_subtag: voice.ietf_primary_language_subtag,
      creator: UserDetailsLight::from_db_fields(
        &voice.creator_user_token,
        &voice.creator_username,
        &voice.creator_display_name,
        &voice.creator_email_gravatar_hash,
      ),
      creator_set_visibility: voice.creator_set_visibility.to_string() ,
      created_at: voice.created_at,
      updated_at: voice.updated_at,
    }
  }).collect();

  let response = ListVoicesByUserSuccessResponse {
    success: true,
    voices,
  };

  Ok(web::Json(response))
}
