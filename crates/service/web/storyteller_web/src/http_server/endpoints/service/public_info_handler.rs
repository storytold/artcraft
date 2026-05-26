use std::sync::Arc;

use crate::http_server::endpoints::app_state::components::get_server_info::get_server_info;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;
use actix_web::http::StatusCode;
use actix_web::web::Json;
use actix_web::{web, HttpRequest, HttpResponse, ResponseError};
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;

#[derive(Serialize)]
pub struct PublicInfoResponse {
  pub success: bool,
  pub server_build_sha: String,
  pub server_hostname: String,
}
// NB: Not using derive_more::Display since Clion doesn't understand it.
pub async fn get_public_info_handler(
  _http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<PublicInfoResponse>, CommonWebError> {
  let server_info = get_server_info(&server_state);
  Ok(Json(PublicInfoResponse {
    success: true,
    server_build_sha: server_info.build_sha,
    server_hostname: server_info.hostname,
  }))
}
