use artcraft_router::generate::generate_video::generate_video_response::GenerateVideoResponse;
use mysql_queries::queries::generic_inference::common::job_cost_estimates::JobCostEstimates;

use crate::http_server::endpoints::omni_api::generate::video::helpers::bill_wallet::BillWalletResult;

/// Both pipelines produce this, then the shared suffix handles DB writes.
pub struct PipelineResult {
  pub billing: BillWalletResult,
  pub response: GenerateVideoResponse,

  /// System (user-facing) and provider-side cost estimates, written onto the
  /// generic_inference_jobs rows.
  pub cost_estimates: JobCostEstimates,
}
