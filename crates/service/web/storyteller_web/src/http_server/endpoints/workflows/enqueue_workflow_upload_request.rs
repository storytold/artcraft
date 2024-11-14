#![forbid(unused_mut)]

use std::fmt::Debug;
use std::fmt::{Display, Formatter};
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Json;
use actix_web::{web, HttpRequest, HttpResponse};
use log::error;
use log::warn;
use serde::Deserialize;
use serde::Serialize;
use utoipa::ToSchema;
use web::Data;

use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;
use enums::by_table::generic_inference_jobs::inference_model_type::InferenceModelType;
use enums::common::visibility::Visibility;
use http_server_common::request::get_request_header_optional::get_request_header_optional;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::payloads::generic_inference_args::generic_inference_args::{
    GenericInferenceArgs,
    InferenceCategoryAbbreviated,
    PolymorphicInferenceArgs,
};
use mysql_queries::payloads::generic_inference_args::inner_payloads::workflow_payload::WorkflowArgs;
use mysql_queries::queries::generic_inference::web::insert_generic_inference_job::{
    insert_generic_inference_job,
    InsertGenericInferenceArgs,
};
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use primitives::str_to_bool::str_to_bool;
use primitives::try_str_to_num::try_str_to_num;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::users::UserToken;

use crate::configs::plans::get_correct_plan_for_session::get_correct_plan_for_session;
use crate::http_server::requests::request_headers::get_routing_tag_header::get_routing_tag_header;
use crate::http_server::requests::request_headers::has_debug_header::has_debug_header;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;
use crate::util::allowed_studio_access::allowed_studio_access;

#[derive(Deserialize, ToSchema)]
pub struct EnqueueWorkFlowRequest {
    pub uuid_idempotency_token: String,
    pub google_drive_link: String, 
    pub title: String,
    pub description: String,
    pub commit_hash: String,
    // Optional cover image for workflow.
    pub maybe_cover_image_media_file_token: Option<MediaFileToken>,
    pub creator_set_visibility:Option<Visibility>
}

#[derive(Serialize, ToSchema)]
pub struct EnqueueWorkFlowRequestSuccessResponse {
    pub success: bool,
    pub inference_job_token: InferenceJobToken,
}

#[derive(Debug, ToSchema)]
pub enum EnqueueWorkFlowRequestError {
    BadInput(String),
    NotAuthorized,
    ServerError,
    RateLimited,
}

impl ResponseError for EnqueueWorkFlowRequestError {
    fn status_code(&self) -> StatusCode {
        match *self {
            EnqueueWorkFlowRequestError::BadInput(_) => StatusCode::BAD_REQUEST,
            EnqueueWorkFlowRequestError::NotAuthorized => StatusCode::UNAUTHORIZED,
            EnqueueWorkFlowRequestError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
            EnqueueWorkFlowRequestError::RateLimited => StatusCode::TOO_MANY_REQUESTS,
        }
    }

    fn error_response(&self) -> HttpResponse {
        let error_reason = match self {
            EnqueueWorkFlowRequestError::BadInput(reason) => reason.to_string(),
            EnqueueWorkFlowRequestError::NotAuthorized => "unauthorized".to_string(),
            EnqueueWorkFlowRequestError::ServerError => "server error".to_string(),
            EnqueueWorkFlowRequestError::RateLimited => "rate limited".to_string(),
        };

        to_simple_json_error(&error_reason, self.status_code())
    }
}

impl Display for EnqueueWorkFlowRequestError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "{:?}", self)
    }
}

// Implementation for enqueuing a TTS request
// Reference enqueue_infer_tts_handler.rs for checks: rate limiting / user sessions
// insert generic inference job.rs
// Need to convert it to generic inference job.

