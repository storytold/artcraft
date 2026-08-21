use chrono::{DateTime, Utc};
use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use enums::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;
use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::common::job_status_plus::JobStatusPlus;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::prompts::PromptToken;

use crate::common::responses::media_links::MediaLinks;

/// Full status payload for a single inference job.
///
/// Shared by both the single (`/v1/omni_api/job_status/job/{token}`) and batch
/// (`/v1/omni_api/job_status/batch`) Omni API status endpoints. Forked from the
/// cookie-authenticated `/v1/jobs/*` response types so the Omni API surface can
/// evolve independently.
#[derive(Serialize, Deserialize, ToSchema)]
pub struct OmniApiJobStatusPayload {
  pub job_token: InferenceJobToken,

  pub request: OmniApiJobRequestDetails,
  pub status: OmniApiJobStatusDetails,
  pub maybe_result: Option<OmniApiJobResultDetails>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

/// Details about what the user requested for generation.
#[derive(Serialize, Deserialize, ToSchema)]
pub struct OmniApiJobRequestDetails {
  pub inference_category: InferenceCategory,

  pub maybe_prompt_token: Option<PromptToken>,

  pub maybe_model_type: Option<String>,
  pub maybe_model_token: Option<String>,
}

/// Details about the ongoing job status.
#[derive(Serialize, Deserialize, ToSchema)]
pub struct OmniApiJobStatusDetails {
  /// Primary status from the database (a state machine).
  pub status: JobStatusPlus,

  pub maybe_first_started_at: Option<DateTime<Utc>>,

  /// An enum the frontend can use to display localized/I18N error
  /// messages. These pertain to both transient and permanent failures.
  pub maybe_failure_category: Option<FrontendFailureCategory>,

  /// This is an integer number between 0 and 100 (both inclusive) that
  /// reports the completeness.
  pub progress_percentage: u8,
}

/// Details about the completed result (if any).
#[derive(Serialize, Deserialize, ToSchema)]
pub struct OmniApiJobResultDetails {
  pub entity_type: String,
  pub entity_token: String,

  /// Rich CDN links to the media, including thumbnails, previews, and more.
  pub media_links: MediaLinks,

  pub maybe_successfully_completed_at: Option<DateTime<Utc>>,
}
