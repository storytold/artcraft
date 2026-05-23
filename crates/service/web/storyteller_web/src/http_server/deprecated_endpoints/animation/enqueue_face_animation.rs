// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use log::{info, warn};

use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::by_table::generic_inference_jobs::inference_job_product_category::InferenceJobProductCategory;
use enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;
use enums::by_table::generic_inference_jobs::inference_model_type::InferenceModelType;
use enums::common::visibility::Visibility;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::payloads::generic_inference_args::generic_inference_args::{GenericInferenceArgs, InferenceCategoryAbbreviated, PolymorphicInferenceArgs};
use mysql_queries::payloads::generic_inference_args::inner_payloads::lipsync_payload::{FaceEnhancer, LipsyncAnimationAudioSource, LipsyncAnimationImageSource, LipsyncArgs};
use mysql_queries::queries::generic_inference::web::insert_generic_inference_job::{insert_generic_inference_job, InsertGenericInferenceArgs};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::media_uploads::MediaUploadToken;
use tokens::tokens::users::UserToken;
use tokens::tokens::voice_conversion_results::VoiceConversionResultToken;

use crate::configs::plans::get_correct_plan_for_session::get_correct_plan_for_session;
use crate::http_server::requests::request_headers::get_routing_tag_header::get_routing_tag_header;
use crate::http_server::requests::request_headers::has_debug_header::has_debug_header;
use crate::http_server::session::lookup::user_session_extended::UserSessionExtended;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;

#[derive(Deserialize)]
pub struct EnqueueFaceAnimationRequest {
  uuid_idempotency_token: String,

  audio_source: AudioSource,
  image_source: ImageSource,

  creator_set_visibility: Option<Visibility>,

  /// Width/height of the video to generate (presets)
  dimensions: Option<FrameSize>,

  /// SadTalker: parameter to make the animation more still.
  make_still: Option<bool>,

  /// SadTalker: we use gfpgan face enhancement by default; this disables it.
  disable_face_enhancement: Option<bool>,

  /// Remove the watermark (premium only)
  remove_watermark: Option<bool>,

  ///// SadTalker: cropping
  //crop: Option<CropMode>,
}

//#[derive(Deserialize, Copy, Clone)]
//#[serde(rename_all = "snake_case")]
//pub enum CropMode {
//  /// SadTalker: "extcrop", which appears to be a wider crop than the "crop" option
//  Crop,
//  /// SadTalker: "crop" (the default)
//  CloseCrop,
//  /// SadTalker: "full" (can't tell that "extfull" does any differently)
//  Full,
//}

#[derive(Deserialize, Copy, Clone)]
#[serde(rename_all = "snake_case")]
pub enum FrameSize {
  /// Twitter horizontal = 1280x720
  /// See: https://developer.twitter.com/en/docs/twitter-api/v1/media/upload-media/uploading-media/media-best-practices
  TwitterLandscape,

  /// Twitter vertical = 720x1280
  TwitterPortrait,

  /// Twitter square = 720x720
  TwitterSquare,

  // D-ID: 1000x1000
  // Runway: 896x512
  // Pika: 1024x576
}

impl FrameSize {
  pub fn get_width_and_height(&self) -> (u32, u32) {
    match self {
      FrameSize::TwitterLandscape => (1280, 720),
      FrameSize::TwitterPortrait => (720, 1280),
      FrameSize::TwitterSquare => (720, 720),
    }
  }
}

/// Treated as an enum. Only one of these may be set.
#[derive(Deserialize)]
pub struct AudioSource {
  maybe_media_file_token: Option<MediaFileToken>,
  maybe_media_upload_token: Option<MediaUploadToken>,
  maybe_tts_result_token: Option<String>,
  maybe_voice_conversion_result_token: Option<VoiceConversionResultToken>,
}

/// Treated as an enum. Only one of these may be set.
#[derive(Deserialize)]
pub struct ImageSource {
  maybe_media_file_token: Option<MediaFileToken>,
  maybe_media_upload_token: Option<MediaUploadToken>,
}

