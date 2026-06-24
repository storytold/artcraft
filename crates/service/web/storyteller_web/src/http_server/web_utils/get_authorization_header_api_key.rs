use actix_http::header::{HeaderMap, HeaderName};
use actix_web::HttpRequest;

use artcraft_api_keys::ArtcraftApiKey;

const AUTHORIZATION_HEADER_NAME: HeaderName = HeaderName::from_static("authorization");

/// Extract an [`ArtcraftApiKey`] from a request's `Authorization` header.
///
/// The header name is matched case-insensitively (HTTP header names always are). The value parsing
/// — the `Bearer <api_key>`, `Key <api_key>`, and bare `<api_key>` forms — lives in the
/// [`artcraft_api_keys`] crate. Returns `None` if the header is absent, unreadable (non-ASCII
/// bytes), or does not contain a usable key.
pub fn get_authorization_header_api_key(http_request: &HttpRequest) -> Option<ArtcraftApiKey> {
  let header_map: &HeaderMap = http_request.headers();
  let header_value = header_map.get(AUTHORIZATION_HEADER_NAME)?
      .to_str()
      .ok()?;

  ArtcraftApiKey::parse_from_authorization_header_value(header_value)
}

#[cfg(test)]
mod tests {
  use actix_web::test::TestRequest;

  use super::*;

  const SAMPLE_KEY: &str = "artcraft_api_55ax0zhd580m598r6n4n7szdwjb2b28sypapvawh";

  mod request_header_tests {
    use super::*;

    #[test]
    fn bearer_scheme() {
      assert_eq!(
        api_key_for_authorization_header(&format!("Bearer {SAMPLE_KEY}")),
        Some(SAMPLE_KEY.to_string()));
    }

    #[test]
    fn key_scheme() {
      assert_eq!(
        api_key_for_authorization_header(&format!("Key {SAMPLE_KEY}")),
        Some(SAMPLE_KEY.to_string()));
    }

    #[test]
    fn bare_key_aws_style() {
      assert_eq!(
        api_key_for_authorization_header(SAMPLE_KEY),
        Some(SAMPLE_KEY.to_string()));
    }

    #[test]
    fn header_name_is_case_insensitive() {
      let value = format!("Bearer {SAMPLE_KEY}");
      for header_name in ["authorization", "Authorization", "AUTHORIZATION"] {
        let http_request = TestRequest::default()
            .insert_header((header_name, value.as_str()))
            .to_http_request();
        assert_eq!(
          get_authorization_header_api_key(&http_request).map(|key| key.to_string_be_careful()),
          Some(SAMPLE_KEY.to_string()),
          "failed for header name {header_name:?}");
      }
    }

    #[test]
    fn missing_header_returns_none() {
      let http_request = TestRequest::default().to_http_request();
      assert_eq!(get_authorization_header_api_key(&http_request), None);
    }
  }

  mod parsing_tests {
    use super::*;

    #[test]
    fn bearer_scheme_is_case_insensitive() {
      assert_eq!(parse_authorization_header_api_key("Bearer abc"), Some("abc".to_string()));
      assert_eq!(parse_authorization_header_api_key("bearer abc"), Some("abc".to_string()));
      assert_eq!(parse_authorization_header_api_key("BEARER abc"), Some("abc".to_string()));
      assert_eq!(parse_authorization_header_api_key("BeArEr abc"), Some("abc".to_string()));
    }

    #[test]
    fn key_scheme_is_case_insensitive() {
      assert_eq!(parse_authorization_header_api_key("Key abc"), Some("abc".to_string()));
      assert_eq!(parse_authorization_header_api_key("key abc"), Some("abc".to_string()));
      assert_eq!(parse_authorization_header_api_key("KEY abc"), Some("abc".to_string()));
    }

    #[test]
    fn bare_key_aws_style() {
      assert_eq!(parse_authorization_header_api_key("abc"), Some("abc".to_string()));
      assert_eq!(parse_authorization_header_api_key(SAMPLE_KEY), Some(SAMPLE_KEY.to_string()));
    }

    #[test]
    fn surrounding_and_inner_whitespace_is_trimmed() {
      assert_eq!(parse_authorization_header_api_key("  Bearer   abc  "), Some("abc".to_string()));
      assert_eq!(parse_authorization_header_api_key("\tKey\tabc\t"), Some("abc".to_string()));
      assert_eq!(parse_authorization_header_api_key("  abc  "), Some("abc".to_string()));
    }

    #[test]
    fn empty_or_blank_is_none() {
      assert_eq!(parse_authorization_header_api_key(""), None);
      assert_eq!(parse_authorization_header_api_key("   "), None);
    }

    #[test]
    fn scheme_with_no_credential_is_none() {
      assert_eq!(parse_authorization_header_api_key("Bearer"), None);
      assert_eq!(parse_authorization_header_api_key("Bearer "), None);
      assert_eq!(parse_authorization_header_api_key("Key"), None);
      assert_eq!(parse_authorization_header_api_key("key   "), None);
    }

    #[test]
    fn unsupported_scheme_is_none() {
      assert_eq!(parse_authorization_header_api_key("Basic dXNlcjpwYXNz"), None);
      assert_eq!(parse_authorization_header_api_key("Digest abc"), None);
      // Two non-scheme tokens — a bare key never contains whitespace.
      assert_eq!(parse_authorization_header_api_key("abc def"), None);
    }
  }

  // Thin string-returning adapters over the real implementation so the original test cases above
  // can stay unchanged after the parser moved into the `artcraft_api_keys` crate.

  fn parse_authorization_header_api_key(header_value: &str) -> Option<String> {
    ArtcraftApiKey::parse_from_authorization_header_value(header_value)
        .map(|key| key.to_string_be_careful())
  }

  fn api_key_for_authorization_header(value: &str) -> Option<String> {
    let http_request = TestRequest::default()
        .insert_header(("Authorization", value))
        .to_http_request();
    get_authorization_header_api_key(&http_request).map(|key| key.to_string_be_careful())
  }
}
