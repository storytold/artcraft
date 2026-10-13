use crate::core::events::generation_events::common::GenerationModel;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::generation_failed_event::GenerationFailedEvent;
use crate::core::state::task_database::TaskDatabase;
use crate::core::utils::enum_conversion::generation_provider::to_generation_service_provider;
use crate::core::utils::enum_conversion::task_type::to_generation_action;
use artcraft_api_defs::jobs::list_session_jobs::ListSessionJobsItem;
use enums::common::job_status_plus::JobStatusPlus;
use enums::tauri::tasks::task_status::TaskStatus;
use errors::AnyhowResult;
use log::info;
use sqlite_tasks::queries::task::Task;
use sqlite_tasks::queries::update_task_status::{update_task_status, UpdateTaskArgs};
use tauri::AppHandle;
use enums::tauri::tasks::task_failure_type::TaskFailureType;
use sqlite_tasks::queries::update_task_status_with_rich_failure::{update_task_status_with_rich_failure, UpdateTaskWithRichFailureArgs};

/// Record that a job ended without a result (`failed_status` comes from `to_failed_task_status`),
/// then tell the frontend, unless the user is the one who ended it.
pub async fn handle_failed_job(
  app_handle: &AppHandle,
  job: &ListSessionJobsItem,
  task: &Task,
  failed_status: TaskStatus,
  task_database: &TaskDatabase,
) -> AnyhowResult<()> {
  info!("Marking storyteller job as {}: {:?}", failed_status, task.id);

  let maybe_failure_type = job.status
      .maybe_failure_category_updated
      .as_ref()
      .map(|val| TaskFailureType::from_frontend_failure_category_for_api(val));
  
  let maybe_failure_message = job.status.maybe_failure_message.as_deref();

  update_task_status_with_rich_failure(UpdateTaskWithRichFailureArgs {
    db: task_database.get_connection(),
    task_id: &task.id,
    status: failed_status,
    maybe_failure_type,
    maybe_failure_message,
  }).await?;

  if let Some(event) = to_generation_failed_event(job, task, failed_status) {
    event.send_infallible(app_handle);
  }

  Ok(())
}

/// The local task status for a job that ended without producing a result.
/// `None` means the job is still in flight, or it succeeded.
///
/// NB: Every terminal state needs an arm here. A job state that is skipped leaves its
/// local task pending forever: the frontend keeps a progress bar stuck at 95% and never
/// shows an error. The match is exhaustive on purpose, so a new `JobStatusPlus` variant
/// can't slip through unnoticed.
pub fn to_failed_task_status(status: JobStatusPlus) -> Option<TaskStatus> {
  match status {
    JobStatusPlus::CompleteFailure => Some(TaskStatus::CompleteFailure),
    JobStatusPlus::Dead => Some(TaskStatus::Dead),
    JobStatusPlus::CancelledByUser => Some(TaskStatus::CancelledByUser),
    // NB: "The system" is the ArtCraft backend, which is `us` here, not a third party provider.
    JobStatusPlus::CancelledBySystem => Some(TaskStatus::CancelledByUs),
    // NB: The backend retries `AttemptFailed` jobs.
    JobStatusPlus::Pending | JobStatusPlus::Started | JobStatusPlus::AttemptFailed => None,
    // NB: Successes are handled by `handle_successful_job`.
    JobStatusPlus::CompleteSuccess => None,
  }
}

