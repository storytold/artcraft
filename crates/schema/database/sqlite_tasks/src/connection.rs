use errors::AnyhowResult;
use sqlx::migrate::MigrateError;
use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode};
use sqlx::{Pool, Sqlite, SqlitePool};
use std::path::Path;

#[derive(Clone)]
pub struct TaskDbConnection {
  pool: Pool<Sqlite>,
}

impl TaskDbConnection {
  pub async fn connect_and_migrate<P: AsRef<Path>>(database_file: P) -> AnyhowResult<Self> {
    let pool = run_migrations(database_file).await?;

    Ok(Self { pool })
  }

  pub fn get_pool(&self) -> &Pool<Sqlite> {
    &self.pool
  }
}

async fn run_migrations<P: AsRef<Path>>(database_file: P) -> Result<SqlitePool, MigrateError> {
  let connection_options = SqliteConnectOptions::new().filename(database_file).create_if_missing(true).journal_mode(SqliteJournalMode::Wal);

  let pool = SqlitePool::connect_with(connection_options).await?;

  // Run migrations regardless of whether the database is new, SQLx will track which migrations
  // have been run.
  // The migrations text get compiled into the binary, so no worries about build inclusion.
  // A startup error must never erase pending jobs or task history. In particular,
  // lock errors and migration checksum mismatches can be recovered without a reset.
  if let Err(err) = sqlx::migrate!("../../../../_database/sql/artcraft_migrations").run(&pool).await {
    // Wait for SQLite handles to close before returning, including on Windows.
    pool.close().await;
    return Err(err);
  }

  Ok(pool)
}
