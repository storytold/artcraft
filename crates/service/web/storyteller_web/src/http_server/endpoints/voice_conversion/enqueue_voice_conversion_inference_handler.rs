// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Json;
use actix_web::{web, HttpRequest, HttpResponse};
use log::{error, info, warn};
use redis::Commands;
use sqlx::pool::PoolConnection;
use sqlx::MySql;
use utoipa::ToSchema;

use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::by_table::generic_inference_jobs::inference_input_source_token_type::InferenceInputSourceTokenType;
use enums::by_table::generic_inference_jobs::inference_job_product_category::InferenceJobProductCategory;
use enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;
use enums::by_table::generic_inference_jobs::inference_model_type::InferenceModelType;
use enums::common::visibility::Visibility;
use http_server_common::request::get_request_header_optional::get_request_header_optional;
use http_server_common::request::get_request_ip::get_request_ip;
use migration::voice_conversion::query_vc_model_info_lite_for_migration::query_vc_model_info_lite_for_migration_with_connection;
use mysql_queries::payloads::generic_inference_args::generic_inference_args::{FundamentalFrequencyMethodForJob, GenericInferenceArgs, InferenceCategoryAbbreviated, PolymorphicInferenceArgs};
use mysql_queries::queries::generic_inference::web::insert_generic_inference_job::{insert_generic_inference_job, InsertGenericInferenceArgs};
use redis_common::redis_keys::RedisKeys;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::media_uploads::MediaUploadToken;
use tokens::tokens::users::UserToken;
use tts_common::priority::FAKEYOU_INVESTOR_PRIORITY_LEVEL;

use crate::configs::plans::get_correct_plan_for_session::get_correct_plan_for_session;
use crate::http_server::deprecated_endpoints::investor_demo::demo_cookie::request_has_demo_cookie;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::memory_cache::model_token_to_info_cache::{ModelInfoForInferenceJob, ModelTokenToInfoCache};
use crate::state::server_state::ServerState;

/// Debug requests can get routed to special "debug-only" workers, which can
/// be used to trial new code, run debugging, etc.
const DEBUG_HEADER_NAME : &str = "enable-debug-mode";

/// The routing tag header can send workloads to particular k8s hosts.
/// This is useful for catching the live logs or intercepting the job.
const ROUTING_TAG_HEADER_NAME : &str = "routing-tag";

#[derive(Deserialize, ToSchema)]
pub struct EnqueueVoiceConversionInferenceRequest {
  uuid_idempotency_token: String,

  /// Model weights token for the voice conversion model.
  /// This must be either a SoVitsSvc or RvcV2 model.
  voice_conversion_model_token: String,

  /// NB: This can be a `MediaUploadToken` or a `MediaFileToken` token.
  /// We will eventually migrate everything to media files and remove
  /// media uploads (legacy, deprecated).
  source_media_upload_token: String,

  creator_set_visibility: Option<Visibility>,

  is_storyteller_demo: Option<bool>,

  /// Argument for so-vits-svc
  /// The python model defaults to true, but that sounds awful,
  /// so we default to false unless specified.
  auto_predict_f0: Option<bool>,

  /// Argument for so-vits-svc
  /// f0 estimation
  override_f0_method: Option<FundamentalFrequencyMethod>,

  /// Argument for so-vits-svc
  /// Pitch controls for so-vits-svc
  transpose: Option<i32>,
}

#[derive(Deserialize, Clone, Copy, ToSchema)]
pub enum FundamentalFrequencyMethod {
  /// RMVPE is the best algorithm as of 2023-10-10.
  #[serde(rename = "rmvpe")]
  Rmvpe,
  #[serde(rename = "crepe")]
  Crepe,
  #[serde(rename = "dio")]
  Dio,
  #[serde(rename = "harvest")]
  Harvest,
}

#[derive(Serialize, ToSchema)]
pub struct EnqueueVoiceConversionInferenceSuccessResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}

#[derive(Debug, ToSchema)]
pub enum EnqueueVoiceConversionInferenceError {
  BadInput(String),
  NotAuthorized,
  ServerError,
  RateLimited,
}

