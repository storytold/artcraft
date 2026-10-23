use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_status::TaskStatus;
use sqlx::Row;
use sqlite_tasks::connection::TaskDbConnection;
use sqlite_tasks::queries::nuke_all_tasks::nuke_all_tasks;
use sqlite_tasks::queries::update_successful_task_status_with_metadata::{update_successful_task_status_with_metadata, UpdateSuccessfulTaskArgs};
use sqlite_tasks::queries::update_successful_task_status_with_metadata_by_provider::{update_successful_task_status_with_metadata_by_provider, UpdateSuccessfulTaskByProviderArgs};
use sqlite_tasks::queries::update_task_status::{update_task_status, UpdateTaskArgs};
use sqlite_tasks::queries::update_task_status_with_rich_failure::{update_task_status_with_rich_failure, UpdateTaskWithRichFailureArgs};
use tempfile::tempdir;
use tokens::tokens::sqlite::tasks::TaskId;

#[tokio::test]
async fn cancellation_wins_over_in_flight_success_and_failure() {
  let dir = tempdir().unwrap();
  let db = TaskDbConnection::connect_and_migrate(dir.path().join("tasks.sqlite")).await.unwrap();
  let id = insert(&db, "artcraft", "job-1").await;
  assert!(nuke_all_tasks(&db).await.unwrap());
  let cancelled = snapshot(&db, &id).await;
  assert_eq!(cancelled.0, "cancelled_by_user");
  assert!(cancelled.1 > 1);
  assert_eq!(cancelled.2, Some(cancelled.1));

  assert!(!complete(&db, &id).await);
  assert!(!update_task_status(UpdateTaskArgs { db: &db, task_id: &id, status: TaskStatus::Started }).await.unwrap());
  assert!(!update_task_status_with_rich_failure(UpdateTaskWithRichFailureArgs { db: &db, task_id: &id, status: TaskStatus::CompleteFailure, maybe_failure_type: None, maybe_failure_message: Some("late failure") }).await.unwrap());
  assert!(!complete_by_provider(&db, GenerationProvider::Artcraft, "job-1").await);
  assert!(!nuke_all_tasks(&db).await.unwrap());
  assert_eq!(snapshot(&db, &id).await, cancelled);
  let row = sqlx::query("SELECT on_failure_message, on_complete_primary_media_file_cdn_url FROM tasks WHERE id = ?").bind(id.as_str()).fetch_one(db.get_pool()).await.unwrap();
  assert!(row.get::<Option<String>, _>(0).is_none());
  assert!(row.get::<Option<String>, _>(1).is_none());
  db.get_pool().close().await;
}

#[tokio::test]
async fn successful_and_failed_transitions_record_stable_timestamps() {
  let dir = tempdir().unwrap();
  let db = TaskDbConnection::connect_and_migrate(dir.path().join("tasks.sqlite")).await.unwrap();
  for terminal in [TaskStatus::CompleteSuccess, TaskStatus::CompleteFailure, TaskStatus::Dead, TaskStatus::CancelledByUser, TaskStatus::CancelledByProvider, TaskStatus::CancelledByUs] {
    let id = insert(&db, "artcraft", terminal.to_str()).await;
    assert!(update_task_status(UpdateTaskArgs { db: &db, task_id: &id, status: TaskStatus::Started }).await.unwrap());
    let started = snapshot(&db, &id).await;
    assert!(started.1 > 1);
    assert_eq!(started.2, None);
    assert!(update_task_status(UpdateTaskArgs { db: &db, task_id: &id, status: terminal }).await.unwrap());
    let finished = snapshot(&db, &id).await;
    assert_eq!(finished.0, terminal.to_str());
    assert_eq!(finished.2, Some(finished.1));
    assert!(!complete(&db, &id).await);
    assert!(!update_task_status(UpdateTaskArgs { db: &db, task_id: &id, status: terminal }).await.unwrap());
    assert_eq!(snapshot(&db, &id).await, finished);
  }
  db.get_pool().close().await;
}

#[tokio::test]
async fn retryable_failures_can_complete_and_metadata_is_written_once() {
  let dir = tempdir().unwrap();
  let db = TaskDbConnection::connect_and_migrate(dir.path().join("tasks.sqlite")).await.unwrap();
  let id = insert(&db, "artcraft", "retry").await;
  assert!(update_task_status_with_rich_failure(UpdateTaskWithRichFailureArgs { db: &db, task_id: &id, status: TaskStatus::AttemptFailed, maybe_failure_type: None, maybe_failure_message: Some("temporary failure") }).await.unwrap());
  assert_eq!(snapshot(&db, &id).await.2, None);
  assert!(complete(&db, &id).await);
  let finished = snapshot(&db, &id).await;
  assert_eq!(finished.0, "complete_success");
  assert_eq!(finished.2, Some(finished.1));
  assert!(!complete_by_provider(&db, GenerationProvider::Artcraft, "retry").await);
  let url: String = sqlx::query_scalar("SELECT on_complete_primary_media_file_cdn_url FROM tasks WHERE id = ?").bind(id.as_str()).fetch_one(db.get_pool()).await.unwrap();
  assert_eq!(url, "https://example.invalid/original.png");
  db.get_pool().close().await;
}

