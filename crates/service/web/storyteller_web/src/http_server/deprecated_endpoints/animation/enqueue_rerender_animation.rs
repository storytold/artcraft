// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use log::{info, warn};

use crate::http_server::session::lookup::user_session_extended::UserSessionExtended;
use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;
use enums::by_table::generic_inference_jobs::inference_model_type::InferenceModelType;
use enums::common::visibility::Visibility;
use http_server_common::request::get_request_header_optional::get_request_header_optional;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::payloads::generic_inference_args::generic_inference_args::{GenericInferenceArgs, InferenceCategoryAbbreviated, PolymorphicInferenceArgs};
use mysql_queries::payloads::generic_inference_args::inner_payloads::videofilter_payload::{RerenderArgs, VideofilterVideoSource};
use mysql_queries::queries::generic_inference::web::insert_generic_inference_job::{insert_generic_inference_job, InsertGenericInferenceArgs};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::users::UserToken;

use crate::configs::plans::get_correct_plan_for_session::get_correct_plan_for_session;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;

/// Debug requests can get routed to special "debug-only" workers, which can
/// be used to trial new code, run debugging, etc.
const DEBUG_HEADER_NAME : &str = "enable-debug-mode";

/// The routing tag header can send workloads to particular k8s hosts.
/// This is useful for catching the live logs or intercepting the job.
const ROUTING_TAG_HEADER_NAME : &str = "routing-tag";

#[derive(Deserialize)]
pub struct EnqueueRerenderAnimationRequest {
    uuid_idempotency_token: String,

    prompt: Option<String>,  // prompt for the new video
    a_prompt: Option<String>,  // prompt describing the old video
    n_prompt: Option<String>,  // negative prompt
    video_source: Option<MediaFileToken>,
    sd_model_token: Option<ModelWeightToken>,
    lora_model_token: Option<ModelWeightToken>,
    seed: Option<i32>,
    creator_set_visibility: Option<Visibility>,
}

/// Treated as an enum. Only one of these may be set.

#[derive(Serialize)]
pub struct EnqueueRerenderAnimationSuccessResponse {
    pub success: bool,
    pub inference_job_token: InferenceJobToken,
}

#[derive(Debug)]
pub enum EnqueueRerenderAnimationError {
    BadInput(String),
    NotAuthorized,
    ServerError,
    RateLimited,
}

impl ResponseError for EnqueueRerenderAnimationError {
    fn status_code(&self) -> StatusCode {
        match *self {
            EnqueueRerenderAnimationError::BadInput(_) => StatusCode::BAD_REQUEST,
            EnqueueRerenderAnimationError::NotAuthorized => StatusCode::UNAUTHORIZED,
            EnqueueRerenderAnimationError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
            EnqueueRerenderAnimationError::RateLimited => StatusCode::TOO_MANY_REQUESTS,
        }
    }

    fn error_response(&self) -> HttpResponse {
        let error_reason = match self {
            EnqueueRerenderAnimationError::BadInput(reason) => reason.to_string(),
            EnqueueRerenderAnimationError::NotAuthorized => "unauthorized".to_string(),
            EnqueueRerenderAnimationError::ServerError => "server error".to_string(),
            EnqueueRerenderAnimationError::RateLimited => "rate limited".to_string(),
        };

        to_simple_json_error(&error_reason, self.status_code())
    }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl std::fmt::Display for EnqueueRerenderAnimationError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{:?}", self)
    }
}

