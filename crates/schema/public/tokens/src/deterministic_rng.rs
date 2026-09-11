use std::sync::{Arc, LockResult, RwLock, RwLockWriteGuard};

use once_cell::sync::Lazy;
use rand::rngs::StdRng;
use rand::SeedableRng;

// FIXME(bt,2023-12-14): Is this threadsafe? Looks like it should be fine.
/// Only use this in tests (and dev seed tools), never in production!
#[derive(Clone)]
pub struct DeterministicRng {
  rng : Arc<RwLock<StdRng>>
}

impl DeterministicRng {
  pub fn get_instance() -> LockResult<RwLockWriteGuard<'static, DeterministicRng>> {
    static DETERMINISTIC_RNG : Lazy<Arc<RwLock<DeterministicRng>>> = Lazy::new(|| {
      Arc::new(RwLock::new(DeterministicRng::new()))
    });

    DETERMINISTIC_RNG.write()
  }

  fn new() -> Self {
    Self {
      rng: Arc::new(RwLock::new(StdRng::seed_from_u64(0)))
    }
  }

  /// Reset the deterministic RNG's seed.
  pub fn reset_rng(&self, state: u64) {
    match self.rng.write() {
      Err(err) => panic!("test panic due to rng failure {:?}", err),
      Ok(mut lock) => {
        *lock = StdRng::seed_from_u64(state);
      }
    }
  }

  /// Grab the deterministic RNG
  pub fn get_rng(&self) -> LockResult<RwLockWriteGuard<StdRng>>{
    self.rng.write()
  }
}
