use crate::ArtcraftApiKey;

/// `Bearer <api_key>` — the widely-accepted style for most APIs.
const BEARER_SCHEME: &str = "bearer";

/// `Key <api_key>` — legacy GitHub-style / Fal-style.
const KEY_SCHEME: &str = "key";

/// Parse an [`ArtcraftApiKey`] from the value of an HTTP `Authorization` header.
///
/// The value is accepted in three forms:
///
/// - `Bearer <api_key>` (widely-accepted style for most APIs)
/// - `Key <api_key>` (legacy GitHub-style / Fal-style)
/// - `<api_key>` (AWS-style — the bare key, no scheme)
///
/// The scheme keyword is matched case-insensitively, and surrounding/inner whitespace is trimmed.
/// Returns `None` if the value is empty, carries an unsupported scheme (e.g. `Basic ...`), or names
/// a scheme with no credential.
pub fn parse_from_header_value(header_value: &str) -> Option<ArtcraftApiKey> {
  let trimmed = header_value.trim();
  if trimmed.is_empty() {
    return None;
  }

  let key = match trimmed.split_once(char::is_whitespace) {
    // A scheme word followed by a value: "Bearer <key>" / "Key <key>".
    Some((scheme, rest)) => {
      if is_supported_scheme(scheme) {
        let key = rest.trim();
        if key.is_empty() {
          // A supported scheme with no credential.
          return None;
        }
        key
      } else {
        // An unsupported scheme (e.g. "Basic ..."). A bare API key never
        // contains whitespace, so a multi-token value we don't recognize is
        // not a usable key.
        return None;
      }
    }
    // No whitespace: AWS-style bare API key ("<api_key>") — unless the value is
    // just a bare scheme keyword (a malformed header carrying no credential).
    None => {
      if is_supported_scheme(trimmed) {
        return None;
      }
      trimmed
    }
  };

  Some(ArtcraftApiKey::new_from_str(key))
}

fn is_supported_scheme(word: &str) -> bool {
  word.eq_ignore_ascii_case(BEARER_SCHEME) || word.eq_ignore_ascii_case(KEY_SCHEME)
}

#[cfg(test)]
mod tests {
  use super::*;

  const SAMPLE_KEY: &str = "artcraft_api_55ax0zhd580m598r6n4n7szdwjb2b28sypapvawh";

  fn parsed(header_value: &str) -> Option<String> {
    parse_from_header_value(header_value).map(|key| key.to_string_be_careful())
  }

  #[test]
  fn bearer_scheme_is_case_insensitive() {
    assert_eq!(parsed("Bearer abc"), Some("abc".to_string()));
    assert_eq!(parsed("bearer abc"), Some("abc".to_string()));
    assert_eq!(parsed("BEARER abc"), Some("abc".to_string()));
    assert_eq!(parsed("BeArEr abc"), Some("abc".to_string()));
  }

  #[test]
  fn key_scheme_is_case_insensitive() {
    assert_eq!(parsed("Key abc"), Some("abc".to_string()));
    assert_eq!(parsed("key abc"), Some("abc".to_string()));
    assert_eq!(parsed("KEY abc"), Some("abc".to_string()));
  }

  #[test]
  fn bare_key_aws_style() {
    assert_eq!(parsed("abc"), Some("abc".to_string()));
    assert_eq!(parsed(SAMPLE_KEY), Some(SAMPLE_KEY.to_string()));
  }

  #[test]
  fn surrounding_and_inner_whitespace_is_trimmed() {
    assert_eq!(parsed("  Bearer   abc  "), Some("abc".to_string()));
    assert_eq!(parsed("\tKey\tabc\t"), Some("abc".to_string()));
    assert_eq!(parsed("  abc  "), Some("abc".to_string()));
  }

  #[test]
  fn empty_or_blank_is_none() {
    assert_eq!(parsed(""), None);
    assert_eq!(parsed("   "), None);
  }

  #[test]
  fn scheme_with_no_credential_is_none() {
    assert_eq!(parsed("Bearer"), None);
    assert_eq!(parsed("Bearer "), None);
    assert_eq!(parsed("Key"), None);
    assert_eq!(parsed("key   "), None);
  }

  #[test]
  fn unsupported_scheme_is_none() {
    assert_eq!(parsed("Basic dXNlcjpwYXNz"), None);
    assert_eq!(parsed("Digest abc"), None);
    // Two non-scheme tokens — a bare key never contains whitespace.
    assert_eq!(parsed("abc def"), None);
  }

  #[test]
  fn returns_an_artcraft_api_key() {
    let key = parse_from_header_value(&format!("Bearer {SAMPLE_KEY}")).expect("should parse");
    assert_eq!(key.as_str_be_careful(), SAMPLE_KEY);
  }
}