/// The error the frontend should show for the failed task, if any.
fn to_generation_failed_event(
  job: &ListSessionJobsItem,
  task: &Task,
  failed_status: TaskStatus,
) -> Option<GenerationFailedEvent> {
  // NB: The user did this on purpose, so it isn't an error.
  // The task queue still lists the task as cancelled.
  if failed_status == TaskStatus::CancelledByUser {
    return None;
  }

  Some(GenerationFailedEvent {
    action: to_generation_action(task.task_type),
    service: to_generation_service_provider(task.provider),
    model: task.model_type.as_ref().map(|model| GenerationModel::Unknown(model.to_str().to_owned())),
    // NB: This is how the user finds out *why* (eg. their prompt was flagged).
    reason: job.status.maybe_failure_message.clone(),
  })
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::core::utils::task_database_pending_statuses::TASK_DATABASE_PENDING_STATUSES;
  use enums::common::generation_provider::GenerationProvider;
  use enums::tauri::tasks::task_model_type::TaskModelType;
  use enums::tauri::tasks::task_type::TaskType;
  use serde_json::{json, Value};
  use tokens::tokens::sqlite::tasks::TaskId;

  const FLAGGED_PROMPT_MESSAGE: &str = "Your prompt was flagged by our content rules.";

  mod failed_task_status_tests {
    use super::*;

    #[test]
    fn jobs_that_ended_without_a_result_map_to_a_terminal_task_status() {
      assert_eq!(to_failed_task_status(JobStatusPlus::CompleteFailure), Some(TaskStatus::CompleteFailure));
      assert_eq!(to_failed_task_status(JobStatusPlus::Dead), Some(TaskStatus::Dead));
      assert_eq!(to_failed_task_status(JobStatusPlus::CancelledByUser), Some(TaskStatus::CancelledByUser));
      assert_eq!(to_failed_task_status(JobStatusPlus::CancelledBySystem), Some(TaskStatus::CancelledByUs));
    }

    #[test]
    fn jobs_in_flight_or_successful_are_not_failures() {
      assert_eq!(to_failed_task_status(JobStatusPlus::Pending), None);
      assert_eq!(to_failed_task_status(JobStatusPlus::Started), None);
      assert_eq!(to_failed_task_status(JobStatusPlus::AttemptFailed), None);
      assert_eq!(to_failed_task_status(JobStatusPlus::CompleteSuccess), None);
    }

    #[test]
    fn failed_task_statuses_are_never_polled_again() {
      // Otherwise the other providers' pollers would keep picking the task up.
      for job_status in JobStatusPlus::all_variants() {
        if let Some(task_status) = to_failed_task_status(job_status) {
          assert!(!TASK_DATABASE_PENDING_STATUSES.contains(&task_status), "{:?}", task_status);
        }
      }
    }
  }

  mod failed_event_tests {
    use super::*;

    #[test]
    fn failure_message_is_the_reason_shown_to_the_user() {
      let job = job("complete_failure", Some(FLAGGED_PROMPT_MESSAGE));
      let event = to_generation_failed_event(&job, &task(), TaskStatus::CompleteFailure).unwrap();

      assert_eq!(serialize(&event), json!({
        "action": "generate_video",
        "service": "artcraft",
        "model": "seedance_2p0",
        "reason": FLAGGED_PROMPT_MESSAGE,
      }));
    }

    #[test]
    fn dead_jobs_are_reported_too() {
      let job = job("dead", Some(FLAGGED_PROMPT_MESSAGE));
      let event = to_generation_failed_event(&job, &task(), TaskStatus::Dead).unwrap();

      assert_eq!(serialize(&event)["reason"], json!(FLAGGED_PROMPT_MESSAGE));
    }

    #[test]
    fn jobs_cancelled_by_the_system_are_reported() {
      let job = job("cancelled_by_system", None);
      let event = to_generation_failed_event(&job, &task(), TaskStatus::CancelledByUs).unwrap();

      assert_eq!(serialize(&event)["reason"], Value::Null);
    }

    #[test]
    fn missing_failure_message_leaves_the_frontend_to_use_its_default_text() {
      let job = job("complete_failure", None);
      let event = to_generation_failed_event(&job, &task(), TaskStatus::CompleteFailure).unwrap();

      assert_eq!(serialize(&event)["reason"], Value::Null);
    }

    #[test]
    fn jobs_cancelled_by_the_user_are_not_reported_as_errors() {
      let job = job("cancelled_by_user", None);

      assert!(to_generation_failed_event(&job, &task(), TaskStatus::CancelledByUser).is_none());
    }
  }

  fn job(status: &str, maybe_failure_message: Option<&str>) -> ListSessionJobsItem {
    serde_json::from_value(json!({
      "job_token": "jinf_test",
      "request": {
        "inference_category": "video_generation",
      },
      "status": {
        "status": status,
        "attempt_count": 1,
        "requires_keepalive": false,
        "maybe_failure_category_updated": "rule_bans_user_text_prompt",
        "maybe_failure_message": maybe_failure_message,
        "progress_percentage": 0,
      },
      "maybe_result": null,
      "created_at": "2026-10-13T12:00:00Z",
      "updated_at": "2026-10-13T12:05:00Z",
    })).expect("job json")
  }

  fn task() -> Task {
    Task {
      id: TaskId::generate(),
      status: TaskStatus::Started,
      task_type: TaskType::VideoGeneration,
      model_type: Some(TaskModelType::Seedance2p0),
      provider: GenerationProvider::Artcraft,
      provider_job_id: Some("jinf_test".to_string()),
      queue_status_url: None,
      queue_response_url: None,
      prompt_token: None,
      frontend_caller: None,
      frontend_subscriber_id: None,
      frontend_subscriber_payload: None,
    }
  }

  fn serialize(event: &GenerationFailedEvent) -> Value {
    serde_json::to_value(event).expect("event json")
  }
}
