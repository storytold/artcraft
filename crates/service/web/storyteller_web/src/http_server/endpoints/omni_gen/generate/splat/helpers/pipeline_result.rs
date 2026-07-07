use artcraft_router::generate::generate_splat::generate_splat_response::GenerateSplatResponse;
use mysql_queries::queries::generic_inference::common::job_cost_estimates::JobCostEstimates;

use crate::http_server::endpoints::omni_gen::generate::video::helpers::bill_wallet::BillWalletResult;

/// The pipeline produces this, then the handler suffix handles DB writes.
pub struct PipelineResult {
  pub billing: BillWalletResult,
  pub response: GenerateSplatResponse,

  /// System (user-facing) and provider-side cost estimates, written onto the
  /// generic_inference_jobs rows.
  pub cost_estimates: JobCostEstimates,
}