impl ResponseError for EnqueueVoiceConversionInferenceError {
  fn status_code(&self) -> StatusCode {
    match *self {
      EnqueueVoiceConversionInferenceError::BadInput(_) => StatusCode::BAD_REQUEST,
      EnqueueVoiceConversionInferenceError::NotAuthorized => StatusCode::UNAUTHORIZED,
      EnqueueVoiceConversionInferenceError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      EnqueueVoiceConversionInferenceError::RateLimited => StatusCode::TOO_MANY_REQUESTS,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      EnqueueVoiceConversionInferenceError::BadInput(reason) => reason.to_string(),
      EnqueueVoiceConversionInferenceError::NotAuthorized => "unauthorized".to_string(),
      EnqueueVoiceConversionInferenceError::ServerError => "server error".to_string(),
      EnqueueVoiceConversionInferenceError::RateLimited => "rate limited".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for EnqueueVoiceConversionInferenceError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

#[utoipa::path(
  post,
  tag = "Voice Conversion",
  path = "/v1/voice_conversion/inference",
  responses(
    (status = 200, description = "Success", body = EnqueueVoiceConversionInferenceSuccessResponse),
    (status = 400, description = "Bad input", body = EnqueueVoiceConversionInferenceError),
    (status = 401, description = "Not authorized", body = EnqueueVoiceConversionInferenceError),
    (status = 429, description = "Rate limited", body = EnqueueVoiceConversionInferenceError),
    (status = 500, description = "Server error", body = EnqueueVoiceConversionInferenceError),
  ),
  params(
    ("request" = EnqueueVoiceConversionInferenceRequest, description = "Payload for Request"),
  )
)]
pub async fn enqueue_voice_conversion_inference_handler(
  http_request: HttpRequest,
  request: Json<EnqueueVoiceConversionInferenceRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<EnqueueVoiceConversionInferenceSuccessResponse>, EnqueueVoiceConversionInferenceError>
{

  if server_state.flags.disable_voice_conversion {
    return Err(EnqueueVoiceConversionInferenceError::RateLimited);
  }
  
  let mut maybe_user_token : Option<UserToken> = None;
  let mut priority_level ;
  let disable_rate_limiter = false; // NB: Careful!

  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        warn!("MySql pool error: {:?}", err);
        EnqueueVoiceConversionInferenceError::ServerError
      })?;

  // ==================== AVT TOKEN ==================== //

  let maybe_avt_token = server_state.avt_cookie_manager.get_avt_token_from_request(&http_request);

  // ==================== USER SESSION ==================== //

  let maybe_user_session = server_state
    .session_checker
    .maybe_get_user_session_extended_from_connection(&http_request, &mut mysql_connection)
    .await
    .map_err(|e| {
      warn!("Session checker error: {:?}", e);
      EnqueueVoiceConversionInferenceError::ServerError
    })?;

  if let Some(user_session) = maybe_user_session.as_ref() {
    maybe_user_token = Some(UserToken::new_from_str(&user_session.user_token));
  }

  // TODO: Plan should handle "first anonymous use" and "investor" cases.
  let plan = get_correct_plan_for_session(
    server_state.server_environment,
    maybe_user_session.as_ref());

  priority_level = plan.web_vc_base_priority_level();

  // ==================== INVESTOR PRIORITY ==================== //

  // TODO/TEMP: Give investors even more priority
  let mut is_investor = false;

  {
    // TODO/TEMP: The storyteller.io website's AJAX calls will set this.
    //  This is just for the YCombinator demo.
    match request.is_storyteller_demo {
      Some(true) => {
        is_investor = true;
      },
      _ => {},
    };

    // TODO/TEMP: The storyteller.io website will redirect and establish this cookie.
    //  This is just for the YCombinator demo.
    if request_has_demo_cookie(&http_request) {
      is_investor = true;
    }

    if is_investor {
      priority_level = FAKEYOU_INVESTOR_PRIORITY_LEVEL;
    }
  }

  // ==================== DEBUG MODE + ROUTING TAG ==================== //

  let is_debug_request =
      get_request_header_optional(&http_request, DEBUG_HEADER_NAME)
          .is_some();

  let maybe_routing_tag=
      get_request_header_optional(&http_request, ROUTING_TAG_HEADER_NAME)
          .map(|routing_tag| routing_tag.trim().to_string());

