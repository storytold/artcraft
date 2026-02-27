use log::{error, info, warn};

use enums::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;
use mysql_queries::queries::generic_inference::job::mark_job_failed_by_token::{mark_job_failed_by_token, MarkJobFailedByTokenArgs};
use mysql_queries::queries::generic_inference::seedance2pro::list_pending_seedance2pro_jobs::PendingSeedance2ProJob;
use mysql_queries::queries::wallets::refund::try_to_refund_ledger_entry::{try_to_refund_ledger_entry, WalletRefundOutcome};
use seedance2pro::requests::poll_orders::poll_orders::OrderStatus;

use crate::job_dependencies::JobDependencies;

pub async fn process_failed_job(
  deps: &JobDependencies,
  job: &PendingSeedance2ProJob,
  order: &OrderStatus,
) {
  let reason = order
    .fail_reason
    .as_deref()
    .unwrap_or("unknown failure reason");

  // --- Step 1: Attempt the refund before touching the job status. ---
  //
  // We do this first so that a crash or error between the refund and the status update
  // can never result in a failed job with no refund. If the refund itself fails we bail
  // out early: the job stays pending and will be retried on the next poll cycle.

  match &job.maybe_wallet_ledger_entry_token {
    None => {
      // No ledger token recorded — job was likely submitted before billing was wired up.
      warn!(
        "Job {} has no wallet ledger entry token; skipping refund.",
        job.job_token.as_str()
      );
    }
    Some(ledger_token) => {
      let mut transaction = match deps.mysql_pool.begin().await {
        Ok(tx) => tx,
        Err(err) => {
          error!(
            "Failed to begin refund transaction for job {} (ledger {}): {:?}. \
             Job will NOT be marked failed yet and will be retried next poll.",
            job.job_token.as_str(), ledger_token.as_str(), err
          );
          return;
        }
      };

      match try_to_refund_ledger_entry(ledger_token, &mut transaction).await {
        Ok(WalletRefundOutcome::Refunded(summary)) => {
          info!(
            "Refunded {} credits for failed job {} (ledger {} → refund ledger {}).",
            summary.refund_amount,
            job.job_token.as_str(),
            ledger_token.as_str(),
            summary.refund_ledger_entry_token.as_str(),
          );
          if let Err(err) = transaction.commit().await {
            error!(
              "Failed to commit refund transaction for job {} (ledger {}): {:?}. \
               Job will NOT be marked failed yet and will be retried next poll.",
              job.job_token.as_str(), ledger_token.as_str(), err
            );
            return;
          }
        }
        Ok(WalletRefundOutcome::AlreadyRefunded) => {
          // Idempotent — nothing to do, safe to proceed.
          info!(
            "Ledger entry {} for job {} was already refunded; proceeding to mark job failed.",
            ledger_token.as_str(),
            job.job_token.as_str(),
          );
          let _ = transaction.rollback().await;
        }
        Err(err) => {
          error!(
            "Failed to refund ledger entry {} for job {}: {:?}. \
             Job will NOT be marked failed yet and will be retried next poll.",
            ledger_token.as_str(),
            job.job_token.as_str(),
            err,
          );
          let _ = transaction.rollback().await;
          return;
        }
      }
    }
  }

  // --- Step 2: Mark the job record as failed. ---

  let reason_lower = reason.to_lowercase();

  let platform_rules_violation = reason_lower.contains("violates") ||
    reason_lower.contains("platform rules") ||
    reason_lower.contains("please modify");

  let frontend_failure_category = if platform_rules_violation {
    Some(FrontendFailureCategory::ModelRulesViolation)
  } else {
    None
  };

  warn!(
    "Order {} failed: {}. Marking job {} failed.",
    order.order_id, reason, job.job_token.as_str()
  );

  let mark_failed_result = mark_job_failed_by_token(MarkJobFailedByTokenArgs {
    pool: &deps.mysql_pool,
    job_token: &job.job_token,
    maybe_public_failure_reason: Some(reason),
    internal_debugging_failure_reason: reason,
    maybe_frontend_failure_category: frontend_failure_category,
  }).await;

  if let Err(err) = mark_failed_result {
    error!(
      "Error marking job {} as failed: {:?}",
      job.job_token.as_str(),
      err
    );
  }
}
