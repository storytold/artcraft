use actix_web::HttpRequest;

use tokens::tokens::mcp_session_private::McpSessionPrivateToken;

use crate::http_server::web_utils::get_authorization_header_api_key::get_authorization_header_api_key;

/// Extract an MCP session's private credential from a request's `Authorization` header.
///
/// MCP session credentials live in the same header (and the same `Bearer <credential>`,
/// `Key <credential>`, and bare `<credential>` forms) as API keys, so this reuses the API-key
/// header parsing and then requires the `mcp_session_` token prefix. Returns `None` if the
/// header is absent, unusable, or carries a credential that is not an MCP session token —
/// callers fall back to (or reject as) other credential types.
pub fn get_authorization_header_mcp_private_session_token(
  http_request: &HttpRequest,
) -> Option<McpSessionPrivateToken> {
  let credential = get_authorization_header_api_key(http_request)?;

  if !credential.as_str_be_careful().starts_with(McpSessionPrivateToken::token_prefix()) {
    return None;
  }

  Some(McpSessionPrivateToken::new_from_str(credential.as_str_be_careful()))
}

#[cfg(test)]
mod tests {
  use actix_web::test::TestRequest;

  use super::*;

  const SAMPLE_MCP_CREDENTIAL: &str =
    "mcp_session_55ax0zhd580m598r6n4n7szdwjb2b28sypapvawh3k9m2p4q6r8t";
  const SAMPLE_API_KEY: &str = "artcraft_api_55ax0zhd580m598r6n4n7szdwjb2b28sypapvawh";

  #[test]
  fn bearer_scheme() {
    assert_eq!(
      parsed(&format!("Bearer {SAMPLE_MCP_CREDENTIAL}")),
      Some(SAMPLE_MCP_CREDENTIAL.to_string()));
  }

  #[test]
  fn key_scheme() {
    assert_eq!(
      parsed(&format!("Key {SAMPLE_MCP_CREDENTIAL}")),
      Some(SAMPLE_MCP_CREDENTIAL.to_string()));
  }

  #[test]
  fn bare_credential_aws_style() {
    assert_eq!(parsed(SAMPLE_MCP_CREDENTIAL), Some(SAMPLE_MCP_CREDENTIAL.to_string()));
  }

  #[test]
  fn api_key_is_not_an_mcp_credential() {
    assert_eq!(parsed(&format!("Bearer {SAMPLE_API_KEY}")), None);
    assert_eq!(parsed(SAMPLE_API_KEY), None);
  }

  #[test]
  fn missing_header_returns_none() {
    let http_request = TestRequest::default().to_http_request();
    assert_eq!(get_authorization_header_mcp_private_session_token(&http_request), None);
  }

  fn parsed(header_value: &str) -> Option<String> {
    let http_request = TestRequest::default()
        .insert_header(("Authorization", header_value))
        .to_http_request();
    get_authorization_header_mcp_private_session_token(&http_request)
        .map(|token| token.as_str().to_string())
  }
}
