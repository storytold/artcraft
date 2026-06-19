use sha1::{Digest, Sha1};

use crate::error::Sha1HashError;

/// Lowercase Crockford base32 alphabet (excludes I, L, O, U). Matches the casing
/// used by the `tokens` crate's Crockford generators.
const CROCKFORD_LOWERCASE: &[u8] = b"0123456789abcdefghjkmnpqrstvwxyz";

/// The byte length of a SHA-1 digest.
const SHA1_DIGEST_LEN: usize = 20;

/// SHA-1 hash `bytes` and return the 20-byte digest encoded as a lowercase
/// Crockford base32 string (32 characters, no padding — 160 bits / 5).
pub fn sha1_hash_bytes_as_crockford(bytes: &[u8]) -> Result<String, Sha1HashError> {
  let mut hasher = Sha1::new();
  hasher.update(bytes);
  let digest = hasher.finalize();

  if digest.len() != SHA1_DIGEST_LEN {
    return Err(Sha1HashError::UnexpectedDigestLength(digest.len()));
  }

  Ok(encode_crockford_lower(&digest))
}

/// Encode bytes as lowercase Crockford base32, reading 5 bits at a time.
fn encode_crockford_lower(data: &[u8]) -> String {
  let mut out = String::with_capacity(data.len() * 8 / 5 + 1);
  let mut buffer: u32 = 0;
  let mut bits: u32 = 0;
  for &byte in data {
    buffer = (buffer << 8) | byte as u32;
    bits += 8;
    while bits >= 5 {
      bits -= 5;
      let index = ((buffer >> bits) & 0x1f) as usize;
      out.push(CROCKFORD_LOWERCASE[index] as char);
    }
  }
  if bits > 0 {
    let index = ((buffer << (5 - bits)) & 0x1f) as usize;
    out.push(CROCKFORD_LOWERCASE[index] as char);
  }
  out
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn empty_input_is_32_crockford_chars() {
    // SHA-1("") = da39a3ee5e6b4b0d3255bfef95601890afd80709
    let out = sha1_hash_bytes_as_crockford(&[]).unwrap();
    assert_eq!(out.len(), 32);
    assert!(out.bytes().all(|b| CROCKFORD_LOWERCASE.contains(&b)));
  }

  #[test]
  fn deterministic_and_distinct() {
    let a = sha1_hash_bytes_as_crockford(b"hello").unwrap();
    let b = sha1_hash_bytes_as_crockford(b"hello").unwrap();
    let c = sha1_hash_bytes_as_crockford(b"world").unwrap();
    assert_eq!(a, b);
    assert_ne!(a, c);
    assert_eq!(a.len(), 32);
  }

  #[test]
  fn encodes_known_bytes() {
    // 20 zero bytes → 32 '0' chars.
    assert_eq!(encode_crockford_lower(&[0u8; 20]), "0".repeat(32));
  }
}
