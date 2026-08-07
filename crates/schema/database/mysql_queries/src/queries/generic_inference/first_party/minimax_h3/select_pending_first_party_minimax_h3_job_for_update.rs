//! `SELECT ... FOR UPDATE SKIP LOCKED` the oldest pending first-party
//! Minimax H3 job of a given model tier.
//!
//! Takes a transaction (not a generic executor) — the row lock only means
//! anything inside a transaction, and the caller must run
//! [`mark_first_party_minimax_h3_job_started`] in the same transaction so the
//! select-then-mark pair is atomic. `SKIP LOCKED` keeps concurrent workers
//! from blocking on (or double-obtaining) the same row: each worker locks a
//! distinct pending row or gets `None`.
//!
//! Performance: the scan is driven by `index_job_type` (job_type, then PK
//! order, so "oldest first" is index order) and only pending rows survive
//! the filter; pending first-party rows are expected to be few.
//!
//! [`mark_first_party_minimax_h3_job_started`]:
//! crate::queries::generic_inference::first_party::minimax_h3::mark_first_party_minimax_h3_job_started

use sqlx::{MySql, Transaction};

use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::prompts::PromptToken;

use crate::queries::generic_inference::first_party::minimax_h3::first_party_minimax_h3_model::FirstPartyMinimaxH3Model;

pub struct SelectPendingFirstPartyMinimaxH3JobForUpdateArgs<'a, 'tx> {
  /// Which model tier to obtain a job for.
  pub minimax_model: FirstPartyMinimaxH3Model,

  pub transaction: &'a mut Transaction<'tx, MySql>,
}

/// The locked pending job.
#[derive(Debug)]
pub struct PendingFirstPartyMinimaxH3Job {
  pub job_token: InferenceJobToken,
  pub maybe_prompt_token: Option<PromptToken>,
}

/// Returns the locked job, or `None` when no unlocked pending job of the
/// given tier exists.
pub async fn select_pending_first_party_minimax_h3_job_for_update(
  args: SelectPendingFirstPartyMinimaxH3JobForUpdateArgs<'_, '_>
) -> Result<Option<PendingFirstPartyMinimaxH3Job>, sqlx::Error> {
  let job_type = args.minimax_model.inference_job_type();

  let maybe_row = sqlx::query!(
    r#"
SELECT
  token as `job_token: tokens::tokens::generic_inference_jobs::InferenceJobToken`,
  maybe_prompt_token as `maybe_prompt_token: tokens::tokens::prompts::PromptToken`
FROM generic_inference_jobs
WHERE job_type = ?
AND status = 'pending'
ORDER BY id ASC
LIMIT 1
FOR UPDATE SKIP LOCKED
    "#,
    job_type.to_str(),
  )
    .fetch_optional(&mut **args.transaction)
    .await?;

  Ok(maybe_row.map(|row| PendingFirstPartyMinimaxH3Job {
    job_token: row.job_token,
    maybe_prompt_token: row.maybe_prompt_token,
  }))
}
