//! Mark a first-party Minimax H3 job as started and record which worker
//! obtained it.
//!
//! Call inside the same transaction as
//! [`select_pending_first_party_minimax_h3_job_for_update`] so the
//! select-then-mark pair is atomic.
//!
//! [`select_pending_first_party_minimax_h3_job_for_update`]:
//! crate::queries::generic_inference::first_party::minimax_h3::select_pending_first_party_minimax_h3_job_for_update

use sqlx::{Executor, MySql};
use std::marker::PhantomData;

use enums::common::job_status_plus::JobStatusPlus;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;

/// `assigned_worker` / `assigned_cluster` are VARCHAR(128).
const MAX_WORKER_FIELD_CHARS: usize = 128;

pub struct MarkFirstPartyMinimaxH3JobStartedArgs<'e, 'c, E>
  where E: 'e + Executor<'c, Database = MySql>
{
  pub job_token: &'e InferenceJobToken,

  /// The worker's hostname (linux hostname, k8s pod name).
  pub worker_hostname: &'e str,

  /// The cluster the worker runs in (e.g. "runpod", "lambda").
  pub cluster_name: &'e str,

  pub mysql_executor: E,

  pub phantom: PhantomData<&'c E>,
}

pub async fn mark_first_party_minimax_h3_job_started<'e, 'c : 'e, E>(
  args: MarkFirstPartyMinimaxH3JobStartedArgs<'e, 'c, E>
) -> Result<(), sqlx::Error>
  where E: 'e + Executor<'c, Database = MySql>
{
  let worker_hostname = clamp_chars(args.worker_hostname, MAX_WORKER_FIELD_CHARS);
  let cluster_name = clamp_chars(args.cluster_name, MAX_WORKER_FIELD_CHARS);

  sqlx::query!(
    r#"
UPDATE generic_inference_jobs
SET
  status = ?,
  assigned_worker = ?,
  last_assigned_worker = ?,
  assigned_cluster = ?,
  first_started_at = NOW()
WHERE token = ?
    "#,
    JobStatusPlus::Started.to_str(),
    worker_hostname,
    worker_hostname,
    cluster_name,
    args.job_token.as_str(),
  )
    .execute(args.mysql_executor)
    .await?;

  Ok(())
}

fn clamp_chars(value: &str, max_chars: usize) -> &str {
  match value.char_indices().nth(max_chars) {
    Some((byte_index, _)) => &value[..byte_index],
    None => value,
  }
}
