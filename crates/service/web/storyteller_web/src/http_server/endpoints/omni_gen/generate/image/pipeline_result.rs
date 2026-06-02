use artcraft_router::generate::generate_image::generate_image_response::GenerateImageResponse;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::wallet_ledger_entries::WalletLedgerEntryToken;

/// Both image pipelines produce this, then the shared handler suffix writes DB rows.
pub struct ImagePipelineResult {
  pub apriori_job_token: InferenceJobToken,
  pub response: GenerateImageResponse,

  /// The wallet ledger entry created when the user was charged for this
  /// generation, if any (None when the generation is free). Used as a
  /// foreign key on the inference job row so the worker can refund on
  /// failure.
  pub maybe_wallet_ledger_entry_token: Option<WalletLedgerEntryToken>,
}
