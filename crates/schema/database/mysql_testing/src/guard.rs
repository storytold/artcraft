//! The safety valve: refuse to touch anything that could be a real database.
//!
//! Every connection made by this crate goes through [`guard_test_database_url`]
//! first. It PANICS unless the URL names a database that is unambiguously a
//! test database on a non-production host. This makes it impossible for a
//! fixture test to wipe or bill against development or production data.

/// The ONE env var test code may read for a database URL.
/// Deliberately not `DATABASE_URL` (sqlx) or `MYSQL_CONNECTION_STRING` (the
/// server) so that test runs never inherit a real database by accident.
pub const TEST_DATABASE_URL_ENV: &str = "ARTCRAFT_TEST_DATABASE_URL";

/// Used when [`TEST_DATABASE_URL_ENV`] is unset. Still guarded.
pub const DEFAULT_TEST_DATABASE_URL: &str = "mysql://root:@localhost:3306/artcraft_test";

/// Database names that must NEVER be used, even if they somehow contained
/// "test": the production/development database names.
const FORBIDDEN_DATABASE_NAMES: [&str; 2] = ["storyteller", "artcraft"];

/// Host substrings that indicate a managed/cloud database. A test database
/// must never live on one of these.
const FORBIDDEN_HOST_SUBSTRINGS: [&str; 10] = [
  "digitalocean",
  "aws",
  "amazonaws",
  "rds",
  "gcp",
  "googleapis",
  "cloudsql",
  "azure",
  "planetscale",
  "supabase",
];

/// Panic unless `url` is a MySQL URL that names a test database on a
/// non-cloud host. Returns the parsed (host, database name) on success so
/// callers can log where they're connecting.
pub fn guard_test_database_url(url: &str) -> (String, String) {
  let (host, database) = parse_mysql_url(url).unwrap_or_else(|| {
    panic!("REFUSING to connect: could not parse a host and database name out of the test database URL");
  });

  let host_lower = host.to_lowercase();
  let database_lower = database.to_lowercase();

  for forbidden in FORBIDDEN_DATABASE_NAMES {
    assert!(
      database_lower != forbidden,
      "REFUSING to connect: {database:?} is a real database name, not a test database. \
       Tests must use a database whose name contains \"test\" (via {TEST_DATABASE_URL_ENV})."
    );
  }

  assert!(
    database_lower.contains("test"),
    "REFUSING to connect: test database name must contain \"test\" (got {database:?}). \
     Set {TEST_DATABASE_URL_ENV} to e.g. {DEFAULT_TEST_DATABASE_URL:?}."
  );

  for forbidden in FORBIDDEN_HOST_SUBSTRINGS {
    assert!(
      !host_lower.contains(forbidden),
      "REFUSING to connect: host {host:?} looks like a managed/cloud database \
       (matched {forbidden:?}). Tests must run against a local or dedicated test host."
    );
  }

  (host, database)
}

/// Extract (host, database) from a `mysql://user:pass@host:port/database?...` URL.
fn parse_mysql_url(url: &str) -> Option<(String, String)> {
  let rest = url.strip_prefix("mysql://")?;
  let rest = rest.split('?').next()?;

  // Strip credentials: everything up to the LAST '@' before the first '/'.
  let (authority, database) = rest.split_once('/')?;
  let host_and_port = match authority.rsplit_once('@') {
    Some((_credentials, host_and_port)) => host_and_port,
    None => authority,
  };

  // Strip the port. IPv6 hosts are bracketed: mysql://u@[::1]:3306/db
  let host = if let Some(bracketed) = host_and_port.strip_prefix('[') {
    bracketed.split_once(']').map(|(h, _)| h)?
  } else {
    host_and_port.split(':').next()?
  };

  if host.is_empty() || database.is_empty() {
    return None;
  }
  Some((host.to_string(), database.to_string()))
}

#[cfg(test)]
mod tests {
  use super::*;

  fn guard_panics(url: &str) -> bool {
    std::panic::catch_unwind(|| guard_test_database_url(url)).is_err()
  }

  mod accepted_urls {
    use super::*;

    #[test]
    fn local_test_databases() {
      for url in [
        "mysql://root:@localhost:3306/artcraft_test",
        "mysql://root:@127.0.0.1:3306/storyteller_test",
        "mysql://user:pass@localhost/test_fixtures",
        "mysql://user:pass@[::1]:3306/artcraft_test",
        "mysql://ci:ci@mysql:3306/artcraft_test", // docker service host
      ] {
        let (_host, database) = guard_test_database_url(url);
        assert!(database.to_lowercase().contains("test"));
      }
    }
  }

  mod rejected_urls {
    use super::*;

    #[test]
    fn production_and_development_database_names() {
      assert!(guard_panics("mysql://root:@localhost:3306/storyteller"));
      assert!(guard_panics("mysql://root:@localhost:3306/artcraft"));
      assert!(guard_panics("mysql://root:@localhost:3306/Storyteller"));
    }

    #[test]
    fn names_without_test() {
      assert!(guard_panics("mysql://root:@localhost:3306/storyteller_dev"));
      assert!(guard_panics("mysql://root:@localhost:3306/scratch"));
    }

    #[test]
    fn cloud_hosts_even_with_test_names() {
      assert!(guard_panics(
        "mysql://doadmin:x@storyteller-db-migration-mysql-do-user-1-0.d.db.ondigitalocean.com:25060/artcraft_test"
      ));
      assert!(guard_panics("mysql://u:p@db.abc123.us-east-1.rds.amazonaws.com/artcraft_test"));
      assert!(guard_panics("mysql://u:p@some-gcp-host.googleapis.com/artcraft_test"));
      assert!(guard_panics("mysql://u:p@my-db.azure.example/artcraft_test"));
    }

    #[test]
    fn unparseable_urls() {
      assert!(guard_panics("postgres://root:@localhost/artcraft_test"));
      assert!(guard_panics("mysql://localhost"));
      assert!(guard_panics(""));
    }
  }

  mod url_parsing {
    use super::*;

    #[test]
    fn parses_host_and_database() {
      assert_eq!(
        parse_mysql_url("mysql://u:p@localhost:3306/artcraft_test?ssl-mode=DISABLED"),
        Some(("localhost".to_string(), "artcraft_test".to_string())),
      );
    }

    #[test]
    fn parses_password_containing_at_sign() {
      assert_eq!(
        parse_mysql_url("mysql://u:p%40ss@h.example:3306/artcraft_test"),
        Some(("h.example".to_string(), "artcraft_test".to_string())),
      );
      assert_eq!(
        parse_mysql_url("mysql://u:p@ss@h.example:3306/artcraft_test"),
        Some(("h.example".to_string(), "artcraft_test".to_string())),
      );
    }
  }
}
