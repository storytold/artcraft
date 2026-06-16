use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Query;
use actix_web::{web, HttpRequest, HttpResponse};
use chrono::{DateTime, Utc};
use log::warn;

use enums::by_table::user_bookmarks::user_bookmark_entity_type::UserBookmarkEntityType;
use tokens::tokens::user_bookmarks::UserBookmarkToken;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;

#[derive(Deserialize)]
pub struct ListUserBookmarksQueryData {
  maybe_scoped_entity_type: Option<UserBookmarkEntityType>,
}

#[derive(Serialize)]
pub struct ListUserBookmarksSuccessResponse {
  pub success: bool,
  pub user_bookmarks: Vec<UserBookmark>,
}

#[derive(Serialize)]
pub struct UserBookmark {
  pub token: UserBookmarkToken,

  pub details: UserBookmarkDetails,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

#[derive(Serialize)]
pub struct UserBookmarkDetails {
  // TODO: This needs titles or some other summary metadata.
  pub entity_type: UserBookmarkEntityType,
  pub entity_token: String,

  // TODO: Populate this for TTS
  pub maybe_summary_text: Option<String>,

  // TODO: Populate this for images, video, etc.
  pub maybe_thumbnail_url: Option<String>,
}

#[derive(Debug)]
pub enum ListUserBookmarksError {
  ServerError,
  NotAuthorizedError,
}

impl ResponseError for ListUserBookmarksError {
  fn status_code(&self) -> StatusCode {
    match *self {
      ListUserBookmarksError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      ListUserBookmarksError::NotAuthorizedError => StatusCode::UNAUTHORIZED,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      ListUserBookmarksError::ServerError => "server error".to_string(),
      ListUserBookmarksError::NotAuthorizedError => "not authorized".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for ListUserBookmarksError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

#[deprecated(note="Removing from API 2024-09-19, can remove code after a while")]
pub async fn list_user_bookmarks_for_session_handler(
  http_request: HttpRequest,
  query: Query<ListUserBookmarksQueryData>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<web::Json<ListUserBookmarksSuccessResponse>, ListUserBookmarksError>
{
  let user_session = server_state.session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        ListUserBookmarksError::ServerError
      })?
      .ok_or(ListUserBookmarksError::NotAuthorizedError)?;

  // let query_results = match query.maybe_scoped_entity_type {
  //   None => list_user_bookmarks(&user_session.username, &server_state.mysql_pool).await,
  //   Some(entity_type) =>
  //     list_user_user_bookmarks_by_entity_type(&user_session.username, entity_type, &server_state.mysql_pool)
  //         .await,
  // };


  let response = ListUserBookmarksSuccessResponse {
    success: true,
    user_bookmarks: Vec::new()
  };

  Ok(web::Json(response))
}
