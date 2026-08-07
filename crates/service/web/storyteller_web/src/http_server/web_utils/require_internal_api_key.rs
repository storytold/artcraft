//! Auth guard for internal (worker-facing) endpoints.
//!
//! Workers send an internal API key in the `Authorization` header. The key
//! MUST exactly match one of the keys loaded from
//! `INTERNAL_API_KEYS` at startup or the request is rejected with
//! 401. This is entirely separate from consumer API key auth.

use actix_web::HttpRequest;
use log::warn;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;
use crate::util::internal_api_key::InternalApiKey;

/// Require a valid internal API key in the `Authorization` header.
///
/// Accepts `Bearer <key>`, `Key <key>`, and bare `<key>` header forms
/// (matching the site-wide Authorization header conventions).
pub fn require_internal_api_key(
  http_request: &HttpRequest,
  server_state: &ServerState,
) -> Result<(), CommonWebError> {
  let maybe_header_value = http_request.headers()
    .get("authorization")
    .and_then(|value| value.to_str().ok());

  let Some(header_value) = maybe_header_value else {
    warn!("Internal endpoint request without an Authorization header.");
    return Err(CommonWebError::NotAuthorized);
  };

  let Some(candidate_key) = parse_authorization_header_value(header_value) else {
    warn!("Internal endpoint request with an unusable Authorization header.");
    return Err(CommonWebError::NotAuthorized);
  };

  if server_state.internal_api_keys.contains(&InternalApiKey::new(candidate_key)) {
    Ok(())
  } else {
    warn!("Internal endpoint request with an unrecognized internal API key.");
    Err(CommonWebError::NotAuthorized)
  }
}

/// Extract the key from `Bearer <key>`, `Key <key>`, or bare `<key>` forms.
/// Returns `None` for blank values, unsupported schemes, or scheme-only values.
fn parse_authorization_header_value(header_value: &str) -> Option<&str> {
  let trimmed = header_value.trim();
  if trimmed.is_empty() {
    return None;
  }

  let mut parts = trimmed.split_whitespace();
  let first = parts.next()?;

  match parts.next() {
    // A single token is a bare key — unless it's a scheme name with no
    // credential ("Bearer" / "Key" alone).
    None => {
      if is_scheme_name(first) {
        None
      } else {
        Some(first)
      }
    }
    Some(second) => {
      // Two tokens: the first must be a supported scheme.
      if parts.next().is_some() {
        return None;
      }
      if is_scheme_name(first) {
        Some(second)
      } else {
        None
      }
    }
  }
}

fn is_scheme_name(token: &str) -> bool {
  token.eq_ignore_ascii_case("bearer") || token.eq_ignore_ascii_case("key")
}

#[cfg(test)]
mod tests {
  use super::*;

  mod header_value_parsing {
    use super::*;

    #[test]
    fn bearer_scheme() {
      assert_eq!(parse_authorization_header_value("Bearer foo_abc"), Some("foo_abc"));
      assert_eq!(parse_authorization_header_value("bearer foo_abc"), Some("foo_abc"));
    }

    #[test]
    fn key_scheme() {
      assert_eq!(parse_authorization_header_value("Key foo_abc"), Some("foo_abc"));
    }

    #[test]
    fn bare_key() {
      assert_eq!(parse_authorization_header_value("foo_abc"), Some("foo_abc"));
      assert_eq!(parse_authorization_header_value("  foo_abc  "), Some("foo_abc"));
    }

    #[test]
    fn blank_or_scheme_only_is_none() {
      assert_eq!(parse_authorization_header_value(""), None);
      assert_eq!(parse_authorization_header_value("   "), None);
      assert_eq!(parse_authorization_header_value("Bearer"), None);
      assert_eq!(parse_authorization_header_value("Bearer  "), None);
    }

    #[test]
    fn unsupported_scheme_is_none() {
      assert_eq!(parse_authorization_header_value("Basic dXNlcjpwYXNz"), None);
      assert_eq!(parse_authorization_header_value("abc def"), None);
    }
  }
}
