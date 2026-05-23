#![forbid(unused_mut)]

use std::fmt::Debug;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use log::warn;
use serde::Deserialize;
use serde::Serialize;
use utoipa::ToSchema;

use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;
use enums::by_table::generic_inference_jobs::inference_model_type::InferenceModelType;
use enums::common::visibility::Visibility;
use http_server_common::request::get_request_header_optional::get_request_header_optional;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::payloads::generic_inference_args::generic_inference_args::{
  GenericInferenceArgs,
  InferenceCategoryAbbreviated,
};
use mysql_queries::queries::generic_inference::web::insert_generic_inference_job::{
  insert_generic_inference_job,
  InsertGenericInferenceArgs,
};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

use crate::configs::plans::get_correct_plan_for_session::get_correct_plan_for_session;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;
use crate::util::allowed_studio_access::allowed_studio_access;

/// Debug requests can get routed to special "debug-only" workers, which can
/// be used to trial new code, run debugging, etc.
const DEBUG_HEADER_NAME: &str = "enable-debug-mode";

/// The routing tag header can send workloads to particular k8s hosts.
/// This is useful for catching the live logs or intercepting the job.
const ROUTING_TAG_HEADER_NAME: &str = "routing-tag";

#[derive(Deserialize, ToSchema)]
pub struct EnqueueFbxToGltfRequest {
  // Entropy for idempotency
  uuid_idempotency_token: String,
  // The existing FBX media file token
  media_file_token: MediaFileToken,
}

#[derive(Serialize, ToSchema)]
pub struct EnqueueFbxToGltfRequestSuccessResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}

#[derive(Debug, ToSchema)]
pub enum EnqueueFbxToGltfRequestError {
  BadInput(String),
  NotAuthorized,
  ServerError,
  RateLimited,
}

impl ResponseError for EnqueueFbxToGltfRequestError {
  fn status_code(&self) -> StatusCode {
    match *self {
      EnqueueFbxToGltfRequestError::BadInput(_) => StatusCode::BAD_REQUEST,
      EnqueueFbxToGltfRequestError::NotAuthorized => StatusCode::UNAUTHORIZED,
      EnqueueFbxToGltfRequestError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      EnqueueFbxToGltfRequestError::RateLimited => StatusCode::TOO_MANY_REQUESTS,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      EnqueueFbxToGltfRequestError::BadInput(reason) => reason.to_string(),
      EnqueueFbxToGltfRequestError::NotAuthorized => "unauthorized".to_string(),
      EnqueueFbxToGltfRequestError::ServerError => "server error".to_string(),
      EnqueueFbxToGltfRequestError::RateLimited => "rate limited".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

impl std::fmt::Display for EnqueueFbxToGltfRequestError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:?}", self)
  }
}

