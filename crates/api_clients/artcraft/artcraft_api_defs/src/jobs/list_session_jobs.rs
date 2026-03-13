use crate::common::responses::job_details::{JobDetailsLipsyncRequest, JobDetailsLivePortraitRequest};
use crate::common::responses::media_links::MediaLinks;
use chrono::{DateTime, Utc};
use enums::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;
use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::common::job_status_plus::JobStatusPlus;
use enums::no_table::style_transfer::style_transfer_name::StyleTransferName;
use serde::Deserialize;
use serde::Serialize;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use utoipa::{IntoParams, ToSchema};
use enums::api_safe::by_table::generic_inference_jobs::frontend_failure_category_for_api_clients::FrontendFailureCategoryForApiClients;
use enums::api_safe::by_table::generic_inference_jobs::frontend_failure_category_for_old_clients::FrontendFailureCategoryForOldClients;
use tokens::tokens::batch_generations::BatchGenerationToken;

pub const LIST_SESSION_JOBS_URL_PATH: &str = "/v1/jobs/session";

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
#[derive(Serialize, Deserialize, ToSchema)]
pub struct ListSessionJobsSuccessResponse {
  pub success: bool,

  /// This is not paginated and is limited to showing 100 jobs.
  pub jobs: Vec<ListSessionJobsItem>,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct ListSessionJobsItem {
  pub job_token: InferenceJobToken,

  pub request: ListSessionRequestDetailsResponse,
  pub status: ListSessionStatusDetailsResponse,
  pub maybe_result: Option<ListSessionResultDetailsResponse>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

/// Details about what the user requested for generation
#[derive(Serialize, Deserialize, ToSchema)]
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

  /// OPTIONAL. For lipsync jobs (face fusion and sad talker), this is additional
  /// information on the request.
  pub maybe_lipsync_details: Option<JobDetailsLipsyncRequest>,
}

/// Details about the ongoing job status
#[derive(Serialize, Deserialize, ToSchema)]
pub struct ListSessionStatusDetailsResponse {
  /// Primary status from the database (a state machine).
  pub status: JobStatusPlus,

  /// Extra, temporary status from Redis.
  /// This can denote inference progress, and the Python code can write to it.
  pub maybe_extra_status_description: Option<String>,

  pub maybe_assigned_worker: Option<String>,
  pub maybe_assigned_cluster: Option<String>,

  pub maybe_first_started_at: Option<DateTime<Utc>>,

  /// If the job is currently running, this is how long it has been running in seconds.
  /// This is heuristic estimate since we don't record the precise start time across runs.
  pub maybe_current_execution_duration_seconds: Option<u64>,

  pub attempt_count: u8,

  /// Whether the frontend needs to maintain a keepalive check.
  /// This is typically only for non-premium users.
  pub requires_keepalive: bool,

  /// NB: DO NOT CHANGE: Old clients can't read the new enum payload values as they are introduced.
  ///
  /// An enum the frontend can use to display localized/I18N error
  /// messages. These pertain to both transient and permanent failures.
  #[deprecated(note="use maybe_failure_category_updated")]
  pub maybe_failure_category: Option<FrontendFailureCategoryForOldClients>,

  /// An enum the frontend can use to display localized/I18N error
  /// messages. These pertain to both transient and permanent failures.
  pub maybe_failure_category_updated: Option<FrontendFailureCategoryForApiClients>,
  
  /// User-facing failure messages
  pub maybe_failure_message: Option<String>,

  /// This is an integer number between 0 and 100 (both inclusive) that
  /// reports the completeness.
  pub progress_percentage: u8,
}

/// Details about the completed result (if any)
#[derive(Serialize, Deserialize, ToSchema)]
pub struct ListSessionResultDetailsResponse {
  pub entity_type: String,
  pub entity_token: String,
  
  /// If generated as part of a batch, the batch token.
  pub maybe_batch_token: Option<BatchGenerationToken>,

  /// (DEPRECATED) URL path to the media file
  #[deprecated(note="This field doesn't point to the full URL. Use media_links instead to leverage the CDN.")]
  pub maybe_public_bucket_media_path: Option<String>,

  /// Rich CDN links to the media, including thumbnails, previews, and more.
  pub media_links: MediaLinks,

  pub maybe_successfully_completed_at: Option<DateTime<Utc>>,
}
