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

pub struct ListTasksByProviderAndStatusArgs<'a> {
  pub db: &'a TaskDbConnection,
  pub provider: GenerationProvider,
  pub task_statuses: &'a HashSet<TaskStatus>,
}

pub struct TaskList {
  pub tasks: Vec<Task>,
}

pub async fn list_tasks_by_provider_and_status(
  args: ListTasksByProviderAndStatusArgs<'_>,
) -> Result<TaskList, SqliteTasksError> {

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
      frontend_caller,
      frontend_subscriber_id,
      frontend_subscriber_payload
    FROM tasks
    WHERE provider =
  "#);

  // TODO(bt,2025-07-15): Fix this. The sqlx mysql queries never required temporaries
  let provider = args.provider.to_string();

  query_builder.push_bind(provider);

  if !args.task_statuses.is_empty() {
    query_builder.push(" AND task_status IN (");
    let mut separated = query_builder.separated(", ");

    for task_status in args.task_statuses.into_iter() {
      separated.push_bind(task_status.to_str());
    }

    separated.push_unseparated(") ");
  }

  let query = query_builder.build_query_as::<RawTask>();

  // info!("Query: {:?}", query.sql());

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
      frontend_caller: task.frontend_caller
          .map(|caller| TauriCommandCaller::from_str(&caller))
          .transpose()?,
      frontend_subscriber_id: task.frontend_subscriber_id,
      frontend_subscriber_payload: task.frontend_subscriber_payload,
    });
  }

  Ok(TaskList {
    tasks,
  })
}
