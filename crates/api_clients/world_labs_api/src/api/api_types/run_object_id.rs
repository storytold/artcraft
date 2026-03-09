/// Type for Object IDs. 
/// These are used to create inference runs and refer to the result
/// These appear to be bare UUIDs.
#[derive(Clone, Debug)]
pub struct RunObjectId(pub String);

impl RunObjectId {
  pub fn from_str(s: &str) -> Self {
    Self(s.to_string())
  }

  pub fn to_string(&self) -> String {
    self.0.clone()
  }
}