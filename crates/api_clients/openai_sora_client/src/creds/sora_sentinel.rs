
/// Sora Sentinel tokens can be generated without cookies or JWTs, and are needed for some API calls.
#[derive(Clone)]
#[deprecated(note="use SoraSentinelToken instead")]
pub struct SoraSentinel {
  sentinel: String,

  // TODO(bt,2025-04-23): We may want to store the user agent alongside the sentinel
  //  as that appears to be important for the validity of the sentinel token.
}

impl SoraSentinel {
  pub fn new(sentinel: String) -> Self {
    SoraSentinel { sentinel }
  }

  #[deprecated(note="use SoraSentinelToken instead")]
  pub fn get_sentinel(&self) -> &str {
    &self.sentinel
  }

  #[deprecated(note="use SoraSentinelToken instead")]
  pub fn as_str(&self) -> &str {
    &self.sentinel
  }

  #[deprecated(note="use SoraSentinelToken instead")]
  pub fn as_bytes(&self) -> &[u8] {
    self.sentinel.as_bytes()
  }
}