pub async fn enqueue_rerender_animation_handler(
    http_request: HttpRequest,
    request: web::Json<EnqueueRerenderAnimationRequest>,
    server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, EnqueueRerenderAnimationError>
{
    let mut maybe_user_token : Option<UserToken> = None;

    let mut mysql_connection = server_state.mysql_pool
        .acquire()
        .await
        .map_err(|err| {
            warn!("MySql pool error: {:?}", err);
            EnqueueRerenderAnimationError::ServerError
        })?;

    let maybe_avt_token = server_state.avt_cookie_manager.get_avt_token_from_request(&http_request);

    // ==================== USER SESSION ==================== //

    let maybe_user_session = server_state
        .session_checker
        .maybe_get_user_session_extended_from_connection(&http_request, &mut mysql_connection)
        .await
        .map_err(|e| {
            warn!("Session checker error: {:?}", e);
            EnqueueRerenderAnimationError::ServerError
        })?;

    if let Some(user_session) = maybe_user_session.as_ref() {
        maybe_user_token = Some(UserToken::new_from_str(&user_session.user_token));
    }

    // TODO: Plan should handle "first anonymous use" and "investor" cases.
    let plan = get_correct_plan_for_session(
      server_state.server_environment,
      maybe_user_session.as_ref());

    // TODO: Separate priority for animation.
    let priority_level = plan.web_vc_base_priority_level();

    // ==================== DEBUG MODE + ROUTING TAG ==================== //

    let is_debug_request =
        get_request_header_optional(&http_request, DEBUG_HEADER_NAME)
            .is_some();

    let maybe_routing_tag=
        get_request_header_optional(&http_request, ROUTING_TAG_HEADER_NAME)
            .map(|routing_tag| routing_tag.trim().to_string());

    // ==================== RATE LIMIT ==================== //

    let rate_limiter = match maybe_user_session {
        None => &server_state.redis_rate_limiters.logged_out,
        Some(ref user) => {
            if user.role.is_banned {
                return Err(EnqueueRerenderAnimationError::NotAuthorized);
            }
            &server_state.redis_rate_limiters.logged_in
        },
    };

    if let Err(_err) = rate_limiter.rate_limit_request(&http_request).await {
        return Err(EnqueueRerenderAnimationError::RateLimited);
    }

    // ==================== LOOK UP MODEL INFO ==================== //

    // TODO(bt): CHECK DATABASE FOR TOKENS!

    let video_source: VideofilterVideoSource = request.video_source
        .as_ref()
        .map(|token| VideofilterVideoSource::media_file_token(token.as_str()))
        .ok_or_else(|| EnqueueRerenderAnimationError::BadInput("video source not fully specified".to_string()))?;

    let sd_model_token: ModelWeightToken = request.sd_model_token
        .as_ref()
        .map(|token| ModelWeightToken::new_from_str(token.as_str()))
        .ok_or_else(|| EnqueueRerenderAnimationError::BadInput("sd model not fully specified".to_string()))?;

    let ip_address = get_request_ip(&http_request);

    let maybe_user_preferred_visibility : Option<Visibility> = maybe_user_session
        .as_ref()
        .map(|user_session: &UserSessionExtended| user_session.preferences.preferred_tts_result_visibility); // TODO: New setting for web-vc

    let set_visibility = request.creator_set_visibility
        .or(maybe_user_preferred_visibility)
        .unwrap_or(Visibility::Public);

    let inference_args = RerenderArgs {
        maybe_video_source: Some(video_source),
        maybe_sd_model_token: Some(sd_model_token),
        maybe_lora_model_token: request.lora_model_token.clone(),
        maybe_prompt: request.prompt.clone(),
        maybe_a_prompt: request.a_prompt.clone(),
        maybe_n_prompt: request.n_prompt.clone(),
        maybe_seed: request.seed,
    };

    info!("Creating rerender animation job record...");

    let query_result = insert_generic_inference_job(InsertGenericInferenceArgs {
        uuid_idempotency_token: &request.uuid_idempotency_token,
        job_type: InferenceJobType::RerenderAVideo,
        maybe_product_category: None, // ReRender was never launched
        inference_category: InferenceCategory::VideoFilter,
        maybe_model_type: Some(InferenceModelType::RerenderAVideo), // NB: Model is static during inference
        maybe_model_token: None, // NB: Model is static during inference
        maybe_input_source_token: None, // TODO: Introduce a second foreign key ?
        maybe_input_source_token_type: None, // TODO: Introduce a second foreign key ?
        maybe_download_url: None,
        maybe_cover_image_media_file_token: None,
        maybe_raw_inference_text: None, // No text
        maybe_max_duration_seconds: None,
        maybe_inference_args: Some(GenericInferenceArgs {
            inference_category: Some(InferenceCategoryAbbreviated::VideoFilter),
            args: Some(PolymorphicInferenceArgs::Rr(inference_args)),
        }),
        maybe_creator_user_token: maybe_user_token.as_ref(),
        maybe_avt_token: maybe_avt_token.as_ref(),
        creator_ip_address: &ip_address,
        creator_set_visibility: set_visibility,
        priority_level,
        requires_keepalive: plan.rerender_requires_frontent_keepalive(),
        is_debug_request,
        maybe_routing_tag: maybe_routing_tag.as_deref(),
        mysql_pool: &server_state.mysql_pool,
    }).await;

    let job_token = match query_result {
        Ok((job_token, _id)) => job_token,
        Err(err) => {
            warn!("New generic inference job creation DB error: {:?}", err);
            if err.had_duplicate_idempotency_token() {
                return Err(EnqueueRerenderAnimationError::BadInput("Duplicate idempotency token".to_string()));
            }
            return Err(EnqueueRerenderAnimationError::ServerError);
        }
    };

    let response: EnqueueRerenderAnimationSuccessResponse = EnqueueRerenderAnimationSuccessResponse {
        success: true,
        inference_job_token: job_token,
    };

    let body = serde_json::to_string(&response)
        .map_err(|_e| EnqueueRerenderAnimationError::ServerError)?;

    Ok(HttpResponse::Ok()
        .content_type("application/json")
        .body(body))
}
