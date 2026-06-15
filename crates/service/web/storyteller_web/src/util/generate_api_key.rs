use rand::Rng;

use artcraft_api_keys::ArtcraftApiKey;

/// All Artcraft API keys begin with this prefix. It counts toward the total key length.
///
/// The underscores in this literal are the ONLY underscores permitted in a key — the random
/// suffix is pure Crockford-lowercase alphanumeric. (Well-known keys do this too: Stripe uses
/// `sk_live_<random>`, GitHub `ghp_<random>`, etc. — a readable prefix plus a long random body.)
const API_KEY_PREFIX: &str = "artcraft_api_";

/// Crockford base32 lowercase alphabet — 32 symbols, deliberately excluding the ambiguous
/// `i`, `l`, `o`, `u`. Every symbol is alphanumeric, so keys never contain `.`, `+`, `/`, `_`,
/// or any other punctuation in the random body. Each symbol carries log2(32) = 5 bits.
///
/// NB: Unlike Stripe/GitHub keys (which use a full base-36 `0-9a-z` alphabet), ours is Crockford
/// so the body is unambiguous to read/transcribe.
const CROCKFORD_LOWERCASE_CHARSET: &[u8] = b"0123456789abcdefghjkmnpqrstvwxyz";

/// Number of random Crockford characters in the entropy suffix.
///
/// 40 symbols * 5 bits = **200 bits** of entropy — far above the ~128-bit cryptographic-security
/// floor, and ahead of a typical Stripe secret key (~24 base-36 chars ≈ 124 bits). The total key
/// length is therefore `API_KEY_PREFIX.len() + 40` = 53 characters.
const ENTROPY_CHAR_COUNT: usize = 40;

/// Generate a cryptographically-secure Artcraft API key, e.g.
/// `artcraft_api_3k7q9w0xv2hs5n8m4d6r1t...` (40 Crockford chars after the prefix).
///
/// Infallible: it draws from the thread-local CSPRNG (`rand::rng()`, a ChaCha-based, OS-seeded
/// generator), which never fails.
///
/// The full secret lives inside the returned [`ArtcraftApiKey`]; use `as_str()` to obtain it for
/// storage (`Debug`/`Display` deliberately redact it).
pub fn generate_api_key() -> ArtcraftApiKey {
  let mut rng = rand::rng();

  let mut key = String::with_capacity(API_KEY_PREFIX.len() + ENTROPY_CHAR_COUNT);
  key.push_str(API_KEY_PREFIX);

  for _ in 0..ENTROPY_CHAR_COUNT {
    let index = rng.random_range(0..CROCKFORD_LOWERCASE_CHARSET.len());
    key.push(CROCKFORD_LOWERCASE_CHARSET[index] as char);
  }

  ArtcraftApiKey(key)
}

#[cfg(test)]
mod tests {
  use std::collections::HashSet;

  use super::*;

  #[test]
  fn starts_with_prefix() {
    assert!(generate_api_key().as_str_be_careful().starts_with("artcraft_api_"));
    assert!(generate_api_key().as_str_be_careful().starts_with(API_KEY_PREFIX));
  }

  #[test]
  fn has_expected_total_length() {
    assert_eq!(generate_api_key().as_str_be_careful().len(), API_KEY_PREFIX.len() + ENTROPY_CHAR_COUNT);
  }

  #[test]
  fn entropy_suffix_is_crockford_lowercase() {
    let key = generate_api_key();
    let suffix = key.as_str_be_careful().strip_prefix(API_KEY_PREFIX).expect("key must start with the prefix");

    assert_eq!(suffix.len(), ENTROPY_CHAR_COUNT);
    for byte in suffix.bytes() {
      assert!(
        CROCKFORD_LOWERCASE_CHARSET.contains(&byte),
        "unexpected character {:?} in entropy suffix",
        byte as char,
      );
    }
    // Crockford excludes the ambiguous i, l, o, u.
    assert!(!suffix.contains(['i', 'l', 'o', 'u']));
  }

  #[test]
  fn forbidden_characters_are_absent() {
    let key = generate_api_key();
    for forbidden in ['.', '+', '/'] {
      assert!(!key.as_str_be_careful().contains(forbidden), "key must not contain {:?}", forbidden);
    }
  }

  #[test]
  fn underscores_only_appear_in_the_prefix() {
    let key = generate_api_key();
    let suffix = key.as_str_be_careful().strip_prefix(API_KEY_PREFIX).expect("key must start with the prefix");
    assert!(!suffix.contains('_'), "the random body must not contain underscores");
  }

  #[test]
  fn entropy_suffix_is_alphanumeric() {
    let key = generate_api_key();
    let suffix = key.as_str_be_careful().strip_prefix(API_KEY_PREFIX).expect("key must start with the prefix");
    assert!(suffix.chars().all(|c| c.is_ascii_alphanumeric()));
  }

  #[test]
  fn entropy_is_cryptographically_sufficient() {
    // 32-symbol alphabet => 5 bits per character. Require a comfortable margin over 128 bits.
    let bits = ENTROPY_CHAR_COUNT * 5;
    assert!(bits >= 128, "insufficient entropy: {bits} bits");
  }

  #[test]
  fn keys_are_unique() {
    let mut seen = HashSet::new();
    for _ in 0..1000 {
      assert!(seen.insert(generate_api_key()), "generated a duplicate key");
    }
  }
}
