//! Materializes the full schema into the test database by replaying the
//! checked-in diesel migrations (`_database/sql/migrations/*/up.sql`) in
//! lexical (== chronological) order, then seeding the system roles.
//!
//! Applied migrations are recorded in `mysql_testing_applied_migrations`, so
//! repeat test runs only apply new migrations. If a replay ever wedges the
//! schema, `DROP DATABASE artcraft_test;` and rerun — the harness recreates
//! everything from scratch.

use std::path::{Path, PathBuf};

use log::info;
use sqlx::MySqlPool;

const MIGRATIONS_TABLE_DDL: &str = "
CREATE TABLE IF NOT EXISTS mysql_testing_applied_migrations (
  name VARCHAR(255) NOT NULL PRIMARY KEY,
  applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin
";

/// Bring the test database schema up to date and seed required system rows.
///
/// Single-flighted via a MySQL named lock, so parallel tests (and parallel
/// test processes) can all call this concurrently: one caller applies any
/// pending migrations while the rest wait, then everyone proceeds.
pub async fn ensure_schema(pool: &MySqlPool) {
  let mut lock_connection = pool.acquire().await.expect("acquire for schema lock");
  let locked: i64 = sqlx::query_scalar("SELECT GET_LOCK('mysql_testing_schema', 120)")
    .fetch_one(&mut *lock_connection)
    .await
    .expect("take schema lock");
  assert_eq!(locked, 1, "timed out waiting for the schema lock");

  apply_schema(pool).await;

  sqlx::query("SELECT RELEASE_LOCK('mysql_testing_schema')")
    .execute(&mut *lock_connection)
    .await
    .expect("release schema lock");
}

async fn apply_schema(pool: &MySqlPool) {
  sqlx::query(MIGRATIONS_TABLE_DDL)
    .execute(pool)
    .await
    .expect("create mysql_testing_applied_migrations table");

  let applied: Vec<String> =
    sqlx::query_scalar("SELECT name FROM mysql_testing_applied_migrations")
      .fetch_all(pool)
      .await
      .expect("read applied migrations");

  let migrations_dir = repo_root().join("_database/sql/migrations");
  let mut migration_dirs: Vec<PathBuf> = std::fs::read_dir(&migrations_dir)
    .unwrap_or_else(|err| panic!("read migrations dir {migrations_dir:?}: {err}"))
    .filter_map(|entry| entry.ok())
    .map(|entry| entry.path())
    .filter(|path| path.is_dir())
    .collect();
  migration_dirs.sort();

  let mut applied_count = 0;
  for migration_dir in &migration_dirs {
    let name = migration_dir
      .file_name()
      .and_then(|n| n.to_str())
      .expect("migration dir name")
      .to_string();

    if applied.iter().any(|a| a == &name) {
      continue;
    }

    let up_sql_path = migration_dir.join("up.sql");
    if !up_sql_path.exists() {
      continue;
    }

    apply_sql_file(pool, &up_sql_path)
      .await
      .unwrap_or_else(|err| panic!("migration {name} failed: {err}"));

    sqlx::query("INSERT INTO mysql_testing_applied_migrations (name) VALUES (?)")
      .bind(&name)
      .execute(pool)
      .await
      .expect("record applied migration");
    applied_count += 1;
  }

  if applied_count > 0 {
    info!("Applied {applied_count} migrations to the test database");
  }

  seed_system_roles(pool).await;
}

/// The `users` table references `user_roles` rows; seed them once.
async fn seed_system_roles(pool: &MySqlPool) {
  let role_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM user_roles")
    .fetch_one(pool)
    .await
    .expect("count user_roles");

  if role_count > 0 {
    return;
  }

  let seed_path = repo_root().join("_database/sql/seed/sql/system_roles.sql");
  apply_sql_file(pool, &seed_path)
    .await
    .unwrap_or_else(|err| panic!("seeding system roles failed: {err}"));
  info!("Seeded system user_roles");
}

/// Execute a file of `;`-separated SQL statements one at a time.
/// (sqlx won't run multi-statement strings; the checked-in migrations contain
/// no stored procedures or DELIMITER blocks, so naive splitting is safe.)
async fn apply_sql_file(pool: &MySqlPool, path: &Path) -> Result<(), sqlx::Error> {
  let sql = std::fs::read_to_string(path)
    .unwrap_or_else(|err| panic!("read {path:?}: {err}"));

  for statement in split_sql_statements(&sql) {
    sqlx::query(&statement).execute(pool).await.map_err(|err| {
      log::error!("Statement from {path:?} failed:\n{statement}\nerror: {err}");
      err
    })?;
  }
  Ok(())
}

/// Split on `;`, dropping `--` line comments and empty statements.
fn split_sql_statements(sql: &str) -> Vec<String> {
  let without_line_comments: String = sql
    .lines()
    .filter(|line| !line.trim_start().starts_with("--"))
    .collect::<Vec<_>>()
    .join("\n");

  without_line_comments
    .split(';')
    .map(|statement| statement.trim())
    .filter(|statement| !statement.is_empty())
    .map(|statement| statement.to_string())
    .collect()
}

/// The repository root, from this crate's location on disk.
fn repo_root() -> PathBuf {
  // crates/schema/database/mysql_testing → repo root is four levels up.
  Path::new(env!("CARGO_MANIFEST_DIR"))
    .ancestors()
    .nth(4)
    .expect("repo root")
    .to_path_buf()
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn repo_root_contains_migrations() {
    assert!(repo_root().join("_database/sql/migrations").is_dir());
    assert!(repo_root().join("_database/sql/seed/sql/system_roles.sql").is_file());
  }

  #[test]
  fn splits_statements_and_strips_comments() {
    let sql = "-- comment\nCREATE TABLE a (id INT);\n\nINSERT INTO a VALUES (1);\n";
    let statements = split_sql_statements(sql);
    assert_eq!(statements.len(), 2);
    assert!(statements[0].starts_with("CREATE TABLE a"));
    assert!(statements[1].starts_with("INSERT INTO a"));
  }

  #[test]
  fn empty_and_comment_only_input_yields_no_statements() {
    assert!(split_sql_statements("").is_empty());
    assert!(split_sql_statements("-- just a comment\n").is_empty());
  }
}
