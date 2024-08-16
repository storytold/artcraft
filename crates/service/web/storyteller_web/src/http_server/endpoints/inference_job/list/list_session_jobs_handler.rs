use std::collections::HashSet;
use std::fmt;
use std::sync::Arc;

use actix_web::{HttpMessage, HttpRequest, HttpResponse, web};
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::{Json, Path};
use actix_web_lab::extract::Query;
use chrono::{DateTime, Duration, Utc};
use log::{error, warn};
use r2d2_redis::redis::{Commands, RedisResult};
use utoipa::{IntoParams, ToSchema};

use buckets::public::media_files::bucket_file_path::MediaFileBucketPath;
use buckets::public::voice_conversion_results::bucket_file_path::VoiceConversionResultOriginalFilePath;
use enums::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;
use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::common::job_status_plus::JobStatusPlus;
use enums::no_table::style_transfer::style_transfer_name::StyleTransferName;
use mysql_queries::queries::generic_inference::web::job_status::GenericInferenceJobStatus;
use mysql_queries::queries::generic_inference::web::list_session_jobs::{list_session_jobs_from_connection, ListSessionJobsForUserArgs};
use redis_common::redis_keys::RedisKeys;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

use crate::http_server::endpoints::inference_job::common_responses::live_portrait::JobDetailsLivePortraitRequest;
use crate::http_server::endpoints::inference_job::utils::estimates::estimate_job_progress::estimate_job_progress;
use crate::http_server::endpoints::inference_job::utils::extractors::extract_live_portrait_details::extract_live_portrait_details;
use crate::http_server::endpoints::inference_job::utils::extractors::extract_polymorphic_inference_args::extract_polymorphic_inference_args;
use crate::http_server::web_utils::filter_model_name::maybe_filter_model_name;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;

/// For certain jobs or job classes (eg. non-premium), we kill the jobs if the user hasn't
/// maintained a keepalive. This prevents wasted work when users who are unlikely to return
/// navigate away. Premium users have accounts and can always return to the site, so they
/// typically do not require keepalive.
const JOB_KEEPALIVE_TTL_SECONDS : usize = 60 * 3;

#[derive(Deserialize, ToSchema, IntoParams)]
pub struct ListSessionJobsQueryParams {
  //pub sort_ascending: Option<bool>,
  //pub page_size: Option<usize>, // TODO(bt,2024-04-23): One page for now.
  //pub page_index: Option<usize>, // TODO(bt,2024-04-23): One page for now.

  /// NB: This can be one (or more comma-separated values) from `JobStatusPlus`.
  /// ?include_states=pending or ?include_states=pending,started,complete_success (etc.)
  pub include_states: Option<String>,

  /// The opposite of include_states, this filters out states from view.
  pub exclude_states: Option<String>,

  // TODO(bt,2024-04-23): Add the ability for users to dismiss completed/dead jobs from view.
}

#[derive(Serialize, ToSchema)]
pub struct ListSessionJobsSuccessResponse {
  pub success: bool,

  /// This is not paginated and is limited to showing 100 jobs.
  pub jobs: Vec<ListSessionJobsItem>,
}

#[derive(Serialize, ToSchema)]
pub struct ListSessionJobsItem {
  pub job_token: InferenceJobToken,

  pub request: ListSessionRequestDetailsResponse,
  pub status: ListSessionStatusDetailsResponse,
  pub maybe_result: Option<ListSessionResultDetailsResponse>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

/// Details about what the user requested for generation
#[derive(Serialize, ToSchema)]
pub struct ListSessionRequestDetailsResponse {
  pub inference_category: InferenceCategory,
  pub maybe_model_type: Option<String>,
  pub maybe_model_token: Option<String>,

  /// OPTIONAL. Title of the model, if it has one
  pub maybe_model_title: Option<String>,

  /// OPTIONAL. If the result was TTS, this is the raw inference text.
  pub maybe_raw_inference_text: Option<String>,

  /// OPTIONAL. For Comfy / Video Style Transfer jobs, this might include
  /// the name of the selected style.
  pub maybe_style_name: Option<StyleTransferName>,

  /// OPTIONAL. For Live Portrait jobs, this is additional information on the request.
  pub maybe_live_portrait_details: Option<JobDetailsLivePortraitRequest>,
}

/// Details about the ongoing job status
#[derive(Serialize, ToSchema)]
pub struct ListSessionStatusDetailsResponse {
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

/// Details about the completed result (if any)
#[derive(Serialize, ToSchema)]
pub struct ListSessionResultDetailsResponse {
  pub entity_type: String,
  pub entity_token: String,

  /// NB: This is only for audio- or video- type results.
  pub maybe_public_bucket_media_path: Option<String>,

