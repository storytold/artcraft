// NB: Incrementally getting rid of build warnings...
// #![forbid(unused_imports)]
// #![forbid(unused_mut)]
// #![forbid(unused_variables)]

use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Json;
use actix_web::{web, HttpRequest, HttpResponse};
use log::{error, info, warn};
use utoipa::ToSchema;

use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::by_table::generic_inference_jobs::inference_job_product_category::InferenceJobProductCategory;
use enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;
use enums::by_table::generic_inference_jobs::inference_model_type::InferenceModelType;
use enums::common::visibility::Visibility;
use enums::no_table::style_transfer::style_transfer_name::StyleTransferName;
use http_server_common::request::get_request_header_optional::get_request_header_optional;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::payloads::generic_inference_args::common::watermark_type::WatermarkType;
use mysql_queries::payloads::generic_inference_args::generic_inference_args::{GenericInferenceArgs, InferenceCategoryAbbreviated, PolymorphicInferenceArgs};
use mysql_queries::payloads::generic_inference_args::inner_payloads::workflow_payload::{WorkflowArgs, WorkflowType};
use mysql_queries::queries::generic_inference::web::insert_generic_inference_job::{insert_generic_inference_job, InsertGenericInferenceArgs};
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use primitives::lazy_any_option_true::lazy_any_option_true;
use primitives::str_to_bool::str_to_bool;
use primitives::traits::trim_or_emptyable::TrimOrEmptyable;
use primitives::try_str_to_num::try_str_to_num;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;

use crate::configs::plans::get_correct_plan_for_session::get_correct_plan_for_session;
use crate::configs::plans::plan_category::PlanCategory;
use crate::http_server::endpoints::workflows::coordinate_workflow_args::{coordinate_workflow_args, CoordinatedWorkflowArgs};
use crate::http_server::endpoints::workflows::enqueue::vst_common::vst_error::VstError;
use crate::http_server::endpoints::workflows::enqueue::vst_common::vst_request::VstRequest;
use crate::http_server::endpoints::workflows::enqueue::vst_common::vst_response::VstSuccessResponse;
use crate::http_server::requests::request_headers::get_routing_tag_header::get_routing_tag_header;
use crate::http_server::requests::request_headers::has_debug_header::has_debug_header;
use crate::http_server::session::lookup::user_session_extended::UserSessionExtended;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;
use crate::util::allowed_video_style_transfer_access::allowed_video_style_transfer_access;
use crate::util::cleaners::empty_media_file_token_to_null::empty_media_file_token_to_null;

/// The default ending trim point of a video if not supplied in the request.
const DEFAULT_TRIM_MILLISECONDS_END : u64 = 7_000;

/// This is the maximum duration (for premium users)
const MAXIMUM_DURATION_MILLIS : u64 = 10_000;

/// Strength of Diffusion:
///  * Range (0.0 - 1.0)
///  * 0.0 less dreamy
///  * 1.0 dream more
///  * The Python code will default to "1.0" if not supplied
const MINIMUM_STRENGTH : f32 = 0.0;
const MAXIMUM_STRENGTH : f32 = 1.0;
const DEFAULT_STRENGTH : f32 = 1.0;

