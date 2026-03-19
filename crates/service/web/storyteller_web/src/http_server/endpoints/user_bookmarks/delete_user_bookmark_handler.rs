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
use log::{error, info, warn};
use sqlx::Acquire;
use utoipa::ToSchema;

use mysql_queries::queries::entity_stats::stats_entity_token::StatsEntityToken;
use mysql_queries::queries::entity_stats::upsert_entity_stats_on_bookmark_event::{upsert_entity_stats_on_bookmark_event, BookmarkAction, UpsertEntityStatsArgs};
use mysql_queries::queries::users::user_bookmarks::delete_user_bookmark::delete_user_bookmark;
use mysql_queries::queries::users::user_bookmarks::get_user_bookmark_transactional_locking::{get_user_bookmark_transactional_locking, BookmarkIdentifier};
use tokens::tokens::user_bookmarks::UserBookmarkToken;

use artcraft_api_defs::common::responses::simple_generic_json_success::SimpleGenericJsonSuccess;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::web_utils::response_success_helpers::simple_json_success;
use crate::state::server_state::ServerState;

/// For the URL PathInfo
#[derive(Deserialize, ToSchema)]
pub struct DeleteUserBookmarkPathInfo {
  user_bookmark_token: UserBookmarkToken,
}

#[derive(Deserialize, ToSchema)]
pub struct DeleteUserBookmarkRequest {
  /// NB: this is only to disambiguate when a user is both a mod and an author.
  as_mod: Option<bool>,
}

#[derive(Debug, ToSchema)]
pub enum DeleteUserBookmarkError {
  BadInput(String),
  NotAuthorized,
  NotFound,
  ServerError,
}

impl ResponseError for DeleteUserBookmarkError {
  fn status_code(&self) -> StatusCode {
    match *self {
      DeleteUserBookmarkError::BadInput(_) => StatusCode::BAD_REQUEST,
      DeleteUserBookmarkError::NotAuthorized => StatusCode::UNAUTHORIZED,
      DeleteUserBookmarkError::NotFound => StatusCode::NOT_FOUND,
      DeleteUserBookmarkError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      DeleteUserBookmarkError::BadInput(reason) => reason.to_string(),
      DeleteUserBookmarkError::NotAuthorized => "unauthorized".to_string(),
      DeleteUserBookmarkError::NotFound => "not found".to_string(),
      DeleteUserBookmarkError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for DeleteUserBookmarkError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

#[utoipa::path(
  delete,
  tag = "User Bookmarks",
  path = "/v1/user_bookmarks/delete/{user_bookmark_token}",
  params(
  ("user_bookmark_token", description = "UserBookmarkToken"),
  ),
  responses(
    (status = 200, description = "Delete User Bookmark", body = SimpleGenericJsonSuccess),
    (status = 400, description = "Bad input", body = DeleteUserBookmarkError),
    (status = 401, description = "Not authorized", body = DeleteUserBookmarkError),
    (status = 404, description = "Not found", body = DeleteUserBookmarkError),
    (status = 500, description = "Server error", body = DeleteUserBookmarkError),
  ),
)]
pub async fn delete_user_bookmark_handler(
  http_request: HttpRequest,
  path: Path<DeleteUserBookmarkPathInfo>,
  _request: web::Json<DeleteUserBookmarkRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, DeleteUserBookmarkError> {
  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        warn!("MySql pool error: {:?}", err);
        DeleteUserBookmarkError::ServerError
      })?;

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        DeleteUserBookmarkError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      return Err(DeleteUserBookmarkError::NotAuthorized);
    }
  };

  let mut transaction = mysql_connection.begin().await
      .map_err(|err| {
        error!("error creating transaction: {:?}", err);
        DeleteUserBookmarkError::ServerError
      })?;

  let user_bookmark = get_user_bookmark_transactional_locking(
    BookmarkIdentifier::BookmarkToken(&path.user_bookmark_token),
    &mut *transaction
  ).await
      .map_err(|err| {
        error!("error getting user bookmark: {:?}", err);
        DeleteUserBookmarkError::ServerError
      })?
      .ok_or_else(|| {
        info!("bookmark not found");
        DeleteUserBookmarkError::NotFound
      })?;

  let delete_result = delete_user_bookmark(
    &path.user_bookmark_token,
    &user_session.user_token,
    &mut *transaction,
  ).await;

  // Decrement only if we're deleting a non-deleted bookmark
  let decrement_bookmark_count = user_bookmark.maybe_deleted_at.is_none();

  if decrement_bookmark_count {
    // NB: Not all bookmarkable things have stats (eg. deprecated record types don't have stats).
    let maybe_stats_entity_token =
        StatsEntityToken::from_bookmark_entity_type_and_token(
          user_bookmark.entity_type, &user_bookmark.entity_token);

    if let Some(stats_entity_token) = maybe_stats_entity_token {
      upsert_entity_stats_on_bookmark_event(UpsertEntityStatsArgs {
        stats_entity_token: &stats_entity_token,
        action: BookmarkAction::Delete,
        mysql_executor: &mut *transaction,
        phantom: Default::default(),

      }).await.map_err(|err| {
        error!("error recording stats: {:?}", err);
        DeleteUserBookmarkError::ServerError
      })?;
    }
  }

  transaction.commit().await
      .map_err(|err| {
        error!("error committing transaction: {:?}", err);
        DeleteUserBookmarkError::ServerError
      })?;

  match delete_result {
    Ok(_) => {},
    Err(err) => {
      warn!("Update tts mod approval status DB error: {:?}", err);
      return Err(DeleteUserBookmarkError::ServerError);
    }
  };

  Ok(simple_json_success())
}