  pub maybe_successfully_completed_at: Option<DateTime<Utc>>,
}


#[derive(Debug, ToSchema)]
pub enum ListSessionJobsError {
  ServerError,
  NotFound,
  NotAuthorized,
}

impl ResponseError for ListSessionJobsError {
  fn status_code(&self) -> StatusCode {
    match *self {
      ListSessionJobsError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      ListSessionJobsError::NotFound => StatusCode::NOT_FOUND,
      ListSessionJobsError::NotAuthorized => StatusCode::UNAUTHORIZED,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      Self::ServerError => "server error".to_string(),
      Self::NotFound => "not found".to_string(),
      Self::NotAuthorized => "not authorized".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for ListSessionJobsError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}


/// List job statuses for jobs that are associated with the user's session.
///
/// The user must be logged in. This endpoint will only show the last 36 hours
/// of jobs. Any jobs "dismissed" by the user will not be returned.
///
/// This returns jobs of all states: pending, started, attempt_failed,
/// complete_success, dead, etc.
#[utoipa::path(
  get,
  tag = "Jobs",
  path = "/v1/jobs/session",
  responses(
    (status = 200, body = ListSessionJobsSuccessResponse),
    (status = 500, body = ListSessionJobsError),
  ),
  params(
    ListSessionJobsQueryParams
  )
)]
pub async fn list_session_jobs_handler(
  http_request: HttpRequest,
  query: Query<ListSessionJobsQueryParams>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<ListSessionJobsSuccessResponse>, ListSessionJobsError> {

  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        warn!("MySql pool error: {:?}", err);
        ListSessionJobsError::ServerError
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
        ListSessionJobsError::ServerError
      })?;

  let session = match maybe_user_session {
    Some(session) => session,
    None => return Err(ListSessionJobsError::NotAuthorized),
  };

  let include_states = query.include_states
      .as_deref()
      .map(|s| s.split(",")
          .filter_map(|status| JobStatusPlus::from_str(status).ok())
          .collect::<HashSet<_>>());

  let exclude_states = query.exclude_states
      .as_deref()
      .map(|s| s.split(",")
          .filter_map(|status| JobStatusPlus::from_str(status).ok())
          .collect::<HashSet<_>>());

  let args = ListSessionJobsForUserArgs {
    user_token: &session.user_token_typed,
    maybe_include_job_statuses: include_states.as_ref(),
    maybe_exclude_job_statuses: exclude_states.as_ref(),
  };

  // NB: Since this is publicly exposed, we don't query sensitive data.
  let maybe_records = list_session_jobs_from_connection(
    args, &mut mysql_connection).await;

  let records = match maybe_records {
    Ok(records) => records,
    Err(err) => {
      error!("tts job query error: {:?}", err);
      return Err(ListSessionJobsError::ServerError);
    }
  };

  let mut redis = server_state.redis_pool
      .get()
      .map_err(|e| {
        error!("redis error: {:?}", e);
        ListSessionJobsError::ServerError
      })?;

  // TODO(bt,2024-04-22): Look up the extra redis statuses per item.

  let keepalive_keys = records.iter()
      .filter(|record| record.is_keepalive_required)
      .map(|record| RedisKeys::generic_inference_keepalive(record.job_token.as_str()))
      .collect::<Vec<_>>();

  for key in keepalive_keys.iter() {
    // TODO(bt,2024-04-22): There is no msetex. We'll need to run a Redis pipeline here.
    //  https://stackoverflow.com/questions/16423342/redis-multi-set-with-a-ttl
    let _: Option<String> = match redis.set_ex(key, "1", JOB_KEEPALIVE_TTL_SECONDS) {
      Ok(Some(status)) => Some(status),
      Ok(None) => None,
      Err(e) => {
        error!("redis error setting job keepalive: {:?}", e);
        None // Fail open (which in this case is bad! it will kill jobs if cluster has many jobs / is slow!)
      },
    };
  }

