use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::{Json, Path};
use actix_web::{web, HttpMessage, HttpRequest, HttpResponse};
use chrono::{DateTime, Utc};
use log::error;
use r2d2_redis::redis::{Commands, RedisResult};
use utoipa::ToSchema;

use crate::http_server::common_responses::media::media_domain::MediaDomain;
use crate::http_server::common_responses::media::media_links::MediaLinks;
use crate::http_server::endpoints::inference_job::common_responses::lipsync::JobDetailsLipsyncRequest;
use crate::http_server::endpoints::inference_job::common_responses::live_portrait::JobDetailsLivePortraitRequest;
use crate::http_server::endpoints::inference_job::utils::estimates::estimate_job_progress::estimate_job_progress;
use crate::http_server::endpoints::inference_job::utils::extractors::extract_lipsync_details::extract_lipsync_details;
use crate::http_server::endpoints::inference_job::utils::extractors::extract_live_portrait_details::extract_live_portrait_details;
use crate::http_server::endpoints::inference_job::utils::extractors::extract_polymorphic_inference_args::extract_polymorphic_inference_args;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::http_server::web_utils::filter_model_name::maybe_filter_model_name;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use bucket_paths::legacy::typified_paths::public::voice_conversion_results::bucket_file_path::VoiceConversionResultOriginalFilePath;
use enums::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;
use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::common::job_status_plus::JobStatusPlus;
use enums::no_table::style_transfer::style_transfer_name::StyleTransferName;
use mysql_queries::queries::generic_inference::web::get_inference_job_status::get_inference_job_status;
use mysql_queries::queries::generic_inference::web::job_status::GenericInferenceJobStatus;
use redis_common::redis_keys::RedisKeys;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;

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
  pub maybe_result: Option<ResultDetailsResponse>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

/// Details about what the user requested for generation
#[derive(Serialize, ToSchema)]
pub struct RequestDetailsResponse {
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

  /// OPTIONAL. For lipsync jobs (face fusion and sad talker), this is additional
  /// information on the request.
  pub maybe_lipsync_details: Option<JobDetailsLipsyncRequest>,
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

/// Details about the completed result (if any)
#[derive(Serialize, ToSchema)]
pub struct ResultDetailsResponse {
  pub entity_type: String,
  pub entity_token: String,

  /// (DEPRECATED) URL path to the media file
  #[deprecated(note="This field doesn't point to the full URL. Use media_links instead to leverage the CDN.")]
  pub maybe_public_bucket_media_path: Option<String>,

  /// Rich CDN links to the media, including thumbnails, previews, and more.
  pub media_links: MediaLinks,

  pub maybe_successfully_completed_at: Option<DateTime<Utc>>,
}

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

/// Get the status for a single job.
#[utoipa::path(
  get,
  tag = "Jobs",
  path = "/v1/jobs/job/{token}",
  params(
    ("path" = GetInferenceJobStatusPathInfo, description = "Path params for Request")
  ),
  responses(
    (status = 200, body = GetInferenceJobStatusSuccessResponse),
    (status = 500, body = GetInferenceJobStatusError),
  ),
)]
pub async fn get_inference_job_status_handler(
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

  // TODO(bt,2023-05-21): Make async.
  let extra_status_key = RedisKeys::generic_inference_extra_status_info(path.token.as_str());
  let maybe_extra_status_value : RedisResult<Option<String>> = redis.get(&extra_status_key);

  let maybe_extra_status_description = match maybe_extra_status_value {
    Err(e) => {
      error!("redis error: {:?}", e);
      None // Fail open
    },
    Ok(maybe_value) => match maybe_value.as_deref() {
      Some("1") => {
        // TODO(bt,2023-10-20): Redis is reporting "1" and it's been surfacing this as a weird
        //  message to the frontend for months. This needs proper fixing.
        None
      },
      Some(value) => Some(value.to_string()),
      None => None,
    }
  };

  if record.is_keepalive_required {
    // TODO(bt,2023-05-21): Make async.
    let keepalive_key = RedisKeys::generic_inference_keepalive(path.token.as_str());
    let _: Option<String> = match redis.set_ex(&extra_status_key, "1", JOB_KEEPALIVE_TTL_SECONDS) {
      Ok(Some(status)) => {
        Some(status)
      },
      Ok(None) => None,
      Err(e) => {
        error!("redis error setting job keepalive: {:?}", e);
        None // Fail open (which in this case is bad! it will kill jobs if cluster has many jobs / is slow!)
      },
    };
  }

  let media_domain = get_media_domain(&http_request);

  let record_for_response = record_to_payload(
    record,
    maybe_extra_status_description,
    media_domain,
  );

  Ok(Json(GetInferenceJobStatusSuccessResponse {
    success: true,
    state: record_for_response,
  }))
}

