use actix_http::header::{HeaderMap, HeaderName};
use actix_web::HttpRequest;

/// `Authorization: Bearer <api_key>` — the widely-accepted style for most APIs.
const BEARER_SCHEME: &str = "bearer";

/// `Authorization: Key <api_key>` — legacy GitHub-style / Fal-style.
const KEY_SCHEME: &str = "key";


const AUTHORIZATION_HEADER_NAME: HeaderName = HeaderName::from_static("authorization");

/// Extract an API key from a request's `Authorization` header.
///
/// The header name is matched case-insensitively (HTTP header names always are),
/// and the value is accepted in three forms:
///
/// - `Authorization: Bearer <api_key>` (widely-accepted style for most APIs)
/// - `Authorization: Key <api_key>` (legacy GitHub-style / Fal-style)
/// - `Authorization: <api_key>` (AWS-style — the bare key, no scheme)
///
/// The scheme keyword is matched case-insensitively. Returns `None` if the
/// header is absent, unreadable (non-ASCII bytes), empty, carries an
/// unsupported scheme (e.g. `Basic ...`), or names a scheme with no credential.
pub fn get_authorization_header_api_key(http_request: &HttpRequest) -> Option<String> {
  let header_map: &HeaderMap = http_request.headers();
  let header_value = header_map.get(AUTHORIZATION_HEADER_NAME)?
      .to_str()
      .ok()?;

  parse_authorization_header_api_key(header_value)
}

fn parse_authorization_header_api_key(header_value: &str) -> Option<String> {
  let trimmed = header_value.trim();
  if trimmed.is_empty() {
    return None;
  }

  match trimmed.split_once(char::is_whitespace) {
    // A scheme word followed by a value: "Bearer <key>" / "Key <key>".
    Some((scheme, rest)) => {
      if is_supported_scheme(scheme) {
        let key = rest.trim();
        if key.is_empty() {
          // A supported scheme with no credential.
          None
        } else {
          Some(key.to_string())
        }
      } else {
        // An unsupported scheme (e.g. "Basic ..."). A bare API key never
        // contains whitespace, so a multi-token value we don't recognize is
        // not a usable key.
        None
      }
    }
    // No whitespace: AWS-style bare API key ("<api_key>") — unless the value is
    // just a bare scheme keyword (a malformed header carrying no credential).
    None => {
      if is_supported_scheme(trimmed) {
        None
      } else {
        Some(trimmed.to_string())
      }
    }
  }
}

fn is_supported_scheme(word: &str) -> bool {
  word.eq_ignore_ascii_case(BEARER_SCHEME) || word.eq_ignore_ascii_case(KEY_SCHEME)
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
          get_authorization_header_api_key(&http_request),
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

  fn api_key_for_authorization_header(value: &str) -> Option<String> {
    let http_request = TestRequest::default()
        .insert_header(("Authorization", value))
        .to_http_request();
    get_authorization_header_api_key(&http_request)
  }
}
