use artcraft_client_identity::destination::Destination;
use artcraft_client_identity::origins::LEGACY_DESKTOP_ORIGIN;
use artcraft_client_identity::user_agents::{ARTCRAFT_DESKTOP_USER_AGENT, WEBVIEW_USER_AGENT};
use http::{header, HeaderMap, HeaderValue};
use url::{Host, Url};

/// The `User-Agent` to send when the frontend didn't set one.
pub(crate) fn artcraft_default_user_agent(destination: &Url) -> &'static str {
  match Destination::classify(destination) {
    Destination::ArtcraftApi { .. } | Destination::ArtcraftHost => ARTCRAFT_DESKTOP_USER_AGENT,
    Destination::ThirdParty(_) | Destination::Unknown => WEBVIEW_USER_AGENT,
  }
}

/// Replace the webview's own `Origin` (packaged `tauri://localhost` etc., or a Vite loopback
/// origin at any port) with the identity chosen for the destination. The native HTTP bridge
/// shares the desktop cookie jar, so its identity must not depend on the webview.
pub(crate) fn normalize_artcraft_origin(destination: &Url, headers: &mut HeaderMap) {
  let origin = headers.get(header::ORIGIN).and_then(|value| value.to_str().ok());
  // Packaged-app webview origins on macOS and Windows.
  let packaged_origin = headers.get(header::ORIGIN).is_none()
    || matches!(origin, Some("null" | "http://tauri.localhost" | "tauri://localhost"));
  // Development webview origins (Vite on any loopback port).
  let webview_origin = packaged_origin || origin.is_some_and(is_loopback_origin);

  let replacement = match Destination::classify(destination) {
    // Our APIs (deployed or local) see the declared desktop identity.
    Destination::ArtcraftApi { origin } if webview_origin => origin,
    // Known third parties see an origin close to their own website.
    Destination::ThirdParty(provider) if webview_origin => provider.origin,
    // Our CDNs and websites keep the historical packaged-app handling.
    Destination::ArtcraftHost if packaged_origin => LEGACY_DESKTOP_ORIGIN,
    // Unknown hosts and ordinary website origins are left untouched.
    _ => return,
  };

  // HeaderMap is a multimap; insert replaces all existing Origin values.
  headers.insert(header::ORIGIN, HeaderValue::from_static(replacement));
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
  const LOCAL_API: &str = "http://localhost:12345/v1/session";
  const CDN: &str = "https://cdn-2.fakeyou.com/media/a/b.png";
  const GCS: &str = "https://storage.googleapis.com/bucket/a.png";
  const GROK: &str = "https://grok.com/rest/app-chat/conversations/new";
  const MIDJOURNEY: &str = "https://www.midjourney.com/api/submit-jobs";
  const UNKNOWN: &str = "https://www.gravatar.com/avatar/a";

  const DEV_WEBVIEW_ORIGIN: &str = "http://127.0.0.1:5193";
  const PACKAGED_ORIGINS: [Option<&str>; 4] =
    [None, Some("null"), Some("http://tauri.localhost"), Some("tauri://localhost")];

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
        assert_eq!(normalized(API, Some(origin)), "https://desktop.getartcraft.com");
        assert_eq!(normalized(LOCAL_API, Some(origin)), "http://localhost");
        assert_eq!(normalized(GROK, Some(origin)), "https://grok.com");
      }
      assert_eq!(
        normalized("https://api.fakeyou.com/v1/session", Some(DEV_WEBVIEW_ORIGIN)),
        "https://desktop.getartcraft.com"
      );
    }

    #[test]
    fn leaves_cdns_and_unknown_destinations_unchanged() {
      for destination in [
        CDN,
        GCS,
        UNKNOWN,
        "https://api.storyteller.ai.example.com/v1/session",
        "http://api.storyteller.ai/v1/session",
      ] {
        assert_eq!(normalized(destination, Some(DEV_WEBVIEW_ORIGIN)), DEV_WEBVIEW_ORIGIN, "{destination}");
      }
    }

    #[test]
    fn leaves_non_webview_origins_unchanged() {
      for origin in [
        "https://app.getartcraft.com",
        "https://example.com",
        "http://localhost.example.com:5193",
        "http://192.168.1.2:5193",
        "not a URL",
        "",
      ] {
        assert_eq!(normalized(API, Some(origin)), origin);
        assert_eq!(normalized(GROK, Some(origin)), origin);
      }
    }
  }

  mod packaged {
    use super::*;

    #[test]
    fn our_apis_get_desktop_identity() {
      for origin in PACKAGED_ORIGINS {
        assert_eq!(normalized(API, origin), "https://desktop.getartcraft.com");
        assert_eq!(normalized(LOCAL_API, origin), "http://localhost");
      }
    }

    #[test]
    fn third_parties_get_their_own_origin() {
      for origin in PACKAGED_ORIGINS {
        assert_eq!(normalized(GROK, origin), "https://grok.com");
        assert_eq!(normalized(MIDJOURNEY, origin), "https://www.midjourney.com");
      }
    }

    #[test]
    fn cdns_keep_legacy_origin() {
      for origin in PACKAGED_ORIGINS {
        assert_eq!(normalized(CDN, origin), "https://studio.storyteller.ai");
      }
    }

    #[test]
    fn unknown_destinations_never_get_our_origin() {
      for destination in [UNKNOWN, GCS] {
        assert_eq!(normalized(destination, Some("tauri://localhost")), "tauri://localhost");
        assert_eq!(normalized(destination, Some("null")), "null");
        assert_eq!(normalized_or_missing(destination, None), None);
      }
    }

    #[test]
    fn replaces_duplicate_origin_values_without_changing_session_headers() {
      let mut headers = HeaderMap::new();
      headers.append(header::ORIGIN, HeaderValue::from_static(DEV_WEBVIEW_ORIGIN));
      headers.append(header::ORIGIN, HeaderValue::from_static(DEV_WEBVIEW_ORIGIN));
      headers.insert(header::COOKIE, HeaderValue::from_static("session=fixture"));
      normalize_artcraft_origin(&Url::parse(API).unwrap(), &mut headers);
      assert_eq!(headers.get_all(header::ORIGIN).iter().count(), 1);
      assert_eq!(headers[header::ORIGIN], "https://desktop.getartcraft.com");
      assert_eq!(headers[header::COOKIE], "session=fixture");
    }
  }

  mod user_agent {
    use super::*;

    #[test]
    fn ours_get_artcraft_user_agent() {
      for destination in [API, LOCAL_API, CDN] {
        assert_eq!(user_agent(destination), "storyteller-client/1.0");
      }
    }

    #[test]
    fn third_parties_get_webview_user_agent() {
      for destination in [GROK, MIDJOURNEY, GCS, UNKNOWN] {
        let user_agent = user_agent(destination);
        assert!(user_agent.starts_with("Mozilla/5.0 ("), "{user_agent}");
        assert!(!user_agent.contains("storyteller"), "{user_agent}");
      }
    }

    fn user_agent(destination: &str) -> &'static str {
      artcraft_default_user_agent(&Url::parse(destination).unwrap())
    }
  }

  fn normalized(destination: &str, origin: Option<&str>) -> String {
    normalized_or_missing(destination, origin).unwrap()
  }

  fn normalized_or_missing(destination: &str, origin: Option<&str>) -> Option<String> {
    let mut headers = HeaderMap::new();
    if let Some(origin) = origin {
      headers.insert(header::ORIGIN, HeaderValue::from_str(origin).unwrap());
    }
    normalize_artcraft_origin(&Url::parse(destination).unwrap(), &mut headers);
    headers.get(header::ORIGIN).map(|value| value.to_str().unwrap().to_owned())
  }
}
