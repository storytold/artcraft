//! Mark a first-party Minimax H3 job as started and record which worker
//! obtained it.
//!
//! Takes a transaction (not a generic executor): this must run in the same
//! transaction as [`select_pending_first_party_minimax_h3_job_for_update`]
//! so the select-then-mark pair is atomic.
//!
//! [`select_pending_first_party_minimax_h3_job_for_update`]:
//! crate::queries::generic_inference::first_party::minimax_h3::select_pending_first_party_minimax_h3_job_for_update

use sqlx::{MySql, Transaction};

use enums::common::job_status_plus::JobStatusPlus;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;

/// `assigned_worker` / `assigned_cluster` are VARCHAR(128).
const MAX_WORKER_FIELD_CHARS: usize = 128;

pub struct MarkFirstPartyMinimaxH3JobStartedArgs<'a, 'tx> {
  pub job_token: &'a InferenceJobToken,

  /// The worker's hostname (linux hostname, k8s pod name), when reported.
  pub maybe_worker_hostname: Option<&'a str>,

  /// The cluster the worker runs in (e.g. "runpod", "lambda"), when reported.
  pub maybe_cluster_name: Option<&'a str>,

  pub transaction: &'a mut Transaction<'tx, MySql>,
}

pub async fn mark_first_party_minimax_h3_job_started(
  args: MarkFirstPartyMinimaxH3JobStartedArgs<'_, '_>
) -> Result<(), sqlx::Error> {
  let maybe_worker_hostname = args.maybe_worker_hostname
    .map(|hostname| clamp_chars(hostname, MAX_WORKER_FIELD_CHARS));

  let maybe_cluster_name = args.maybe_cluster_name
    .map(|cluster| clamp_chars(cluster, MAX_WORKER_FIELD_CHARS));

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
    maybe_worker_hostname,
    maybe_worker_hostname,
    maybe_cluster_name,
    args.job_token.as_str(),
  )
    .execute(&mut **args.transaction)
    .await?;

  Ok(())
}

fn clamp_chars(value: &str, max_chars: usize) -> &str {
  match value.char_indices().nth(max_chars) {
    Some((byte_index, _)) => &value[..byte_index],
    None => value,
  }
}
