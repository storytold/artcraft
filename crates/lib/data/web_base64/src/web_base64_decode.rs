use base64::prelude::BASE64_STANDARD;
use base64::Engine;

use crate::error::WebBase64Error;

pub fn web_base64_decode(input: &str) -> Result<Vec<u8>, WebBase64Error> {
  let payload = if let Some(rest) = input.strip_prefix("data:") {
    let (metadata, data) = rest
      .split_once(',')
      .ok_or(WebBase64Error::MalformedDataUrl)?;

    if !metadata
      .split(';')
      .any(|part| part.eq_ignore_ascii_case("base64"))
    {
      return Err(WebBase64Error::NotBase64Encoded);
    }
    data
  } else {
    input
  };

  Ok(BASE64_STANDARD.decode(payload)?)
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::error::WebBase64Error;
  use base64::prelude::BASE64_STANDARD;
  use base64::Engine;

  #[test]
  fn decodes_non_prefixed_base64() {
    let payload = BASE64_STANDARD.encode(b"hello");
    let decoded = web_base64_decode(&payload).unwrap();
    assert_eq!(decoded, b"hello");
  }

  #[test]
  fn decodes_data_url_with_base64_marker() {
    let input = "data:image/png;base64,aGVsbG8=";
    let decoded = web_base64_decode(input).unwrap();
    assert_eq!(decoded, b"hello");
  }

  #[test]
  fn rejects_percent_encoded_data_url() {
    let input = "data:text/plain,Hello%20World";
    let err = web_base64_decode(input).unwrap_err();
    assert!(matches!(err, WebBase64Error::NotBase64Encoded));
  }

  #[test]
  fn rejects_data_url_without_comma() {
    let input = "data:image/png;base64";
    let err = web_base64_decode(input).unwrap_err();
    assert!(matches!(err, WebBase64Error::MalformedDataUrl));
  }

  #[test]
  fn rejects_invalid_base64() {
    let err = web_base64_decode("!!!").unwrap_err();
    assert!(matches!(err, WebBase64Error::DecodeError(_)));
  }

  #[test]
  fn empty_input_decodes_to_empty_bytes() {
    let decoded = web_base64_decode("").unwrap();
    assert!(decoded.is_empty());
  }

  #[test]
  fn round_trip_binary_data() {
    let bytes: Vec<u8> = (0u8..=255).collect();
    let payload = BASE64_STANDARD.encode(&bytes);
    let decoded = web_base64_decode(&payload).unwrap();
    assert_eq!(decoded, bytes);
  }
}
