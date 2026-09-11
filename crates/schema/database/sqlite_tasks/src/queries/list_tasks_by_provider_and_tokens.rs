use crate::connection::TaskDbConnection;
use crate::error::SqliteTasksError;
use crate::queries::task::{RawTask, Task};
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_model_type::TaskModelType;
use enums::tauri::tasks::task_status::TaskStatus;
use enums::tauri::tasks::task_type::TaskType;
use enums::tauri::ux::tauri_command_caller::TauriCommandCaller;
use sqlx::{QueryBuilder, Sqlite};
use tokens::tokens::sqlite::tasks::TaskId;

pub struct ListTasksArgs<'a> {
  pub db: &'a TaskDbConnection,
  pub provider: GenerationProvider,
  pub provider_job_ids: Option<Vec<String>>,
}

pub struct TaskList {
  pub tasks: Vec<Task>,
}

pub async fn list_tasks_by_provider_and_tokens(
  args: ListTasksArgs<'_>,
) -> Result<TaskList, SqliteTasksError> {

  let mut query_builder: QueryBuilder<Sqlite> = QueryBuilder::new(r#"
    SELECT
      id,
      task_status,
      task_type,
      model_type,
      provider,
      provider_job_id,
      frontend_caller,
      queue_status_url,
      queue_response_url,
      prompt_token,
      frontend_subscriber_id,
      frontend_subscriber_payload
    FROM tasks
    WHERE provider =
  "#);

  // TODO(bt,2025-07-15): Fix this. The sqlx mysql queries never required temporaries
  let provider = args.provider.to_string();

  query_builder.push_bind(provider);

  if let Some(provider_job_ids) = args.provider_job_ids {
    query_builder.push(" AND provider_job_id IN (");
    let mut separated = query_builder.separated(", ");

    for job_id in provider_job_ids.into_iter() {
      separated.push_bind(job_id);
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
      prompt_token: task.prompt_token,
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
