use chrono::{DateTime, Utc};

use enums::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;
use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::by_table::generic_inference_jobs::inference_job_product_category::InferenceJobProductCategory;
use enums::common::job_status_plus::JobStatusPlus;
use enums::no_table::style_transfer::style_transfer_name::StyleTransferName;
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::users::UserToken;

/// Shared inference job status struct for several queries (list, get, batch get)
/// NB: Serialization is for internal endpoints, not for returning to end-users.
#[derive(Debug, Default, Serialize)]
pub struct GenericInferenceJobStatus {
  pub job_token: InferenceJobToken,

  pub status: JobStatusPlus,
  pub attempt_count: u16,

  pub maybe_assigned_worker: Option<String>,
  pub maybe_assigned_cluster: Option<String>,

  pub maybe_first_started_at: Option<DateTime<Utc>>,

  pub maybe_frontend_failure_category: Option<FrontendFailureCategory>,
  pub failure_reason: Option<String>,

  pub request_details: RequestDetails,
  pub maybe_result_details: Option<ResultDetails>,
  pub user_details: UserDetails,

  pub is_keepalive_required: bool,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  /// This is MySQL's NOW(), which will let us do duration math without clock skew.
  pub database_clock: DateTime<Utc>,
}

/// NB: Serialize is for internal moderator-only endpoints
/// Details about the user's original inference request
/// (We may want to present it in the "pending" UI.)
#[derive(Debug, Default, Serialize)]
pub struct RequestDetails {
  pub maybe_product_category: Option<InferenceJobProductCategory>,
  pub inference_category: InferenceCategory,
  pub maybe_model_type: Option<String>, // TODO: Strongly type
  pub maybe_model_token: Option<String>,
  pub maybe_model_title: Option<String>,

  /// TTS input. In the future, perhaps voice conversion SST
  pub maybe_raw_inference_text: Option<String>,

  /// Raw JSON payload of polymorphic inference args
  pub maybe_inference_args: Option<String>,

  /// For Comfy / Video Style Transfer jobs, this might include
  /// the name of the selected style.
  pub maybe_style_name: Option<StyleTransferName>,
}

/// NB: Serialize is for internal moderator-only endpoints
/// Details about the generated result
#[derive(Debug, Default, Serialize)]
pub struct ResultDetails {
  pub entity_type: String,
  pub entity_token: String,

  pub maybe_batch_token: Option<BatchGenerationToken>,

  /// The bucket storage hash (for vc and media_files) or full path (for tts)
  pub public_bucket_location_or_hash: String,
  pub maybe_media_file_public_bucket_prefix: Option<String>,
  pub maybe_media_file_public_bucket_extension: Option<String>,

  /// Whether the location is a full path (for tts) or a hash (for vc) that
  /// needs to be reconstructed into a path.
  pub public_bucket_location_is_hash: bool,

  pub maybe_successfully_completed_at: Option<DateTime<Utc>>,
}

/// NB: DO NOT EXPOSE TO FRONTEND.
/// NB: Serialize is for internal moderator-only endpoints
/// This is used to gate access to job termination
#[derive(Debug, Default, Serialize)]
pub struct UserDetails {
  pub maybe_creator_user_token: Option<UserToken>,
  pub maybe_creator_anonymous_visitor_token: Option<AnonymousVisitorTrackingToken>,
  pub creator_ip_address: String,
}
