use crate::connection::TaskDbConnection;
use crate::error::SqliteTasksError;
use enums::tauri::tasks::task_status::TaskStatus;
use tokens::tokens::sqlite::tasks::TaskId;

pub struct UpdateTaskArgs<'a> {
  pub db: &'a TaskDbConnection,
  pub task_id: &'a TaskId,
  pub status: TaskStatus,
}

/// Returns true if rows were updated.
pub async fn update_task_status(
  args: UpdateTaskArgs<'_>,
) -> Result<bool, SqliteTasksError> {

  // TODO(bt,2025-07-12): Fix this. The sqlx mysql queries never required temporaries
  let task_id_temp = args.task_id.as_str();
  let status_temp = args.status.to_str();

  // info!("Update task id: {}, status: {}", task_id_temp, status_temp);

  // TODO(bt,2025-07-15): We can't set a LIMIT without a certain compiler flag for SQLite ?
  let query = sqlx::query!(r#"
    UPDATE tasks
    SET task_status = ?
    WHERE id = ?
  "#,
      status_temp,
      task_id_temp,
  );

  // info!("query: {:?}", query.sql());

  let res = query.execute(args.db.get_pool()).await?;
  let rows_updated = res.rows_affected() > 0;

  Ok(rows_updated)
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::queries::create_task::{create_task, CreateTaskArgs};
  use enums::common::generation_provider::GenerationProvider;
  use enums::tauri::tasks::task_type::TaskType;

  // NB: A plain #[test] with a hand-built runtime, because this crate forbids `unused_mut`, which the
  // #[tokio::test] expansion trips over.
  #[test]
  fn finishing_a_task_stamps_completed_at_and_refreshes_updated_at() {
    let runtime = tokio::runtime::Builder::new_current_thread().enable_all().build().unwrap();
    runtime.block_on(async {
      let dir = tempfile::tempdir().unwrap();
      let db = TaskDbConnection::connect_and_migrate(dir.path().join("tasks.sqlite")).await.unwrap();
      let task_id = new_task(&db).await;

      // Pretend the row is old so a refreshed `updated_at` is visible.
      sqlx::query("UPDATE tasks SET updated_at = 1 WHERE id = ?")
          .bind(task_id.as_str())
          .execute(db.get_pool())
          .await
          .unwrap();

      update_task_status(UpdateTaskArgs { db: &db, task_id: &task_id, status: TaskStatus::Started }).await.unwrap();
      let (updated_at, completed_at) = read_times(&db, &task_id).await;
      assert!(updated_at > 1, "updated_at should move on a status change");
      assert_eq!(completed_at, None, "a started task is not complete");

      update_task_status(UpdateTaskArgs { db: &db, task_id: &task_id, status: TaskStatus::CompleteFailure }).await.unwrap();
      let (_, completed_at) = read_times(&db, &task_id).await;
      assert!(completed_at.is_some(), "a finished task needs a completed_at");
    });
  }

  async fn new_task(db: &TaskDbConnection) -> TaskId {
    create_task(CreateTaskArgs {
      db,
      status: TaskStatus::Pending,
      task_type: TaskType::ImageGeneration,
      model_type: None,
      provider: GenerationProvider::Fal,
      provider_job_id: Some("job-1"),
      queue_status_url: None,
      queue_response_url: None,
      prompt_token: None,
      frontend_caller: None,
      frontend_subscriber_id: None,
      frontend_subscriber_payload: None,
    }).await.unwrap()
  }

  async fn read_times(db: &TaskDbConnection, task_id: &TaskId) -> (i64, Option<i64>) {
    sqlx::query_as::<_, (i64, Option<i64>)>("SELECT updated_at, completed_at FROM tasks WHERE id = ?")
        .bind(task_id.as_str())
        .fetch_one(db.get_pool())
        .await
        .unwrap()
  }
}
