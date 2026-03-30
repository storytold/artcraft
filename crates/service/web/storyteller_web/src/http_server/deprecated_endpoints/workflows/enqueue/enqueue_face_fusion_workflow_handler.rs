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
use enums::common::visibility::Visibility;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::payloads::generic_inference_args::common::watermark_type::WatermarkType;
use mysql_queries::payloads::generic_inference_args::generic_inference_args::{GenericInferenceArgs, InferenceCategoryAbbreviated, PolymorphicInferenceArgs};
use mysql_queries::payloads::generic_inference_args::inner_payloads::face_fusion_payload::{CropDimensions, FaceFusionPayload};
use mysql_queries::queries::generic_inference::web::insert_generic_inference_job::{insert_generic_inference_job, InsertGenericInferenceArgs};
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;

use crate::configs::plans::get_correct_plan_for_session::get_correct_plan_for_session;
use crate::configs::plans::plan_category::PlanCategory;
use crate::http_server::requests::get_request_domain_branding::{get_request_domain_branding, DomainBranding};
use crate::http_server::requests::request_headers::get_routing_tag_header::get_routing_tag_header;
use crate::http_server::requests::request_headers::has_debug_header::has_debug_header;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::web_utils::user_session::require_user_session::RequireUserSessionError;
use crate::http_server::web_utils::user_session::require_user_session_extended_using_connection::require_user_session_extended_using_connection;
use crate::state::server_state::ServerState;
use crate::util::cleaners::empty_media_file_token_to_null::empty_media_file_token_to_null;

#[derive(Deserialize, ToSchema)]
pub struct EnqueueFaceFusionWorkflowRequest {
  /// Entropy for request de-duplication (required)
  uuid_idempotency_token: String,

  /// Audio media token
  /// This is the audio to lipsync against.
  audio_media_file_token: MediaFileToken,

  /// Image or video media token
  /// This is the image or video that will be lipsynced to the audio
  /// This video must contain a face.
  image_or_video_media_file_token: MediaFileToken,

  /// Remove watermark from the output
  /// Only for premium accounts
  remove_watermark: Option<bool>,

  /// Optional visibility setting override.
  creator_set_visibility: Option<Visibility>,

  /// Optional crop dimensions from the top left corner.
  maybe_crop: Option<EnqueueFaceFusionCropDimensions>,
}

// Top left corner, height  + width  of crop area
#[derive(Deserialize, ToSchema)]
pub struct EnqueueFaceFusionCropDimensions {
  /// X coordinate of the top left corner of the cropped area
  x: u32,
  /// Y coordinate of the top left corner of the cropped area
  y: u32,
  /// Width in pixels of the cropped area
  width: u32,
  /// Height in pixels of the cropped area
  height: u32,
}

#[derive(Serialize, ToSchema)]
pub struct EnqueueFaceFusionWorkflowSuccessResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}

#[derive(Debug, ToSchema)]
pub enum EnqueueFaceFusionWorkflowError {
  BadInput(String),
  NotAuthorized,
  ServerError,
  RateLimited,
}

impl ResponseError for EnqueueFaceFusionWorkflowError {
  fn status_code(&self) -> StatusCode {
    match *self {
      EnqueueFaceFusionWorkflowError::BadInput(_) => StatusCode::BAD_REQUEST,
      EnqueueFaceFusionWorkflowError::NotAuthorized => StatusCode::UNAUTHORIZED,
      EnqueueFaceFusionWorkflowError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      EnqueueFaceFusionWorkflowError::RateLimited => StatusCode::TOO_MANY_REQUESTS,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      EnqueueFaceFusionWorkflowError::BadInput(reason) => reason.to_string(),
      EnqueueFaceFusionWorkflowError::NotAuthorized => "unauthorized".to_string(),
      EnqueueFaceFusionWorkflowError::ServerError => "server error".to_string(),
      EnqueueFaceFusionWorkflowError::RateLimited => "rate limited".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl std::fmt::Display for EnqueueFaceFusionWorkflowError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:?}", self)
  }
}

