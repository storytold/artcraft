# mysql_testing

Test-only MySQL harness: guarded connections to a **test** database, schema
setup from the checked-in migrations, and shared fixtures (accounts,
sessions, wallets, media files). Use it as a `dev-dependency` only.

## Safety model

Every connection goes through `guard::guard_test_database_url`, which PANICS
unless:

- the database name contains `"test"`,
- the database name is not `storyteller` or `artcraft` (the real databases),
- the host does not look like a managed/cloud database (`digitalocean`,
  `aws`, `amazonaws`, `rds`, `gcp`, `googleapis`, `cloudsql`, `azure`, ...).

Test code reads its URL from exactly one env var —
`ARTCRAFT_TEST_DATABASE_URL` — never `MYSQL_URL` or `DATABASE_URL`, so test
runs can't inherit a real database by accident. The default is
`mysql://root:@localhost:3306/artcraft_test`.

## One-time local setup

```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS artcraft_test;"
```

The harness creates the database itself when the connecting user has the
privilege, applies all `_database/sql/migrations/*/up.sql` in order (tracked
in `mysql_testing_applied_migrations`, so repeat runs are fast), and seeds
`user_roles`. If the schema ever wedges: `DROP DATABASE artcraft_test;` and
rerun.

## Writing a database test

Database tests run by default; mark them with the `skip_database_tests`
off switch so database-less machines/CI can exclude them, and take the
serial lock first — they share one schema:

```rust
#[tokio::test]
#[cfg_attr(feature = "skip_database_tests", ignore)]
async fn my_database_test() {
  let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
  let pool = mysql_testing::pool::create_test_pool().await;

  let user = mysql_testing::fixtures::users::create_test_user(&pool).await.unwrap();
  mysql_testing::fixtures::wallets::fund_wallet_banked(&pool, &user.user_token, 10_000)
    .await
    .unwrap();
  // ...
}
```

Skip them (machines/CI without MySQL) with:

```bash
SQLX_OFFLINE=true cargo test -p storyteller-web --features skip_database_tests
```

The first end-to-end consumers are the omni_gen video pricing tests in
`crates/service/web/storyteller_web/src/http_server/endpoints/omni_gen/generate/video/tests/`,
which drive the real generate handler with dummy Actix requests, stub the
provider with an in-process HTTP server, and assert the exact credits
debited from the wallet.
