use crate::connection::TaskDbConnection;
use crate::error::SqliteTasksError;
use crate::queries::task::{warn_unreadable_task, RawTask, Task};
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_status::TaskStatus;
use sqlx::{QueryBuilder, Sqlite};
use std::collections::HashSet;

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
    match raw.into_task() {
      Ok(task) => tasks.push(task),
      Err(err) => warn_unreadable_task(&task_id, &err),
    }
  }

  Ok(TaskList {
    tasks,
  })
}


#[cfg(test)]
mod tests {
  use super::*;
  use crate::queries::create_task::{create_task, CreateTaskArgs};
  use enums::tauri::tasks::task_type::TaskType;
  use tokens::tokens::sqlite::tasks::TaskId;

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
