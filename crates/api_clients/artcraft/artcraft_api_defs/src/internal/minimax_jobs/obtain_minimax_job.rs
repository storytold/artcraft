use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use enums::by_table::prompt_context_items::prompt_context_semantic_type::PromptContextSemanticType;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_bitrate::CommonBitrate;
use enums::common::generation::common_generation_mode::CommonGenerationMode;
use enums::common::generation::common_resolution::CommonResolution;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;

use crate::common::responses::media_links::MediaLinks;
use crate::internal::minimax_jobs::minimax_worker_model::MinimaxWorkerModel;

/// Request body for `POST /v1/internal/minimax_jobs/obtain_job`.
#[derive(Clone, Debug, Serialize, Deserialize, ToSchema)]
pub struct ObtainMinimaxJobRequest {
  /// Which model the worker wants a job for.
  pub model: MinimaxWorkerModel,

  /// The worker's hostname (linux hostname, k8s pod name), if reported.
  pub worker_hostname: Option<String>,

  /// The cluster the worker runs in (e.g. "runpod", "lambdalabs"), if reported.
  pub cluster_name: Option<String>,
}

/// Response body for `POST /v1/internal/minimax_jobs/obtain_job`.
#[derive(Clone, Debug, Serialize, Deserialize, ToSchema)]
pub struct ObtainMinimaxJobResponse {
  pub success: bool,

  /// The obtained job, or `None` when no pending job is available.
  pub maybe_job: Option<ObtainedMinimaxJob>,
}

/// A job the worker now holds a lock on (status was moved to `started`).
#[derive(Clone, Debug, Serialize, Deserialize, ToSchema)]
pub struct ObtainedMinimaxJob {
  pub job_token: InferenceJobToken,

  /// Echo of the requested model.
  pub model: MinimaxWorkerModel,

  /// The prompt and inputs the worker needs to run inference. Only `None`
  /// when the job was somehow enqueued without a prompt record (or the
  /// prompt lookup failed) — workers should fail such jobs via the failure
  /// endpoint.
  pub maybe_prompt: Option<MinimaxJobPromptDetails>,
}

/// The prompt (text + generation settings) and its attached media references.
#[derive(Clone, Debug, Serialize, Deserialize, ToSchema)]
pub struct MinimaxJobPromptDetails {
  pub prompt_token: PromptToken,

  pub maybe_positive_prompt: Option<String>,
  pub maybe_negative_prompt: Option<String>,

  pub maybe_generation_mode: Option<CommonGenerationMode>,
  pub maybe_aspect_ratio: Option<CommonAspectRatio>,
  pub maybe_resolution: Option<CommonResolution>,
  pub maybe_bitrate: Option<CommonBitrate>,
  pub maybe_generate_audio: Option<bool>,
  pub maybe_duration_seconds: Option<u32>,

  /// Image / video / audio references attached to the prompt, with full CDN
  /// links, in their original order.
  pub media_references: Vec<MinimaxJobMediaReference>,
}

/// One media input attached to the prompt (start frame, end frame, or an
/// image / video / audio reference), with full CDN links.
#[derive(Clone, Debug, Serialize, Deserialize, ToSchema)]
pub struct MinimaxJobMediaReference {
  pub media_file_token: MediaFileToken,

  /// The role the media plays (start frame, end frame, image / video / audio
  /// reference, etc.).
  pub semantic_type: PromptContextSemanticType,

  /// Full CDN links to the media file.
  pub media_links: MediaLinks,
}
