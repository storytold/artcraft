// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpRequest, HttpResponse};
use log::{error, warn};
use utoipa::ToSchema;

use mysql_queries::queries::comments::delete_comment::{delete_comment, DeleteCommentAs};
use mysql_queries::queries::comments::get_comment::get_comment;
use tokens::tokens::comments::CommentToken;

use artcraft_api_defs::common::responses::simple_generic_json_success::SimpleGenericJsonSuccess;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::web_utils::response_success_helpers::simple_json_success;
use crate::state::server_state::ServerState;

/// For the URL PathInfo
#[derive(Deserialize, ToSchema)]
pub struct DeleteCommentPathInfo {
  comment_token: CommentToken,
}

#[derive(Deserialize, ToSchema)]
pub struct DeleteCommentRequest {
  /// NB: this is only to disambiguate when a user is both a mod and an author.
  as_mod: Option<bool>,
}

#[derive(Debug, ToSchema)]
pub enum DeleteCommentError {
  BadInput(String),
  NotAuthorized,
  NotFound,
  ServerError,
}

impl ResponseError for DeleteCommentError {
  fn status_code(&self) -> StatusCode {
    match *self {
      DeleteCommentError::BadInput(_) => StatusCode::BAD_REQUEST,
      DeleteCommentError::NotAuthorized => StatusCode::UNAUTHORIZED,
      DeleteCommentError::NotFound => StatusCode::NOT_FOUND,
      DeleteCommentError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      DeleteCommentError::BadInput(reason) => reason.to_string(),
      DeleteCommentError::NotAuthorized => "unauthorized".to_string(),
      DeleteCommentError::NotFound => "not found".to_string(),
      DeleteCommentError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for DeleteCommentError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

/// Delete a comment.
#[utoipa::path(
  post,
  tag = "Comments",
  path = "/v1/comments/delete/{comment_token}",
  params(
    ("request" = DeleteCommentRequest, description = "Payload for Request"),
    ("path" = DeleteCommentPathInfo, description = "Path for Request"),
  ),
  responses(
    (status = 200, description = "Success", body = SimpleGenericJsonSuccess),
    (status = 400, description = "Bad input", body = DeleteCommentError),
    (status = 401, description = "Not authorized", body = DeleteCommentError),
    (status = 500, description = "Server error", body = DeleteCommentError),
  ),
)]
pub async fn delete_comment_handler(
  http_request: HttpRequest,
  path: Path<DeleteCommentPathInfo>,
  request: web::Json<DeleteCommentRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, DeleteCommentError> {
  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        warn!("MySql pool error: {:?}", err);
        DeleteCommentError::ServerError
      })?;

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        DeleteCommentError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      return Err(DeleteCommentError::NotAuthorized);
    }
  };

  let mut maybe_delete_as = None;

  if request.as_mod.unwrap_or(false) && user_session.can_ban_users {
    // 1) Delete as moderator
    maybe_delete_as = Some(DeleteCommentAs::Moderator);
  } else {
    let comment = get_comment(&path.comment_token, &mut *mysql_connection)
        .await
        .map_err(|err| {
          error!("error with query: {:?}", err);
          DeleteCommentError::ServerError
        })?
        .ok_or(DeleteCommentError::NotFound)?;

    // 2) Delete as author
    if comment.user_token == user_session.user_token {
      maybe_delete_as = Some(DeleteCommentAs::Author);
    }

    // 3) Delete as object owner
    if maybe_delete_as.is_none() {
      // TODO: Search for owner of the entity.
    }

    // 4) Last ditch - try to see if they're a moderator again.
    if maybe_delete_as.is_none() && user_session.can_ban_users {
      maybe_delete_as = Some(DeleteCommentAs::Moderator);
    }
  }

  let delete_as = match maybe_delete_as {
    Some(delete_as) => delete_as,
    None => return Err(DeleteCommentError::NotAuthorized),
  };

  let query_result = delete_comment(
    &path.comment_token,
    delete_as,
    &mut *mysql_connection
  ).await;

  match query_result {
    Ok(_) => {},
    Err(err) => {
      warn!("Update tts mod approval status DB error: {:?}", err);
      return Err(DeleteCommentError::ServerError);
    }
  };

  Ok(simple_json_success())
}
