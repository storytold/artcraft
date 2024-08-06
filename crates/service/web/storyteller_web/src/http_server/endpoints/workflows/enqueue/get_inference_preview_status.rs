use std::fmt;
use std::sync::Arc;

use actix_web::{HttpMessage, HttpRequest, HttpResponse, web};
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::{Json, Path};
use chrono::{DateTime, Utc};
use log::error;
use r2d2_redis::redis::{Commands, RedisResult};
use reqwest::Url;
use utoipa::ToSchema;

use buckets::public::media_files::bucket_file_path::MediaFileBucketPath;
use buckets::public::voice_conversion_results::bucket_file_path::VoiceConversionResultOriginalFilePath;
use enums::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;
use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::common::job_status_plus::JobStatusPlus;
use enums::no_table::style_transfer::style_transfer_name::StyleTransferName;
use mysql_queries::queries::generic_inference::web::get_inference_job_status::get_inference_job_status;
use mysql_queries::queries::generic_inference::web::job_status::GenericInferenceJobStatus;
use redis_common::redis_keys::RedisKeys;
use redis_schema::keys::inference_job::style_transfer_progress_key::StyleTransferProgressKey;
use redis_schema::payloads::inference_job::style_transfer_progress_state::{InferenceProgressDetailsResponse, InferenceStageDetails};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;

use crate::http_server::endpoints::inference_job::utils::estimate_job_progress::estimate_job_progress;
use crate::http_server::web_utils::filter_model_name::maybe_filter_model_name;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;

/// For certain jobs or job classes (eg. non-premium), we kill the jobs if the user hasn't
/// maintained a keepalive. This prevents wasted work when users who are unlikely to return
/// navigate away. Premium users have accounts and can always return to the site, so they
/// typically do not require keepalive.
const JOB_KEEPALIVE_TTL_SECONDS : usize = 60 * 3;

/// For the URL PathInfo
#[derive(Deserialize, ToSchema)]
pub struct GetInferenceJobStatusPathInfo {
  token: InferenceJobToken,
}

#[derive(Serialize, ToSchema)]
pub struct GetInferenceJobStatusSuccessResponse {
  pub success: bool,
  pub state: InferenceJobStatusResponsePayload,
}

#[derive(Serialize, ToSchema)]
pub struct InferenceJobStatusResponsePayload {
  pub job_token: InferenceJobToken,

  pub request: RequestDetailsResponse,
  pub status: StatusDetailsResponse,
  pub maybe_result: Option<InferenceProgressDetailsResponse>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}


/// Details about what the user requested for generation
#[derive(Serialize, ToSchema)]
pub struct RequestDetailsResponse {
}

/// Details about the ongoing job status
#[derive(Serialize, ToSchema)]
pub struct StatusDetailsResponse {
  /// Primary status from the database (a state machine).
  pub status: JobStatusPlus,

  /// Extra, temporary status from Redis.
  /// This can denote inference progress, and the Python code can write to it.
  pub maybe_extra_status_description: Option<String>,

  pub maybe_assigned_worker: Option<String>,
  pub maybe_assigned_cluster: Option<String>,

  pub maybe_first_started_at: Option<DateTime<Utc>>,

  pub attempt_count: u8,

  /// Whether the frontend needs to maintain a keepalive check.
  /// This is typically only for non-premium users.
  pub requires_keepalive: bool,

  /// An enum the frontend can use to display localized/I18N error
  /// messages. These pertain to both transient and permanent failures.
  pub maybe_failure_category: Option<FrontendFailureCategory>,

  /// This is an integer number between 0 and 100 (both inclusive) that
  /// reports the completeness.
  pub progress_percentage: u8,
}

// #[derive(Serialize, ToSchema)]
// pub struct InferenceStageDetails {
//   pub stage_progress: u8,
//   pub expected_frame_count: u8,
//   pub stage_complete: bool,
//   pub frames: Vec<Url>,
// }

/// Details about the completed result (if any)
// #[derive(Serialize, ToSchema)]
// pub struct InferenceProgressDetailsResponse {
//   pub expected_stages: u8,
//   pub currently_active_stage: u8,
//   pub per_stage_frame_count: u8,
//   pub stages: Vec<InferenceStageDetails>,
// }