fn record_to_payload(
  record: GenericInferenceJobStatus,
  maybe_extra_status_description: Option<String>,
  media_domain: MediaDomain,
) -> InferenceJobStatusResponsePayload {
  let inference_category = record.request_details.inference_category;

  // NB: Fail open. We don't want to fail the request if we can't extract the args.
  let maybe_polymorphic_args = extract_polymorphic_inference_args(&record)
      .ok()
      .flatten();

  let progress_percentage = estimate_job_progress(&record, maybe_polymorphic_args.as_ref());

  InferenceJobStatusResponsePayload {
    job_token: record.job_token,
    request: RequestDetailsResponse {
      inference_category: record.request_details.inference_category,
      maybe_model_type: maybe_filter_model_name(record.request_details.maybe_model_type.as_deref()),
      maybe_model_token: record.request_details.maybe_model_token,
      maybe_model_title: record.request_details.maybe_model_title,
      maybe_raw_inference_text: record.request_details.maybe_raw_inference_text,
      maybe_style_name: record.request_details.maybe_style_name,
      maybe_live_portrait_details: maybe_polymorphic_args
          .as_ref()
          .and_then(|args| extract_live_portrait_details(args)),
      maybe_lipsync_details: maybe_polymorphic_args
          .as_ref()
          .and_then(|args| extract_lipsync_details(args)),
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
        InferenceCategory::TextToSpeech
        | InferenceCategory::F5TTS => {
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
        InferenceCategory::SeedVc => {
          MediaFileBucketPath::from_object_hash(
            &result_details.public_bucket_location_or_hash,
            result_details.maybe_media_file_public_bucket_prefix.as_deref(),
            result_details.maybe_media_file_public_bucket_extension.as_deref())
              .get_full_object_path_str()
              .to_string()
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
          "".to_string() // TODO(bt,2024-07-15): Fix. This should read job type.
        }
      };
     
      ResultDetailsResponse {
        entity_type: result_details.entity_type,
        entity_token: result_details.entity_token,
        media_links: MediaLinks::from_rooted_path(media_domain, &public_bucket_media_path),
        maybe_public_bucket_media_path: Some(public_bucket_media_path),
        maybe_successfully_completed_at: result_details.maybe_successfully_completed_at,
      }
    }),
    created_at: record.created_at,
    updated_at: record.updated_at,
  }
}

#[cfg(test)]
mod tests {
  use crate::http_server::common_responses::media::media_domain::MediaDomain;
  use crate::http_server::endpoints::inference_job::get::get_inference_job_status_handler::record_to_payload;
  use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
  use mysql_queries::queries::generic_inference::web::job_status::{GenericInferenceJobStatus, RequestDetails, ResultDetails};
  use url::Url;

  #[test]
  fn text_to_speech_as_media_file() {
    let status = GenericInferenceJobStatus {
      request_details: RequestDetails {
        inference_category: InferenceCategory::TextToSpeech,
        maybe_model_type: Some("tacotron2".to_string()),
        ..Default::default()
      },
      maybe_result_details: Some(ResultDetails {
        entity_type: "media_file".to_string(),
        entity_token: "m_024pk3p3xrmeyk83chps90jeymnygk".to_string(),
        public_bucket_location_or_hash: "tpk848b5s5zwhnwrph75jhyfyja3j42v".to_string(),
        maybe_media_file_public_bucket_prefix: Some("fakeyou_".to_string()),
        maybe_media_file_public_bucket_extension: Some(".wav".to_string()),
        public_bucket_location_is_hash: true,
        ..Default::default()
      }),
      ..Default::default()
    };

    let payload =
        record_to_payload(status, None, MediaDomain::Storyteller);

    assert!(payload.maybe_result.is_some());

    let result = payload.maybe_result.expect("should have result");

    assert_eq!(
      Url::parse("https://cdn.storyteller.ai/media/t/p/k/8/4/tpk848b5s5zwhnwrph75jhyfyja3j42v/fakeyou_tpk848b5s5zwhnwrph75jhyfyja3j42v.wav").unwrap(),
      result.media_links.cdn_url
    );

    assert_eq!(
      Some("/media/t/p/k/8/4/tpk848b5s5zwhnwrph75jhyfyja3j42v/fakeyou_tpk848b5s5zwhnwrph75jhyfyja3j42v.wav"),
      result.maybe_public_bucket_media_path.as_deref()
    );
  }

  #[test]
  fn text_to_speech_as_tts_result() {
    let status = GenericInferenceJobStatus {
      request_details: RequestDetails {
        inference_category: InferenceCategory::TextToSpeech,
        maybe_model_type: Some("tacotron2".to_string()),
        ..Default::default()
      },
      maybe_result_details: Some(ResultDetails {
        entity_type: "text_to_speech".to_string(),
        entity_token: "TR:qvgdvngw4y54t7rmfepwv8fd965eh".to_string(),
        public_bucket_location_or_hash:
          "/tts_inference_output/9/9/7/vocodes_997e710c-d733-406c-9b6e-5e1d0c471816.wav".to_string(),
        maybe_media_file_public_bucket_prefix: None,
        maybe_media_file_public_bucket_extension: None,
        public_bucket_location_is_hash: false,
        ..Default::default()
      }),
      ..Default::default()
    };

    let payload =
        record_to_payload(status, None, MediaDomain::FakeYou);

    assert!(payload.maybe_result.is_some());

    let result = payload.maybe_result.expect("should have result");

    assert_eq!(
      Url::parse("https://cdn.fakeyou.com/tts_inference_output/9/9/7/vocodes_997e710c-d733-406c-9b6e-5e1d0c471816.wav").unwrap(),
      result.media_links.cdn_url
    );

    assert_eq!(
      Some("/tts_inference_output/9/9/7/vocodes_997e710c-d733-406c-9b6e-5e1d0c471816.wav"),
      result.maybe_public_bucket_media_path.as_deref(),
    );
  }
}
