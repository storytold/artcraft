use base64::prelude::BASE64_STANDARD;
use base64::Engine;

pub fn web_base64_decode(base64_string: &str) -> Result<Vec<u8>, base64::DecodeError> {
  // Remove the data URL prefix if it exists
  // eg: "data:image/png;base64,..." 
  let base64_data = if base64_string.starts_with("data:") {
    base64_string.split_once(',')
      .map(|(_, payload)| payload)
      .unwrap_or(base64_string)
  } else {
    base64_string
  };

  BASE64_STANDARD.decode(base64_data)
}

#[cfg(test)]
mod tests {
  use super::*;

  mod complete_payload {
    use super::*;

    #[test]
    fn rejects_comma_after_base64_payload() {
      let result = web_base64_decode("data:image/png;base64,aGVsbG8=,trailing");
      assert!(result.is_err(), "Expected an error, got {result:?}");
    }

    #[test]
    fn rejects_empty_first_payload_followed_by_bytes() {
      let result = web_base64_decode("data:image/png;base64,,aGVsbG8=");
      assert!(result.is_err(), "Expected an error, got {result:?}");
    }

    #[test]
    fn decodes_the_complete_payload_without_a_data_url() {
      assert_eq!(web_base64_decode("aGVsbG8="), Ok(b"hello".to_vec()));
      assert!(web_base64_decode("aGVsbG8=,trailing").is_err());
    }

    #[test]
    fn decodes_the_complete_data_url_payload() {
      assert_eq!(
        web_base64_decode("data:image/png;base64,aGVsbG8="),
        Ok(b"hello".to_vec()),
      );
      assert_eq!(web_base64_decode("data:image/png;base64,"), Ok(Vec::new()));
    }

    #[test]
    fn malformed_prefix_without_a_comma_still_fails() {
      assert!(web_base64_decode("data:image/png;base64").is_err());
    }
  }
}