#[derive(Debug, ToSchema)]
pub enum GetInferenceJobStatusError {
  ServerError,
  NotFound,
}

impl ResponseError for GetInferenceJobStatusError {
  fn status_code(&self) -> StatusCode {
    match *self {
      GetInferenceJobStatusError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      GetInferenceJobStatusError::NotFound => StatusCode::NOT_FOUND,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      Self::ServerError => "server error".to_string(),
      Self::NotFound => "not found".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for GetInferenceJobStatusError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

pub async fn get_inference_preview_status_handler(
  http_request: HttpRequest,
  path: Path<GetInferenceJobStatusPathInfo>,
  server_state: web::Data<Arc<ServerState>>) -> Result<Json<GetInferenceJobStatusSuccessResponse>, GetInferenceJobStatusError>
{
  if path.token.as_str().trim() == "None" {
    // NB: A bunch of Python clients use our API and can fail in this manner.
    // This was a large traffic driver during the 2023-03-08 outage.
    // Presumably it's this client: https://github.com/shards-7/fakeyou.py
    return Err(GetInferenceJobStatusError::NotFound);
  }

  // NB: Since this is publicly exposed, we don't query sensitive data.
  let maybe_status = get_inference_job_status(
    &path.token,
    &server_state.mysql_pool
  ).await;

  let record = match maybe_status {
    Ok(Some(record)) => record,
    Ok(None) => return Err(GetInferenceJobStatusError::NotFound),
    Err(err) => {
      error!("tts job query error: {:?}", err);
      return Err(GetInferenceJobStatusError::ServerError);
    }
  };

  let mut redis = server_state.redis_pool
    .get()
    .map_err(|e| {
      error!("redis error: {:?}", e);
      GetInferenceJobStatusError::ServerError
    })?;

  let progress_key = StyleTransferProgressKey::new_for_job_id(record.job_token.clone());
  let progress_value: RedisResult<Option<String>> = redis.get(progress_key.to_string());

  let maybe_result = match progress_value {
    Ok(Some(value)) => {
      let progress_details: InferenceProgressDetailsResponse = serde_json::from_str(&value)
        .map_err(|e| {
          error!("redis error: {:?}", e);
          GetInferenceJobStatusError::ServerError
        })?;

      Some(progress_details)
    },
    Ok(None) => None,
    Err(e) => {
      error!("redis error: {:?}", e);
      return Err(GetInferenceJobStatusError::ServerError);
    }
  };
  


  Ok(Json(GetInferenceJobStatusSuccessResponse {
    success: true,
    state: record_to_payload(record, maybe_result, None),
  }))
}

fn record_to_payload(
  record: GenericInferenceJobStatus,
  progress_details: Option<InferenceProgressDetailsResponse>,
  maybe_extra_status_description: Option<String>,
) -> InferenceJobStatusResponsePayload {
  let inference_category = record.request_details.inference_category;

  let progress_percentage = estimate_job_progress(&record);

  InferenceJobStatusResponsePayload {
    job_token: record.job_token,
    request: RequestDetailsResponse {
      // inference_category: record.request_details.inference_category,
      // maybe_model_type: maybe_filter_model_name(record.request_details.maybe_model_type.as_deref()),
      // maybe_model_token: record.request_details.maybe_model_token,
      // maybe_model_title: record.request_details.maybe_model_title,
      // maybe_raw_inference_text: record.request_details.maybe_raw_inference_text,
      // maybe_style_name: record.request_details.maybe_style_name,
    },
    status: StatusDetailsResponse {
      status: record.status,
      maybe_extra_status_description,
      maybe_assigned_worker: maybe_filter_model_name(record.maybe_assigned_worker.as_deref()),
      maybe_assigned_cluster: record.maybe_assigned_cluster,
      maybe_first_started_at: record.maybe_first_started_at,
      attempt_count: record.attempt_count as u8,
      requires_keepalive: record.is_keepalive_required,
      maybe_failure_category: record.maybe_frontend_failure_category,
      progress_percentage,
    },
    maybe_result: progress_details,
    created_at: record.created_at,
    updated_at: record.updated_at,
  }
}
