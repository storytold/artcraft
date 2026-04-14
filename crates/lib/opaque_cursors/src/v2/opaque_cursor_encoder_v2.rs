use std::io::Cursor;

use base64::alphabet::{Alphabet, URL_SAFE};
use base64::engine::{DecodePaddingMode, GeneralPurpose, GeneralPurposeConfig};
use base64::Engine;
use magic_crypt::generic_array::typenum::U256;
use magic_crypt::{MagicCrypt256, MagicCryptTrait, new_magic_crypt};

use crate::v2::opaque_cursor_error_v2::OpaqueCursorErrorV2;
use crate::v2::opaque_cursor_v2::OpaqueCursorV2;

/// Encrypts and decrypts opaque cursor payloads so that internal database
/// IDs are never leaked to the frontend.
#[derive(Clone)]
pub struct OpaqueCursorEncoderV2 {
  crypt: MagicCrypt256,
  alphabet: Alphabet,
  base64_config: GeneralPurposeConfig,
}

impl OpaqueCursorEncoderV2 {
  pub fn new(secret: &str) -> Self {
    let base64_config = GeneralPurposeConfig::new()
        .with_encode_padding(false)
        .with_decode_allow_trailing_bits(true)
        .with_decode_padding_mode(DecodePaddingMode::Indifferent);

    Self {
      crypt: new_magic_crypt!(secret, 256),
      alphabet: URL_SAFE,
      base64_config,
    }
  }

  /// Encode a last-id cursor into an opaque string.
  pub fn encode_last_id_cursor(&self, name: &str, id: u64) -> Result<String, OpaqueCursorErrorV2> {
    let cursor = OpaqueCursorV2 {
      name: Some(name.to_string()),
      last_id: Some(id),
    };
    self.encode_cursor(&cursor)
  }

  /// Encode an arbitrary cursor payload into an opaque string.
  pub fn encode_cursor(&self, cursor: &OpaqueCursorV2) -> Result<String, OpaqueCursorErrorV2> {
    let json = serde_json::to_string(cursor)?;

    let engine = GeneralPurpose::new(&self.alphabet, self.base64_config);

    let mut reader = Cursor::new(json);
    let mut writer = Vec::new();

    self.crypt.encrypt_reader_to_writer2::<U256>(&mut reader, &mut writer)?;

    Ok(engine.encode(&writer))
  }

  /// Decode an opaque cursor string and verify the name matches `expected_name`.
  pub fn decode_cursor_expecting_name(
    &self,
    expected_name: &str,
    cursor: &str,
  ) -> Result<OpaqueCursorV2, OpaqueCursorErrorV2> {
    let decoded = self.decode_cursor(cursor)?;

    match &decoded.name {
      None => Err(OpaqueCursorErrorV2::DecodedNameNotPresent),
      Some(actual) if actual != expected_name => {
        Err(OpaqueCursorErrorV2::DecodedNameMismatch {
          expected: expected_name.to_string(),
          actual: actual.clone(),
        })
      }
      _ => Ok(decoded),
    }
  }

