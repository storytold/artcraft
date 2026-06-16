use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpMessage, HttpRequest};
use derive_more::Display;
use log::warn;
use redis::Commands;

use redis_common::redis_keys::RedisKeys;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct GetTtsModelUseCountPathInfo {
  model_token: String,
}

#[derive(Serialize)]
pub struct GetTtsModelUseCountSuccessResponse {
  pub success: bool,
  pub count: Option<u64>,
}
pub async fn get_tts_model_use_count_handler(
  http_request: HttpRequest,
  path: Path<GetTtsModelUseCountPathInfo>,
  server_state: web::Data<Arc<ServerState>>) -> Result<web::Json<GetTtsModelUseCountSuccessResponse>, CommonWebError>
{
  let mut redis = server_state.redis_pool
      .get()
      .map_err(|e| {
        warn!("redis error: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  let redis_count_key = RedisKeys::tts_model_usage_count(&path.model_token);

  let count : Option<u64> = redis.get(&redis_count_key)
      .map_err(|e| {
        warn!("redis error: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  Ok(web::Json(GetTtsModelUseCountSuccessResponse {
    success: true,
    count,
  }))
}
