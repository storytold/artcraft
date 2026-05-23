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
use enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;
use enums::common::visibility::Visibility;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::payloads::generic_inference_args::common::watermark_type::WatermarkType;
use mysql_queries::payloads::generic_inference_args::generic_inference_args::{GenericInferenceArgs, InferenceCategoryAbbreviated, PolymorphicInferenceArgs};
use mysql_queries::payloads::generic_inference_args::inner_payloads::studio_gen2_payload::StudioGen2Payload;
use mysql_queries::queries::generic_inference::web::insert_generic_inference_job::{insert_generic_inference_job, InsertGenericInferenceArgs};
use mysql_queries::queries::generic_inference::web::kill_jobs_in_development::kill_jobs_in_development;
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;

use crate::configs::plans::get_correct_plan_for_session::get_correct_plan_for_session;
use crate::configs::plans::plan_category::PlanCategory;
use crate::http_server::requests::request_headers::get_routing_tag_header::get_routing_tag_header;
use crate::http_server::requests::request_headers::has_debug_header::has_debug_header;
use crate::http_server::session::lookup::user_session_extended::UserSessionExtended;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;
use crate::util::allowed_video_style_transfer_access::allowed_video_style_transfer_access;

#[derive(Deserialize, ToSchema)]
pub struct EnqueueStudioGen2Request {
  /// Entropy for request de-duplication (required)
  pub uuid_idempotency_token: String,

  /// The input image media file (required)
  pub image_file: MediaFileToken,

  /// The input video media file (required)
  pub video_file: MediaFileToken,

  /// Remove watermark from the output
  /// Only for premium accounts
  pub remove_watermark: Option<bool>,

  /// Optional visibility setting override.
  pub creator_set_visibility: Option<Visibility>,

  /// Sleep for debugging
  pub debug_sleep_millis: Option<u64>,

  /// Kill old jobs (only in development)
  pub debug_kill_old_jobs: Option<bool>,

  // TODO
  pub output_width: Option<u64>,
  pub output_height: Option<u64>,
  pub fps: Option<u64>,

  // TODO
  pub trim_duration_millis: Option<u64>,

  // TODO
  pub max_frames: Option<u64>,
  pub rounds: Option<u64>,
  pub skip_image_resize: Option<bool>,
  
  /// Model image tensor width (we do not resize images to this!)
  pub tensor_image_width: Option<u64>,
  
  /// Model image tensor height (we do not resize images to this!)
  pub tensor_image_height: Option<u64>,
}

#[derive(Serialize, ToSchema)]
pub struct EnqueueStudioGen2Response {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}

#[derive(Debug, ToSchema)]
pub enum EnqueueStudioGen2Error {
  BadInput(String),
  NotAuthorized,
  ServerError,
  RateLimited,
}

