// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::web::Json;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpRequest, HttpResponse};
use chrono::{DateTime, Utc};
use log::warn;
use utoipa::ToSchema;

use crate::http_server::common_responses::user_avatars::default_avatar_color_from_username::default_avatar_color_from_username;
use crate::http_server::common_responses::user_avatars::default_avatar_from_username::default_avatar_from_username;
use crate::http_server::common_responses::user_details_lite::{UserDefaultAvatarInfo, UserDetailsLight};
use enums::by_table::comments::comment_entity_type::CommentEntityType;
use mysql_queries::queries::comments::comment_entity_token::CommentEntityToken;
use mysql_queries::queries::comments::list_comments_for_entity::list_comments_for_entity;
use tokens::tokens::comments::CommentToken;
use tokens::tokens::users::UserToken;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;

/// For the URL PathInfo
#[derive(Deserialize, ToSchema)]
pub struct ListCommentsPathInfo {
  entity_type: CommentEntityType,
  entity_token: String,
}

#[derive(Serialize, ToSchema)]
pub struct ListCommentsSuccessResponse {
  pub success: bool,
  pub comments: Vec<Comment>,
}

#[derive(Serialize, ToSchema)]
pub struct Comment {
  pub token: CommentToken,

  pub user: UserDetailsLight,

  pub comment_markdown: String,
  pub comment_rendered_html: String,

  //pub mod_fields: CommentForListModFields,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
  pub maybe_edited_at: Option<DateTime<Utc>>,

  #[deprecated(note="switch to UserDetailsLight")]
  pub user_token: UserToken,

  #[deprecated(note="switch to UserDetailsLight")]
  pub username: String,

  #[deprecated(note="switch to UserDetailsLight")]
  pub user_display_name: String,

  #[deprecated(note="switch to UserDetailsLight")]
  pub user_gravatar_hash: String,

  #[deprecated(note="switch to UserDetailsLight")]
  pub default_avatar_index: u8,

  #[deprecated(note="switch to UserDetailsLight")]
  pub default_avatar_color_index: u8,
}

// TODO
//pub struct CommentForListModFields {
//  pub creator_ip_address: String,
//  pub editor_ip_address: String,
//  pub maybe_user_deleted_at: Option<DateTime<Utc>>,
//  pub maybe_mod_deleted_at: Option<DateTime<Utc>>,
//  pub maybe_object_owner_deleted_at: Option<DateTime<Utc>>,
//}

#[derive(Debug, ToSchema)]
pub enum ListCommentsError {
  ServerError,
}

impl ResponseError for ListCommentsError {
  fn status_code(&self) -> StatusCode {
    match *self {
      ListCommentsError::ServerError=> StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      ListCommentsError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for ListCommentsError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

/// List comments for an entity of a given type.
///
/// You need to supply the entity type (media files, model weights, users, etc.) and the token of the entity.
#[utoipa::path(
  get,
  tag = "Comments",
  path = "/v1/comments/list/{entity_type}/{entity_token}",
  params(
    ("path" = ListCommentsPathInfo, description = "Path for Request"),
  ),
  responses(
    (status = 200, description = "Success", body = ListCommentsSuccessResponse),
    (status = 500, description = "Server error", body = ListCommentsError),
  ),
)]
pub async fn list_comments_handler(
  _http_request: HttpRequest,
  path: Path<ListCommentsPathInfo>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<ListCommentsSuccessResponse>, ListCommentsError>
{
  let entity_token = CommentEntityToken::from_entity_type_and_token(
    path.entity_type, &path.entity_token);
  
  let query_results = list_comments_for_entity(
    entity_token,
    &server_state.mysql_pool,
  ).await;

  let comments = match query_results {
    Ok(results) => results,
    Err(e) => {
      warn!("Query error: {:?}", e);
      return Err(ListCommentsError::ServerError);
    }
  };

  let response = ListCommentsSuccessResponse {
    success: true,
    comments: comments.into_iter()
        .map(|comment| Comment {
          token: comment.token,
          user: UserDetailsLight {
            user_token: comment.user_token.clone(),
            username: comment.username.to_string(), // NB: Cloned because of ref use for avatar below
            display_name: comment.user_display_name.clone(),
            gravatar_hash: comment.user_gravatar_hash.clone(),
            default_avatar: UserDefaultAvatarInfo::from_username(&comment.username),
          },
          user_token: comment.user_token,
          username: comment.username.to_string(), // NB: Cloned because of ref use for avatar below
          user_display_name: comment.user_display_name,
          user_gravatar_hash: comment.user_gravatar_hash,
          default_avatar_index: default_avatar_from_username(&comment.username),
          default_avatar_color_index: default_avatar_color_from_username(&comment.username),
          comment_markdown: comment.comment_markdown,
          comment_rendered_html: comment.comment_rendered_html,
          created_at: comment.created_at,
          updated_at: comment.updated_at,
          maybe_edited_at: comment.maybe_edited_at,
        })
        .collect(),
  };

  Ok(Json(response))
}