  // ==================== BANNED USERS ==================== //

  if let Some(ref user) = maybe_user_session {
    if user.role.is_banned {
      return Err(EnqueueVoiceConversionInferenceError::NotAuthorized);
    }
  }

  // ==================== RATE LIMIT ==================== //

  if !disable_rate_limiter {
    let mut rate_limiter = match maybe_user_session {
      None => &server_state.redis_rate_limiters.logged_out,
      Some(ref _session) => &server_state.redis_rate_limiters.logged_in
    };

    // TODO/TEMP
    if is_investor {
      rate_limiter = &server_state.redis_rate_limiters.logged_in;
    }

    if let Err(_err) = rate_limiter.rate_limit_request(&http_request).await {
      return Err(EnqueueVoiceConversionInferenceError::RateLimited);
    }
  }

  // ==================== LOOK UP MODEL INFO ==================== //

  // TODO(bt): CHECK DATABASE!
  let model_token = request.voice_conversion_model_token.clone();

  let model_inference_info = lookup_model_info(
    &model_token,
    &server_state.caches.durable.model_token_info,
    &mut mysql_connection
  ).await?;

  // ==================== HANDLE AUDIO INPUT ==================== //

  let media_token = request.source_media_upload_token.clone();

  let media_token_type =
    if media_token.starts_with(MediaUploadToken::token_prefix()) {
      InferenceInputSourceTokenType::MediaUpload
    } else if media_token.starts_with(MediaFileToken::token_prefix()) {
      InferenceInputSourceTokenType::MediaFile
    } else {
      return Err(EnqueueVoiceConversionInferenceError::BadInput(
        "input token is not a media_upload or media_file token".to_string()));
    };

  // ==================== CHECK AND ENQUEUE VOICE CONVERSION ==================== //

  let mut redis = server_state.redis_pool
      .get()
      .map_err(|e| {
        error!("redis error: {:?}", e);
        EnqueueVoiceConversionInferenceError::ServerError
      })?;

  let redis_count_key = RedisKeys::web_vc_model_usage_count(&model_token);

  redis.incr::<_, _, ()>(&redis_count_key, 1)
      .map_err(|e| {
        warn!("redis error: {:?}", e);
        EnqueueVoiceConversionInferenceError::ServerError
      })?;

  let ip_address = get_request_ip(&http_request);

  let maybe_user_preferred_visibility : Option<Visibility> = maybe_user_session
      .as_ref()
      .map(|user_session| user_session.preferences.preferred_tts_result_visibility); // TODO: New setting for web-vc

  let set_visibility = request.creator_set_visibility
      .or(maybe_user_preferred_visibility)
      .unwrap_or(Visibility::Public);

  info!("Creating voice conversion inference job record...");

  let mut maybe_args = None;

  let set_args = request.auto_predict_f0.is_some()
      || request.transpose.is_some()
      || request.override_f0_method.is_some();

  if set_args {
    maybe_args = Some(PolymorphicInferenceArgs::Vc {
      auto_predict_f0: request.auto_predict_f0,
      override_f0_method: request.override_f0_method.map(|f| match f {
        FundamentalFrequencyMethod::Crepe => FundamentalFrequencyMethodForJob::Crepe,
        FundamentalFrequencyMethod::Dio => FundamentalFrequencyMethodForJob::Dio,
        FundamentalFrequencyMethod::Harvest => FundamentalFrequencyMethodForJob::Harvest,
        FundamentalFrequencyMethod::Rmvpe => FundamentalFrequencyMethodForJob::Rmvpe,
      }),
      transpose: request.transpose,
    });
  }

  let job_type = match model_inference_info.job_model_type {
    InferenceModelType::SoVitsSvc => InferenceJobType::SoVitsSvc,
    InferenceModelType::RvcV2 => InferenceJobType::RvcV2,
    _ => {
      // In theory, this shouldn't catch anything.
      error!("wrong model type for voice conversion: {:?}", model_inference_info.job_model_type);
      return Err(EnqueueVoiceConversionInferenceError::ServerError)
    }
  };

  let maybe_product_category = match model_inference_info.job_model_type {
    InferenceModelType::RvcV2 => Some(InferenceJobProductCategory::VcRvc2),
    InferenceModelType::SoVitsSvc => Some(InferenceJobProductCategory::VcSvc),
    _ => None,
  };

