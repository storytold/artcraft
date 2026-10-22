use crate::connection::TaskDbConnection;
use crate::error::SqliteTasksError;
use crate::queries::task::{RawTask, Task};
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_model_type::TaskModelType;
use enums::tauri::tasks::task_status::TaskStatus;
use enums::tauri::tasks::task_type::TaskType;
use enums::tauri::ux::tauri_command_caller::TauriCommandCaller;
use log::warn;
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
      prompt_token,
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

  for raw in results {
    let task_id = raw.id.clone();
    // FIX: one row with a value this build cannot parse (left by a newer version of the app, or damaged) used to
    // fail the whole call with `?`, and every poller that lists its tasks through here then did nothing for any task.
    // Log the row and carry on with the rest.
    match task_from_raw(raw) {
      Ok(task) => tasks.push(task),
      Err(err) => warn!("Skipping task {} that could not be read: {}", task_id, err),
    }
  }

  Ok(TaskList {
    tasks,
  })
}

fn task_from_raw(task: RawTask) -> Result<Task, SqliteTasksError> {
  Ok(Task {
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
  })
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::queries::create_task::{create_task, CreateTaskArgs};

  // NB: A plain #[test] with a hand-built runtime, because this crate forbids `unused_mut`, which the
  // #[tokio::test] expansion trips over.
  #[test]
  fn a_row_with_an_unknown_value_does_not_hide_the_other_tasks() {
    let runtime = tokio::runtime::Builder::new_current_thread().enable_all().build().unwrap();
    runtime.block_on(async {
      let dir = tempfile::tempdir().unwrap();
      let db = TaskDbConnection::connect_and_migrate(dir.path().join("tasks.sqlite")).await.unwrap();
      let good = new_task(&db, "job-good").await;
      let odd = new_task(&db, "job-odd").await;

      // A value this build does not know, as left behind by a newer version of the app.
      sqlx::query("UPDATE tasks SET task_type = 'from_a_newer_version' WHERE id = ?")
          .bind(odd.as_str())
          .execute(db.get_pool())
          .await
          .unwrap();

      let statuses = HashSet::from([TaskStatus::Pending]);
      let list = list_tasks_by_provider_and_status(ListTasksByProviderAndStatusArgs {
        db: &db,
        provider: GenerationProvider::Fal,
        task_statuses: &statuses,
      }).await.unwrap();

      let ids = list.tasks.iter().map(|task| task.id.as_str().to_string()).collect::<Vec<_>>();
      assert_eq!(ids, vec![good.as_str().to_string()]);
    });
  }

  async fn new_task(db: &TaskDbConnection, provider_job_id: &str) -> TaskId {
    create_task(CreateTaskArgs {
      db,
      status: TaskStatus::Pending,
      task_type: TaskType::ImageGeneration,
      model_type: None,
      provider: GenerationProvider::Fal,
      provider_job_id: Some(provider_job_id),
      queue_status_url: None,
      queue_response_url: None,
      prompt_token: None,
      frontend_caller: None,
      frontend_subscriber_id: None,
      frontend_subscriber_payload: None,
    }).await.unwrap()
  }
}
