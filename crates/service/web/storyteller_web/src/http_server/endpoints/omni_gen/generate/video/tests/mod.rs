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
//! `mysql://root:@localhost:3306/artcraft_test`), plus `ffmpeg`/`ffprobe` on
//! PATH (the stub CDN generates real fixture videos for the input-duration
//! billing tests, and the endpoint probes them).
//!
//! These tests run in PARALLEL: every test creates its own users, wallets,
//! and media rows, schema setup is single-flighted via a MySQL named lock,
//! and the stub Kinovi server is one process-wide instance. A test may only
//! opt out of isolation (mutating shared/global rows) if it takes
//! `mysql_testing::serial::acquire_serial_test_lock()` — none currently do.

pub mod support;

mod omni_api_parity_tests;
mod seedance_2p0;
mod seedance_2p5;
