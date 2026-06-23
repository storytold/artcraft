use log::{error, info, warn};

use enums::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;
use mysql_queries::queries::generic_inference::api_providers::seedance2pro::list_pending_seedance2pro_video_jobs::PendingSeedance2ProJob;
use mysql_queries::queries::generic_inference::job::mark_job_failed_by_token::mark_job_failed_by_token_with_executor;
use mysql_queries::queries::generic_inference::job::select_inference_job_status_for_update::select_inference_job_status_for_update;
use mysql_queries::queries::wallets::refund::try_to_refund_ledger_entry::{try_to_refund_ledger_entry, WalletRefundOutcome};
use pager::notification::notification_details_builder::NotificationDetailsBuilder;
use pager::notification::notification_urgency::NotificationUrgency;
use seedance2pro_client::requests::poll_orders::failure_type::FailureType;
use seedance2pro_client::requests::poll_orders::poll_orders::OrderStatus;

use crate::job_dependencies::JobDependencies;
use crate::jobs::order_processing_job::is_job_status_terminal::is_job_status_terminal;

/// Reconcile a failed order: refund the user (if billed) and mark the job
/// failed — atomically, in one transaction.
///
/// The whole thing runs under a `SELECT ... FOR UPDATE` row lock: we re-read
/// the job's status, bail if another finalizer already settled it, and
/// otherwise refund + mark-failed + commit together. Because refund and the
/// failure write share a transaction, a crash can never leave a failed job
/// without its refund (or vice versa), and the refund itself is idempotent.
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

  let mut transaction = match deps.mysql_pool.begin().await {
    Ok(tx) => tx,
    Err(err) => {
      error!(
        "Failed to begin failure transaction for job {}: {:?}. \
         Job will NOT be marked failed yet and will be retried next poll.",
        job.job_token.as_str(), err,
      );
      return;
    }
  };

  // ── Terminal-state guard (do NOT remove) ──
  //
  // Bail unless the job is still pending. Another finalizer may have already
  // settled (and refunded) this job between the processing loop's pre-check and
  // this locked re-read. If we don't stop here we could double-refund the user.
  // This is the single most important check in this function, so it's a
  // discrete, early-returning step.

  let maybe_status = match select_inference_job_status_for_update(&mut *transaction, &job.job_token).await {
    Ok(maybe_status) => maybe_status,
    Err(err) => {
      error!(
        "Failed to lock job {} for failure finalize: {:?}. Will retry next poll.",
        job.job_token.as_str(), err,
      );
      let _ = transaction.rollback().await;
      return;
    }
  };

  let status = match maybe_status {
    Some(status) => status,
    None => {
      warn!(
        "Job {} vanished before failure finalize (order {}); skipping.",
        job.job_token.as_str(), order.order_id,
      );
      let _ = transaction.rollback().await;
      return;
    }
  };

  if is_job_status_terminal(status) {
    info!(
      "Job {} is already terminal ({:?}) before failure finalize (order {}); skipping.",
      job.job_token.as_str(), status, order.order_id,
    );
    let _ = transaction.rollback().await;
    return;
  }

  // Still pending — refund and mark failed within the locked transaction.
  //
  // Refund first (within the same transaction), so the refund and the failure
  // write commit or roll back together.
  match &job.maybe_wallet_ledger_entry_token {
    None => {
      // No ledger token recorded — job was likely submitted before billing was wired up.
      warn!(
        "Job {} has no wallet ledger entry token; skipping refund.",
        job.job_token.as_str()
      );
    }
    Some(ledger_token) => {
      match try_to_refund_ledger_entry(ledger_token, &mut transaction).await {
        Ok(WalletRefundOutcome::Refunded(summary)) => {
          info!(
            "Refunded {} credits for failed job {} (ledger {} → refund ledger {}).",
            summary.refund_amount,
            job.job_token.as_str(),
            ledger_token.as_str(),
            summary.refund_ledger_entry_token.as_str(),
          );
        }
        Ok(WalletRefundOutcome::AlreadyRefunded) => {
          info!(
            "Ledger entry {} for job {} was already refunded; proceeding to mark job failed.",
            ledger_token.as_str(),
            job.job_token.as_str(),
          );
        }
        Err(err) => {
          error!(
            "Failed to refund ledger entry {} for job {}: {:?}. \
             Job will NOT be marked failed yet and will be retried next poll.",
            ledger_token.as_str(),
            job.job_token.as_str(),
            err,
          );

          let notification = NotificationDetailsBuilder::from_boxed_error(err.into())
              .set_title("Kinovi refund failed".to_string())
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

  warn!(
    "Order {} failed: {}. Marking job {} failed.",
    order.order_id, reason, job.job_token.as_str()
  );

  if let Err(err) = mark_job_failed_by_token_with_executor(
    &mut *transaction,
    &job.job_token,
    Some(reason),
    reason,
    frontend_failure_category,
  ).await {
    error!(
      "Error marking job {} as failed: {:?}",
      job.job_token.as_str(),
      err
    );

    let notification = NotificationDetailsBuilder::from_boxed_error(err.into())
        .set_title("Kinovi mark job failed error".to_string())
        .set_urgency(Some(NotificationUrgency::Medium))
        .build();

    if let Err(pager_err) = deps.pager.enqueue_page(notification) {
      error!("Failed to enqueue pager alert: {:?}", pager_err);
    }

    let _ = transaction.rollback().await;
    return;
  }

  if let Err(err) = transaction.commit().await {
    error!(
      "Failed to commit failure transaction for job {}: {:?}. \
       Will be retried next poll.",
      job.job_token.as_str(), err,
    );
  }
}
