
use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode};
use sqlx::SqlitePool;

pub fn main() {
  println!("cargo:rustc-env=DATABASE_URL=sqlite:/tmp/tasks.sqlite");

  //  // From: https://github.com/launchbadge/sqlx/issues/121#issuecomment-1913373602
  //  // Create a new temporary file. We need to `.keep()` it so that it isn't
  //  // deleted when it goes out of scope at the end of this function.
  //  let (_, tempfile) = tempfile::NamedTempFile::new().unwrap().keep().unwrap();
  //  let database_path = tempfile.as_path().to_str().unwrap();

  //  let schema_file = "../schema.sql";

  //  // Ensure that the build script is rerun if schema.sql changes
  //  println!("cargo:rerun-if-changed={schema_file}");

  //  // Execute SQL commands from schema.sql on the temporary database
  //  //rusqlite::Connection::open(database_path)
  //  //    .unwrap()
  //  //    .execute_batch(&std::fs::read_to_string(schema_file).unwrap())
  //  //    .unwrap();

  //  //let connection_options = SqliteConnectOptions::new()
  //  //    .filename(schema_file)
  //  //    .create_if_missing(true)
  //  //    .journal_mode(SqliteJournalMode::Wal);

  //  //let pool = SqlitePool::connect_lazy_with(connection_options);

  //  //// Run migrations regardless of whether the database is new, SQLx will track which migrations
  //  //// have been run.
  //  //// The migrations text get compiled into the binary, so no worries about build inclusion.
  //  //// Since the task database is being treated as ephemeral, we can always run migrations without
  //  //// worrying about previous state if we simply blow away old versions of the schema.
  //  //sqlx::migrate!("../../../../_sql/artcraft_migrations").

  //  // Prepare the DATABASE_URL in the format that sqlx expects for SQLite
  //  println!("cargo:rustc-env=DATABASE_URL=sqlite:{database_path}");
}