pub async fn enqueue_workflow_upload_request(
    http_request: HttpRequest,
    request: Json<EnqueueWorkFlowRequest>,
    server_state: Data<Arc<ServerState>>
) -> Result<HttpResponse, EnqueueWorkFlowRequestError> {


    if request.google_drive_link.is_empty() {
        return Err(EnqueueWorkFlowRequestError::BadInput("Missing Google Drive Link".to_string()));
    } 

    if request.title.is_empty() {
        return Err(EnqueueWorkFlowRequestError::BadInput("Missing Title".to_string()));
    }

    if request.description.is_empty() {
        return Err(EnqueueWorkFlowRequestError::BadInput("Missing Description".to_string()));
    }

    if request.commit_hash.is_empty() {
        return Err(EnqueueWorkFlowRequestError::BadInput("Missing commit hash".to_string()));
    }

    let mut maybe_user_token: Option<UserToken> = None;

    let visibility = request.creator_set_visibility
    .unwrap_or(Visibility::Private);

    let mut mysql_connection = server_state.mysql_pool.acquire().await.map_err(|err| {
        warn!("MySql pool error: {:?}", err);
        EnqueueWorkFlowRequestError::ServerError
    })?;

    // ==================== USER SESSION ==================== //

    let maybe_user_session = server_state.session_checker
        .maybe_get_user_session_extended_from_connection(&http_request, &mut mysql_connection).await
        .map_err(|e| {
            warn!("Session checker error: {:?}", e);
            EnqueueWorkFlowRequestError::ServerError
        })?;
    

    if let Some(user_session) = maybe_user_session.as_ref() {
        maybe_user_token = Some(UserToken::new_from_str(&user_session.user_token));
    }

    // ==================== PLANS ==================== //

    // Plan should handle "first anonymous use" and "investor" cases.
    let plan = get_correct_plan_for_session(
        server_state.server_environment,
        maybe_user_session.as_ref()
    );

    // Separate priority for animation.
    let priority_level = plan.web_vc_base_priority_level();

    // ==================== DEBUG MODE + ROUTING TAG ==================== //

    let is_debug_request = has_debug_header(&http_request);

    let maybe_routing_tag= get_routing_tag_header(&http_request);

    // ==================== BANNED USERS ==================== //

    if let Some(ref user) = maybe_user_session {
        if user.role.is_banned {
            return Err(EnqueueWorkFlowRequestError::NotAuthorized);
        }
    }

    // DETECT premium user and queue

    // ==================== RATE LIMIT ==================== //

    let rate_limiter = match maybe_user_session {
        None => &server_state.redis_rate_limiters.logged_out,
        Some(ref _user) => &server_state.redis_rate_limiters.logged_in,
    };

    if let Err(_err) = rate_limiter.rate_limit_request(&http_request) {
        return Err(EnqueueWorkFlowRequestError::RateLimited);
    }

    // Get up IP address
    let ip_address = get_request_ip(&http_request);

    // Check the inference args to make sure everything is all there for upload loRA / model or standard inference

    // ==================== HANDLE IDEMPOTENCY ==================== //

    if let Err(reason) = validate_idempotency_token_format(&request.uuid_idempotency_token) {
        return Err(EnqueueWorkFlowRequestError::BadInput(reason));
    }

    insert_idempotency_token(&request.uuid_idempotency_token, &mut *mysql_connection)
        .await
        .map_err(|err| {
            error!("Error inserting idempotency token: {:?}", err);
            EnqueueWorkFlowRequestError::BadInput("invalid idempotency token".to_string())
        })?;

    // ==================== INFERENCE ARGS ==================== //

    let google_drive_link = request.google_drive_link.clone();
    let title = request.title.clone();
    let description = request.description.clone();
    let commit_hash = request.commit_hash.clone();

    let inference_args = WorkflowArgs {
        workflow_type: None, // Is this endpoint even used anymore?
        maybe_google_drive_link: Some(google_drive_link),
        maybe_title: Some(title),
        maybe_description: Some(description),
        maybe_commit_hash: Some(commit_hash),
        creator_visibility: Some(visibility),
        remove_watermark: None,
        // NB: The following args are irrelevant for uploading workflows
        maybe_lora_model: None,
        maybe_json_modifications: None,
        maybe_workflow_config: None,
        maybe_input_file: None,
        maybe_input_depth_file: None,
        maybe_input_normal_file: None,
        maybe_input_outline_file: None,
        maybe_output_path: None,
        trim_start_seconds: None,
        trim_end_seconds: None,
        target_fps: None,
        style_name: None,
        trim_start_milliseconds: None,
        trim_end_milliseconds: None,
        positive_prompt: None,
        negative_prompt: None,
        travel_prompt: None,
        global_ip_adapter_token: None,
        enable_lipsync: None,
        rollout_python_workflow_args: get_request_header_optional(&http_request, "PYTHON-WORKFLOW-ARGS")
            .map(|value| str_to_bool(&value)),
        skip_process_video: get_request_header_optional(&http_request, "SKIP-PROCESS-VIDEO")
            .map(|value| str_to_bool(&value)),
        sleep_millis: get_request_header_optional(&http_request, "SLEEP-MILLIS")
            .and_then(|value| try_str_to_num(&value).ok()),
        use_face_detailer: None,
        use_upscaler: None,
        lipsync_enabled: None,
        disable_lcm: None,
        use_cinematic: None,
        strength: None,
        frame_skip: None,
        watermark_type: None,
        generate_fast_previews: Some(false),
        use_cogvideo: None,
    };
   
    // create the inference args here
    let maybe_avt_token = server_state.avt_cookie_manager.get_avt_token_from_request(&http_request);

    
    // create the job record here!
    let query_result = insert_generic_inference_job(InsertGenericInferenceArgs {
        uuid_idempotency_token: &request.uuid_idempotency_token,
        job_type: InferenceJobType::ComfyUi,
        maybe_product_category: None, // This endpoint is deprecated
        inference_category: InferenceCategory::Workflow,
        maybe_model_type: Some(InferenceModelType::ComfyUi), // NB: Model is static during inference
        maybe_model_token: None, // NB: Model is static during inference
        maybe_input_source_token: None,
        maybe_input_source_token_type: None,
        maybe_download_url: None,
        maybe_cover_image_media_file_token: request.maybe_cover_image_media_file_token.as_ref(),
        maybe_raw_inference_text: None,
        maybe_max_duration_seconds: None,
        maybe_inference_args: Some(GenericInferenceArgs {
            inference_category: Some(InferenceCategoryAbbreviated::Workflow),
            args: Some(PolymorphicInferenceArgs::Cu(inference_args)),
        }),

        
        maybe_creator_user_token: maybe_user_token.as_ref(),
        maybe_avt_token: maybe_avt_token.as_ref(),
        creator_ip_address: &ip_address,
        creator_set_visibility: Visibility::Private,
        priority_level,
        requires_keepalive: false, //reverse ...  TODO fix this. we set it base on account is premium or not ... 
        is_debug_request,
        maybe_routing_tag: maybe_routing_tag.as_deref(),
        mysql_pool: &server_state.mysql_pool,
    }).await;

    let job_token = match query_result {
        Ok((job_token, _id)) => job_token,
        Err(err) => {
            warn!("New generic inference job creation DB error: {:?}", err);
            if err.had_duplicate_idempotency_token() {
                return Err(EnqueueWorkFlowRequestError::BadInput("Duplicate idempotency token".to_string()));
            }
            return Err(EnqueueWorkFlowRequestError::ServerError);
        }
    };

    let response: EnqueueWorkFlowRequestSuccessResponse = EnqueueWorkFlowRequestSuccessResponse {
        success: true,
        inference_job_token: job_token,
    };

    let body = serde_json
        ::to_string(&response)
        .map_err(|_e| EnqueueWorkFlowRequestError::ServerError)?;

    // Error handling 101 rust result type returned like so.
    Ok(HttpResponse::Ok().content_type("application/json").body(body))
}




