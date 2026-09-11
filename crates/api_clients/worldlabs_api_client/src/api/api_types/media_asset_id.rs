/// ID for a media asset in the World Labs API.
#[derive(Clone, Debug)]
pub struct MediaAssetId(pub String);

impl MediaAssetId {
  pub fn as_str(&self) -> &str {
    &self.0
  }
}
