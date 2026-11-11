use errors::AnyhowResult;
use log::{error, info};
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
    {
      match run_migrations(&database_file).await {
        Ok(pool) => return Ok(Self { pool }),
        Err(err) => {
          error!("Error running SQLite migrations: {:?}", err);
        }
      }

      info!("Deleting and recreating SQLite database at {:?}", database_file.as_ref());

      if let Err(err) = std::fs::remove_file(&database_file) {
        error!("Error deleting SQLite database file: {:?}", err);
      }

      // NB: Scope change here is an attempt to drop the open file connection for Windows.
      // On Windows, we've observed that the file might still be open, preventing deletion:
      // [2025-08-08][06:42:29][sqlite_tasks::connection][INFO] Deleting and recreating SQLite
      //  database at "C:\Users\User\Artcraft\state\tasks_v2.sqlite"
      // [2025-08-08][06:42:29][sqlite_tasks::connection][ERROR] Error deleting SQLite database
      //  file: Os { code: 32, kind: Uncategorized, message: "The process cannot access the file
      //  because it is being used by another process." }
    }

    let pool = run_migrations(database_file).await?;

    Ok(Self { pool })
  }

  pub fn get_pool(&self) -> &Pool<Sqlite> {
    &self.pool
  }
}

async fn run_migrations<P: AsRef<Path>>(database_file: P) -> Result<SqlitePool, MigrateError> {
  let connection_options = SqliteConnectOptions::new()
      .filename(database_file)
      .create_if_missing(true)
      .journal_mode(SqliteJournalMode::Wal);

  let pool = SqlitePool::connect_with(connection_options).await?;

  // Run migrations regardless of whether the database is new, SQLx will track which migrations
  // have been run.
  // The migrations text get compiled into the binary, so no worries about build inclusion.
  // Since the task database is being treated as ephemeral, we can always run migrations without
  // worrying about previous state if we simply blow away old versions of the schema.
  sqlx::migrate!("../../../../_database/sql/artcraft_migrations").run(&pool).await?;

  Ok(pool)
}
