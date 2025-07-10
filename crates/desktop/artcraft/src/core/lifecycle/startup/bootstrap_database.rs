use errors::AnyhowResult;
use sqlx::sqlite::SqliteConnectOptions;
use tauri::{AppHandle, Manager};

pub async fn bootstrap_database(app_handle: &AppHandle) -> AnyhowResult<()> {

  let app_dir = app_handle
      .path()
      .app_data_dir()?;

  // Ensure the app directory exists
  std::fs::create_dir_all(&app_dir)?;

  let db_path = app_dir.join("database.db");

  // why?
  // Set the DATABASE_URL environment variable to point to this SQLite file
  //env::set_var("DATABASE_URL", format!("sqlite://{}", db_path.display()));

  let connection_options = SqliteConnectOptions::new()
      .filename(&db_path)
      .create_if_missing(true)
      .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal);

  Ok(())
}
