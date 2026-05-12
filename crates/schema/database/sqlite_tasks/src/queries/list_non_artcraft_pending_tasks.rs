use crate::connection::TaskDbConnection;
use crate::error::SqliteTasksError;
use crate::queries::task::{RawTask, Task};
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_model_type::TaskModelType;
use enums::tauri::tasks::task_status::TaskStatus;
use enums::tauri::tasks::task_type::TaskType;
use enums::tauri::ux::tauri_command_caller::TauriCommandCaller;
use sqlx::{QueryBuilder, Sqlite};
use std::collections::HashSet;
use tokens::tokens::sqlite::tasks::TaskId;

pub struct ListNonArtcraftPendingTasksArgs<'a> {
  pub db: &'a TaskDbConnection,
  pub task_statuses: &'a HashSet<TaskStatus>,
}

pub struct NonArtcraftTaskList {
  pub tasks: Vec<Task>,
}

/// List all tasks that are NOT from the Artcraft provider and match the given statuses.
pub async fn list_non_artcraft_pending_tasks(
  args: ListNonArtcraftPendingTasksArgs<'_>,
) -> Result<NonArtcraftTaskList, SqliteTasksError> {
  let artcraft_provider = GenerationProvider::Artcraft.to_string();

  let mut query_builder: QueryBuilder<Sqlite> = QueryBuilder::new(r#"
    SELECT
      id,
      task_status,
      task_type,
      model_type,
      provider,
      provider_job_id,
      queue_status_url,
      queue_response_url,
      prompt_token,
      frontend_caller,
      frontend_subscriber_id,
      frontend_subscriber_payload
    FROM tasks
    WHERE provider !=
  "#);

  query_builder.push_bind(artcraft_provider);

  if !args.task_statuses.is_empty() {
    query_builder.push(" AND task_status IN (");
    let mut separated = query_builder.separated(", ");
    for task_status in args.task_statuses.into_iter() {
      separated.push_bind(task_status.to_str());
    }
    separated.push_unseparated(") ");
  }

  let query = query_builder.build_query_as::<RawTask>();
  let results = query.fetch_all(args.db.get_pool()).await?;

  let mut tasks: Vec<Task> = Vec::new();

  for task in results {
    tasks.push(Task {
      id: TaskId::new_from_str(&task.id),
      status: TaskStatus::from_str(&task.task_status)?,
      task_type: TaskType::from_str(&task.task_type)?,
      model_type: task.model_type
        .map(|model| TaskModelType::from_str(&model))
        .transpose()?,
      provider: GenerationProvider::from_str(&task.provider)?,
      provider_job_id: task.provider_job_id,
      queue_status_url: task.queue_status_url,
      queue_response_url: task.queue_response_url,
      prompt_token: task.prompt_token,
      frontend_caller: task.frontend_caller
        .map(|caller| TauriCommandCaller::from_str(&caller))
        .transpose()?,
      frontend_subscriber_id: task.frontend_subscriber_id,
      frontend_subscriber_payload: task.frontend_subscriber_payload,
    });
  }

  Ok(NonArtcraftTaskList { tasks })
}