  /// Decode an opaque cursor string back into a cursor payload.
  pub fn decode_cursor(&self, cursor: &str) -> Result<OpaqueCursorV2, OpaqueCursorErrorV2> {
    let engine = GeneralPurpose::new(&self.alphabet, self.base64_config);

    let decoded_bytes = engine.decode(cursor)?;
    let decrypted_bytes = self.crypt.decrypt_bytes_to_bytes(&decoded_bytes)?;

    let json = String::from_utf8(decrypted_bytes)?;
    let cursor = serde_json::from_str::<OpaqueCursorV2>(&json)?;

    Ok(cursor)
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  const SECRET: &str = "test_secret_key_for_opaque_cursors";

  #[test]
  fn roundtrip_last_id() {
    let encoder = OpaqueCursorEncoderV2::new(SECRET);
    let encoded = encoder.encode_last_id_cursor("test", 42).unwrap();
    let decoded = encoder.decode_cursor(&encoded).unwrap();
    assert_eq!(decoded.name, Some("test".to_string()));
    assert_eq!(decoded.last_id, Some(42));
  }

  #[test]
  fn roundtrip_none_fields() {
    let encoder = OpaqueCursorEncoderV2::new(SECRET);
    let cursor = OpaqueCursorV2 { name: None, last_id: None };
    let encoded = encoder.encode_cursor(&cursor).unwrap();
    let decoded = encoder.decode_cursor(&encoded).unwrap();
    assert_eq!(decoded.name, None);
    assert_eq!(decoded.last_id, None);
  }

  #[test]
  fn roundtrip_zero() {
    let encoder = OpaqueCursorEncoderV2::new(SECRET);
    let encoded = encoder.encode_last_id_cursor("zero", 0).unwrap();
    let decoded = encoder.decode_cursor(&encoded).unwrap();
    assert_eq!(decoded.name, Some("zero".to_string()));
    assert_eq!(decoded.last_id, Some(0));
  }

  #[test]
  fn roundtrip_large_id() {
    let encoder = OpaqueCursorEncoderV2::new(SECRET);
    let encoded = encoder.encode_last_id_cursor("big", u64::MAX).unwrap();
    let decoded = encoder.decode_cursor(&encoded).unwrap();
    assert_eq!(decoded.last_id, Some(u64::MAX));
  }

  #[test]
  fn roundtrip_many_ids() {
    let encoder = OpaqueCursorEncoderV2::new(SECRET);
    for id in [0, 1, 100, 999, 100_000, 1_000_000_000, u64::MAX - 1] {
      let encoded = encoder.encode_last_id_cursor("batch", id).unwrap();
      let decoded = encoder.decode_cursor(&encoded).unwrap();
      assert_eq!(decoded.name, Some("batch".to_string()));
      assert_eq!(decoded.last_id, Some(id), "roundtrip failed for id={}", id);
    }
  }

  #[test]
  fn name_preserved_in_roundtrip() {
    let encoder = OpaqueCursorEncoderV2::new(SECRET);
    let encoded = encoder.encode_last_id_cursor("media_files_list", 999).unwrap();
    let decoded = encoder.decode_cursor(&encoded).unwrap();
    assert_eq!(decoded.name, Some("media_files_list".to_string()));
    assert_eq!(decoded.last_id, Some(999));
  }

  #[test]
  fn stable_cursor() {
    let encoder = OpaqueCursorEncoderV2::new("stable_secret");
    let encoded = encoder.encode_last_id_cursor("media_files_list", 123456).unwrap();
    assert_eq!(encoded, "0-8bNhoOVA37eZAKwVQ0B8kWq-HLs0x0gQc51TJXjw2hWJ7PNfVqas7WvRnIK80O");
  }

  #[test]
  fn different_secrets_produce_different_output() {
    let encoder_a = OpaqueCursorEncoderV2::new("secret_a");
    let encoder_b = OpaqueCursorEncoderV2::new("secret_b");

    let encoded_a = encoder_a.encode_last_id_cursor("test", 42).unwrap();
    let encoded_b = encoder_b.encode_last_id_cursor("test", 42).unwrap();

    assert_ne!(encoded_a, encoded_b);
  }

  #[test]
  fn wrong_secret_fails_to_decode() {
    let encoder_a = OpaqueCursorEncoderV2::new("secret_a");
    let encoder_b = OpaqueCursorEncoderV2::new("secret_b");

    let encoded = encoder_a.encode_last_id_cursor("test", 42).unwrap();
    let result = encoder_b.decode_cursor(&encoded);

    assert!(result.is_err());
  }

  #[test]
  fn invalid_base64_fails() {
    let encoder = OpaqueCursorEncoderV2::new(SECRET);
    let result = encoder.decode_cursor("!!!not-valid-base64!!!");
    assert!(result.is_err());
  }

  #[test]
  fn empty_string_fails() {
    let encoder = OpaqueCursorEncoderV2::new(SECRET);
    let result = encoder.decode_cursor("");
    assert!(result.is_err());
  }

  #[test]
  fn encoded_cursor_is_url_safe() {
    let encoder = OpaqueCursorEncoderV2::new(SECRET);
    for id in [0, 1, 42, 999_999_999] {
      let encoded = encoder.encode_last_id_cursor("safe", id).unwrap();
      assert!(
        encoded.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_'),
        "non-URL-safe character in cursor: {:?}",
        encoded,
      );
    }
  }

  #[test]
  fn decode_expecting_name_matches() {
    let encoder = OpaqueCursorEncoderV2::new(SECRET);
    let encoded = encoder.encode_last_id_cursor("my_list", 100).unwrap();
    let decoded = encoder.decode_cursor_expecting_name("my_list", &encoded).unwrap();
    assert_eq!(decoded.name, Some("my_list".to_string()));
    assert_eq!(decoded.last_id, Some(100));
  }

  #[test]
  fn decode_expecting_name_mismatch() {
    let encoder = OpaqueCursorEncoderV2::new(SECRET);
    let encoded = encoder.encode_last_id_cursor("wrong_name", 100).unwrap();
    let result = encoder.decode_cursor_expecting_name("expected_name", &encoded);
    assert!(matches!(result, Err(OpaqueCursorErrorV2::DecodedNameMismatch { .. })));
  }

  #[test]
  fn decode_expecting_name_not_present() {
    let encoder = OpaqueCursorEncoderV2::new(SECRET);
    let cursor = OpaqueCursorV2 { name: None, last_id: Some(42) };
    let encoded = encoder.encode_cursor(&cursor).unwrap();
    let result = encoder.decode_cursor_expecting_name("anything", &encoded);
    assert!(matches!(result, Err(OpaqueCursorErrorV2::DecodedNameNotPresent)));
  }

  #[test]
  fn deterministic_output() {
    let encoder = OpaqueCursorEncoderV2::new(SECRET);
    let a = encoder.encode_last_id_cursor("det", 42).unwrap();
    let b = encoder.encode_last_id_cursor("det", 42).unwrap();
    assert_eq!(a, b);
  }
}
