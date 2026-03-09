use uuid::Uuid;

/// Type for "meta" World IDs (not sure what to term this).
/// These are in the first run patch request
/// These appear to be bare UUIDs.
#[derive(Clone, Debug)]
pub struct MetaWorldObjectId(pub String);

impl MetaWorldObjectId {
  pub fn generate_new() -> Self {
    let uuid = Uuid::new_v4().to_string();
    Self(uuid)
  }

  pub fn from_str(s: &str) -> Self {
    Self(s.to_string())
  }
  
  pub fn as_str(&self) -> &str {
    &self.0
  }

  pub fn to_string(&self) -> String {
    self.0.clone()
  }
}