/// Enqueue Storyteller Studio video workflows.
#[utoipa::path(
  post,
  tag = "Workflows",
  path = "/v1/workflows/enqueue_studio",
  responses(
    (status = 200, description = "Success", body = VstSuccessResponse),
    (status = 400, description = "Bad input", body = VstError),
    (status = 401, description = "Not authorized", body = VstError),
    (status = 429, description = "Rate limited", body = VstError),
    (status = 500, description = "Server error", body = VstError)
  ),
  params(("request" = VstRequest, description = "Payload for request"))
)]
pub async fn enqueue_studio_workflow_handler(
  http_request: HttpRequest,
  request: Json<VstRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<VstSuccessResponse>, VstError> {

  // ==================== VALIDATION ==================== //

  match request.frame_skip {
    None | Some(1) | Some(2) => {} // Allowed
    _ => {
      return Err(VstError::BadInput("Invalid frame skip value".to_string()));
    }
  }

  // ==================== DB ==================== //

  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        warn!("MySql pool error: {:?}", err);
        VstError::ServerError
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
        VstError::ServerError
      })?;

  let maybe_user_token = maybe_user_session
      .as_ref()
      .map(|session| session.user_token_typed.clone());

  // ==================== FEATURE FLAG CHECK ==================== //

  if !allowed_video_style_transfer_access(maybe_user_session.as_ref(), &server_state.flags) {
    warn!("Video style transfer access is not permitted for user");
    return Err(VstError::NotAuthorized);
  }

  // ==================== PAID PLAN + PRIORITY ==================== //

  // TODO: Plan should handle "first anonymous use" and "investor" cases.
  let plan = get_correct_plan_for_session(
    server_state.server_environment,
    maybe_user_session.as_ref());

  // TODO: Separate priority for animation.
  let priority_level = plan.web_vc_base_priority_level();

  let is_staff = maybe_user_session
      .as_ref()
      .map(|user| user.role.can_ban_users)
      .unwrap_or(false);

  // ==================== DEBUG MODE + ROUTING TAG ==================== //

  let is_debug_request = has_debug_header(&http_request);

  let maybe_routing_tag= get_routing_tag_header(&http_request);

  // ==================== RATE LIMIT ==================== //

  let rate_limiter = match maybe_user_session {
    None => &server_state.redis_rate_limiters.logged_out,
    Some(ref user) => {
      if user.role.is_banned {
        return Err(VstError::NotAuthorized);
      }
      &server_state.redis_rate_limiters.logged_in
    },
  };

  if let Err(_err) = rate_limiter.rate_limit_request(&http_request) {
    return Err(VstError::RateLimited);
  }

  // ==================== HANDLE IDEMPOTENCY ==================== //

  if let Err(reason) = validate_idempotency_token_format(&request.uuid_idempotency_token) {
    return Err(VstError::BadInput(reason));
  }

  insert_idempotency_token(&request.uuid_idempotency_token, &mut *mysql_connection)
      .await
      .map_err(|err| {
        error!("Error inserting idempotency token: {:?}", err);
        VstError::BadInput("invalid idempotency token".to_string())
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

  let mut trim_start_millis = request.trim_start_millis.unwrap_or(0);
  let mut trim_end_millis = request.trim_end_millis.unwrap_or(DEFAULT_TRIM_MILLISECONDS_END);

  let has_paid_plan = plan.plan_slug() == "fakeyou_contributor" || plan.plan_category() == PlanCategory::Paid;

  // block trim too much
  if has_paid_plan {
    if trim_end_millis - trim_start_millis > MAXIMUM_DURATION_MILLIS {
      trim_start_millis = 0;
      trim_end_millis = MAXIMUM_DURATION_MILLIS;
    }
  } else {
    if trim_end_millis - trim_start_millis > DEFAULT_TRIM_MILLISECONDS_END {
      trim_start_millis = 0;
      trim_end_millis = DEFAULT_TRIM_MILLISECONDS_END;
    }
  }

  let maybe_strength = request.use_strength
      .map(|strength| {
        if strength < MINIMUM_STRENGTH || strength > MAXIMUM_STRENGTH {
          Err(VstError::BadInput("Strength must be between 0.0 and 1.0".to_string()))
        } else {
          Ok(strength)
        }
      })
      .transpose()?;

  let watermark_type ;
  let remove_watermark ;

  let is_requested_to_remove_watermark = request.remove_watermark.unwrap_or(false);
  let is_allowed_to_remove_watermark = is_staff; // TODO: Paid permission instead

  if  is_requested_to_remove_watermark && is_allowed_to_remove_watermark {
    watermark_type = None;
    remove_watermark = Some(true);
  } else {
    watermark_type = Some(WatermarkType::Storyteller); // Studio is only on Storyteller.
    remove_watermark = None; // NB: Smaller payload, defaults to false
  }

  let coordinated_args = CoordinatedWorkflowArgs {
    prompt: request.prompt.new_string_trim_or_empty(),
    travel_prompt: request.travel_prompt.new_string_trim_or_empty(),
    use_lipsync: lazy_any_option_true(&[
      Box::new(|| request.enable_lipsync),
      Box::new(|| request.use_lipsync),
      Box::new(|| get_request_header_optional(&http_request, "LIPSYNC-ENABLED")
          .map(|value| str_to_bool(&value)))
    ]),
    disable_lcm: lazy_any_option_true(&[
      Box::new(|| request.disable_lcm),
      Box::new(|| get_request_header_optional(&http_request, "DISABLE-LCM")
          .map(|value| str_to_bool(&value)))
    ]),
    use_cinematic: lazy_any_option_true(&[
      Box::new(|| request.use_cinematic),
      Box::new(|| get_request_header_optional(&http_request, "USE-CINEMATIC")
          .map(|value| str_to_bool(&value)))
    ]),
    use_face_detailer: request.use_face_detailer,
    use_upscaler: request.use_upscaler,
    remove_watermark,
  };

  let is_allowed_expensive_generation = is_staff || has_paid_plan;

  let coordinated_args = coordinate_workflow_args(coordinated_args, is_allowed_expensive_generation);

  let inference_args = WorkflowArgs {
    // Type of workflow
    workflow_type: Some(WorkflowType::StorytellerStudio),

    // Main text prompts
    positive_prompt: coordinated_args.prompt.new_string_trim_or_empty(),
    negative_prompt: request.negative_prompt.new_string_trim_or_empty(),
    travel_prompt: coordinated_args.travel_prompt.new_string_trim_or_empty(),

    // Input files
    maybe_input_file: Some(request.input_file.clone()),
    maybe_input_depth_file: empty_media_file_token_to_null(request.input_depth_file.as_ref()),
    maybe_input_normal_file: empty_media_file_token_to_null(request.input_normal_file.as_ref()),
    maybe_input_outline_file: empty_media_file_token_to_null(request.input_outline_file.as_ref()),
    global_ip_adapter_token: empty_media_file_token_to_null(request.global_ipa_media_token.as_ref()),

    // Other inputs
    style_name: Some(request.style),
    creator_visibility: Some(set_visibility),
    trim_start_milliseconds: Some(trim_start_millis),
    trim_end_milliseconds: Some(trim_end_millis),
    strength: maybe_strength,
    frame_skip: request.frame_skip,

    // Flags
    disable_lcm: coordinated_args.disable_lcm,
    use_cinematic: coordinated_args.use_cinematic,
    use_face_detailer: coordinated_args.use_face_detailer,
    use_upscaler: coordinated_args.use_upscaler,
    lipsync_enabled: coordinated_args.use_lipsync,
    enable_lipsync: coordinated_args.use_lipsync, // TODO(bt): We can stop writing this flag after we re-deploy the job.
    remove_watermark: coordinated_args.remove_watermark,
    watermark_type,

    // TODO: Get rid of the temporary flags.
    rollout_python_workflow_args: None,
    skip_process_video: get_request_header_optional(&http_request, "SKIP-PROCESS-VIDEO")
        .map(|value| str_to_bool(&value)),
    sleep_millis: get_request_header_optional(&http_request, "SLEEP-MILLIS")
        .and_then(|value| try_str_to_num(&value).ok()),

    // The new, simplified enqueuing doesn't care about the following parameters:
    maybe_lora_model: None,
    maybe_json_modifications: None,
    maybe_workflow_config: None,
    maybe_output_path: None,
    maybe_google_drive_link: None,
    maybe_title: None,
    maybe_commit_hash:None,
    maybe_description:None,
    trim_start_seconds: None,
    trim_end_seconds: None,
    target_fps: None,
    generate_fast_previews: Some(true),
  };

  info!("Creating ComfyUI job record...");

  let query_result = insert_generic_inference_job(InsertGenericInferenceArgs {
    uuid_idempotency_token: &request.uuid_idempotency_token,
    job_type: InferenceJobType::ComfyUi,
    maybe_product_category: Some(InferenceJobProductCategory::VidStudio),
    inference_category: InferenceCategory::Workflow,
    maybe_model_type: Some(InferenceModelType::ComfyUi), // NB: Model is static during inference
    maybe_model_token: None, // NB: Model is static during inference
    maybe_input_source_token: None, // TODO: Introduce a second foreign key ?
    maybe_input_source_token_type: None, // TODO: Introduce a second foreign key ?
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
    requires_keepalive: false,
    is_debug_request,
    maybe_routing_tag: maybe_routing_tag.as_deref(),
    mysql_pool: &server_state.mysql_pool,
  }).await;

  let job_token = match query_result {
    Ok((job_token, _id)) => job_token,
    Err(err) => {
      warn!("New generic inference job creation DB error: {:?}", err);
      if err.had_duplicate_idempotency_token() {
        return Err(VstError::BadInput("Duplicate idempotency token".to_string()));
      }
      return Err(VstError::ServerError);
    }
  };

  Ok(Json(VstSuccessResponse {
    success: true,
    inference_job_token: job_token,
  }))
}
