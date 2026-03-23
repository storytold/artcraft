use std::collections::{HashMap, HashSet};
use std::sync::Arc;

use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse, ResponseError};
use actix_web_lab::extract::Query;
use log::error;
use utoipa::{IntoParams, ToSchema};

use enums_api::by_table::user_bookmarks::user_bookmark_entity_type::UserBookmarkEntityType;
use enums_api::by_table::user_bookmarks::user_bookmark_entity_type::UserBookmarkEntityType as ApiUserBookmarkEntityType;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use mysql_queries::queries::users::user_bookmarks::batch_get_user_bookmarks::{batch_get_user_bookmarks, BatchUserBookmark};
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::tts_models::TtsModelToken;
use tokens::tokens::user_bookmarks::UserBookmarkToken;

use crate::state::server_state::ServerState;

const MAX_BATCH_SIZE : usize = 200;

// =============== Request ===============

#[derive(Deserialize, ToSchema, IntoParams)]
pub struct BatchGetUserBookmarksQueryParams {
  /// A grab bag of tokens of various types.
  /// Technically we should pair with token types, as that's the unique index.
  /// But since each token family generally has its own prefix, this should be fine.
  ///
  /// NB: We're using actix_web_lab's Query<T>, because the default actix_web Query<T> doesn't support URL
  /// decoding sequences yet.
  /// See https://github.com/actix/actix-web/issues/1301
  ///
  pub tokens: HashSet<String>,
}

// =============== Success Response ===============

#[derive(Serialize, ToSchema)]
pub struct BatchGetUserBookmarksResponse {
  pub success: bool,

  /// Ratings on each item passed to us.
  pub bookmarks: Vec<BookmarkRow>,
}

#[derive(Serialize, ToSchema)]
pub struct BookmarkRow {
  /// The passed token
  pub entity_token: String,
  /// The type of entity
  pub entity_type: ApiUserBookmarkEntityType,
  /// Whether the entity is bookmarked or not
  pub is_bookmarked: bool,
  /// If the object is bookmarked, this is the bookmark token (used to delete the bookmark).
  /// Since we soft-delete bookmarks, we go to the extra step of clearing out this field if
  /// the bookmark is soft deleted, even though it still has a record with token on the
  /// backend.
  pub maybe_bookmark_token: Option<UserBookmarkToken>,
}

// =============== Error Response ===============

#[derive(Debug, Serialize, ToSchema)]
pub enum BatchGetUserBookmarksError {
  BadInput(String),
  NotAuthorized,
  ServerError,
}

impl ResponseError for BatchGetUserBookmarksError {
  fn status_code(&self) -> StatusCode {
    match *self {
      BatchGetUserBookmarksError::BadInput(_) => StatusCode::BAD_REQUEST,
      BatchGetUserBookmarksError::NotAuthorized => StatusCode::UNAUTHORIZED,
      BatchGetUserBookmarksError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using DeriveMore since Clion doesn't understand it.
impl std::fmt::Display for BatchGetUserBookmarksError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:?}", self)
  }
}

// =============== Handler ===============


#[utoipa::path(
  get,
  tag = "User Bookmarks",
  path = "/v1/user_bookmarks/batch",
  params(
    BatchGetUserBookmarksQueryParams,
  ),
  responses(
    (status = 200, description = "List User Bookmarks", body = BatchGetUserBookmarksResponse),
    (status = 400, description = "Bad input", body = BatchGetUserBookmarksError),
    (status = 401, description = "Not authorized", body = BatchGetUserBookmarksError),
    (status = 500, description = "Server error", body = BatchGetUserBookmarksError),
  ),
)]
pub async fn batch_get_user_bookmarks_handler(
  http_request: HttpRequest,
  query: Query<BatchGetUserBookmarksQueryParams>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, BatchGetUserBookmarksError>
{
  let mut mysql_connection = server_state.mysql_pool.acquire()
      .await
      .map_err(|e| {
        error!("Could not acquire DB pool: {:?}", e);
        BatchGetUserBookmarksError::ServerError
      })?;

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|e| {
        error!("Session checker error: {:?}", e);
        BatchGetUserBookmarksError::ServerError
      })?;

  // NB: Force move of tokens from the Query<T>.
  // The auto-magical Query<T> will ordinarily try to force a Copy, which isn't on HashSet.
  let mut tokens = query.0.tokens;

  // Don't allow bad actors to flood our DB.
  tokens.shrink_to(MAX_BATCH_SIZE);

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      let bookmarks = fill_in_missed_bookmarks(&tokens, Vec::new());

      // NB: Just return "neutral" for everything.
      return Ok(HttpResponse::Ok()
          .content_type("application/json")
          .json(BatchGetUserBookmarksResponse {
            success: true,
            bookmarks,
          }));
    }
  };

  batch_get_user_bookmarks(
    &user_session.user_token,
    &tokens,
    &mut mysql_connection
  ).await
      .map_err(|e| {
        error!("Batch get user ratings DB error: {:?}", e);
        BatchGetUserBookmarksError::ServerError
      })
      .map(|bookmarks| {
        HttpResponse::Ok()
            .content_type("application/json")
            .json(BatchGetUserBookmarksResponse {
              success: true,
              bookmarks: fill_in_missed_bookmarks(&tokens, bookmarks),
            })
      })
}

fn fill_in_missed_bookmarks(request_tokens: &HashSet<String>, db_response: Vec<BatchUserBookmark>) -> Vec<BookmarkRow> {
  let mut outputs = HashMap::with_capacity(request_tokens.len());

  for record in db_response.into_iter() {
    let is_bookmarked = record.maybe_deleted_at.is_none();

    outputs.insert(record.entity_token.clone(), BookmarkRow {
      // NB: We clear out the token if it's deleted for the sake of the frontend.
      maybe_bookmark_token: if is_bookmarked { Some(record.token) } else { None },
      entity_token: record.entity_token,
      entity_type: enums_convert::by_table::user_bookmarks::user_bookmark_entity_type::user_bookmark_entity_type_to_api(&record.entity_type),

      is_bookmarked,
    });
  }

  for request_token in request_tokens.iter() {
    if !outputs.contains_key(request_token) {
      outputs.insert(request_token.clone(), BookmarkRow {
        entity_token: request_token.clone(),
        entity_type: {
          if request_token.starts_with(MediaFileToken::token_prefix()) {
            UserBookmarkEntityType::MediaFile
          } else if request_token.starts_with(ModelWeightToken::token_prefix()) {
            UserBookmarkEntityType::ModelWeight
          } else if request_token.starts_with(TtsModelToken::token_prefix()) {
            UserBookmarkEntityType::TtsModel
          } else {
            // NB: Fail open; W2lTemplates are dead, so this is a good sentinel value
            UserBookmarkEntityType::W2lTemplate
          }
        },
        is_bookmarked: false,
        maybe_bookmark_token: None,
      });
    }
  }

  outputs.into_iter()
      .map(|(_key, value)| value)
      .collect::<Vec<_>>()
}