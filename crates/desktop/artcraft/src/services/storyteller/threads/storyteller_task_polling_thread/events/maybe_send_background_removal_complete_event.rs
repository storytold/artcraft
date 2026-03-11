use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::functional_events::canvas_background_removal_complete_event::CanvasBackgroundRemovalCompleteEvent;
use crate::core::events::generation_events::generation_complete_event::GenerationCompleteEvent;
use artcraft_api_defs::jobs::list_session_jobs::ListSessionJobsItem;
use enums::tauri::tasks::task_type::TaskType;
use enums::tauri::ux::tauri_command_caller::TauriCommandCaller;
use errors::AnyhowResult;
use log::error;
use sqlite_tasks::queries::list_tasks_by_provider_and_tokens::{list_tasks_by_provider_and_tokens, ListTasksArgs};
use sqlite_tasks::queries::task::Task;
use tokens::tokens::media_files::MediaFileToken;

pub async fn maybe_send_background_removal_complete_event(
  app: &tauri::AppHandle,
  task: &Task,
  job: &ListSessionJobsItem,
) -> AnyhowResult<()> {

  match task.task_type {
    TaskType::BackgroundRemoval => {} // NB: Fall-through
    _ => return Ok(()),
  }

  match task.frontend_caller {
    Some(TauriCommandCaller::Canvas) => {} // NB: Fall-through
    _ => return Ok(()),
  }

  let result = match job.maybe_result {
    Some(ref res) => res,
    None => {
      error!("Job result is None for task: {:?}", task);
      return Ok(()); // No result, nothing to do
    },
  };

  let event = CanvasBackgroundRemovalCompleteEvent {
    media_token: MediaFileToken::new_from_str(&result.entity_token),
    image_cdn_url: result.media_links.cdn_url.clone(),
    maybe_frontend_subscriber_id: task.frontend_subscriber_id.clone(),
    maybe_frontend_subscriber_payload: task.frontend_subscriber_payload.clone(),
  };

  if let Err(err) = event.send(&app) {
    error!("Failed to send CanvasBackgroundRemovalCompleteEvent: {:?}", err); // Fail open
  }

  Ok(())
}