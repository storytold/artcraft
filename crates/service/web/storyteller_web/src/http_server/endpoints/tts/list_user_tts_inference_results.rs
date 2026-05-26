use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::header::ContentType;
use actix_web::http::StatusCode;
use actix_web::web::{Path, Query};
use actix_web::{web, HttpMessage, HttpRequest, HttpResponse};
use log::warn;

use mysql_queries::queries::tts::tts_results::list_tts_results_query_builder::{ListTtsResultsQueryBuilder, TtsInferenceRecordForList};

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct ListTtsInferenceResultsForUserPathInfo {
  pub username: String,
}

#[derive(Deserialize)]
pub struct ListTtsInferenceResultsForUserQuery {
  pub sort_ascending: Option<bool>,
  pub limit: Option<u16>,
  pub cursor: Option<String>,
  pub cursor_is_reversed: Option<bool>,
}

#[derive(Serialize)]
pub struct ListTtsInferenceResultsForUserSuccessResponse {
  pub success: bool,
  pub results: Vec<TtsInferenceRecordForList>,
  pub cursor_next: Option<String>,
  pub cursor_previous: Option<String>,
}
// NB: Not using derive_more::Display since Clion doesn't understand it.
pub async fn list_user_tts_inference_results_handler(
  http_request: HttpRequest,
  path: Path<ListTtsInferenceResultsForUserPathInfo>,
  query: Query<ListTtsInferenceResultsForUserQuery>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, CommonWebError>
{
  return Ok(HttpResponse::Gone()
      .content_type(ContentType::plaintext())
      .body("This endpoint has been removed."))
}

  pub async fn _original_list_user_tts_inference_results_handler(
    http_request: HttpRequest,
    path: Path<ListTtsInferenceResultsForUserPathInfo>,
    query: Query<ListTtsInferenceResultsForUserQuery>,
    server_state: web::Data<Arc<ServerState>>
  ) -> Result<HttpResponse, CommonWebError>
  {
    let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  // Permissions & ACLs
  let mut viewer_is_user = false;
  let mut is_mod_that_can_see_deleted = false;

  match maybe_user_session {
    None => {},
    Some(session) => {
      viewer_is_user = path.username == session.username;
      is_mod_that_can_see_deleted = session.can_delete_other_users_tts_results;
    },
  };

  // TODO: Enforce real maximums and defaults
  let limit = query.limit.unwrap_or(25);
  //let limit = std::cmp::max(limit, 100);

  let sort_ascending = query.sort_ascending.unwrap_or(false);
  let cursor_is_reversed = query.cursor_is_reversed.unwrap_or(false);

  let cursor = if let Some(cursor) = query.cursor.as_deref() {
    let cursor = server_state.sort_key_crypto.decrypt_id(cursor)
        .map_err(|e| {
          warn!("crypto error: {:?}", e);
          CommonWebError::from_anyhow_error(e)
        })?;
    Some(cursor)
  } else {
    None
  };

  let include_user_hidden = viewer_is_user || is_mod_that_can_see_deleted;

  let mut query_builder = ListTtsResultsQueryBuilder::new()
      .sort_ascending(sort_ascending)
      .scope_creator_username(Some(path.username.as_ref()))
      .include_user_hidden(include_user_hidden)
      .include_mod_disabled_results(is_mod_that_can_see_deleted)
      .limit(limit)
      .cursor_is_reversed(cursor_is_reversed)
      .offset(cursor);

  let query_results = query_builder.perform_query_for_page(&server_state.mysql_pool)
      .await;

  let results_page = match query_results {
    Ok(results) => results,
    Err(e) => {
      warn!("Query error: {:?}", e);
      return Err(CommonWebError::from_anyhow_error(e));
    }
  };

  let cursor_next = if let Some(id) = results_page.last_id {
    let cursor = server_state.sort_key_crypto.encrypt_id(id as u64)
        .map_err(|e| {
          warn!("crypto error: {:?}", e);
          CommonWebError::from_anyhow_error(e)
        })?;
    Some(cursor)
  } else {
    None
  };

  let cursor_previous = if let Some(id) = results_page.first_id {
    let cursor = server_state.sort_key_crypto.encrypt_id(id as u64)
        .map_err(|e| {
          warn!("crypto error: {:?}", e);
          CommonWebError::from_anyhow_error(e)
        })?;
    Some(cursor)
  } else {
    None
  };

  let response = ListTtsInferenceResultsForUserSuccessResponse {
    success: true,
    results: results_page.inference_records,
    cursor_next,
    cursor_previous,
  };

  let body = serde_json::to_string(&response)
    .map_err(CommonWebError::from_error)?;

  Ok(HttpResponse::Ok()
    .content_type("application/json")
    .body(body))
}
