/// ID for an async operation returned by the World Labs API.
#[derive(Clone, Debug)]
pub struct OperationId(pub String);

impl OperationId {
  pub fn as_str(&self) -> &str {
    &self.0
  }
}