#[utoipa::path(
  post,
  tag = "Engine",
  path = "/v1/conversion/enqueue_fbx_to_gltf",
  responses(
    (
      status = 200,
      description = "Enqueue FBX to GLTF",
      body = EnqueueFbxToGltfRequestSuccessResponse,
    ),
    (status = 400, description = "Bad input", body = EnqueueFbxToGltfRequestError),
    (status = 401, description = "Not authorized", body = EnqueueFbxToGltfRequestError),
    (status = 429, description = "Rate limited", body = EnqueueFbxToGltfRequestError),
    (status = 500, description = "Server error", body = EnqueueFbxToGltfRequestError)
  ),
  params(("request" = EnqueueFbxToGltfRequest, description = "Payload for FBX to GLTF Request"))
)]
pub async fn enqueue_fbx_to_gltf_handler(
    http_request: HttpRequest,
    request: web::Json<EnqueueFbxToGltfRequest>,
    server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, EnqueueFbxToGltfRequestError> {
    let mut maybe_user_token: Option<UserToken> = None;

    let mut mysql_connection = server_state.mysql_pool.acquire().await.map_err(|err| {
        warn!("MySql pool error: {:?}", err);
        EnqueueFbxToGltfRequestError::ServerError
    })?;

    // ==================== USER SESSION ==================== //

    let maybe_user_session = server_state.session_checker
        .maybe_get_user_session_extended_from_connection(&http_request, &mut mysql_connection).await
        .map_err(|e| {
            warn!("Session checker error: {:?}", e);
            EnqueueFbxToGltfRequestError::ServerError
        })?;

    if let Some(user_session) = maybe_user_session.as_ref() {
        maybe_user_token = Some(UserToken::new_from_str(&user_session.user_token));
    }

    // ==================== FEATURE FLAG CHECK ==================== //

    if !allowed_studio_access(maybe_user_session.as_ref(), &server_state.flags) {
        warn!("Storyteller Studio access is not permitted for user");
        return Err(EnqueueFbxToGltfRequestError::NotAuthorized);
    }

    // ==================== PAID PLAN + PRIORITY ==================== //

    // Plan should handle "first anonymous use" and "investor" cases.
    let plan = get_correct_plan_for_session(
      server_state.server_environment,
      maybe_user_session.as_ref()
    );

    // Separate priority for animation.
    let priority_level = plan.web_vc_base_priority_level();

    // ==================== DEBUG MODE + ROUTING TAG ==================== //

    let is_debug_request = get_request_header_optional(&http_request, DEBUG_HEADER_NAME).is_some();

    let maybe_routing_tag = get_request_header_optional(&http_request, ROUTING_TAG_HEADER_NAME).map(
        |routing_tag| routing_tag.trim().to_string()
    );

    // ==================== BANNED USERS ==================== //

    if let Some(ref user) = maybe_user_session {
        if user.role.is_banned {
            return Err(EnqueueFbxToGltfRequestError::NotAuthorized);
        }
    }

    // ==================== RATE LIMIT ==================== //

    let rate_limiter = match maybe_user_session {
        None => &server_state.redis_rate_limiters.logged_out,
        Some(ref _user) => &server_state.redis_rate_limiters.logged_in,
    };

    if let Err(_err) = rate_limiter.rate_limit_request(&http_request).await {
        return Err(EnqueueFbxToGltfRequestError::RateLimited);
    }

    let ip_address = get_request_ip(&http_request);

    let maybe_avt_token = server_state.avt_cookie_manager
        .get_avt_token_from_request(&http_request);

    if request.media_file_token.as_str().is_empty() {
        return Err(EnqueueFbxToGltfRequestError::BadInput("media_file_token is empty".to_string()));
    }

    let query_result = insert_generic_inference_job(InsertGenericInferenceArgs {
        uuid_idempotency_token: &request.uuid_idempotency_token,
        job_type: InferenceJobType::ConvertFbxToGltf,
        maybe_product_category: None, // This is not a product
        inference_category: InferenceCategory::FormatConversion,
        maybe_model_type: Some(InferenceModelType::ConvertFbxToGltf),
        maybe_model_token: None,
        maybe_input_source_token: Some(&request.media_file_token.as_str()),
        maybe_input_source_token_type: None,
        maybe_download_url: None,
        maybe_cover_image_media_file_token: None,
        maybe_raw_inference_text: None,
        maybe_max_duration_seconds: None,
        maybe_inference_args: Some(GenericInferenceArgs {
            inference_category: Some(InferenceCategoryAbbreviated::FormatConversion),
            args: None, // NB: no format conversion args for now
        }),
        maybe_creator_user_token: maybe_user_token.as_ref(),
        maybe_avt_token: maybe_avt_token.as_ref(),
        creator_ip_address: &ip_address,
        creator_set_visibility: Visibility::Public,
        priority_level,
        requires_keepalive: true,
        is_debug_request,
        maybe_routing_tag: maybe_routing_tag.as_deref(),
        mysql_pool: &server_state.mysql_pool,
    }).await;

    let job_token = match query_result {
        Ok((job_token, _id)) => job_token,
        Err(err) => {
            warn!("New generic inference job creation DB error: {:?}", err);
            if err.had_duplicate_idempotency_token() {
              return Err(EnqueueFbxToGltfRequestError::BadInput("Duplicate idempotency token".to_string()));
            }
            return Err(EnqueueFbxToGltfRequestError::ServerError);
        }
    };

    let response: EnqueueFbxToGltfRequestSuccessResponse = EnqueueFbxToGltfRequestSuccessResponse {
        success: true,
        inference_job_token: job_token,
    };

    let body = serde_json::to_string(&response)
        .map_err(|_e| EnqueueFbxToGltfRequestError::ServerError)?;

    Ok(HttpResponse::Ok().content_type("application/json").body(body))
}
