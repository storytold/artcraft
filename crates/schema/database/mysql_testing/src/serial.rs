//! Database tests share one schema, so they must not interleave.
//!
//! Every database test's FIRST statement should be:
//!
//! ```ignore
//! let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
//! ```
//!
//! This serializes database tests within one test binary regardless of
//! `--test-threads`, so a forgotten `--test-threads=1` can't cause flaky
//! cross-test interference.

use std::sync::OnceLock;

use tokio::sync::{Mutex, MutexGuard};

static SERIAL_TEST_LOCK: OnceLock<Mutex<()>> = OnceLock::new();

/// Hold the returned guard for the duration of the test.
pub async fn acquire_serial_test_lock() -> MutexGuard<'static, ()> {
  SERIAL_TEST_LOCK.get_or_init(|| Mutex::new(())).lock().await
}
