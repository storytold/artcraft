use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::functional_events::show_provider_billing_modal_event::ShowProviderBillingModalEvent;
use crate::core::events::functional_events::show_provider_login_modal_event::ShowProviderLoginModalEvent;
use crate::core::events::generation_events::common::GenerationServiceProvider;
use crate::core::events::generation_events::generation_failed_event::GenerationFailedEvent;
use crate::core::state::task_database::TaskDatabase;
use crate::core::threads::third_party_task_polling_thread::events::notify_frontend_of_completion::task_type_to_generation_action;
use crate::core::threads::third_party_task_polling_thread::handlers::openrouter::poll_openrouter_tasks::{BILLING_REASON, MISSING_KEY_REASON};
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_status::TaskStatus;
use log::{error, info};
use sqlite_tasks::queries::task::Task;
use sqlite_tasks::queries::update_task_status::{update_task_status, UpdateTaskArgs};
use tauri::AppHandle;

/// The OpenRouter modal a failure opens, as the enqueue path does for the same problems.
#[derive(Debug, PartialEq)]
enum ProviderModal {
  Billing,
  /// No API key: the provider setup (login) modal.
  Setup,
}

pub async fn handle_openrouter_failure(
  app_handle: &AppHandle,
  task_database: &TaskDatabase,
  task: &Task,
  reason: &str,
) {
  info!("[OpenRouterPolling] Marking task {} as failed: {}", task.id.as_str(), reason);

  let update_result = update_task_status(UpdateTaskArgs {
    db: task_database.get_connection(),
    task_id: &task.id,
    status: TaskStatus::CompleteFailure,
  }).await;

  if let Err(err) = update_result {
    error!("[OpenRouterPolling] Failed to update task status for {}: {:?}", task.id.as_str(), err);
  }

  let event = GenerationFailedEvent {
    action: task_type_to_generation_action(task.task_type),
    service: GenerationServiceProvider::OpenRouter,
    model: None,
    reason: Some(reason.to_string()),
  };

  event.send_infallible(app_handle);

  match provider_modal(reason) {
    Some(ProviderModal::Billing) => ShowProviderBillingModalEvent::send_for_provider(GenerationProvider::OpenRouter, app_handle),
    Some(ProviderModal::Setup) => ShowProviderLoginModalEvent::send_for_provider(GenerationProvider::OpenRouter, app_handle),
    None => {},
  }
}

fn provider_modal(reason: &str) -> Option<ProviderModal> {
  match reason {
    BILLING_REASON => Some(ProviderModal::Billing),
    MISSING_KEY_REASON => Some(ProviderModal::Setup),
    _ => None,
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::core::threads::third_party_task_polling_thread::handlers::openrouter::poll_openrouter_tasks::INTERRUPTED_REASON;

  #[test]
  fn account_problems_open_the_openrouter_modals() {
    assert_eq!(provider_modal(BILLING_REASON), Some(ProviderModal::Billing));
    assert_eq!(provider_modal(MISSING_KEY_REASON), Some(ProviderModal::Setup));
    assert_eq!(provider_modal(INTERRUPTED_REASON), None);
    assert_eq!(provider_modal("OpenRouter refused the request (400): bad size"), None);
  }
}
