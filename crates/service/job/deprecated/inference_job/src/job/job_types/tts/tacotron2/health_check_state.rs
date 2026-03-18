use std::sync::{Arc, RwLock};

use anyhow::anyhow;

use errors::AnyhowResult;

#[derive(Clone)]
pub struct HealthCheckState {
  inner: Arc<RwLock<InnerHealthCheckState>>,
}

struct InnerHealthCheckState {
  checked_health_at_least_once: bool,
  maybe_needs_health_check: bool,
}

impl HealthCheckState {
  pub fn new() -> Self {
    Self {
      inner: Arc::new(RwLock::new(InnerHealthCheckState {
        checked_health_at_least_once: false,
        maybe_needs_health_check: false,
      }))
    }
  }

  //pub fn mark_first_health_check_done(&self) -> AnyhowResult<()> {
  //  match self.inner.write() {
  //    Err(err) => return Err(anyhow!("lock error: {err}")),
  //    Ok(mut lock) => {
  //      lock.checked_health_at_least_once = true;
  //      Ok(())
  //    }
  //  }
  //}

  pub fn mark_maybe_needs_health_check(&self, maybe_needs_health_check: bool) -> AnyhowResult<()> {
    match self.inner.write() {
      Err(err) => Err(anyhow!("lock error: {err}")),
      Ok(mut lock) => {
        lock.maybe_needs_health_check = maybe_needs_health_check;
        if !maybe_needs_health_check {
          lock.checked_health_at_least_once = true;
        }
        Ok(())
      }
    }
  }

  pub fn needs_health_check(&self) -> AnyhowResult<bool> {
    match self.inner.read() {
      Err(err) => Err(anyhow!("lock error: {err}")),
      Ok(lock) => {
        let needs_health_check = !lock.checked_health_at_least_once || lock.maybe_needs_health_check;
        Ok(needs_health_check)
      }
    }
  }
}
