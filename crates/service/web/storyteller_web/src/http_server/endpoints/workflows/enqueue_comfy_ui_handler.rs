// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::collections::HashMap;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use log::{error, info, warn};

use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::by_table::generic_inference_jobs::inference_input_source_token_type::InferenceInputSourceTokenType;
use enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;
use enums::by_table::generic_inference_jobs::inference_model_type::InferenceModelType;
use enums::common::visibility::Visibility;
use http_server_common::request::get_request_header_optional::get_request_header_optional;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::payloads::generic_inference_args::generic_inference_args::{GenericInferenceArgs, InferenceCategoryAbbreviated, PolymorphicInferenceArgs};
use mysql_queries::payloads::generic_inference_args::inner_payloads::workflow_payload::{NewValue, WorkflowArgs};
use mysql_queries::queries::generic_inference::web::insert_generic_inference_job::{insert_generic_inference_job, InsertGenericInferenceArgs};
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use primitives::str_to_bool::str_to_bool;
use primitives::try_str_to_num::try_str_to_num;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::users::UserToken;

use crate::configs::plans::get_correct_plan_for_session::get_correct_plan_for_session;
use crate::configs::plans::plan_category::PlanCategory;
use crate::http_server::requests::request_headers::get_routing_tag_header::get_routing_tag_header;
use crate::http_server::requests::request_headers::has_debug_header::has_debug_header;
use crate::http_server::session::lookup::user_session_extended::UserSessionExtended;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;
use crate::util::allowed_video_style_transfer_access::allowed_video_style_transfer_access;

#[derive(Deserialize)]
pub struct EnqueueComfyRequest {
    uuid_idempotency_token: String,

    maybe_lora_model: Option<ModelWeightToken>,
    maybe_prompt: Option<String>,
    maybe_negative_prompt: Option<String>,
    maybe_json_modifications: Option<HashMap<String, NewValue>>,
    maybe_workflow_config: Option<ModelWeightToken>,
    maybe_input_file: Option<MediaFileToken>,
    maybe_output_path: Option<String>,

    maybe_trim_start_seconds: Option<u32>,
    maybe_trim_end_seconds: Option<u32>,

    maybe_target_fps: Option<u32>,
    // maybe_scale_width: Option<u32>,
    // maybe_scale_height: Option<u32>,

    creator_set_visibility: Option<Visibility>,
}

/// Treated as an enum. Only one of these may be set.

#[derive(Serialize)]
pub struct EnqueueComfySuccessResponse {
    pub success: bool,
    pub inference_job_token: InferenceJobToken,
}

#[derive(Debug)]
pub enum EnqueueComfyError {
    BadInput(String),
    NotAuthorized,
    ServerError,
    RateLimited,
}

impl ResponseError for EnqueueComfyError {
    fn status_code(&self) -> StatusCode {
        match *self {
            EnqueueComfyError::BadInput(_) => StatusCode::BAD_REQUEST,
            EnqueueComfyError::NotAuthorized => StatusCode::UNAUTHORIZED,
            EnqueueComfyError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
            EnqueueComfyError::RateLimited => StatusCode::TOO_MANY_REQUESTS,
        }
    }

    fn error_response(&self) -> HttpResponse {
        let error_reason = match self {
            EnqueueComfyError::BadInput(reason) => reason.to_string(),
            EnqueueComfyError::NotAuthorized => "unauthorized".to_string(),
            EnqueueComfyError::ServerError => "server error".to_string(),
            EnqueueComfyError::RateLimited => "rate limited".to_string(),
        };

        to_simple_json_error(&error_reason, self.status_code())
    }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl std::fmt::Display for EnqueueComfyError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{:?}", self)
    }
}

