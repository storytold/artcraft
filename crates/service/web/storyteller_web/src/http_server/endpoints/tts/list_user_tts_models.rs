use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::header::ContentType;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpMessage, HttpRequest, HttpResponse};
use log::{info, warn};

use mysql_queries::queries::tts::tts_models::list_tts_models::{list_tts_models, TtsModelRecordForList};

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct GetProfilePathInfo {
  username: String,
}

#[derive(Serialize)]
pub struct ListTtsModelsForUserSuccessResponse {
  pub success: bool,
  pub models: Vec<TtsModelRecordForList>,
}
// NB: Not using derive_more::Display since Clion doesn't understand it.
pub async fn list_user_tts_models_handler(
  http_request: HttpRequest,
  path: Path<GetProfilePathInfo>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, CommonWebError>
{
  return Ok(HttpResponse::Gone()
      .content_type(ContentType::plaintext())
      .body("This endpoint has been removed."))
}

pub async fn original_list_user_tts_models_handler(
  http_request: HttpRequest,
  path: Path<GetProfilePathInfo>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, CommonWebError>
{
  info!("Fetching templates for user: {}", &path.username);

  let query_results = list_tts_models(
    &server_state.mysql_pool,
    Some(path.username.as_ref()),
    false
  ).await;

  let models = match query_results {
    Ok(results) => results,
    Err(e) => {
      warn!("Query error: {:?}", e);
      return Err(CommonWebError::from_anyhow_error(e));
    }
  };

  let response = ListTtsModelsForUserSuccessResponse {
    success: true,
    models,
  };

  let body = serde_json::to_string(&response)
    .map_err(|e| CommonWebError::from_error(e))?;

  Ok(HttpResponse::Ok()
    .content_type("application/json")
    .body(body))
}
