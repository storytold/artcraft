use actix_http::header::{HeaderMap, HeaderName};
use actix_web::HttpRequest;

use enums::common::platform_type::PlatformType;

/// User-Agent prefix sent by the ArtCraft desktop (Tauri) client, eg. "storyteller-client/1.0".
const DESKTOP_CLIENT_USER_AGENT_PREFIX : &str = "storyteller-client";

/// User-Agent prefix sent by the curl CLI tool, eg. "curl/8.7.1".
const CURL_USER_AGENT_PREFIX : &str = "curl";

/// User-Agent prefix sent by the Python `requests` library.
/// Modern releases send "python-requests/2.31.0" (optionally followed by
/// "CPython/x.y.z OS/release" in older releases, eg.
/// "python-requests/0.14.2 CPython/2.7.3 Linux/3.2.0"). Some early releases
/// sent the bare "python-requests.org", which shares this prefix.
const PYTHON_REQUESTS_USER_AGENT_PREFIX : &str = "python-requests";

/// User-Agent prefix sent by Postman, eg. "PostmanRuntime/7.36.0".
/// All known Postman Runtime versions (2.x through 8.x) use this form.
/// (Compared case-insensitively.)
const POSTMAN_USER_AGENT_PREFIX : &str = "postmanruntime";

const USER_AGENT_HEADER_NAME : HeaderName = HeaderName::from_static("user-agent");

/// Infer the calling platform from the request's User-Agent header.
///
/// Returns `None` if the header is absent or unreadable. Otherwise, the ArtCraft
/// desktop client identifies itself with a "storyteller-client" prefix, known
/// CLI/API tools (curl, python-requests, Postman) are flagged as such, and
/// anything else is assumed to be a browser.
pub fn get_request_platform_type(http_request: &HttpRequest) -> Option<PlatformType> {
  let header_map : &HeaderMap = http_request.headers();
  let user_agent = header_map.get(USER_AGENT_HEADER_NAME)?
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
  let lowercase_user_agent = user_agent.to_ascii_lowercase();
  if lowercase_user_agent.starts_with(CURL_USER_AGENT_PREFIX) {
    return Some(PlatformType::Curl);
  }
  if lowercase_user_agent.starts_with(PYTHON_REQUESTS_USER_AGENT_PREFIX) {
    return Some(PlatformType::PythonRequests);
  }
  if lowercase_user_agent.starts_with(POSTMAN_USER_AGENT_PREFIX) {
    return Some(PlatformType::Postman);
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
    fn python_requests_user_agent() {
      assert_eq!(
        platform_type_for_user_agent_header("python-requests/2.31.0"),
        Some(PlatformType::PythonRequests));
    }

    #[test]
    fn postman_user_agent() {
      assert_eq!(
        platform_type_for_user_agent_header("PostmanRuntime/7.36.0"),
        Some(PlatformType::Postman));
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
    fn python_requests_versions() {
      // Modern releases: bare "python-requests/<version>".
      assert_eq!(platform_type_from_user_agent("python-requests/2.31.0"), Some(PlatformType::PythonRequests));
      assert_eq!(platform_type_from_user_agent("python-requests/2.32.3"), Some(PlatformType::PythonRequests));
      // Older releases appended runtime and OS details.
      assert_eq!(
        platform_type_from_user_agent("python-requests/0.14.2 CPython/2.7.3 Linux/3.2.0-armv7l"),
        Some(PlatformType::PythonRequests));
      assert_eq!(
        platform_type_from_user_agent("python-requests/1.1.0 CPython/2.6.6 Linux/2.6.32-431.3.1.el6.x86_64"),
        Some(PlatformType::PythonRequests));
      // Some early releases sent the bare project domain.
      assert_eq!(platform_type_from_user_agent("python-requests.org"), Some(PlatformType::PythonRequests));
      // Case-insensitive.
      assert_eq!(platform_type_from_user_agent("Python-Requests/2.25.1"), Some(PlatformType::PythonRequests));
    }

    #[test]
    fn postman_versions() {
      // Modern Postman Runtime 7.x/8.x.
      assert_eq!(platform_type_from_user_agent("PostmanRuntime/7.36.0"), Some(PlatformType::Postman));
      assert_eq!(platform_type_from_user_agent("PostmanRuntime/8.0.3"), Some(PlatformType::Postman));
      // Historical Postman Runtime versions.
      assert_eq!(platform_type_from_user_agent("PostmanRuntime/2.4.5"), Some(PlatformType::Postman));
      assert_eq!(platform_type_from_user_agent("PostmanRuntime/7.6.0"), Some(PlatformType::Postman));
      // Case-insensitive, with surrounding whitespace.
      assert_eq!(platform_type_from_user_agent(" postmanruntime/7.26.8 "), Some(PlatformType::Postman));
    }

    #[test]
    fn unknown_tools_are_web() {
      assert_eq!(platform_type_from_user_agent("Go-http-client/2.0"), Some(PlatformType::Web));
      assert_eq!(platform_type_from_user_agent("insomnia/8.6.1"), Some(PlatformType::Web));
      // Other Python HTTP clients are not the `requests` library.
      assert_eq!(platform_type_from_user_agent("python-httpx/0.27.0"), Some(PlatformType::Web));
      assert_eq!(platform_type_from_user_agent("Python-urllib/3.11"), Some(PlatformType::Web));
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