#[tokio::test]
async fn provider_ids_are_scoped_and_provider_updates_do_not_cross_providers() {
  let dir = tempdir().unwrap();
  let db = TaskDbConnection::connect_and_migrate(dir.path().join("tasks.sqlite")).await.unwrap();
  let artcraft = insert(&db, "artcraft", "shared-job-id").await;
  let fal = insert(&db, "fal", "shared-job-id").await;
  let duplicate = sqlx::query("INSERT INTO tasks (id, task_status, task_type, provider, provider_job_id) VALUES ('duplicate', 'pending', 'image_generation', 'fal', 'shared-job-id')").execute(db.get_pool()).await;
  assert!(duplicate.is_err());
  assert!(complete_by_provider(&db, GenerationProvider::Fal, "shared-job-id").await);
  assert_eq!(snapshot(&db, &artcraft).await.0, "pending");
  assert_eq!(snapshot(&db, &fal).await.0, "complete_success");
  assert!(snapshot(&db, &fal).await.2.is_some());
  db.get_pool().close().await;
}

#[tokio::test]
async fn legacy_jobs_with_unknown_provider_remain_unique() {
  let dir = tempdir().unwrap();
  let db = TaskDbConnection::connect_and_migrate(dir.path().join("tasks.sqlite")).await.unwrap();
  sqlx::query("INSERT INTO tasks (id, task_status, task_type, provider_job_id) VALUES ('legacy-1', 'pending', 'image_generation', 'job')").execute(db.get_pool()).await.unwrap();
  assert!(sqlx::query("INSERT INTO tasks (id, task_status, task_type, provider_job_id) VALUES ('legacy-2', 'pending', 'image_generation', 'job')").execute(db.get_pool()).await.is_err());
  db.get_pool().close().await;
}

#[tokio::test]
async fn upgrading_existing_storage_keeps_history_and_installs_guards() {
  let dir = tempdir().unwrap();
  let path = dir.path().join("tasks.sqlite");
  let pool = sqlx::SqlitePool::connect_with(sqlx::sqlite::SqliteConnectOptions::new().filename(&path).create_if_missing(true)).await.unwrap();
  let old_migration = sqlx::migrate::Migration::new(20250708000000, "create tasks table".into(), sqlx::migrate::MigrationType::Simple, include_str!("../../../../../_database/sql/artcraft_migrations/20250708000000_create_tasks_table.sql").into());
  let mut migrator = sqlx::migrate::Migrator::DEFAULT;
  migrator.migrations = vec![old_migration].into();
  migrator.run(&pool).await.unwrap();
  sqlx::query("INSERT INTO tasks (id, task_status, task_type) VALUES ('old-task', 'cancelled_by_user', 'image_generation')").execute(&pool).await.unwrap();
  pool.close().await;

  let db = TaskDbConnection::connect_and_migrate(&path).await.unwrap();
  let id = TaskId::new_from_str("old-task");
  assert_eq!(snapshot(&db, &id).await.0, "cancelled_by_user");
  assert!(!complete(&db, &id).await);
  // Dismissal still works on terminal rows; only status mutations are guarded.
  assert_eq!(sqlx::query("UPDATE tasks SET is_dismissed_by_user = 1 WHERE id = 'old-task'").execute(db.get_pool()).await.unwrap().rows_affected(), 1);
  db.get_pool().close().await;
}

async fn insert(db: &TaskDbConnection, provider: &str, job: &str) -> TaskId {
  let id = TaskId::generate();
  sqlx::query("INSERT INTO tasks (id, task_status, task_type, provider, provider_job_id, updated_at) VALUES (?, 'pending', 'image_generation', ?, ?, 1)").bind(id.as_str()).bind(provider).bind(job).execute(db.get_pool()).await.unwrap();
  id
}

async fn snapshot(db: &TaskDbConnection, id: &TaskId) -> (String, i64, Option<i64>) {
  sqlx::query_as("SELECT task_status, updated_at, completed_at FROM tasks WHERE id = ?").bind(id.as_str()).fetch_one(db.get_pool()).await.unwrap()
}

async fn complete(db: &TaskDbConnection, id: &TaskId) -> bool {
  update_successful_task_status_with_metadata(UpdateSuccessfulTaskArgs { db, task_id: id, maybe_batch_token: None, maybe_primary_media_file_token: None, maybe_primary_media_file_class: None, maybe_primary_media_file_cdn_url: Some("https://example.invalid/original.png"), maybe_primary_media_file_thumbnail_url_template: None }).await.unwrap()
}

async fn complete_by_provider(db: &TaskDbConnection, provider: GenerationProvider, job: &str) -> bool {
  update_successful_task_status_with_metadata_by_provider(UpdateSuccessfulTaskByProviderArgs { db, provider, provider_job_id: job, maybe_batch_token: None, maybe_primary_media_file_token: None, maybe_primary_media_file_class: None, maybe_primary_media_file_cdn_url: Some("https://example.invalid/replacement.png"), maybe_primary_media_file_thumbnail_url_template: None }).await.unwrap()
}
