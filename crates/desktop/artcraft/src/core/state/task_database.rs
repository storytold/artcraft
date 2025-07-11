use crate::core::state::data_dir::app_data_root::AppDataRoot;
use errors::AnyhowResult;
use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode};
use sqlx::{Pool, Sqlite, SqlitePool};

pub struct TaskDatabase {
  pool: Pool<Sqlite>,
}

impl TaskDatabase {
  pub async fn connect(root: &AppDataRoot) -> AnyhowResult<Self> {
    let connection_options = SqliteConnectOptions::new()
        .filename(root.state_dir().get_tasks_sqlite_database_path())
        .create_if_missing(true)
        .journal_mode(SqliteJournalMode::Wal);

    let pool = SqlitePool::connect_with(connection_options).await?;

    // Run migrations regardless of whether the database is new, SQLx will track which migrations 
    // have been run.
    // The migrations text get compiled into the binary, so no worries about build inclusion.
    // Since the task database is being treated as ephemeral, we can always run migrations without 
    // worrying about previous state if we simply blow away old versions of the schema.
    sqlx::migrate!("../../../_sql/artcraft_migrations").run(&pool).await?;
    
    Ok(Self { pool })
  }
  
  pub fn get_pool(&self) -> &Pool<Sqlite> {
    &self.pool
  }
}