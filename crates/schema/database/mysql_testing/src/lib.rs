//! Test-only MySQL harness: guarded connections to a TEST database, schema
//! setup from the checked-in migrations, and shared fixtures (accounts,
//! sessions, wallets, media files).
//!
//! # Safety model
//!
//! Every connection is vetted by [`guard::guard_test_database_url`], which
//! panics unless the database name contains "test" (and is not a real
//! database name) and the host is not a managed/cloud database. See that
//! module for the exact rules. Tests read their URL from
//! [`guard::TEST_DATABASE_URL_ENV`] only — never `MYSQL_URL` or
//! `DATABASE_URL`.
//!
//! # Usage
//!
//! ```ignore
//! let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
//! let pool = mysql_testing::pool::create_test_pool().await;
//! let user = mysql_testing::fixtures::users::create_test_user(&pool).await.unwrap();
//! mysql_testing::fixtures::wallets::fund_wallet_banked(&pool, &user.user_token, 10_000).await.unwrap();
//! ```

pub mod fixtures;
pub mod guard;
pub mod pool;
pub mod schema;
pub mod serial;