  records_to_response(records)
}

fn records_to_response(records: Vec<GenericInferenceJobStatus>) -> Result<Json<ListSessionJobsSuccessResponse>, ListSessionJobsError> {
  let mut records = records.into_iter()
      .map(|record| {
        db_record_to_response_payload(record, None)
      })
      .collect::<Vec<_>>();

  // NB: Having a lot of "success" entries that haven't been cleared can make the list
  // long, so we can downsample.
  let mut success_count = 0;

  records.retain(|record| {
    if record.status.status != JobStatusPlus::CompleteSuccess {
      return true;
    }
    match record.request.inference_category {
      // Show all audio results
      InferenceCategory::TextToSpeech
      | InferenceCategory::VoiceConversion => return true,
      // Fall through for everything else
      _ => {},
    }
    success_count += 1;
    success_count <= 3
  });

  Ok(Json(ListSessionJobsSuccessResponse {
    success: true,
    jobs: records,
  }))
}

fn db_record_to_response_payload(
  record: GenericInferenceJobStatus,
  maybe_extra_status_description: Option<String>,
) -> ListSessionJobsItem {
  let inference_category = record.request_details.inference_category;

  // NB: Fail open. We don't want to fail the request if we can't extract the args.
  let maybe_polymorphic_args = extract_polymorphic_inference_args(&record)
      .ok()
      .flatten();

  let progress_percentage = estimate_job_progress(&record, maybe_polymorphic_args.as_ref());

  ListSessionJobsItem {
    job_token: record.job_token,
    request: ListSessionRequestDetailsResponse {
      inference_category: record.request_details.inference_category,
      maybe_model_type: maybe_filter_model_name(record.request_details.maybe_model_type.as_deref()),
      maybe_model_token: record.request_details.maybe_model_token,
      maybe_model_title: record.request_details.maybe_model_title,
      maybe_raw_inference_text: record.request_details.maybe_raw_inference_text,
      maybe_style_name: record.request_details.maybe_style_name,
      maybe_live_portrait_details: maybe_polymorphic_args
          .and_then(|ref args| extract_live_portrait_details(args)),
    },
    status: ListSessionStatusDetailsResponse {
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
    maybe_result: record.maybe_result_details.map(|result_details| {
      // NB: Be careful here, because this varies based on the type of inference result.
      let public_bucket_media_path = match inference_category {
        InferenceCategory::LipsyncAnimation => {
          MediaFileBucketPath::from_object_hash(
            &result_details.public_bucket_location_or_hash,
            result_details.maybe_media_file_public_bucket_prefix.as_deref(),
            result_details.maybe_media_file_public_bucket_extension.as_deref())
              .get_full_object_path_str()
              .to_string()
        }
        InferenceCategory::Mocap => {
          MediaFileBucketPath::from_object_hash(
            &result_details.public_bucket_location_or_hash,
            result_details.maybe_media_file_public_bucket_prefix.as_deref(),
            result_details.maybe_media_file_public_bucket_extension.as_deref())
              .get_full_object_path_str()
              .to_string()
        }
        InferenceCategory::VideoFilter => {
          MediaFileBucketPath::from_object_hash(
            &result_details.public_bucket_location_or_hash,
            result_details.maybe_media_file_public_bucket_prefix.as_deref(),
            result_details.maybe_media_file_public_bucket_extension.as_deref())
              .get_full_object_path_str()
              .to_string()
        }
        InferenceCategory::Workflow => {
          MediaFileBucketPath::from_object_hash(
            &result_details.public_bucket_location_or_hash,
            result_details.maybe_media_file_public_bucket_prefix.as_deref(),
            result_details.maybe_media_file_public_bucket_extension.as_deref())
              .get_full_object_path_str()
              .to_string()
        }
        InferenceCategory::TextToSpeech => {
          match result_details.entity_type.as_str() {
            "media_file" => {
              // NB: We're migrating TTS to media_files.
              // Zero shot TTS uses media files.
              // Legacy TT2 uses old pathing.
              MediaFileBucketPath::from_object_hash(
                &result_details.public_bucket_location_or_hash,
                result_details.maybe_media_file_public_bucket_prefix.as_deref(),
                result_details.maybe_media_file_public_bucket_extension.as_deref())
                  .get_full_object_path_str()
                  .to_string()
            }
            _ => {
              // NB: TTS results receive the legacy treatment where their table only reports the full bucket path
              result_details.public_bucket_location_or_hash
            }
          }
        }
        InferenceCategory::VoiceConversion => {
          match result_details.entity_type.as_str() {
            "media_file" => {
              // NB: We're migrating voice conversion to media_files.
              MediaFileBucketPath::from_object_hash(
                &result_details.public_bucket_location_or_hash,
                result_details.maybe_media_file_public_bucket_prefix.as_deref(),
                result_details.maybe_media_file_public_bucket_extension.as_deref())
                  .get_full_object_path_str()
                  .to_string()
            }
            _ => {
              // NB: This is the old voice conversion result pathing.
              VoiceConversionResultOriginalFilePath::from_object_hash(&result_details.public_bucket_location_or_hash)
                  .get_full_object_path_str()
                  .to_string()
            }
          }
        }
        InferenceCategory::LivePortrait => {
          MediaFileBucketPath::from_object_hash(
            &result_details.public_bucket_location_or_hash,
            result_details.maybe_media_file_public_bucket_prefix.as_deref(),
            result_details.maybe_media_file_public_bucket_extension.as_deref())
              .get_full_object_path_str()
              .to_string()
        }
        InferenceCategory::ImageGeneration => { 
          "".to_string()
        }
        InferenceCategory::FormatConversion => {
          "".to_string()
        }
        InferenceCategory::ConvertBvhToWorkflow => {
          "".to_string()
        }
        InferenceCategory::DeprecatedField => {
          "".to_string() // TODO(bt,2024-07-16): Read job type instead
        }
      };
     
      ListSessionResultDetailsResponse {
        entity_type: result_details.entity_type,
        entity_token: result_details.entity_token,
        maybe_public_bucket_media_path: Some(public_bucket_media_path),
        maybe_successfully_completed_at: result_details.maybe_successfully_completed_at,
      }
    }),
    created_at: record.created_at,
    updated_at: record.updated_at,
  }
}

