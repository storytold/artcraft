use concurrency::relaxed_atomic_bool::RelaxedAtomicBool;

#[derive(Clone)]
pub struct NvidiaSmiHealthCheckStatus {
  /// Occasionally the compute nodes lose the GPU.
  /// When this happens, the GPU is gone and the node needs to be restarted.
  /// (This might be a result of the so-vits-svc architecture doing weird things.)
  gpu_is_missing: RelaxedAtomicBool,
}

impl NvidiaSmiHealthCheckStatus {

  pub fn new() -> Self {
    Self {
      gpu_is_missing: RelaxedAtomicBool::new(false),
    }
  }

  /// Read
  pub fn get_gpu_is_missing(&self) -> bool {
    self.gpu_is_missing.get()
  }

  /// Write
  pub fn notify_gpu_missing(&self) {
    self.gpu_is_missing.set(true)
  }
}
