use http::{header, HeaderMap, HeaderValue};
use url::{Host, Url};

const DESKTOP_ORIGIN: &str = "https://studio.storyteller.ai";

/// The native HTTP bridge shares the desktop cookie jar. Its API identity must
/// not depend on which loopback port Vite happened to bind for this launch.
pub(crate) fn normalize_artcraft_origin(destination: &Url, headers: &mut HeaderMap) {
  let origin = headers.get(header::ORIGIN);
  // Preserve the existing packaged-app handling on macOS and Windows.
  let packaged_origin = origin.is_none()
    || matches!(
      origin.and_then(|value| value.to_str().ok()),
      Some("null" | "http://tauri.localhost" | "tauri://localhost")
    );
  // Only first-party API requests get the development-origin replacement.
  // Leave third-party requests and ordinary website origins untouched.
  let development_origin = destination.scheme() == "https"
    && matches!(destination.host_str(), Some("api.storyteller.ai" | "api.fakeyou.com"))
    && origin.and_then(|value| value.to_str().ok()).is_some_and(is_loopback_origin);

  if packaged_origin || development_origin {
    // HeaderMap is a multimap; insert replaces all existing Origin values.
    headers.insert(header::ORIGIN, HeaderValue::from_static(DESKTOP_ORIGIN));
  }
}

fn is_loopback_origin(origin: &str) -> bool {
  let Ok(url) = Url::parse(origin) else {
    return false;
  };
  if !matches!(url.scheme(), "http" | "https") {
    return false;
  }
  match url.host() {
    Some(Host::Domain("localhost")) => true,
    Some(Host::Ipv4(address)) => address.is_loopback(),
    Some(Host::Ipv6(address)) => address.is_loopback(),
    _ => false,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  const API: &str = "https://api.storyteller.ai/v1/session";

  mod development {
    use super::*;

    #[test]
    fn normalizes_dynamic_ports_and_loopback_hosts() {
      for origin in [
        "http://127.0.0.1:5193",
        "http://127.0.0.1:5194",
        "http://127.0.0.1:65535",
        "http://localhost:5173",
        "http://[::1]:5193",
      ] {
        assert_eq!(normalized(API, Some(origin)), DESKTOP_ORIGIN);
      }
      assert_eq!(
        normalized("https://api.fakeyou.com/v1/session", Some("http://127.0.0.1:5193")),
        DESKTOP_ORIGIN
      );
    }

    #[test]
    fn leaves_other_destinations_and_non_loopback_origins_unchanged() {
      for destination in [
        "https://example.com/v1/session",
        "https://api.storyteller.ai.example.com/v1/session",
        "http://api.storyteller.ai/v1/session",
        "http://localhost:12345/v1/session",
      ] {
        assert_eq!(normalized(destination, Some("http://127.0.0.1:5193")), "http://127.0.0.1:5193");
      }
      for origin in [
        "https://app.getartcraft.com",
        "https://example.com",
        "http://localhost.example.com:5193",
        "http://192.168.1.2:5193",
        "not a URL",
        "",
      ] {
        assert_eq!(normalized(API, Some(origin)), origin);
      }
    }
  }

  mod packaged {
    use super::*;

    #[test]
    fn preserves_existing_desktop_origins() {
      for origin in [None, Some("null"), Some("http://tauri.localhost"), Some("tauri://localhost")]
      {
        assert_eq!(normalized(API, origin), DESKTOP_ORIGIN);
      }
    }

    #[test]
    fn replaces_duplicate_origin_values_without_changing_session_headers() {
      let mut headers = HeaderMap::new();
      headers.append(header::ORIGIN, HeaderValue::from_static("http://127.0.0.1:5193"));
      headers.append(header::ORIGIN, HeaderValue::from_static("http://127.0.0.1:5193"));
      headers.insert(header::COOKIE, HeaderValue::from_static("session=fixture"));
      normalize_artcraft_origin(&Url::parse(API).unwrap(), &mut headers);
      assert_eq!(headers.get_all(header::ORIGIN).iter().count(), 1);
      assert_eq!(headers[header::ORIGIN], DESKTOP_ORIGIN);
      assert_eq!(headers[header::COOKIE], "session=fixture");
    }
  }

  fn normalized(destination: &str, origin: Option<&str>) -> String {
    let mut headers = HeaderMap::new();
    if let Some(origin) = origin {
      headers.insert(header::ORIGIN, HeaderValue::from_str(origin).unwrap());
    }
    normalize_artcraft_origin(&Url::parse(destination).unwrap(), &mut headers);
    headers[header::ORIGIN].to_str().unwrap().to_owned()
  }
}
