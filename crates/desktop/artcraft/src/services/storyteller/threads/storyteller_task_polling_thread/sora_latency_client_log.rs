//! Client-side wall-clock log for Sora ArtCraft jobs (#1069 investigation).
//! No behavior change — structured `info!` only.

use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use artcraft_api_defs::jobs::list_session_jobs::ListSessionJobsItem;
use artcraft_api_defs::subscriptions::get_session_subscription::GetSessionSubscriptionResponse;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::endpoints::subscriptions::get_session_subscription::get_session_subscription;
use chrono::Utc;
use enums::common::payments_namespace::PaymentsNamespace;
use enums::tauri::tasks::task_model_type::TaskModelType;
use log::{info, warn};
use sqlite_tasks::queries::task::Task;

fn is_sora_model(model: Option<&TaskModelType>) -> Option<&'static str> {
  match model {
    Some(TaskModelType::Sora2) => Some("sora_2"),
    Some(TaskModelType::Sora2Pro) => Some("sora_2_pro"),
    _ => None,
  }
}

fn plan_tag_from_subscription_response(response: &GetSessionSubscriptionResponse) -> &'static str {
  match response.active_subscription.as_ref().map(|s| s.product_slug.as_str()) {
    None => "free",
    Some("artcraft_basic") => "artcraft_basic",
    Some("artcraft_pro") => "artcraft_pro",
    Some("artcraft_max") => "artcraft_max",
    Some(_) => "unknown",
  }
}

/// Best-effort structured log when a Sora ArtCraft task completes locally.
pub async fn maybe_log_sora_client_completion(
  app_env_configs: &AppEnvConfigs,
  maybe_creds: Option<&StorytellerCredentialSet>,
  job: &ListSessionJobsItem,
  task: &Task,
  outcome: &str,
) {
  let Some(model) = is_sora_model(task.model_type.as_ref()) else {
    return;
  };

  let plan = match get_session_subscription(
    &app_env_configs.storyteller_host,
    maybe_creds,
    PaymentsNamespace::Artcraft,
  )
  .await
  {
    Ok(response) => plan_tag_from_subscription_response(&response),
    Err(err) => {
      warn!(
        "Sora latency client log: subscription lookup failed (using unknown): {:?}",
        err
      );
      "unknown"
    }
  };

  let elapsed_ms = (Utc::now() - job.created_at).num_milliseconds().max(0);
  let job_token = task
    .provider_job_id
    .as_deref()
    .unwrap_or(job.job_token.as_str());

  info!(
    "sora_latency_client model={} plan={} outcome={} client_elapsed_ms={} inference_job_token={}",
    model, plan, outcome, elapsed_ms, job_token
  );
}
