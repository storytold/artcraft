//! Main entrypoint for video generation execution.
//!
//! Routes to the appropriate provider (Fal or Seedance2Pro/Kinovi)
//! based on the distilled request's `execution_provider`.

use std::collections::HashMap;

use url::Url;

use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
use artcraft_router::api::provider::Provider;
use enums::common::generation::common_generation_mode::CommonGenerationMode;
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::state::server_state::ServerState;

use super::super::distill_video_request::DistilledVideoRequest;
use super::execute_fal::execute_generation_fal;
use super::execute_kinovi::execute_generation_kinovi;

/// Result of a successful generation, regardless of provider.
pub struct GenerationResult {
  /// The external job ID used to track the generation (first order_id for Seedance).
  pub external_job_id: String,

  /// Whether this is a Seedance2Pro generation (changes DB insertion path).
  pub is_seedance2pro: bool,

  /// For Seedance2Pro batch jobs, the list of all order IDs.
  pub maybe_seedance_order_ids: Option<Vec<String>>,

  /// The generation mode (Text, Keyframe, Reference).
  pub generation_mode: CommonGenerationMode,
}

/// Execute video generation via the appropriate provider.
pub async fn execute_generation(
  distilled: &DistilledVideoRequest,
  request: &OmniGenVideoCostAndGenerateRequest,
  server_state: &ServerState,
  media_file_hydration_map: Option<&HashMap<MediaFileToken, Url>>,
) -> Result<GenerationResult, AdvancedCommonWebError> {
  match distilled.execution_provider {
    Provider::Seedance2Pro => {
      execute_generation_kinovi(
        distilled,
        request,
        server_state,
        media_file_hydration_map,
      ).await
    }
    _ => {
      execute_generation_fal(
        distilled,
        request,
        server_state,
      ).await
    }
  }
}
