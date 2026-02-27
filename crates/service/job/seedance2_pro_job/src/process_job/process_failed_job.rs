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

  // Refund the credits for the failed generation.
  let ledger_token = match &job.maybe_wallet_ledger_entry_token {
    Some(token) => token,
    None => {
      warn!(
        "Job {} has no wallet ledger entry token; cannot issue refund.",
        job.job_token.as_str()
      );
      return;
    }
  };

  match deps.mysql_pool.begin().await {
    Err(err) => {
      error!(
        "Failed to begin refund transaction for job {}: {:?}",
        job.job_token.as_str(), err
      );
    }
    Ok(mut transaction) => {
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
              "Failed to commit refund transaction for job {}: {:?}",
              job.job_token.as_str(), err
            );
          }
        }
        Ok(WalletRefundOutcome::AlreadyRefunded) => {
          info!(
            "Ledger entry {} for job {} was already refunded; skipping.",
            ledger_token.as_str(),
            job.job_token.as_str(),
          );
          let _ = transaction.rollback().await;
        }
        Err(err) => {
          error!(
            "Failed to refund ledger entry {} for job {}: {:?}",
            ledger_token.as_str(),
            job.job_token.as_str(),
            err,
          );
          let _ = transaction.rollback().await;
        }
      }
    }
  }
}