  let query_result = insert_generic_inference_job(InsertGenericInferenceArgs {
    uuid_idempotency_token: &request.uuid_idempotency_token,
    job_type,
    maybe_product_category,
    inference_category: InferenceCategory::VoiceConversion,
    maybe_model_type: Some(model_inference_info.job_model_type),
    maybe_model_token: Some(&model_token),
    maybe_input_source_token: Some(&media_token),
    maybe_input_source_token_type: Some(media_token_type),
    maybe_download_url: None,
    maybe_cover_image_media_file_token: None,
    maybe_raw_inference_text: None, // NB: Voice conversion isn't TTS, so there's no text.
    maybe_max_duration_seconds: None,
    maybe_inference_args: Some(GenericInferenceArgs {
      inference_category: Some(InferenceCategoryAbbreviated::VoiceConversion),
      args: maybe_args,
    }),
    maybe_creator_user_token: maybe_user_token.as_ref(),
    maybe_avt_token: maybe_avt_token.as_ref(),
    creator_ip_address: &ip_address,
    creator_set_visibility: set_visibility,
    priority_level,
    requires_keepalive: plan.web_vc_requires_frontend_keepalive(),
    is_debug_request,
    maybe_routing_tag: maybe_routing_tag.as_deref(),
    mysql_pool: &server_state.mysql_pool,
  }).await;

  let job_token = match query_result {
    Ok((job_token, _id)) => job_token,
    Err(err) => {
      warn!("New generic inference job creation DB error: {:?}", err);
      if err.had_duplicate_idempotency_token() {
        return Err(EnqueueVoiceConversionInferenceError::BadInput("Duplicate idempotency token".to_string()));
      }
      return Err(EnqueueVoiceConversionInferenceError::ServerError);
    }
  };

  server_state.firehose_publisher.enqueue_vc_inference(
    maybe_user_token.as_ref(),
    &job_token)
      .await
      .map_err(|e| {
        warn!("error publishing event: {:?}", e);
        EnqueueVoiceConversionInferenceError::ServerError
      })?;

  Ok(Json(EnqueueVoiceConversionInferenceSuccessResponse {
    success: true,
    inference_job_token: job_token,
  }))
}

async fn lookup_model_info(
  model_token: &str,
  cache: &ModelTokenToInfoCache,
  mysql_connection: &mut PoolConnection<MySql>,
) -> Result<ModelInfoForInferenceJob, EnqueueVoiceConversionInferenceError> {
  let maybe_model_inference_info = cache
      .get_info(model_token)
      .map_err(|err| {
        error!("in-memory cache error: {:?}", err);
        EnqueueVoiceConversionInferenceError::ServerError
      })?;

  if let Some(inference_info) = maybe_model_inference_info {
    return Ok(inference_info);
  }

  let result = query_vc_model_info_lite_for_migration_with_connection(
    model_token, mysql_connection)
      .await
      .map_err(|err| {
        error!("model lookup error: {:?}", err);
        EnqueueVoiceConversionInferenceError::ServerError
      })?;

  let model_info = match result {
    Some(model_info) => model_info,
    None => {
      warn!("model not found for {model_token}; failing open");
      // NB: Fail open for now.
      return Ok(ModelInfoForInferenceJob {
        job_inference_category: InferenceCategory::VoiceConversion,
        job_model_type: InferenceModelType::SoVitsSvc,
      });
    }
  };

  let inference_info = match (model_info.get_inference_category(), model_info.get_inference_model_type()) {
    (Some(inference_category), Some(model_type)) => {
      ModelInfoForInferenceJob {
        job_inference_category: inference_category,
        job_model_type: model_type,
      }
    }
    _ => {
      error!("wrong model type for inference: {:?}", model_info);
      return Err(EnqueueVoiceConversionInferenceError::BadInput("wrong model type for inference".to_string()));
    }
  };

  cache.insert_one(model_token, &inference_info)
      .map_err(|err| {
        error!("cache insertion error: {:?}", err);
        EnqueueVoiceConversionInferenceError::ServerError
      })?;

  Ok(inference_info)
}