/// Enqueue "lipsync" (Face Fusion) video workflows.
///
/// We've renamed this as to not give away what we're doing to users.
#[utoipa::path(
  post,
  tag = "Workflows",
  path = "/v1/workflows/enqueue_lipsync",
  responses(
    (status = 200, description = "Success", body = EnqueueFaceFusionWorkflowSuccessResponse),
    (status = 400, description = "Bad input", body = EnqueueFaceFusionWorkflowError),
    (status = 401, description = "Not authorized", body = EnqueueFaceFusionWorkflowError),
    (status = 429, description = "Rate limited", body = EnqueueFaceFusionWorkflowError),
    (status = 500, description = "Server error", body = EnqueueFaceFusionWorkflowError)
  ),
  params(("request" = EnqueueFaceFusionWorkflowRequest, description = "Payload for request"))
)]
pub async fn enqueue_face_fusion_workflow_handler(
  http_request: HttpRequest,
  request: Json<EnqueueFaceFusionWorkflowRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<EnqueueFaceFusionWorkflowSuccessResponse>, EnqueueFaceFusionWorkflowError>
{
  // ==================== DB ==================== //

  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        warn!("MySql pool error: {:?}", err);
        EnqueueFaceFusionWorkflowError::ServerError
      })?;

  // ==================== USER SESSION ==================== //

  let maybe_avt_token = server_state.avt_cookie_manager
      .get_avt_token_from_request(&http_request);

  let user_session = require_user_session_extended_using_connection(
    &http_request,
    &server_state.session_checker,
    &mut mysql_connection)
      .await
      .map_err(|err| match err {
        RequireUserSessionError::ServerError => EnqueueFaceFusionWorkflowError::ServerError,
        RequireUserSessionError::NotAuthorized => EnqueueFaceFusionWorkflowError::NotAuthorized,
      })?;

  // ==================== PAID PLAN + PRIORITY ==================== //

  // TODO: Plan should handle "first anonymous use" and "investor" cases.
  let plan = get_correct_plan_for_session(server_state.server_environment_old, Some(&user_session));

  // TODO: Separate priority for animation.
  let priority_level = plan.web_vc_base_priority_level();

  let is_staff = user_session.role.can_ban_users;

  // ==================== DEBUG MODE + ROUTING TAG ==================== //

  let is_debug_request = has_debug_header(&http_request);

  let maybe_routing_tag= get_routing_tag_header(&http_request);

  // ==================== RATE LIMIT ==================== //

  if let Err(_err) = server_state.redis_rate_limiters.logged_in.rate_limit_request(&http_request).await {
    return Err(EnqueueFaceFusionWorkflowError::RateLimited);
  }

  // ==================== HANDLE IDEMPOTENCY ==================== //

  if let Err(reason) = validate_idempotency_token_format(&request.uuid_idempotency_token) {
    return Err(EnqueueFaceFusionWorkflowError::BadInput(reason));
  }

  insert_idempotency_token(&request.uuid_idempotency_token, &mut *mysql_connection)
      .await
      .map_err(|err| {
        error!("Error inserting idempotency token: {:?}", err);
        EnqueueFaceFusionWorkflowError::BadInput("invalid idempotency token".to_string())
      })?;

  // ==================== HANDLE REQUEST ==================== //

  // TODO(bt): CHECK DATABASE FOR TOKENS!

  let ip_address = get_request_ip(&http_request);

  let set_visibility = request.creator_set_visibility
      .unwrap_or(user_session.preferences.preferred_tts_result_visibility);

  let has_paid_plan = plan.plan_slug() == "fakeyou_contributor" || plan.plan_category() == PlanCategory::Paid;

  let _is_allowed_expensive_generation = is_staff || has_paid_plan;
  let is_allowed_no_watermark = is_staff || has_paid_plan;

  let maybe_crop = request.maybe_crop.as_ref()
      .map(|crop| {
        CropDimensions {
          x: crop.x,
          y: crop.y,
          width: crop.width,
          height: crop.height,
        }
      });

  let branding = get_request_domain_branding(&http_request);

  let mut watermark_type = match branding {
    Some(DomainBranding::FakeYou) => Some(WatermarkType::FakeYou),
    Some(DomainBranding::Storyteller) => Some(WatermarkType::Storyteller),
    Some(_) => Some(WatermarkType::Storyteller),
    None => Some(WatermarkType::Storyteller),
  };

  if request.remove_watermark.unwrap_or(false) && is_allowed_no_watermark {
    watermark_type = None;
  }

  let payload = FaceFusionPayload {
    audio_media_file_token: empty_media_file_token_to_null(Some(&request.audio_media_file_token)),
    image_or_video_media_file_token: empty_media_file_token_to_null(Some(&request.image_or_video_media_file_token)),
    crop: maybe_crop,
    watermark_type,
    sleep_millis: None,
  };

  info!("Creating ComfyUI job record...");

  let query_result = insert_generic_inference_job(InsertGenericInferenceArgs {
    uuid_idempotency_token: &request.uuid_idempotency_token,
    job_type: InferenceJobType::FaceFusion,
    maybe_product_category: Some(InferenceJobProductCategory::VidLipsyncFaceFusion),
    inference_category: InferenceCategory::LipsyncAnimation,
    maybe_model_type: None,
    maybe_model_token: None,
    maybe_input_source_token: None,
    maybe_input_source_token_type: None,
    maybe_download_url: None,
    maybe_cover_image_media_file_token: None,
    maybe_raw_inference_text: None,
    maybe_max_duration_seconds: None,
    maybe_inference_args: Some(GenericInferenceArgs {
      inference_category: Some(InferenceCategoryAbbreviated::FaceFusion),
      args: Some(PolymorphicInferenceArgs::Ff(payload)),
    }),
    maybe_creator_user_token: Some(&user_session.user_token_typed),
    maybe_avt_token: maybe_avt_token.as_ref(),
    creator_ip_address: &ip_address,
    creator_set_visibility: set_visibility,
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
        return Err(EnqueueFaceFusionWorkflowError::BadInput("Duplicate idempotency token".to_string()));
      }
      return Err(EnqueueFaceFusionWorkflowError::ServerError);
    }
  };

  Ok(Json(EnqueueFaceFusionWorkflowSuccessResponse {
    success: true,
    inference_job_token: job_token,
  }))
}
