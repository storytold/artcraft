use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpMessage, HttpRequest, HttpResponse};
use chrono::{DateTime, Utc};
use log::warn;

use crate::http_server::session::lookup::user_session_extended::UserSessionExtended;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use enums::by_table::media_uploads::media_upload_type::MediaUploadType;
use enums::common::visibility::Visibility;
use mysql_queries::queries::media_uploads::reverse_list_user_media_uploads_of_type::reverse_list_user_media_uploads_of_type_with_connection;
use tokens::tokens::media_uploads::MediaUploadToken;
use tokens::tokens::users::UserToken;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;

/// For the URL PathInfo
#[deprecated(note = "Use `media_files` instead of `media_uploads`.")]
#[derive(Deserialize)]
pub struct ListUserMediaUploadsOfTypeProfilePathInfo {
  media_type: MediaUploadType,
}

#[deprecated(note = "Use `media_files` instead of `media_uploads`.")]
#[derive(Serialize)]
pub struct ListUserMediaUploadsOfTypeSuccessResponse {
  pub success: bool,
  pub uploads: Vec<MediaUploadEntry>,
}

#[deprecated(note = "Use `media_files` instead of `media_uploads`.")]
#[derive(Serialize)]
pub struct MediaUploadEntry {
  pub token: MediaUploadToken,
  pub media_type: MediaUploadType,

  pub maybe_original_filename: Option<String>,

  pub original_file_size_bytes: u32,
  pub original_duration_millis: u32,

  pub creator_set_visibility: Visibility,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}
// NB: Not using derive_more::Display since Clion doesn't understand it.
#[deprecated(note = "Use `media_files` instead of `media_uploads`.")]
pub async fn list_user_media_uploads_of_type_handler(
  http_request: HttpRequest,
  path: Path<ListUserMediaUploadsOfTypeProfilePathInfo>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, CommonWebError>
{
  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        warn!("MySql pool error: {:?}", err);
        CommonWebError::from_error(err)
      })?;

  // ==================== USER SESSION ==================== //

  let maybe_user_session : Option<UserSessionExtended> = server_state
      .session_checker
      .maybe_get_user_session_extended_from_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  let user_token = match maybe_user_session {
    None => {
      return Err(CommonWebError::NotAuthorized);
    }
    Some(user_session) => UserToken::new_from_str(&user_session.user_token),
  };

  let query_results = reverse_list_user_media_uploads_of_type_with_connection(
    &user_token,
    path.media_type,
    &mut mysql_connection,
  ).await;

  let uploads = match query_results {
    Ok(results) => results,
    Err(e) => {
      warn!("Query error: {:?}", e);
      return Err(CommonWebError::from_anyhow_error(e));
    }
  };

  let response = ListUserMediaUploadsOfTypeSuccessResponse {
    success: true,
    uploads: uploads.into_iter().map(|upload| MediaUploadEntry {
      token: upload.token,
      media_type: upload.media_type,
      maybe_original_filename: upload.maybe_original_filename,
      original_file_size_bytes: upload.original_file_size_bytes,
      original_duration_millis: upload.original_duration_millis,
      creator_set_visibility: upload.creator_set_visibility,
      created_at: upload.created_at,
      updated_at: upload.updated_at,
    }).collect(),
  };

  let body = serde_json::to_string(&response)
    .map_err(|e| CommonWebError::from_error(e))?;

  Ok(HttpResponse::Ok()
    .content_type("application/json")
    .body(body))
}
