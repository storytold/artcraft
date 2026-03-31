use log::{error, info, warn};

use enums::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;
use mysql_queries::queries::generic_inference::job::mark_job_failed_by_token::{mark_job_failed_by_token, MarkJobFailedByTokenArgs};
use mysql_queries::queries::generic_inference::seedance2pro::list_pending_seedance2pro_jobs::PendingSeedance2ProJob;
use mysql_queries::queries::wallets::refund::try_to_refund_ledger_entry::{try_to_refund_ledger_entry, WalletRefundOutcome};
use pager::notification::notification_details_builder::NotificationDetailsBuilder;
use pager::notification::notification_urgency::NotificationUrgency;
use seedance2pro_client::requests::poll_orders::failure_type::FailureType;
use seedance2pro_client::requests::poll_orders::poll_orders::OrderStatus;

use crate::job_dependencies::JobDependencies;

pub async fn process_failed_job(
  deps: &JobDependencies,
  job: &PendingSeedance2ProJob,
  order: &OrderStatus,
) {
  let reason = order
    .fail_reason
    .as_ref()
    .map(|fr| fr.reason.as_str())
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

          let notification = NotificationDetailsBuilder::from_error(&err)
              .set_title("Seedance2Pro refund failed".to_string())
              .set_inference_job_token(Some(job.job_token.to_string()))
              .set_third_party_id(Some(job.order_id.to_string()))
              .set_user_token(job.maybe_creator_user_token.as_ref().map(|t| t.to_string()))
              .set_urgency(Some(NotificationUrgency::Medium))
              .build();

          if let Err(pager_err) = deps.pager.enqueue_page(notification) {
            error!("Failed to enqueue pager alert: {:?}", pager_err);
          }

          let _ = transaction.rollback().await;
          return;
        }
      }
    }
  }

  // --- Step 2: Mark the job record as failed. ---

  let frontend_failure_category = order.fail_reason.as_ref().map(|fr| {
    match fr.failure_type {
      FailureType::RuleBansUserImage => FrontendFailureCategory::RuleBansUserImage,
      FailureType::RuleBansUserImageWithFaces => FrontendFailureCategory::RuleBansUserImageWithFaces,
      FailureType::RuleBansUserTextPrompt => FrontendFailureCategory::RuleBansUserTextPrompt,
      FailureType::RuleBansUserContent => FrontendFailureCategory::RuleBansUserContent,
      FailureType::RuleBansGeneratedVideo => FrontendFailureCategory::RuleBansGeneratedVideo,
      FailureType::RuleBansGeneratedAudio => FrontendFailureCategory::RuleBansGeneratedAudio,
      FailureType::RuleBansGeneratedContent => FrontendFailureCategory::RuleBansGeneratedContent,
      FailureType::GenerationFailed => FrontendFailureCategory::GenerationFailed,
      FailureType::OtherUnknownReason => FrontendFailureCategory::GenerationFailed,
    }
  });

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

    let notification = NotificationDetailsBuilder::from_error(&err)
        .set_title("Seedance2Pro mark job failed error".to_string())
        .set_urgency(Some(NotificationUrgency::Medium))
        .build();

    if let Err(pager_err) = deps.pager.enqueue_page(notification) {
      error!("Failed to enqueue pager alert: {:?}", pager_err);
    }
  }
}
