// #![forbid(unused_imports)]
// #![forbid(unused_mut)]
// #![forbid(unused_variables)]

use std::fmt::Debug;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use log::{info, warn};
use serde::Deserialize;
use serde::Serialize;

use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::by_table::generic_inference_jobs::inference_job_product_category::InferenceJobProductCategory;
use enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;
use enums::by_table::generic_inference_jobs::inference_model_type::InferenceModelType;
use http_server_common::request::get_request_header_optional::get_request_header_optional;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::payloads::generic_inference_args::generic_inference_args::{
  GenericInferenceArgs,
  InferenceCategoryAbbreviated,
  PolymorphicInferenceArgs,
};
use mysql_queries::payloads::generic_inference_args::inner_payloads::tts_payload::TTSArgs;
use mysql_queries::queries::generic_inference::web::insert_generic_inference_job::{
  insert_generic_inference_job,
  InsertGenericInferenceArgs,
};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::users::UserToken;

use crate::configs::plans::get_correct_plan_for_session::get_correct_plan_for_session;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;

#[derive(Deserialize)]
pub struct EnqueueCreateVoiceRequest {
    uuid_idempotency_token: String,
    voice_dataset_token: String,
}

#[derive(Serialize)]
pub struct EnqueueCreateVoiceRequestSuccessResponse {
    pub success: bool,
    pub inference_job_token: InferenceJobToken,
}

#[derive(Debug)]
pub enum EnqueueCreateVoiceRequestError {
    BadInput(String),
    NotAuthorized,
    ServerError,
    RateLimited,
}

impl ResponseError for EnqueueCreateVoiceRequestError {
    fn status_code(&self) -> StatusCode {
        match *self {
            EnqueueCreateVoiceRequestError::BadInput(_) => StatusCode::BAD_REQUEST,
            EnqueueCreateVoiceRequestError::NotAuthorized => StatusCode::UNAUTHORIZED,
            EnqueueCreateVoiceRequestError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
            EnqueueCreateVoiceRequestError::RateLimited => StatusCode::TOO_MANY_REQUESTS,
        }
    }

    fn error_response(&self) -> HttpResponse {
        let error_reason = match self {
            EnqueueCreateVoiceRequestError::BadInput(reason) => reason.to_string(),
            EnqueueCreateVoiceRequestError::NotAuthorized => "unauthorized".to_string(),
            EnqueueCreateVoiceRequestError::ServerError => "server error".to_string(),
            EnqueueCreateVoiceRequestError::RateLimited => "rate limited".to_string(),
        };

        to_simple_json_error(&error_reason, self.status_code())
    }
}

impl std::fmt::Display for EnqueueCreateVoiceRequestError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{:?}", self)
    }
}

/// Debug requests can get routed to special "debug-only" workers, which can
/// be used to trial new code, run debugging, etc.
const DEBUG_HEADER_NAME: &str = "enable-debug-mode";

/// The routing tag header can send workloads to particular k8s hosts.
/// This is useful for catching the live logs or intercepting the job.
const ROUTING_TAG_HEADER_NAME: &str = "routing-tag";

