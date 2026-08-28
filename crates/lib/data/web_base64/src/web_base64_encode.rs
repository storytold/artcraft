use base64::prelude::BASE64_STANDARD;
use base64::Engine;

/// Encode bytes to a data URL suitable for embedding in HTML/CSS.
/// If `mime_type` is Some, produces `data:<mime>;base64,<payload>`.
/// If None, produces bare base64 with no prefix.
pub fn web_base64_encode(bytes: &[u8], mime_type: Option<&str>) -> String {
  let payload = BASE64_STANDARD.encode(bytes);
  match mime_type {
    Some(mime) => format!("data:{mime};base64,{payload}"),
    None => payload,
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::web_base64_decode::web_base64_decode;

  #[test]
  fn round_trip_without_mime_type() {
    let bytes = b"hello world";
    let encoded = web_base64_encode(bytes, None);
    let decoded = web_base64_decode(&encoded).unwrap();
    assert_eq!(decoded, bytes);
  }

  #[test]
  fn round_trip_with_mime_type() {
    let bytes = b"hello world";
    let encoded = web_base64_encode(bytes, Some("image/png"));
    assert!(encoded.starts_with("data:image/png;base64,"));
    let decoded = web_base64_decode(&encoded).unwrap();
    assert_eq!(decoded, bytes);
  }

  #[test]
  fn round_trip_binary_data() {
    let bytes: Vec<u8> = (0u8..=255).collect();
    let encoded = web_base64_encode(&bytes, Some("application/octet-stream"));
    let decoded = web_base64_decode(&encoded).unwrap();
    assert_eq!(decoded, bytes);
  }
}
