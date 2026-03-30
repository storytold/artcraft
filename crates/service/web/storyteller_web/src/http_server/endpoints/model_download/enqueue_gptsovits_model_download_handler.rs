use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Json;
use actix_web::{web, HttpRequest, HttpResponse};
use log::warn;
use utoipa::ToSchema;

use config::bad_urls::is_bad_tts_model_download_url;
use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::by_table::generic_inference_jobs::inference_job_product_category::InferenceJobProductCategory;
use enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;
use enums::common::visibility::Visibility;
use http_server_common::request::get_request_ip::get_request_ip;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use mysql_queries::payloads::generic_inference_args::generic_inference_args::{GenericInferenceArgs, InferenceCategoryAbbreviated, PolymorphicInferenceArgs};
use mysql_queries::payloads::generic_inference_args::inner_payloads::gptsovits_payload::GptSovitsPayload;
use mysql_queries::queries::generic_inference::web::insert_generic_inference_job::{insert_generic_inference_job, InsertGenericInferenceArgs};
use primitives::traits::trim_or_emptyable::TrimOrEmptyable;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;

use crate::configs::plans::get_correct_plan_for_session::get_correct_plan_for_session;
use crate::http_server::requests::request_headers::get_routing_tag_header::get_routing_tag_header;
use crate::http_server::requests::request_headers::has_debug_header::has_debug_header;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::http_server::validations::validate_model_title::validate_model_title;
use crate::http_server::web_utils::user_session::require_user_session::RequireUserSessionError;
use crate::http_server::web_utils::user_session::require_user_session_extended_using_connection::require_user_session_extended_using_connection;
use crate::state::server_state::ServerState;

#[derive(Deserialize, ToSchema)]
pub struct EnqueueGptSovitsModelDownloadRequest {
  // Required fields
  pub uuid_idempotency_token: String,
  pub download_url: String,

  // Optional fields
  pub maybe_title: Option<String>,
  pub maybe_description: Option<String>,
  pub maybe_cover_image_media_file_token: Option<MediaFileToken>,
  pub creator_set_visibility: Option<Visibility>,
}

#[derive(Serialize, ToSchema)]
pub struct EnqueueGptSovitsModelDownloadSuccessResponse {
  pub success: bool,
  /// This is how frontend clients can request the job execution status.
  pub job_token: InferenceJobToken,
}

#[derive(Debug, Serialize, ToSchema)]
pub enum EnqueueGptSovitsModelDownloadError {
  BadInput(String),
  NotAuthorized,
  ServerError,
  RateLimited,
}

