use serde::Serialize;

#[derive(Serialize)]
pub (super) struct LikeMediaWireRequest {
  /// The file ID
  /// Videos can be favorited before they are generated !
  pub (super) id: String,
}
