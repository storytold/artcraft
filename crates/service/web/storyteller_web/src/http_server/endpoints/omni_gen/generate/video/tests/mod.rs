//! Database fixture tests for the omni_gen video generate endpoint.
//!
//! These are DATABASE TESTS: they connect to a guarded MySQL test database
//! (see the `mysql_testing` crate — never production, never the local dev
//! database) and drive the real handler with dummy Actix HTTP requests.
//!
//! They RUN BY DEFAULT under `cargo test` and from the IDE. On machines or
//! CI without a local MySQL, skip them with:
//!
//! ```bash
//! SQLX_OFFLINE=true cargo test -p storyteller-web --features skip_database_tests
//! ```
//!
//! Requirements: a local MySQL with an `artcraft_test` database reachable via
//! `ARTCRAFT_TEST_DATABASE_URL` (default
//! `mysql://root:@localhost:3306/artcraft_test`). Tests self-serialize via
//! `mysql_testing::serial`, so `--test-threads=1` is not required.

pub mod support;

mod seedance_2p0_tests;
mod seedance_2p5_tests;