impl ResponseError for EnqueueGptSovitsModelDownloadError {
  fn status_code(&self) -> StatusCode {
    match *self {
      EnqueueGptSovitsModelDownloadError::BadInput(_) => StatusCode::BAD_REQUEST,
      EnqueueGptSovitsModelDownloadError::NotAuthorized => StatusCode::UNAUTHORIZED,
      EnqueueGptSovitsModelDownloadError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      EnqueueGptSovitsModelDownloadError::RateLimited => StatusCode::TOO_MANY_REQUESTS,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

impl fmt::Display for EnqueueGptSovitsModelDownloadError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

/// Enqueue a GptSoVits model for download (eg. from Google Drive)
#[utoipa::path(
  post,
  tag = "Model Downloads",
  path = "/v1/model_download/gsv",
  request_body = EnqueueGptSovitsModelDownloadRequest,
  responses(
    (status = 200, body = EnqueueGptSovitsModelDownloadSuccessResponse),
    (status = 400, body = EnqueueGptSovitsModelDownloadError),
  )
)]
pub async fn enqueue_gptsovits_model_download_handler(
  http_request: HttpRequest,
  request: Json<EnqueueGptSovitsModelDownloadRequest>,
  server_state: web::Data<Arc<ServerState>>) -> Result<Json<EnqueueGptSovitsModelDownloadSuccessResponse>, EnqueueGptSovitsModelDownloadError>
{
  // ==================== DB ==================== //

  let mut mysql_connection = server_state.mysql_pool
    .acquire()
    .await
    .map_err(|err| {
      warn!("MySql pool error: {:?}", err);
      EnqueueGptSovitsModelDownloadError::ServerError
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
      RequireUserSessionError::ServerError => EnqueueGptSovitsModelDownloadError::ServerError,
      RequireUserSessionError::NotAuthorized => EnqueueGptSovitsModelDownloadError::NotAuthorized,
    })?;

  // ==================== PAID PLAN + PRIORITY ==================== //

  let plan = get_correct_plan_for_session(server_state.server_environment_old, Some(&user_session));
  let priority_level = plan.web_vc_base_priority_level();

  // ==================== DEBUG MODE + ROUTING TAG ==================== //

  let is_debug_request = has_debug_header(&http_request);

  let maybe_routing_tag= get_routing_tag_header(&http_request);

  if let Err(_err) = server_state.redis_rate_limiters.model_upload.rate_limit_request(&http_request).await {
    return Err(EnqueueGptSovitsModelDownloadError::RateLimited);
  }

  let ip_address = get_request_ip(&http_request);
  let uuid = request.uuid_idempotency_token.to_string();
  let download_url = request.download_url.trim().to_string();

  let title = request.maybe_title.trim_or_empty();
  let description = request.maybe_description.trim_or_empty();
  let creator_set_visibility = request.creator_set_visibility.unwrap_or(Visibility::Public);

  if let Err(reason) = validate_idempotency_token_format(&uuid) {
    return Err(EnqueueGptSovitsModelDownloadError::BadInput(reason));
  }

  if let Some(title) = title {
    if let Err(reason) = validate_model_title(title) {
      return Err(EnqueueGptSovitsModelDownloadError::BadInput(reason));
    }
  }

  match is_bad_tts_model_download_url(&download_url) {
    Ok(false) => {} // Ok case
    Ok(true) => {
      return Err(EnqueueGptSovitsModelDownloadError::BadInput("Bad model download URL".to_string()));
    }
    Err(err) => {
      warn!("Error parsing url: {:?}", err);
      return Err(EnqueueGptSovitsModelDownloadError::BadInput("Bad model download URL".to_string()));
    }
  }

  let query_result = insert_generic_inference_job(InsertGenericInferenceArgs {
    uuid_idempotency_token: &request.uuid_idempotency_token,
    job_type: InferenceJobType::GptSovits,
    maybe_product_category: Some(InferenceJobProductCategory::DownloadGptSoVits),
    inference_category: InferenceCategory::DeprecatedField,
    maybe_model_type: None,
    maybe_model_token: None,
    maybe_input_source_token: None,
    maybe_input_source_token_type: None,
    maybe_download_url: Some(&download_url),
    maybe_cover_image_media_file_token: request.maybe_cover_image_media_file_token.as_ref(),
    maybe_raw_inference_text: None,
    maybe_max_duration_seconds: None,
    maybe_inference_args: Some(GenericInferenceArgs {
      inference_category: Some(InferenceCategoryAbbreviated::GptSovits),
      args: Some(PolymorphicInferenceArgs::Gs(
        GptSovitsPayload {
          maybe_title: title.map(|s| s.to_string()),
          maybe_description: description.map(|s| s.to_string()),
          creator_visibility: Some(creator_set_visibility),
          // Inference only args:
          append_advertisement: None,
        })
      ),
    }),
    maybe_creator_user_token: Some(&user_session.user_token_typed),
    maybe_avt_token: maybe_avt_token.as_ref(),
    creator_ip_address: &ip_address,
    creator_set_visibility,
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
        return Err(EnqueueGptSovitsModelDownloadError::BadInput("Duplicate idempotency token".to_string()));
      }
      return Err(EnqueueGptSovitsModelDownloadError::ServerError);
    }
  };

  Ok(Json(EnqueueGptSovitsModelDownloadSuccessResponse {
    success: true,
    job_token,
  }))
}
