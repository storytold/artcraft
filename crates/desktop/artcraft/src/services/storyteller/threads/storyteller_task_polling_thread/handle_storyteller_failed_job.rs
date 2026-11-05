// Event types the frontend understands; GenerationModel names the model that was used.
use crate::core::events::generation_events::common::GenerationModel;
// Trait that gives events a `send_infallible` method (emit to the UI, never panic).
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
// The "generation failed" event the UI listens for to show an error toast.
use crate::core::events::generation_events::generation_failed_event::GenerationFailedEvent;
// Handle to the local SQLite database that stores every task.
use crate::core::state::task_database::TaskDatabase;
// Converts the internal provider enum into the one the frontend uses.
use crate::core::utils::enum_conversion::generation_provider::to_generation_service_provider;
// Converts the internal task type into the "action" the frontend shows (image, video, ...).
use crate::core::utils::enum_conversion::task_type::to_generation_action;
// One row of the server's "my recent jobs" response.
use artcraft_api_defs::jobs::list_session_jobs::ListSessionJobsItem;
// The lifecycle states a task can be in (pending, complete, failed, ...).
use enums::tauri::tasks::task_status::TaskStatus;
// Shorthand `Result` type that can hold any error.
use errors::AnyhowResult;
// Logging macro; used instead of println! per AGENTS.md.
use log::info;
// A task row as stored in SQLite.
use sqlite_tasks::queries::task::Task;
// Plain status-update query (imported but the rich variant below is the one used here).
use sqlite_tasks::queries::update_task_status::{update_task_status, UpdateTaskArgs};
// Handle to the running Tauri app, needed to send events to the window.
use tauri::AppHandle;
// Category of failure (e.g. content filter, timeout) stored with the task.
use enums::tauri::tasks::task_failure_type::TaskFailureType;
// Query that records a failed status together with its failure type and message.
use sqlite_tasks::queries::update_task_status_with_rich_failure::{update_task_status_with_rich_failure, UpdateTaskWithRichFailureArgs};

/// Called by the polling thread when the server reports that a job failed.
/// It (1) records the failure in the local database, then (2) tells the UI why.
pub async fn handle_failed_job(
  // Used to emit the failure event to the frontend.
  app_handle: &AppHandle,
  // What the server said about the job, including the failure category and message.
  job: &ListSessionJobsItem,
  // Our local record of the same job.
  task: &Task,
  // Where the local record is written.
  task_database: &TaskDatabase,
) -> AnyhowResult<()> {
  // Leave a trail in the log so a failed job can be traced by task id.
  info!("Marking storyteller job as failed: {:?}", task.id);

  // Translate the server's failure category into our own enum (None if the server sent none).
  let maybe_failure_type = job.status
      .maybe_failure_category_updated
      .as_ref()
      .map(|val| TaskFailureType::from_frontend_failure_category_for_api(val));

  // The human-readable reason from the server, borrowed (not copied) when present.
  let maybe_failure_message = job.status.maybe_failure_message.as_deref();

  // Write "complete failure" plus the type and message to the SQLite task row.
  update_task_status_with_rich_failure(UpdateTaskWithRichFailureArgs {
    db: task_database.get_connection(),
    task_id: &task.id,
    status: TaskStatus::CompleteFailure,
    maybe_failure_type,
    maybe_failure_message,
  }).await?;

  // Map internal enums to the names the frontend expects.
  let service = to_generation_service_provider(task.provider);
  let action = to_generation_action(task.task_type);

  // Build the event the UI will receive.
  let event = GenerationFailedEvent {
    action,
    service,
    model: task.model_type.as_ref().map(|model| GenerationModel::Unknown(model.to_str().to_owned())),
    // Forward the user-facing failure message (prompt flagged, etc.) so the frontend can show why.
    reason: maybe_failure_message.map(|message| message.to_string()),
  };

  // Emit the event to the window; this never fails the handler.
  event.send_infallible(app_handle);

  // Everything succeeded.
  Ok(())
}
