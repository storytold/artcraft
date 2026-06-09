use actix_http::header::{HeaderMap, HeaderName};
use actix_web::HttpRequest;

use enums::common::platform_type::PlatformType;

/// User-Agent prefix sent by the ArtCraft desktop (Tauri) client, eg. "storyteller-client/1.0".
const DESKTOP_CLIENT_USER_AGENT_PREFIX : &str = "storyteller-client";

/// User-Agent prefix sent by the curl CLI tool, eg. "curl/8.7.1".
const CURL_USER_AGENT_PREFIX : &str = "curl";

/// Infer the calling platform from the request's User-Agent header.
///
/// Returns `None` if the header is absent or unreadable. Otherwise, the ArtCraft
/// desktop client identifies itself with a "storyteller-client" prefix, curl-like
/// CLI callers are flagged as such, and anything else is assumed to be a browser.
pub fn get_request_platform_type(http_request: &HttpRequest) -> Option<PlatformType> {
  let user_agent_header_name = HeaderName::from_static("user-agent");
  let header_map : &HeaderMap = http_request.headers();
  let user_agent = header_map.get(user_agent_header_name)?
      .to_str()
      .ok()?;

  platform_type_from_user_agent(user_agent)
}

fn platform_type_from_user_agent(user_agent: &str) -> Option<PlatformType> {
  let user_agent = user_agent.trim();
  if user_agent.is_empty() {
    return None;
  }
  if user_agent.starts_with(DESKTOP_CLIENT_USER_AGENT_PREFIX) {
    return Some(PlatformType::DesktopApp);
  }
  if user_agent.to_ascii_lowercase().starts_with(CURL_USER_AGENT_PREFIX) {
    return Some(PlatformType::Curl);
  }
  Some(PlatformType::Web)
}

#[cfg(test)]
mod tests {
  use actix_web::test::TestRequest;

  use super::*;

  const CHROME_USER_AGENT : &str = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) \
    AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

  mod request_header_tests {
    use super::*;

    #[test]
    fn missing_user_agent_returns_none() {
      assert_eq!(platform_type_for_request_without_user_agent(), None);
    }

    #[test]
    fn desktop_client_user_agent() {
      assert_eq!(
        platform_type_for_user_agent_header("storyteller-client/1.0"),
        Some(PlatformType::DesktopApp));
    }

    #[test]
    fn curl_user_agent() {
      assert_eq!(
        platform_type_for_user_agent_header("curl/8.7.1"),
        Some(PlatformType::Curl));
    }

    #[test]
    fn browser_user_agent() {
      assert_eq!(
        platform_type_for_user_agent_header(CHROME_USER_AGENT),
        Some(PlatformType::Web));
    }
  }

  mod user_agent_parsing_tests {
    use super::*;

    #[test]
    fn desktop_client_versions() {
      assert_eq!(platform_type_from_user_agent("storyteller-client/1.0"), Some(PlatformType::DesktopApp));
      assert_eq!(platform_type_from_user_agent("storyteller-client/2.3.4"), Some(PlatformType::DesktopApp));
      assert_eq!(platform_type_from_user_agent("storyteller-client"), Some(PlatformType::DesktopApp));
    }

    #[test]
    fn desktop_client_with_surrounding_whitespace() {
      assert_eq!(platform_type_from_user_agent("  storyteller-client/1.0  "), Some(PlatformType::DesktopApp));
    }

    #[test]
    fn curl_versions() {
      assert_eq!(platform_type_from_user_agent("curl/8.7.1"), Some(PlatformType::Curl));
      assert_eq!(platform_type_from_user_agent(" curl/7.64.1 "), Some(PlatformType::Curl));
      assert_eq!(platform_type_from_user_agent("Curl/8.0.0"), Some(PlatformType::Curl));
    }

    #[test]
    fn browsers_are_web() {
      assert_eq!(platform_type_from_user_agent(CHROME_USER_AGENT), Some(PlatformType::Web));
      assert_eq!(platform_type_from_user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)"), Some(PlatformType::Web));
    }

    #[test]
    fn unknown_tools_are_web() {
      assert_eq!(platform_type_from_user_agent("python-requests/2.31.0"), Some(PlatformType::Web));
      assert_eq!(platform_type_from_user_agent("PostmanRuntime/7.36.0"), Some(PlatformType::Web));
    }

    #[test]
    fn empty_or_blank_is_none() {
      assert_eq!(platform_type_from_user_agent(""), None);
      assert_eq!(platform_type_from_user_agent("   "), None);
    }
  }

  fn platform_type_for_user_agent_header(user_agent: &str) -> Option<PlatformType> {
    let http_request = TestRequest::default()
        .insert_header(("user-agent", user_agent))
        .to_http_request();
    get_request_platform_type(&http_request)
  }

  fn platform_type_for_request_without_user_agent() -> Option<PlatformType> {
    let http_request = TestRequest::default().to_http_request();
    get_request_platform_type(&http_request)
  }
}
