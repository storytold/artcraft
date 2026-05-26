use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Json;
use actix_web::{web, HttpRequest, HttpResponse};

use crate::http_server::endpoints::app_state::components::get_user_locale::get_user_locale;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;

// =============== Success Response ===============

#[derive(Serialize, Default)]
pub struct DetectLocaleResponse {
  pub success: bool,
  /// Full BCP47 language tags
  pub full_language_tags: Vec<String>,
  /// Parsed out languages
  pub language_codes: Vec<String>,
}

// =============== Error Response ===============
// NB: Not using derive_more::Display since Clion doesn't understand it.
// =============== Handler ===============

pub async fn detect_locale_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<DetectLocaleResponse>, CommonWebError> {
  let locale = get_user_locale(&http_request);

  Ok(Json(DetectLocaleResponse {
    success: true,
    full_language_tags: locale.full_language_tags,
    language_codes: locale.language_codes,
  }))
}
