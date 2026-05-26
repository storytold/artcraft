use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpMessage, HttpRequest, HttpResponse};
use log::warn;

use mysql_queries::queries::tts::tts_results::query_tts_result::select_tts_result_by_token;
use mysql_queries::queries::tts::tts_results::query_tts_result::TtsResultRecordForResponse;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct GetTtsResultPathInfo {
  token: String,
}

#[derive(Serialize)]
pub struct GetTtsResultSuccessResponse {
  pub success: bool,
  pub result: TtsResultRecordForResponse,
}
// NB: Not using derive_more::Display since Clion doesn't understand it.
pub async fn get_tts_inference_result_handler(
  http_request: HttpRequest,
  path: Path<GetTtsResultPathInfo>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, CommonWebError>
{
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  let mut show_deleted_results = false;
  let mut is_moderator = false;

  if let Some(user_session) = maybe_user_session {
    // NB: Moderators can see deleted results.
    // Original creators cannot see them (unless they're moderators!)
    show_deleted_results = user_session.can_delete_other_users_tts_results;
    // Moderators get to see all the fields.
    is_moderator = user_session.can_delete_other_users_tts_results
        || user_session.can_edit_other_users_tts_models;
  }

  let inference_result_query_result = select_tts_result_by_token(
    &path.token,
    show_deleted_results,
    &server_state.mysql_pool
  ).await;

  let mut inference_result = match inference_result_query_result {
    Err(e) => {
      warn!("query error: {:?}", e);
      return Err(CommonWebError::from_anyhow_error(e));
    }
    Ok(None) => return Err(CommonWebError::NotFound),
    Ok(Some(inference_result)) => inference_result,
  };

  if let Some(moderator_fields) = inference_result.maybe_moderator_fields.as_ref() {
    // NB: The moderator fields will always be present before removal
    // We don't want non-mods seeing stuff made by banned users.
    if (moderator_fields.model_creator_is_banned || moderator_fields.result_creator_is_banned_if_user)
        && !is_moderator{
      return Err(CommonWebError::NotFound);
    }
  }

  if !is_moderator {
    inference_result.maybe_moderator_fields = None;
  }

  let response = GetTtsResultSuccessResponse {
    success: true,
    result: inference_result,
  };

  let body = serde_json::to_string(&response)
    .map_err(|e| CommonWebError::from_error(e))?;

  Ok(HttpResponse::Ok()
    .content_type("application/json")
    .body(body))
}