// pub async fn get_dataset_by_token
pub async fn create_voice_handler(
    http_request: HttpRequest,
    request: web::Json<EnqueueCreateVoiceRequest>,
    server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, EnqueueCreateVoiceRequestError> {
    // voice data set token ... zsd_wb08asm0m4a4cz42wwqked6tfg6e e.g

    // need this for the job
    // -> create_voice_records
    // Implementation for creating a voice

    let mut maybe_user_token: Option<UserToken> = None;

    let mut mysql_connection = server_state.mysql_pool.acquire().await.map_err(|err| {
        warn!("MySql pool error: {:?}", err);
        EnqueueCreateVoiceRequestError::ServerError
    })?;

    // ==================== USER SESSION ==================== //

    let maybe_user_session = server_state.session_checker
        .maybe_get_user_session_extended_from_connection(&http_request, &mut mysql_connection).await
        .map_err(|e| {
            warn!("Session checker error: {:?}", e);
            EnqueueCreateVoiceRequestError::ServerError
        })?;

    if let Some(user_session) = maybe_user_session.as_ref() {
        maybe_user_token = Some(UserToken::new_from_str(&user_session.user_token));
    }

    // TODO: Plan should handle "first anonymous use" and "investor" cases.
    let plan = get_correct_plan_for_session(
      server_state.server_environment_old,
      maybe_user_session.as_ref()
    );

    // TODO: Separate priority for animation.
    let priority_level = plan.web_vc_base_priority_level();

    // ==================== DEBUG MODE + ROUTING TAG ==================== //

    let is_debug_request = get_request_header_optional(&http_request, DEBUG_HEADER_NAME).is_some();

    let maybe_routing_tag = get_request_header_optional(&http_request, ROUTING_TAG_HEADER_NAME).map(
        |routing_tag| routing_tag.trim().to_string()
    );

    // ==================== BANNED USERS ==================== //

    if let Some(ref user) = maybe_user_session {
        if user.role.is_banned {
            return Err(EnqueueCreateVoiceRequestError::NotAuthorized);
        }
    }

    // ==================== RATE LIMIT ==================== //

    let rate_limiter = match maybe_user_session {
        None => &server_state.redis_rate_limiters.logged_out,
        Some(ref _user) => &server_state.redis_rate_limiters.logged_in,
    };

    if let Err(_err) = rate_limiter.rate_limit_request(&http_request).await {
        return Err(EnqueueCreateVoiceRequestError::RateLimited);
    }

    info!("Received payload for voice creation.");

    // Get up IP address
    let ip_address = get_request_ip(&http_request);

    // package as larger component args should always have an embedding token ..
    let inference_args = TTSArgs {
        voice_token: None,
        dataset_token: Some(request.voice_dataset_token.clone()),
    };

    let maybe_avt_token = server_state.avt_cookie_manager.get_avt_token_from_request(&http_request);

    // create the inference args here
    // enqueue a zero shot tts request here...
    // create the job record here! explore the table insert the inference args in here as json! keep it short
    let query_result = insert_generic_inference_job(InsertGenericInferenceArgs {
        uuid_idempotency_token: &request.uuid_idempotency_token,
        job_type: InferenceJobType::StyleTTS2,
        maybe_product_category: Some(InferenceJobProductCategory::TtsStyleTts2), // Perhaps we should count this another way?
        inference_category: InferenceCategory::TextToSpeech,
        maybe_model_type: Some(InferenceModelType::StyleTTS2), // NB: Model is static during inference
        maybe_model_token: None, // NB: Model is static during inference
        maybe_input_source_token: None,
        maybe_input_source_token_type: None,
        maybe_download_url: None,
        maybe_cover_image_media_file_token: None,
        maybe_raw_inference_text: None,
        maybe_max_duration_seconds: None,
        maybe_inference_args: Some(GenericInferenceArgs {
            inference_category: Some(InferenceCategoryAbbreviated::TextToSpeech),
            args: Some(PolymorphicInferenceArgs::Tts(inference_args)),
        }),
        maybe_creator_user_token: maybe_user_token.as_ref(),
        creator_ip_address: &ip_address,
        creator_set_visibility: enums::common::visibility::Visibility::Public,
        priority_level,
        requires_keepalive: true,
        maybe_avt_token: maybe_avt_token.as_ref(),
        is_debug_request,
        maybe_routing_tag: maybe_routing_tag.as_deref(),
        mysql_pool: &server_state.mysql_pool,
    }).await;

    let job_token = match query_result {
        Ok((job_token, _id)) => job_token,
        Err(err) => {
            warn!("New generic inference job creation DB error: {:?}", err);
            if err.had_duplicate_idempotency_token() {
                return Err(EnqueueCreateVoiceRequestError::BadInput("Duplicate idempotency token".to_string()));
            }
            return Err(EnqueueCreateVoiceRequestError::ServerError);
        }
    };

    let response: EnqueueCreateVoiceRequestSuccessResponse =
        EnqueueCreateVoiceRequestSuccessResponse {
            success: true,
            inference_job_token: job_token,
        };

    let body = serde_json
        ::to_string(&response)
        .map_err(|_e| EnqueueCreateVoiceRequestError::ServerError)?;
    // Error handling 101 rust result type returned like so.
    Ok(HttpResponse::Ok().content_type("application/json").body(body))
}