#[derive(Serialize)]
pub struct EnqueueFaceAnimationSuccessResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}

#[derive(Debug)]
pub enum EnqueueFaceAnimationError {
  BadInput(String),
  NotAuthorized,
  ServerError,
  RateLimited,
}

impl ResponseError for EnqueueFaceAnimationError {
  fn status_code(&self) -> StatusCode {
    match *self {
      EnqueueFaceAnimationError::BadInput(_) => StatusCode::BAD_REQUEST,
      EnqueueFaceAnimationError::NotAuthorized => StatusCode::UNAUTHORIZED,
      EnqueueFaceAnimationError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      EnqueueFaceAnimationError::RateLimited => StatusCode::TOO_MANY_REQUESTS,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      EnqueueFaceAnimationError::BadInput(reason) => reason.to_string(),
      EnqueueFaceAnimationError::NotAuthorized => "unauthorized".to_string(),
      EnqueueFaceAnimationError::ServerError => "server error".to_string(),
      EnqueueFaceAnimationError::RateLimited => "rate limited".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl std::fmt::Display for EnqueueFaceAnimationError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:?}", self)
  }
}

pub async fn enqueue_face_animation_handler(
  http_request: HttpRequest,
  request: web::Json<EnqueueFaceAnimationRequest>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, EnqueueFaceAnimationError>
{
  let mut maybe_user_token : Option<UserToken> = None;

  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        warn!("MySql pool error: {:?}", err);
        EnqueueFaceAnimationError::ServerError
      })?;

  let maybe_avt_token = server_state.avt_cookie_manager.get_avt_token_from_request(&http_request);

  // ==================== USER SESSION ==================== //

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_extended_from_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        EnqueueFaceAnimationError::ServerError
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

  let is_debug_request = has_debug_header(&http_request);
  let maybe_routing_tag = get_routing_tag_header(&http_request);

  // ==================== BANNED USERS ==================== //

  if let Some(ref user) = maybe_user_session {
    if user.role.is_banned {
      warn!("User is not authorized because they are banned.");
      return Err(EnqueueFaceAnimationError::NotAuthorized);
    }
  }

  // ==================== RATE LIMIT ==================== //

  let rate_limiter = match maybe_user_session {
    None => &server_state.redis_rate_limiters.logged_out,
    Some(ref _user) => &server_state.redis_rate_limiters.logged_in
  };

  if let Err(_err) = rate_limiter.rate_limit_request(&http_request).await {
    return Err(EnqueueFaceAnimationError::RateLimited);
  }

  // ==================== LOOK UP MODEL INFO ==================== //

  // TODO(bt): CHECK DATABASE FOR TOKENS!

  let audio_source: LipsyncAnimationAudioSource = {
    if let Some(ref token) = request.audio_source.maybe_media_file_token {
      LipsyncAnimationAudioSource::media_file_token(token.as_str())
    } else if let Some(ref token) = request.audio_source.maybe_media_upload_token {
      LipsyncAnimationAudioSource::media_upload_token(token.as_str())
    } else if let Some(ref token) = request.audio_source.maybe_tts_result_token {
      LipsyncAnimationAudioSource::tts_result_token(token)
    } else if let Some(ref token) = request.audio_source.maybe_voice_conversion_result_token {
      LipsyncAnimationAudioSource::voice_conversion_result_token(token.as_str())
    } else {
      return Err(EnqueueFaceAnimationError::BadInput("audio source not fully specified".to_string()));
    }
  };

  let image_source: LipsyncAnimationImageSource = {
    if let Some(ref token) = request.image_source.maybe_media_file_token {
      LipsyncAnimationImageSource::media_file_token(token.as_str())
    } else if let Some(ref token) = request.image_source.maybe_media_upload_token {
      LipsyncAnimationImageSource::media_upload_token(token.as_str())
    } else {
      return Err(EnqueueFaceAnimationError::BadInput("image source not fully specified".to_string()));
    }
  };

  let ip_address = get_request_ip(&http_request);

  let maybe_user_preferred_visibility : Option<Visibility> = maybe_user_session
      .as_ref()
      .map(|user_session: &UserSessionExtended| user_session.preferences.preferred_tts_result_visibility); // TODO: New setting for web-vc

  let set_visibility = request.creator_set_visibility
      .or(maybe_user_preferred_visibility)
      .unwrap_or(Visibility::Public);

  let mut inference_args = LipsyncArgs {
    maybe_audio_source: Some(audio_source),
    maybe_image_source: Some(image_source),
    maybe_face_enhancer: None,
    maybe_pose_style: None,
    maybe_preprocess: None,
    maybe_make_still: None,
    maybe_remove_watermark: None,
    maybe_resize_width: None,
    maybe_resize_height: None,
  };

  let enable_face_enhancement = !request.disable_face_enhancement.unwrap_or(false);

  if enable_face_enhancement {
    inference_args.maybe_face_enhancer = Some(FaceEnhancer::G); // "--enhancer gfpgan"
  }

  if request.make_still.unwrap_or(false) {
    inference_args.maybe_make_still = Some(true);
  }

  let remove_watermark = request.remove_watermark.unwrap_or(false)
      && plan.can_remove_visual_watermarks();

  if remove_watermark {
    inference_args.maybe_remove_watermark = Some(true);
  }

  let (width, height) = request.dimensions
      .unwrap_or(FrameSize::TwitterLandscape)
      .get_width_and_height();

  inference_args.maybe_resize_width = Some(width);
  inference_args.maybe_resize_height = Some(height);

  info!("Creating lipsync animation job record...");

  let query_result = insert_generic_inference_job(InsertGenericInferenceArgs {
    uuid_idempotency_token: &request.uuid_idempotency_token,
    job_type: InferenceJobType::SadTalker,
    maybe_product_category: Some(InferenceJobProductCategory::VidLipsyncSadTalker),
    inference_category: InferenceCategory::LipsyncAnimation,
    maybe_model_type: Some(InferenceModelType::SadTalker), // NB: Model is static during inference
    maybe_model_token: None, // NB: Model is static during inference
    maybe_input_source_token: None, // TODO: Introduce a second foreign key ?
    maybe_input_source_token_type: None, // TODO: Introduce a second foreign key ?
    maybe_download_url: None,
    maybe_cover_image_media_file_token: None,
    maybe_raw_inference_text: None, // No text
    maybe_max_duration_seconds: None,
    maybe_inference_args: Some(GenericInferenceArgs {
      inference_category: Some(InferenceCategoryAbbreviated::LipsyncAnimation),
      args: Some(PolymorphicInferenceArgs::La(inference_args)),
    }),
    maybe_creator_user_token: maybe_user_token.as_ref(),
    maybe_avt_token: maybe_avt_token.as_ref(),
    creator_ip_address: &ip_address,
    creator_set_visibility: set_visibility,
    priority_level,
    requires_keepalive: plan.lipsync_requires_frontend_keepalive(),
    is_debug_request,
    maybe_routing_tag: maybe_routing_tag.as_deref(),
    mysql_pool: &server_state.mysql_pool,
  }).await;

  let job_token = match query_result {
    Ok((job_token, _id)) => job_token,
    Err(err) => {
      warn!("New generic inference job creation DB error: {:?}", err);
      if err.had_duplicate_idempotency_token() {
        return Err(EnqueueFaceAnimationError::BadInput("Duplicate idempotency token".to_string()));
      }
      return Err(EnqueueFaceAnimationError::ServerError);
    }
  };

  // If you are using this file as a reference for another generic endpoint feature.
  // this feature will be sunset so don't worry about this
  server_state.firehose_publisher.enqueue_lipsync_animation(
    maybe_user_token.as_ref(),
    &job_token)
      .await
      .map_err(|e| {
        warn!("error publishing event: {:?}", e);
        EnqueueFaceAnimationError::ServerError
      })?;

  let response: EnqueueFaceAnimationSuccessResponse = EnqueueFaceAnimationSuccessResponse {
    success: true,
    inference_job_token: job_token,
  };

  let body = serde_json::to_string(&response)
      .map_err(|_e| EnqueueFaceAnimationError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
