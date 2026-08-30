use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::info;

use artcraft_api_defs::omni_api::generate_requests::omni_api_video_generate_request::OmniApiVideoGenerateRequest;
use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
use artcraft_api_defs::omni_gen::generate_response::omni_gen_video_generate_response::OmniGenVideoGenerateResponse;
use enums::common::platform_type::PlatformType;
use http_server_common::request::get_request_ip::get_request_ip;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::generate::common::payments_error_test::payments_error_test;
use crate::http_server::endpoints::omni_api::generate::video::check_request::check_request;
use crate::http_server::endpoints::omni_api::generate::video::ingest_url_inputs::ingest_url_inputs;
use crate::http_server::endpoints::omni_api::shared_utils::video::validate_video_request::validate_video_request;
use crate::http_server::endpoints::omni_gen::generate::video::shared_video_generation::{
  run_authenticated_video_generation, VideoGenerationAuth,
};
use crate::http_server::user_lookup::api_keys::require_api_key_user::require_api_key_user;
use crate::state::server_state::ServerState;

/// Generate a video using the omni-api unified endpoint (API-key authenticated).
///
/// Razor-thin handler: validate the omni-api extras (URL-based media inputs),
/// authenticate the API key, ingest any URL inputs into media files, then
/// delegate to the shared generation core in the omni_gen module — which is
/// authoritative for generation behavior. This endpoint is the API-key-only
/// twin of `/v1/omni_gen/generate/video`.
#[utoipa::path(
  post,
  tag = "Omni API",
  path = "/v1/omni_api/generate/video",
  request_body = OmniApiVideoGenerateRequest,
  responses(
    (status = 200, description = "Success", body = OmniGenVideoGenerateResponse),
    (status = 400, description = "Bad input"),
    (status = 401, description = "Unauthorized"),
    (status = 402, description = "Payment required"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn omni_api_video_generate_handler(
  http_request: HttpRequest,
  mut request: Json<OmniApiVideoGenerateRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<OmniGenVideoGenerateResponse>, CommonWebError> {

  info!("request: {:?}", request);

  // Validate URL/media-token preconditions before any billable or DB-mutating work.
  check_request(&request)?;

  // Reject doomed combos (e.g. grok_imagine_video_1p5 without an image)
  // before any billable or DB-mutating work — see helper for the rules.
  // (This is the URL-aware twin of the omni_gen validator: URL inputs count
  // toward the same limits before they are ingested below.)
  validate_video_request(&request)?;

  payments_error_test(&request.prompt.as_deref().unwrap_or(""))?;

  // ==================== API KEY USER ==================== //

  let mut mysql_connection = server_state.mysql_pool.acquire().await?;

  // API-key authentication (Authorization header) ONLY — never a web
  // session. Web/session callers use /v1/omni_gen/generate/video.
  let api_session = require_api_key_user(&http_request, &mut *mysql_connection).await?;

  let ip_address = get_request_ip(&http_request);

  // ==================== INGEST URL INPUTS ==================== //

  // Download any URL media inputs into media files owned by this user, then
  // treat them as media tokens. Release the pooled connection first so we
  // don't hold a pool slot during the (network) downloads. This happens
  // BEFORE the shared core consumes the idempotency token, so a failed
  // ingest never burns the caller's token.
  let has_url_inputs = request.start_frame_image_url.is_some()
    || request.end_frame_image_url.is_some()
    || request.reference_image_urls.is_some()
    || request.reference_video_urls.is_some()
    || request.reference_audio_urls.is_some();

  if has_url_inputs {
    drop(mysql_connection);
    ingest_url_inputs(&mut request, &server_state, &api_session.user_token, &ip_address).await?;
    mysql_connection = server_state.mysql_pool.acquire().await?;
  }

  // ==================== DELEGATE TO THE SHARED CORE ==================== //

  let omni_gen_request = to_omni_gen_request(request.into_inner());

  let auth = VideoGenerationAuth {
    user_token: &api_session.user_token,
    // AVT tokens are web-session only; API-key callers have none.
    maybe_avt_token: None,
    // Omni API requests are always API-key authenticated.
    maybe_platform_type: Some(PlatformType::ApiKey),
  };

  run_authenticated_video_generation(
    &http_request,
    &omni_gen_request,
    &server_state,
    auth,
    mysql_connection,
  ).await
}

/// The omni-api request is the omni-gen request plus URL-based media inputs.
/// By the time this runs, `ingest_url_inputs` has folded every URL into its
/// media-token twin, so the conversion is a plain field map.
fn to_omni_gen_request(request: OmniApiVideoGenerateRequest) -> OmniGenVideoCostAndGenerateRequest {
  OmniGenVideoCostAndGenerateRequest {
    idempotency_token: request.idempotency_token,
    model: request.model,
    prompt: request.prompt,
    negative_prompt: request.negative_prompt,
    start_frame_image_media_token: request.start_frame_image_media_token,
    end_frame_image_media_token: request.end_frame_image_media_token,
    reference_image_media_tokens: request.reference_image_media_tokens,
    reference_video_media_tokens: request.reference_video_media_tokens,
    reference_audio_media_tokens: request.reference_audio_media_tokens,
    reference_character_tokens: request.reference_character_tokens,
    resolution: request.resolution,
    aspect_ratio: request.aspect_ratio,
    bitrate: request.bitrate,
    quality: request.quality,
    duration_seconds: request.duration_seconds,
    video_batch_count: request.video_batch_count,
    generate_audio: request.generate_audio,
    // Cost-estimation hints are an omni_gen-only field; generation ignores it.
    estimate_only: None,
  }
}
