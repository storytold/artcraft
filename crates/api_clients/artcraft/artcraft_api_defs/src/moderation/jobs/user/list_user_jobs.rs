use chrono::{DateTime, Utc};
use enums::by_table::generic_inference_jobs::inference_job_external_third_party::InferenceJobExternalThirdParty;
use enums::by_table::wallet_ledger_entries::wallet_ledger_entry_type::WalletLedgerEntryType;
use enums::common::job_status_plus::JobStatusPlus;
use serde_derive::{Deserialize, Serialize};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;
use tokens::tokens::wallet_ledger_entries::WalletLedgerEntryToken;
use utoipa::ToSchema;

pub const LIST_USER_JOBS_PATH: &str = "/v1/moderation/jobs/user/{user_token}/list";

#[derive(Deserialize, ToSchema)]
pub struct ListUserJobsPathInfo {
  pub user_token: UserToken,
}

#[derive(Serialize, ToSchema)]
pub struct ListUserJobsResponse {
  pub success: bool,
  pub jobs: Vec<ListUserJobsEntry>,
}

#[derive(Serialize, ToSchema)]
pub struct ListUserJobsEntry {
  pub job_status: JobStatusPlus,
  pub job_failure_reason: Option<String>,
  pub credits_delta: Option<i32>,
  pub maybe_linked_refund_ledger_token: Option<WalletLedgerEntryToken>,
  pub on_success_result_media_token: Option<MediaFileToken>,
  pub job_token: InferenceJobToken,
  pub wallet_ledger_entry_token: Option<WalletLedgerEntryToken>,
  pub wallet_ledger_entry_type: Option<WalletLedgerEntryType>,
  pub maybe_external_third_party: Option<InferenceJobExternalThirdParty>,
  pub maybe_external_third_party_id: Option<String>,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}
