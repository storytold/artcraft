use std::sync::Arc;

use actix_web::{HttpMessage, HttpRequest, HttpResponse, web};
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::{Path, Query};
use chrono::{DateTime, Utc};
use log::{info, warn};

use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_origin_model_type::MediaFileOriginModelType;
use enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use mysql_queries::queries::media_files::list_media_files::{list_media_files, ListMediaFilesArgs, ViewAs};
use tokens::tokens::media_files::MediaFileToken;
use crate::http_server::common_responses::media_file_social_meta_lite::MediaFileSocialMetaLight;

use crate::http_server::common_responses::pagination_cursors::PaginationCursors;
use crate::http_server::common_responses::user_details_lite::UserDetailsLight;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::server_state::ServerState;

#[derive(Deserialize)]
pub struct QueryParams {
  pub sort_ascending: Option<bool>,
  pub per_page: Option<usize>,
  pub cursor: Option<String>,
  pub cursor_is_reversed: Option<bool>,
  pub filter_media_type: Option<MediaFileType>,
}

#[derive(Serialize)]
pub struct SuccessResponse {
  pub success: bool,
  pub results: Vec<MediaFileListItem>,
  pub pagination: PaginationCursors,
}

#[derive(Serialize)]
pub struct MediaFileListItem {
  pub token: MediaFileToken,

  pub origin_category: MediaFileOriginCategory,
  pub origin_product_category: MediaFileOriginProductCategory,
  pub maybe_origin_model_type: Option<MediaFileOriginModelType>,
  pub maybe_origin_model_token: Option<String>,

  pub media_type: MediaFileType,
  pub public_bucket_directory_hash: String,
  pub maybe_public_bucket_prefix: Option<String>,
  pub maybe_public_bucket_extension: Option<String>,

  pub maybe_creator: Option<UserDetailsLight>,
  pub maybe_social_meta: Option<MediaFileSocialMetaLight>,

  pub creator_set_visibility: Visibility,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

#[derive(Debug)]
pub enum ErrorResponse {
  ServerError,
}

impl ResponseError for ErrorResponse {
  fn status_code(&self) -> StatusCode {
    match *self {
      ErrorResponse::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      ErrorResponse::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

impl std::fmt::Display for ErrorResponse {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:?}", self)
  }
}

pub async fn list_media_files_handler(
  http_request: HttpRequest,
  query: Query<QueryParams>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, ErrorResponse>
{
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        ErrorResponse::ServerError
      })?;

  let mut is_mod = false;

  match maybe_user_session {
    None => {},
    Some(session) => {
      is_mod = session.can_ban_users;
    },
  };

  // TODO(bt,2023-12-04): Enforce real maximums and defaults
  let limit = query.per_page.unwrap_or(25);

  let sort_ascending = query.sort_ascending.unwrap_or(false);
  let cursor_is_reversed = query.cursor_is_reversed.unwrap_or(false);

  let cursor = if let Some(cursor) = query.cursor.as_deref() {
    let cursor = server_state.sort_key_crypto.decrypt_id(cursor)
        .map_err(|e| {
          warn!("crypto error: {:?}", e);
          ErrorResponse::ServerError
        })?;
    Some(cursor as usize)
  } else {
    None
  };

  let view_as = if is_mod {
    ViewAs::Moderator
  } else {
    ViewAs::NonModerator
  };

  let query_results = list_media_files(ListMediaFilesArgs {
    limit,
    maybe_filter_media_type: query.filter_media_type,
    maybe_offset: cursor,
    cursor_is_reversed,
    view_as,
    mysql_pool: &server_state.mysql_pool,
  }).await;


  let results_page = match query_results {
    Ok(results) => results,
    Err(e) => {
      warn!("Query error: {:?}", e);
      return Err(ErrorResponse::ServerError);
    }
  };

  let cursor_next = if let Some(id) = results_page.last_id {
    let cursor = server_state.sort_key_crypto.encrypt_id(id as u64)
        .map_err(|e| {
          warn!("crypto error: {:?}", e);
          ErrorResponse::ServerError
        })?;
    Some(cursor)
  } else {
    None
  };

  let cursor_previous = if let Some(id) = results_page.first_id {
    let cursor = server_state.sort_key_crypto.encrypt_id(id as u64)
        .map_err(|e| {
          warn!("crypto error: {:?}", e);
          ErrorResponse::ServerError
        })?;
    Some(cursor)
  } else {
    None
  };

  let results = results_page.records.into_iter()
      .map(|record| MediaFileListItem {
        token: record.token.clone(),
        origin_category: record.origin_category,
        origin_product_category: record.origin_product_category,
        maybe_origin_model_type: record.maybe_origin_model_type,
        maybe_origin_model_token: record.maybe_origin_model_token,
        media_type: record.media_type,
        public_bucket_directory_hash: record.public_bucket_directory_hash,
        maybe_public_bucket_prefix: record.maybe_public_bucket_prefix,
        maybe_public_bucket_extension: record.maybe_public_bucket_extension,
        maybe_creator: UserDetailsLight::from_optional_db_fields_owned(
          record.maybe_creator_user_token,
          record.maybe_creator_username,
          record.maybe_creator_display_name,
          record.maybe_creator_gravatar_hash,
        ),
        maybe_social_meta: Option::from(MediaFileSocialMetaLight::from_db_fields(
            record.favorite_count,
            record.comment_count,
        )),
        creator_set_visibility: record.creator_set_visibility,
        created_at: record.created_at,
        updated_at: record.updated_at,
      })
      .collect::<Vec<_>>();

  let response = SuccessResponse {
    success: true,
    results,
    pagination: PaginationCursors {
      maybe_next: cursor_next,
      maybe_previous: cursor_previous,
      cursor_is_reversed,
    }
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| ErrorResponse::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
