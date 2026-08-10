//! Opt-in serialization for database tests that CANNOT be data-isolated.
//!
//! Most database tests should NOT use this: create your own users, wallets,
//! and rows and run in parallel (schema setup already single-flights via a
//! MySQL named lock). Take this lock only when a test must mutate shared or
//! global state (e.g. truncating a table, changing a singleton row):
//!
//! ```ignore
//! let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
//! ```

use std::sync::OnceLock;

use tokio::sync::{Mutex, MutexGuard};

static SERIAL_TEST_LOCK: OnceLock<Mutex<()>> = OnceLock::new();

/// Hold the returned guard for the duration of the test.
pub async fn acquire_serial_test_lock() -> MutexGuard<'static, ()> {
  SERIAL_TEST_LOCK.get_or_init(|| Mutex::new(())).lock().await
}
