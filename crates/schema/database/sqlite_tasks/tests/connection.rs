use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode};
use sqlx::SqlitePool;
use sqlite_tasks::connection::TaskDbConnection;
use tempfile::tempdir;

#[tokio::test]
async fn creates_and_reopens_task_storage() {
  let dir = tempdir().unwrap();
  let path = dir.path().join("tasks.sqlite");
  let db = TaskDbConnection::connect_and_migrate(&path).await.unwrap();
  insert_task(db.get_pool()).await;
  db.get_pool().close().await;

  let reopened = TaskDbConnection::connect_and_migrate(&path).await.unwrap();
  assert_task_survives(reopened.get_pool()).await;
  reopened.get_pool().close().await;
}

#[tokio::test]
async fn checksum_failure_preserves_history_and_can_be_retried() {
  let dir = tempdir().unwrap();
  let path = dir.path().join("tasks.sqlite");
  let db = TaskDbConnection::connect_and_migrate(&path).await.unwrap();
  insert_task(db.get_pool()).await;
  let (version, checksum): (i64, Vec<u8>) = sqlx::query_as("SELECT version, checksum FROM _sqlx_migrations ORDER BY version LIMIT 1").fetch_one(db.get_pool()).await.unwrap();
  sqlx::query("UPDATE _sqlx_migrations SET checksum = X'00' WHERE version = ?").bind(version).execute(db.get_pool()).await.unwrap();
  db.get_pool().close().await;

  assert!(TaskDbConnection::connect_and_migrate(&path).await.is_err());
  let pool = SqlitePool::connect_with(SqliteConnectOptions::new().filename(&path)).await.unwrap();
  assert_task_survives(&pool).await;
  sqlx::query("UPDATE _sqlx_migrations SET checksum = ? WHERE version = ?").bind(checksum).bind(version).execute(&pool).await.unwrap();
  pool.close().await;

  let retried = TaskDbConnection::connect_and_migrate(&path).await.unwrap();
  assert_task_survives(retried.get_pool()).await;
  retried.get_pool().close().await;
}

#[tokio::test]
async fn invalid_database_is_preserved_byte_for_byte() {
  let dir = tempdir().unwrap();
  let path = dir.path().join("tasks.sqlite");
  let original = b"unrecognized database contents that must not be deleted";
  std::fs::write(&path, original).unwrap();

  assert!(TaskDbConnection::connect_and_migrate(&path).await.is_err());
  assert_eq!(std::fs::read(&path).unwrap(), original);
}

#[tokio::test]
async fn locked_database_is_preserved_while_another_connection_uses_it() {
  let dir = tempdir().unwrap();
  let path = dir.path().join("tasks.sqlite");
  let pool = SqlitePool::connect_with(SqliteConnectOptions::new().filename(&path).create_if_missing(true).journal_mode(SqliteJournalMode::Wal)).await.unwrap();
  sqlx::query("CREATE TABLE retained_history (value TEXT)").execute(&pool).await.unwrap();
  sqlx::query("INSERT INTO retained_history VALUES ('keep me')").execute(&pool).await.unwrap();
  let mut owner = pool.acquire().await.unwrap();
  sqlx::query("BEGIN EXCLUSIVE").execute(&mut *owner).await.unwrap();

  assert!(TaskDbConnection::connect_and_migrate(&path).await.is_err());
  sqlx::query("ROLLBACK").execute(&mut *owner).await.unwrap();
  drop(owner);
  pool.close().await;

  let reopened = TaskDbConnection::connect_and_migrate(&path).await.unwrap();
  let retained: String = sqlx::query_scalar("SELECT value FROM retained_history").fetch_one(reopened.get_pool()).await.unwrap();
  assert_eq!(retained, "keep me");
  reopened.get_pool().close().await;
}

async fn insert_task(pool: &SqlitePool) {
  sqlx::query("INSERT INTO tasks (id, task_status, task_type) VALUES ('test-task', 'pending', 'image_generation')").execute(pool).await.unwrap();
}

async fn assert_task_survives(pool: &SqlitePool) {
  let status: String = sqlx::query_scalar("SELECT task_status FROM tasks WHERE id = 'test-task'").fetch_one(pool).await.unwrap();
  assert_eq!(status, "pending");
}
