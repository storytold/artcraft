
/// A trait implemented by all public paths.
pub trait PublicPath {
  fn is_public(&self) -> bool {
    true
  }
}
