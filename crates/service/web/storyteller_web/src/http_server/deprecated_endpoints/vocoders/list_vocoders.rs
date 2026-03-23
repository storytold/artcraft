// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use chrono::{DateTime, Utc};
use log::warn;

use enums_db::common::vocoder_type::VocoderType;
use mysql_queries::queries::vocoder::list_vocoder_models::{list_vocoder_models, VocoderModelListItem};

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;

#[derive(Serialize)]
pub struct ListVocodersSuccessResponse {
  pub success: bool,
  pub vocoders: Vec<VocoderListItem>,
}

#[derive(Serialize)]
pub struct VocoderListItem {
  pub vocoder_token: String,
  pub vocoder_type: VocoderType,

  pub title: String,
  pub is_staff_recommended: bool,

  pub creator_user_token: String,
  pub creator_username: String,
  pub creator_display_name: String,
  pub creator_gravatar_hash: String,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  /// Moderator fields are absent if not a moderator.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub moderator_fields: Option<VocoderListItemModFields>,
}

#[derive(Serialize)]
pub struct VocoderListItemModFields {
  pub is_mod_disabled_from_public_use: bool,
  pub is_mod_disabled_from_author_use: bool,
  pub is_mod_author_editing_locked: bool,
  pub user_deleted_at: Option<DateTime<Utc>>,
  pub mod_deleted_at: Option<DateTime<Utc>>,
}


#[derive(Debug)]
pub enum ListVocodersError {
  ServerError,
}

impl ResponseError for ListVocodersError {
  fn status_code(&self) -> StatusCode {
    match *self {
      ListVocodersError::ServerError=> StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      ListVocodersError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for ListVocodersError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

pub async fn list_vocoders_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, ListVocodersError> {

  let is_moderator = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        ListVocodersError::ServerError
      })?
      .map(|session| {
        // NB: Since we need to rip out and replace the permissions system,
        // this is a proxy for being a moderator.
        session.can_ban_users
      })
      .unwrap_or(false);

  const NO_CREATOR_SCOPING_HERE : Option<&'static str> = None;

  let query_results = list_vocoder_models(
    &server_state.mysql_pool,
    NO_CREATOR_SCOPING_HERE,
    false,
  ).await;

  let vocoders = match query_results {
    Ok(results) => results,
    Err(e) => {
      warn!("vocoder list query error: {:?}", e);
      return Err(ListVocodersError::ServerError);
    }
  };

  let vocoders = vocoders
      .into_iter()
      .map(|v: VocoderModelListItem| {
        let mut vocoder = VocoderListItem {
          vocoder_token: v.vocoder_token,
          vocoder_type: v.vocoder_type,
          title: v.title,
          is_staff_recommended: v.is_staff_recommended,
          creator_user_token: v.creator_user_token,
          creator_username: v.creator_username,
          creator_display_name: v.creator_display_name,
          creator_gravatar_hash: v.creator_gravatar_hash,
          created_at: v.created_at,
          updated_at: v.updated_at,
          moderator_fields: Some(VocoderListItemModFields {
            is_mod_disabled_from_public_use: v.moderator_fields.is_mod_disabled_from_public_use,
            is_mod_disabled_from_author_use: v.moderator_fields.is_mod_disabled_from_author_use,
            is_mod_author_editing_locked: v.moderator_fields.is_mod_author_editing_locked,
            user_deleted_at: v.moderator_fields.user_deleted_at,
            mod_deleted_at:v.moderator_fields.mod_deleted_at,
          })
        };

        if !is_moderator {
          vocoder.moderator_fields = None;
        }

        vocoder
      })
      .collect();

  let response = ListVocodersSuccessResponse {
    success: true,
    vocoders,
  };

  let body = serde_json::to_string(&response)
      .map_err(|_e| ListVocodersError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
