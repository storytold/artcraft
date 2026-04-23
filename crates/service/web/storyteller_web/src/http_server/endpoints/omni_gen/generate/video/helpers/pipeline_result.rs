use artcraft_router::generate::generate_video::generate_video_response::GenerateVideoResponse;

use crate::http_server::endpoints::omni_gen::generate::video::helpers::bill_wallet::BillWalletResult;

/// Both pipelines produce this, then the shared suffix handles DB writes.
pub struct PipelineResult {
  pub billing: BillWalletResult,
  pub response: GenerateVideoResponse,
}
