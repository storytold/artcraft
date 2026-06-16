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
use chrono::{DateTime, Utc};
use log::warn;
use utoipa::ToSchema;

use crate::http_server::common_responses::user_details_lite::{UserDefaultAvatarInfo, UserDetailsLight};
use enums::by_table::user_bookmarks::user_bookmark_entity_type::UserBookmarkEntityType;
use mysql_queries::queries::users::user_bookmarks::list_user_bookmarks_for_entity::list_user_bookmarks_for_entity;
use mysql_queries::queries::users::user_bookmarks::user_bookmark_entity_token::UserBookmarkEntityToken;
use tokens::tokens::user_bookmarks::UserBookmarkToken;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;

/// For the URL PathInfo
#[derive(Deserialize, ToSchema)]
pub struct ListUserBookmarksForEntityPathInfo {
  entity_type: UserBookmarkEntityType,
  entity_token: String,
}

#[derive(Serialize, ToSchema)]
pub struct ListUserBookmarksForEntitySuccessResponse {
  pub success: bool,
  pub user_bookmarks: Vec<UserBookmarkForEntityListItem>,
}

#[derive(Serialize, ToSchema)]
pub struct UserBookmarkForEntityListItem {
  pub token: UserBookmarkToken,

  pub user: UserDetailsLight,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

#[derive(Debug, ToSchema)]
pub enum ListUserBookmarksForEntityError {
  ServerError,
}

impl ResponseError for ListUserBookmarksForEntityError {
  fn status_code(&self) -> StatusCode {
    match *self {
      ListUserBookmarksForEntityError::ServerError=> StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      ListUserBookmarksForEntityError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for ListUserBookmarksForEntityError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}


#[utoipa::path(
  get,
  tag = "User Bookmarks",
  path = "/v1/user_bookmarks/list/{entity_type}/{entity_token}",
  params(
    ("entity_type", description="The type of entity to list bookmarks for"),
    ("entity_token", description="The token of the entity to list bookmarks for"),
  ),
  responses(
  (status = 200, body = ListUserBookmarksForEntitySuccessResponse),
  (status = 500, body = ListUserBookmarksForEntityError),
  ),
)]
pub async fn list_user_bookmarks_for_entity_handler(
  _http_request: HttpRequest,
  path: Path<ListUserBookmarksForEntityPathInfo>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<web::Json<ListUserBookmarksForEntitySuccessResponse>, ListUserBookmarksForEntityError>
{
  let entity_token = UserBookmarkEntityToken::from_entity_type_and_token(
    path.entity_type, &path.entity_token);
  
  let query_results = list_user_bookmarks_for_entity(
    entity_token,
    &server_state.mysql_pool,
  ).await;

  let user_bookmarks = match query_results {
    Ok(results) => results,
    Err(e) => {
      warn!("Query error: {:?}", e);
      return Err(ListUserBookmarksForEntityError::ServerError);
    }
  };

  let response = ListUserBookmarksForEntitySuccessResponse {
    success: true,
    user_bookmarks: user_bookmarks.into_iter()
        .map(|user_bookmark| UserBookmarkForEntityListItem {
          token: user_bookmark.token,
          user: UserDetailsLight {
            user_token: user_bookmark.user_token.clone(),
            username: user_bookmark.username.to_string(), // NB: Cloned because of ref use for avatar below
            display_name: user_bookmark.user_display_name.clone(),
            gravatar_hash: user_bookmark.user_gravatar_hash.clone(),
            default_avatar: UserDefaultAvatarInfo::from_username(&user_bookmark.username),
          },
          created_at: user_bookmark.created_at,
          updated_at: user_bookmark.updated_at,
        })
        .collect(),
  };

  Ok(web::Json(response))
}
