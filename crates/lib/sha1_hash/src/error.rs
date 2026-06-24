use std::fmt;

/// Errors produced while computing a SHA-1 hash.
#[derive(Debug)]
pub enum Sha1HashError {
  /// The SHA-1 digest wasn't the expected 20 bytes. This should be unreachable
  /// for a well-behaved SHA-1 implementation; it exists as a defensive guard.
  UnexpectedDigestLength(usize),
}

impl fmt::Display for Sha1HashError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

impl std::error::Error for Sha1HashError {}
