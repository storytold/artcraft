use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::info;

use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
use artcraft_api_defs::omni_gen::generate_response::omni_gen_video_generate_response::OmniGenVideoGenerateResponse;
use enums::common::platform_type::PlatformType;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::generate::common::payments_error_test::payments_error_test;
use crate::http_server::endpoints::omni_gen::generate::video::shared_video_generation::{
  run_authenticated_video_generation, VideoGenerationAuth,
};
use crate::http_server::endpoints::omni_gen::shared_utils::video::validate_video_request::validate_video_request;
use crate::http_server::user_lookup::api_or_web_session::require_any_session_or_key::{require_any_session_or_key, AnySessionType};
use crate::http_server::web_utils::get_request_platform_type::get_request_platform_type;
use crate::state::server_state::ServerState;

/// Generate a video using the omni-gen unified endpoint.
/// Authenticates as a web-session (cookie) user, an API-key (`Authorization` header) user, or
/// an MCP-session (`Authorization` header) user.
///
/// Razor-thin handler: authenticate, then delegate to the shared
/// generation core in `shared_video_generation` (which is authoritative for
/// behavior — the omni_api endpoint delegates to the same core).
#[utoipa::path(
  post,
  tag = "Omni Gen",
  path = "/v1/omni_gen/generate/video",
  request_body = OmniGenVideoCostAndGenerateRequest,
  responses(
    (status = 200, description = "Success", body = OmniGenVideoGenerateResponse),
    (status = 400, description = "Bad input"),
    (status = 401, description = "Unauthorized"),
    (status = 402, description = "Payment required"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn omni_gen_video_generate_handler(
  http_request: HttpRequest,
  request: Json<OmniGenVideoCostAndGenerateRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<OmniGenVideoGenerateResponse>, CommonWebError> {

  info!("request: {:?}", request);

  // Reject doomed combos (e.g. grok_imagine_video_1p5 without an image)
  // before any billable or DB-mutating work — see helper for the rules.
  validate_video_request(&request)?;

  payments_error_test(&request.prompt.as_deref().unwrap_or(""))?;

  // ==================== SESSION ==================== //

  let mut mysql_connection = server_state.mysql_pool.acquire().await?;

  // An API-key or MCP-session user (Authorization header) or a web-session (cookie) user.
  let session = require_any_session_or_key(
    &http_request,
    &server_state.session_checker,
    &server_state.avt_cookie_manager,
    &mut *mysql_connection,
  ).await?;

  let maybe_platform_type = match session.session_type {
    AnySessionType::Api => Some(PlatformType::ApiKey),
    AnySessionType::McpSession => Some(PlatformType::Mcp),
    AnySessionType::WebSession => get_request_platform_type(&http_request),
  };

  let auth = VideoGenerationAuth {
    user_token: &session.user_token,
    // AVT tokens are web-session only; API-key and MCP sessions never carry one.
    maybe_avt_token: session.maybe_avt_token.clone(),
    maybe_platform_type,
  };

  run_authenticated_video_generation(
    &http_request,
    &request,
    &server_state,
    auth,
    mysql_connection,
  ).await
}
