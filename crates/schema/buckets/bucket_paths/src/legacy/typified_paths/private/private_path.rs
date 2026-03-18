
/// A trait implemented by all private paths.
pub trait PrivatePath {
  fn is_public(&self) -> bool {
    false
  }
}