pub async fn enqueue_comfy_ui_handler(
    http_request: HttpRequest,
    request: web::Json<EnqueueComfyRequest>,
    server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, EnqueueComfyError>
{
    let mut maybe_user_token : Option<UserToken> = None;

    let mut mysql_connection = server_state.mysql_pool
        .acquire()
        .await
        .map_err(|err| {
            warn!("MySql pool error: {:?}", err);
            EnqueueComfyError::ServerError
        })?;

    let maybe_avt_token = server_state.avt_cookie_manager
        .get_avt_token_from_request(&http_request);

    // ==================== USER SESSION ==================== //

    let maybe_user_session = server_state
        .session_checker
        .maybe_get_user_session_extended_from_connection(&http_request, &mut mysql_connection)
        .await
        .map_err(|e| {
            warn!("Session checker error: {:?}", e);
            EnqueueComfyError::ServerError
        })?;

    if let Some(user_session) = maybe_user_session.as_ref() {
        maybe_user_token = Some(UserToken::new_from_str(&user_session.user_token));
    }

    // ==================== FEATURE FLAG CHECK ==================== //

    if !allowed_video_style_transfer_access(maybe_user_session.as_ref(), &server_state.flags) {
        warn!("Video style transfer access is not permitted for user");
        return Err(EnqueueComfyError::NotAuthorized);
    }

    // ==================== PAID PLAN + PRIORITY ==================== //

    // TODO: Plan should handle "first anonymous use" and "investor" cases.
    let plan = get_correct_plan_for_session(
        server_state.server_environment,
        maybe_user_session.as_ref());

    // TODO: Separate priority for animation.
    let priority_level = plan.web_vc_base_priority_level();

    // ==================== DEBUG MODE + ROUTING TAG ==================== //

    let is_debug_request = has_debug_header(&http_request);

    let maybe_routing_tag= get_routing_tag_header(&http_request);

    // ==================== RATE LIMIT ==================== //

    let rate_limiter = match maybe_user_session {
        None => &server_state.redis_rate_limiters.logged_out,
        Some(ref user) => {
            if user.role.is_banned {
                return Err(EnqueueComfyError::NotAuthorized);
            }
            &server_state.redis_rate_limiters.logged_in
        },
    };

    if let Err(_err) = rate_limiter.rate_limit_request(&http_request) {
        return Err(EnqueueComfyError::RateLimited);
    }

    // ==================== HANDLE IDEMPOTENCY ==================== //

    if let Err(reason) = validate_idempotency_token_format(&request.uuid_idempotency_token) {
        return Err(EnqueueComfyError::BadInput(reason));
    }

    insert_idempotency_token(&request.uuid_idempotency_token, &mut *mysql_connection)
        .await
        .map_err(|err| {
            error!("Error inserting idempotency token: {:?}", err);
            EnqueueComfyError::BadInput("invalid idempotency token".to_string())
        })?;

    // ==================== LOOK UP MODEL INFO ==================== //

    // TODO(bt): CHECK DATABASE FOR TOKENS!

    let ip_address = get_request_ip(&http_request);

    let maybe_user_preferred_visibility : Option<Visibility> = maybe_user_session
        .as_ref()
        .map(|user_session: &UserSessionExtended| user_session.preferences.preferred_tts_result_visibility); // TODO: New setting for web-vc

    let set_visibility = request.creator_set_visibility
        .or(maybe_user_preferred_visibility)
        .unwrap_or(Visibility::Public);


    let mut trim_start_seconds = request.maybe_trim_start_seconds.unwrap_or(0);
    let mut trim_end_seconds: u32 = request.maybe_trim_end_seconds.unwrap_or(3);
    
    // set to default 24 if beyond 60 set to 24 else set to 30
    let mut target_fps = request.maybe_target_fps.unwrap_or(24);
    if target_fps < 24 || target_fps > 60 || (target_fps != 30 && target_fps != 60) {
        target_fps = 24;
    }

    // let mut scale_width = request.maybe_scale_width.unwrap_or(1024);
    // let mut scale_height = request.maybe_scale_height.unwrap_or(1024);
    //
    // if scale_width < 768 || scale_width > 1024 {
    //     scale_width = 768;
    // }
    // if scale_height < 768 || scale_height > 1024 {
    //     scale_height = 768;
    // }

    // Plan should handle "first anonymous use" and "investor" cases.
    let plan = get_correct_plan_for_session(
        server_state.server_environment,
        maybe_user_session.as_ref()
    );

    // block trim too much 
    if plan.plan_slug() == "fakeyou_contributor" || plan.plan_category() == PlanCategory::Paid {
        if trim_end_seconds - trim_start_seconds > 20 {
            trim_start_seconds = 0;
            trim_end_seconds = 3;
        }
    } else {
        if trim_end_seconds - trim_start_seconds > 3 {
            trim_start_seconds = 0;
            trim_end_seconds = 3;
        }
    }

    let inference_args = WorkflowArgs {
        workflow_type: None, // Is this endpoint even used anymore?
        maybe_lora_model: request.maybe_lora_model.clone(),
        maybe_json_modifications: request.maybe_json_modifications.clone(),
        maybe_workflow_config: request.maybe_workflow_config.clone(),
        maybe_input_file: request.maybe_input_file.clone(),
        maybe_input_depth_file: None,
        maybe_input_normal_file: None,
        maybe_input_outline_file: None,
        maybe_output_path: request.maybe_output_path.clone(),
        creator_visibility:Some(set_visibility),
        trim_start_seconds: Some(trim_start_seconds),
        trim_end_seconds: Some(trim_end_seconds),
        target_fps:Some(target_fps),
        remove_watermark: None,
        // NB: The following are unused:
        maybe_google_drive_link: None,
        maybe_title: None,
        maybe_commit_hash: None,
        maybe_description: None,
        // NB: The following do not matter for this endpoint; they're used in
        // the newer, simpler enqueue endpoint:
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

    info!("Creating ComfyUI job record...");

    let query_result = insert_generic_inference_job(InsertGenericInferenceArgs {
        uuid_idempotency_token: &request.uuid_idempotency_token,
        job_type: InferenceJobType::ComfyUi,
        maybe_product_category: None,
        inference_category: InferenceCategory::Workflow,
        maybe_model_type: Some(InferenceModelType::ComfyUi), // NB: Model is static during inference
        maybe_model_token: None, // NB: Model is static during inference
        maybe_input_source_token: request.maybe_input_file.as_ref().map(|f| f.as_str()),
        maybe_input_source_token_type: Some(InferenceInputSourceTokenType::MediaFile),
        maybe_download_url: None,
        maybe_cover_image_media_file_token: None,
        maybe_raw_inference_text: None, // No text
        maybe_max_duration_seconds: None,
        maybe_inference_args: Some(GenericInferenceArgs {
            inference_category: Some(InferenceCategoryAbbreviated::Workflow),
            args: Some(PolymorphicInferenceArgs::Cu(inference_args)),
        }),
        maybe_creator_user_token: maybe_user_token.as_ref(),
        maybe_avt_token: maybe_avt_token.as_ref(),
        creator_ip_address: &ip_address,
        creator_set_visibility:  set_visibility,
        priority_level,
        requires_keepalive: plan.workflow_requires_frontend_keepalive(),
        is_debug_request,
        maybe_routing_tag: maybe_routing_tag.as_deref(),
        mysql_pool: &server_state.mysql_pool,
    }).await;

    let job_token = match query_result {
        Ok((job_token, _id)) => job_token,
        Err(err) => {
            warn!("New generic inference job creation DB error: {:?}", err);
            if err.had_duplicate_idempotency_token() {
                return Err(EnqueueComfyError::BadInput("Duplicate idempotency token".to_string()));
            }
            return Err(EnqueueComfyError::ServerError);
        }
    };

    let response: EnqueueComfySuccessResponse = EnqueueComfySuccessResponse {
        success: true,
        inference_job_token: job_token,
    };

    let body = serde_json::to_string(&response)
        .map_err(|_e| EnqueueComfyError::ServerError)?;

    Ok(HttpResponse::Ok()
        .content_type("application/json")
        .body(body))
}
