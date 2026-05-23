/// Opaque wrapper around a Datadog API key. `Debug` is implemented manually
/// so the secret never leaks to logs.
#[derive(Clone)]
pub struct DatadogApiKey(String);

impl DatadogApiKey {
  pub fn new(key: impl Into<String>) -> Self {
    Self(key.into())
  }

  pub fn as_str(&self) -> &str {
    &self.0
  }
}

impl std::fmt::Debug for DatadogApiKey {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    f.write_str("DatadogApiKey(***)")
  }
}
