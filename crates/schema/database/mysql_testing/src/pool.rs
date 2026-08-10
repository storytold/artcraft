//! Guarded test-database connections.

use log::info;
use sqlx::mysql::MySqlPoolOptions;
use sqlx::MySqlPool;

use crate::guard::{guard_test_database_url, DEFAULT_TEST_DATABASE_URL, TEST_DATABASE_URL_ENV};
use crate::schema::ensure_schema;

/// Connect to the test database, creating it and applying the schema first.
///
/// Reads [`TEST_DATABASE_URL_ENV`]; falls back to
/// [`DEFAULT_TEST_DATABASE_URL`]. Panics (via the guard) if the URL points
/// anywhere that isn't unambiguously a test database.
pub async fn create_test_pool() -> MySqlPool {
  let url = std::env::var(TEST_DATABASE_URL_ENV)
    .unwrap_or_else(|_| DEFAULT_TEST_DATABASE_URL.to_string());

  let (host, database) = guard_test_database_url(&url);
  info!("Connecting to test database {database:?} on {host:?}");

  // Local test databases don't need TLS, and test binaries often have
  // ambiguous rustls crypto providers (which panics when sqlx negotiates
  // TLS). Disable it unless the URL explicitly configures ssl-mode.
  let url = if url.contains("ssl-mode") {
    url
  } else if url.contains('?') {
    format!("{url}&ssl-mode=DISABLED")
  } else {
    format!("{url}?ssl-mode=DISABLED")
  };

  create_database_if_missing(&url, &database).await;

  let pool = MySqlPoolOptions::new()
    .max_connections(4)
    .connect(&url)
    .await
    .unwrap_or_else(|err| {
      panic!(
        "Failed to connect to the test database ({url_env}={url:?}): {err}. \
         Is MySQL running, and does the user have access?",
        url_env = TEST_DATABASE_URL_ENV,
      )
    });

  ensure_schema(&pool).await;

  pool
}

/// `CREATE DATABASE IF NOT EXISTS` via a server-level (no database) connection.
/// Best-effort: if the user lacks the privilege but the database already
/// exists, the later pool connection succeeds anyway.
async fn create_database_if_missing(url: &str, database: &str) {
  // The database name came out of the guard, but re-validate before splicing
  // it into DDL (identifiers can't be bound as parameters).
  assert!(
    database.chars().all(|c| c.is_ascii_alphanumeric() || c == '_'),
    "test database name must be [A-Za-z0-9_]+ (got {database:?})",
  );

  let server_url = strip_database_from_url(url);
  let server_connection = MySqlPoolOptions::new()
    .max_connections(1)
    .connect(&server_url)
    .await;

  match server_connection {
    Ok(pool) => {
      let create = format!("CREATE DATABASE IF NOT EXISTS `{database}`");
      if let Err(err) = sqlx::query(&create).execute(&pool).await {
        info!("Could not CREATE DATABASE {database:?} ({err}); assuming it already exists");
      }
      pool.close().await;
    }
    Err(err) => {
      info!("Could not open server-level connection to create {database:?} ({err}); assuming it already exists");
    }
  }
}

/// `mysql://user:pass@host:port/db?params` → `mysql://user:pass@host:port`
fn strip_database_from_url(url: &str) -> String {
  match url.rfind('/') {
    // Position 7 is the end of "mysql://" — a URL with no database path.
    Some(idx) if idx > "mysql://".len() => url[..idx].to_string(),
    _ => url.to_string(),
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn strips_database_segment() {
    assert_eq!(
      strip_database_from_url("mysql://u:p@localhost:3306/artcraft_test"),
      "mysql://u:p@localhost:3306",
    );
  }

  #[test]
  fn leaves_database_free_urls_alone() {
    assert_eq!(
      strip_database_from_url("mysql://u:p@localhost:3306"),
      "mysql://u:p@localhost:3306",
    );
  }
}