impl ResponseError for EnqueueStudioGen2Error {
  fn status_code(&self) -> StatusCode {
    match *self {
      EnqueueStudioGen2Error::BadInput(_) => StatusCode::BAD_REQUEST,
      EnqueueStudioGen2Error::NotAuthorized => StatusCode::UNAUTHORIZED,
      EnqueueStudioGen2Error::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      EnqueueStudioGen2Error::RateLimited => StatusCode::TOO_MANY_REQUESTS,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      EnqueueStudioGen2Error::BadInput(reason) => reason.to_string(),
      EnqueueStudioGen2Error::NotAuthorized => "unauthorized".to_string(),
      EnqueueStudioGen2Error::ServerError => "server error".to_string(),
      EnqueueStudioGen2Error::RateLimited => "rate limited".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl std::fmt::Display for EnqueueStudioGen2Error {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:?}", self)
  }
}

/// Enqueue Studio Gen2 jobs.
#[utoipa::path(
  post,
  tag = "Studio Gen2",
  path = "/v1/studio_gen2/enqueue",
  responses(
    (status = 200, description = "Success", body = EnqueueStudioGen2Response),
    (status = 400, description = "Bad input", body = EnqueueStudioGen2Error),
    (status = 401, description = "Not authorized", body = EnqueueStudioGen2Error),
    (status = 429, description = "Rate limited", body = EnqueueStudioGen2Error),
    (status = 500, description = "Server error", body = EnqueueStudioGen2Error)
  ),
  params(("request" = EnqueueStudioGen2Request, description = "Payload for request"))
)]
pub async fn enqueue_studio_gen2_handler(
  http_request: HttpRequest,
  request: Json<EnqueueStudioGen2Request>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<EnqueueStudioGen2Response>, EnqueueStudioGen2Error> {

  let a = 1;
  // ==================== DB ==================== //

  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        warn!("MySql pool error: {:?}", err);
        EnqueueStudioGen2Error::ServerError
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
        EnqueueStudioGen2Error::ServerError
      })?;

  let maybe_user_token = maybe_user_session
      .as_ref()
      .map(|session| session.user_token_typed.clone());

  // ==================== FEATURE FLAG CHECK ==================== //

  //if !allowed_video_style_transfer_access(maybe_user_session.as_ref(), &server_state.flags) {
  //  warn!("Video style transfer access is not permitted for user");
  //  return Err(EnqueueStudioGen2Error::NotAuthorized);
  //}

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
        return Err(EnqueueStudioGen2Error::NotAuthorized);
      }
      &server_state.redis_rate_limiters.logged_in
    },
  };

  if let Err(_err) = rate_limiter.rate_limit_request(&http_request).await {
    return Err(EnqueueStudioGen2Error::RateLimited);
  }

  // ==================== HANDLE IDEMPOTENCY ==================== //

  if let Err(reason) = validate_idempotency_token_format(&request.uuid_idempotency_token) {
    return Err(EnqueueStudioGen2Error::BadInput(reason));
  }

  insert_idempotency_token(&request.uuid_idempotency_token, &mut *mysql_connection)
      .await
      .map_err(|err| {
        error!("Error inserting idempotency token: {:?}", err);
        EnqueueStudioGen2Error::BadInput("invalid idempotency token".to_string())
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

  let has_paid_plan = plan.plan_slug() == "fakeyou_contributor" || plan.plan_category() == PlanCategory::Paid;

  let watermark_type ;

  let is_requested_to_remove_watermark = request.remove_watermark.unwrap_or(false);
  let is_allowed_to_remove_watermark = is_staff; // TODO: Paid permission instead

  if  is_requested_to_remove_watermark && is_allowed_to_remove_watermark {
    watermark_type = None;
  } else {
    watermark_type = Some(WatermarkType::Storyteller); // Studio is only on Storyteller.
  }

  if request.debug_kill_old_jobs.unwrap_or(false)
      && server_state.server_environment.is_development()
  {
    info!("Killing old jobs before inserting new job (DEVELOPMENT MODE ONLY!)");
    let result = kill_jobs_in_development(&server_state.mysql_pool).await;
    if let Err(err) = result {
      warn!("Error killing old jobs: {:?}", err);
    }
  }

  let inference_args = StudioGen2Payload {
    image_file: Some(request.image_file.clone()),
    video_file: Some(request.video_file.clone()),
    creator_visibility: Some(set_visibility),
    watermark_type,
    after_job_debug_sleep_millis: request.debug_sleep_millis,
    output_width: request.output_width,
    output_height: request.output_height,
    fps: request.fps,
    max_frames: request.max_frames,
    rounds: request.rounds,
    trim_duration_millis: request.trim_duration_millis,
    skip_image_resize: request.skip_image_resize,
    tensor_image_width: request.tensor_image_width,
    tensor_image_height: request.tensor_image_height,
  };

  info!("Creating ComfyUI job record...");

  let query_result = insert_generic_inference_job(InsertGenericInferenceArgs {
    uuid_idempotency_token: &request.uuid_idempotency_token,
    job_type: InferenceJobType::StudioGen2,
    inference_category: InferenceCategory::DeprecatedField,
    maybe_model_type: None,
    maybe_product_category: None,
    maybe_model_token: None,
    maybe_input_source_token: None, // TODO: Introduce a second foreign key ?
    maybe_input_source_token_type: None, // TODO: Introduce a second foreign key ?
    maybe_download_url: None,
    maybe_cover_image_media_file_token: None,
    maybe_raw_inference_text: None, // No text
    maybe_max_duration_seconds: None,
    maybe_inference_args: Some(GenericInferenceArgs {
      inference_category: Some(InferenceCategoryAbbreviated::Workflow),
      args: Some(PolymorphicInferenceArgs::S2(inference_args)),
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
        return Err(EnqueueStudioGen2Error::BadInput("Duplicate idempotency token".to_string()));
      }
      return Err(EnqueueStudioGen2Error::ServerError);
    }
  };

  Ok(Json(EnqueueStudioGen2Response {
    success: true,
    inference_job_token: job_token,
  }))
}
