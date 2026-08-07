//! `SELECT ... FOR UPDATE SKIP LOCKED` the oldest pending first-party
//! Minimax H3 job of a given model tier.
//!
//! Pass `&mut *transaction` as the executor — the row lock only means
//! anything inside the surrounding transaction. `SKIP LOCKED` keeps
//! concurrent workers from blocking on (or double-obtaining) the same row:
//! each worker locks a distinct pending row or gets `None`.
//!
//! Performance: the scan is driven by `index_job_type` (job_type, then PK
//! order, so "oldest first" is index order) and only pending rows survive
//! the filter; pending first-party rows are expected to be few.

use sqlx::{Executor, MySql};
use std::marker::PhantomData;

use enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;

use crate::queries::generic_inference::first_party::minimax_h3::insert_generic_inference_job_for_first_party_minimax_h3_with_apriori_job_token::FirstPartyMinimaxH3Model;

pub struct SelectPendingFirstPartyMinimaxH3JobForUpdateArgs<'e, 'c, E>
  where E: 'e + Executor<'c, Database = MySql>
{
  /// Which model tier to obtain a job for.
  pub minimax_model: FirstPartyMinimaxH3Model,

  pub mysql_executor: E,

  pub phantom: PhantomData<(&'e (), &'c E)>,
}

/// Returns the locked job's token, or `None` when no unlocked pending job of
/// the given tier exists.
pub async fn select_pending_first_party_minimax_h3_job_for_update<'e, 'c : 'e, E>(
  args: SelectPendingFirstPartyMinimaxH3JobForUpdateArgs<'e, 'c, E>
) -> Result<Option<InferenceJobToken>, sqlx::Error>
  where E: 'e + Executor<'c, Database = MySql>
{
  let job_type = match args.minimax_model {
    FirstPartyMinimaxH3Model::Turbo => InferenceJobType::ArtcraftMinimaxH3Turbo,
    FirstPartyMinimaxH3Model::Ultra => InferenceJobType::ArtcraftMinimaxH3Ultra,
  };

  let maybe_row = sqlx::query!(
    r#"
SELECT token as `job_token: tokens::tokens::generic_inference_jobs::InferenceJobToken`
FROM generic_inference_jobs
WHERE job_type = ?
AND status = 'pending'
ORDER BY id ASC
LIMIT 1
FOR UPDATE SKIP LOCKED
    "#,
    job_type.to_str(),
  )
    .fetch_optional(args.mysql_executor)
    .await?;

  Ok(maybe_row.map(|row| row.job_token))
}
