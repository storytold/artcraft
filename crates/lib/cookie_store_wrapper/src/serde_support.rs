//! Serde support for [`CookieStore`] and [`SharedCookieStore`].
//!
//! Both types implement `Serialize` and `Deserialize` directly, so callers
//! can embed a cookie store in their own serializable structs (JSON state
//! files, TOML credential files, etc.) without a conversion type:
//!
//! ```ignore
//! #[derive(Serialize, Deserialize)]
//! struct CookieCredential {
//!   updated_at: Option<DateTime<Utc>>,
//!   cookies: CookieStore,  // NB: keep array-of-table fields LAST for TOML
//! }
//! ```
//!
//! The wire shape is a flat list of cookies, chosen to stay human-editable
//! when it lands in a TOML file someone opens in vim:
//!
//! ```toml
//! [[cookie.cookies]]
//! name = "session"
//! value = "abc123"
//! domain = "example.com"
//! secure = true
//! http_only = true
//! expires = "2027-01-01T00:00:00+00:00"
//! ```
//!
//! Defaulted attributes (`path = "/"`, false flags, session-cookie expiry)
//! are omitted on write but accepted on read. Expired cookies are dropped on
//! both save and load. The change log is debug state and is not serialized.

use crate::cookie_store::CookieStore;
use crate::shared_cookie_store::SharedCookieStore;
use ::cookie_store::Cookie as CookieRfc;
use ::cookie_store::{CookieDomain, CookieExpiration, RawCookie};
use chrono::{DateTime, SecondsFormat, Utc};
use log::warn;
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use std::time::SystemTime;
use url::Url;

const DEFAULT_PATH: &str = "/";

/// The wire shape of one cookie. Public so callers can build tooling around
/// the stored format, but normal use is via `CookieStore`'s serde impls.
#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
pub struct SerializedCookie {
  pub name: String,
  pub value: String,

  /// The domain the cookie belongs to, without a leading dot. Subdomains
  /// also match unless `host_only` is set.
  pub domain: String,

  /// Restrict the cookie to exactly `domain` (no subdomains).
  #[serde(default, skip_serializing_if = "is_false")]
  pub host_only: bool,

  #[serde(default = "default_path", skip_serializing_if = "is_default_path")]
  pub path: String,

  #[serde(default, skip_serializing_if = "is_false")]
  pub secure: bool,

  #[serde(default, skip_serializing_if = "is_false")]
  pub http_only: bool,

  /// RFC 3339 expiry time. Omitted for session cookies (which never expire
  /// on disk).
  #[serde(default, skip_serializing_if = "Option::is_none")]
  pub expires: Option<String>,
}

impl Serialize for CookieStore {
  fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
    serializer.collect_seq(self.rfc_store().iter_unexpired().filter_map(serialized_cookie_from_rfc))
  }
}

impl<'de> Deserialize<'de> for CookieStore {
  fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
    let cookies = Vec::<SerializedCookie>::deserialize(deserializer)?;
    let mut store = CookieStore::empty();
    for cookie in cookies {
      insert_serialized_cookie(&mut store, cookie);
    }
    Ok(store)
  }
}

/// Serializes as a point-in-time snapshot of the shared store.
impl Serialize for SharedCookieStore {
  fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
    self.with_read(|store| store.serialize(serializer))
  }
}

/// Deserializes into a fresh handle, unrelated to any existing clones.
impl<'de> Deserialize<'de> for SharedCookieStore {
  fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
    Ok(SharedCookieStore::new(CookieStore::deserialize(deserializer)?))
  }
}

/// Compares the cookies (name, value, and attributes), ignoring the change
/// log and insertion order.
impl PartialEq for CookieStore {
  fn eq(&self, other: &Self) -> bool {
    sorted_serialized_cookies(self) == sorted_serialized_cookies(other)
  }
}

impl Eq for CookieStore {}

fn serialized_cookie_from_rfc(cookie: &CookieRfc<'static>) -> Option<SerializedCookie> {
  let (domain, host_only) = match &cookie.domain {
    CookieDomain::HostOnly(host) => (host.clone(), true),
    CookieDomain::Suffix(suffix) => (suffix.clone(), false),
    other => {
      warn!("Cannot serialize cookie {:?} with domain {:?}; skipping.", cookie.name(), other);
      return None;
    },
  };

  let expires = match &cookie.expires {
    CookieExpiration::AtUtc(at_utc) => {
      let system_time = SystemTime::from(*at_utc);
      Some(DateTime::<Utc>::from(system_time).to_rfc3339_opts(SecondsFormat::Secs, false))
    },
    CookieExpiration::SessionEnd => None,
  };

  Some(SerializedCookie { name: cookie.name().to_owned(), value: cookie.value().to_owned(), domain, host_only, path: (*cookie.path).to_owned(), secure: cookie.secure().unwrap_or(false), http_only: cookie.http_only().unwrap_or(false), expires })
}

fn insert_serialized_cookie(store: &mut CookieStore, cookie: SerializedCookie) {
  let source_url = match Url::parse(&format!("https://{}/", cookie.domain)) {
    Ok(url) => url,
    Err(err) => {
      warn!("Cannot restore cookie {:?} with domain {:?}: {:?}", cookie.name, cookie.domain, err);
      return;
    },
  };

  let mut raw = RawCookie::new(cookie.name, cookie.value);
  raw.set_path(cookie.path);
  raw.set_secure(cookie.secure);
  raw.set_http_only(cookie.http_only);
  if !cookie.host_only {
    raw.set_domain(cookie.domain);
  }
  if let Some(expires) = &cookie.expires {
    match DateTime::parse_from_rfc3339(expires) {
      Ok(at) => {
        let system_time = SystemTime::from(at.with_timezone(&Utc));
        raw.set_expires(time::OffsetDateTime::from(system_time));
      },
      Err(err) => {
        warn!("Cookie {:?} has unparseable expires {:?} ({:?}); treating as session cookie.", raw.name(), expires, err);
      },
    }
  }

  // NB: An expired cookie is rejected here (with a warning), which is the
  // intended load behavior.
  store.insert_raw(&raw, &source_url);
}

fn sorted_serialized_cookies(store: &CookieStore) -> Vec<SerializedCookie> {
  let mut cookies = store.rfc_store().iter_unexpired().filter_map(serialized_cookie_from_rfc).collect::<Vec<SerializedCookie>>();
  cookies.sort_by(|a, b| (&a.domain, &a.path, &a.name).cmp(&(&b.domain, &b.path, &b.name)));
  cookies
}

fn default_path() -> String {
  DEFAULT_PATH.to_owned()
}

fn is_default_path(path: &str) -> bool {
  path == DEFAULT_PATH
}

fn is_false(value: &bool) -> bool {
  !value
}

#[cfg(test)]
mod tests {
  use super::*;
  use serde_derive::{Deserialize, Serialize};

  #[test]
  fn cookie_store_round_trips_through_json() {
    let store = example_store();

    let serialized = serde_json::to_string(&store).unwrap();
    let restored: CookieStore = serde_json::from_str(&serialized).unwrap();

    assert_eq!(restored.len(), 3);
    assert_eq!(restored.get_cookie_value("session"), Some("abc123"));
    assert_eq!(restored.get_cookie_value("pref"), Some("dark"));
    assert_eq!(restored.get_cookie_value("keeper"), Some("forever"));
    assert_eq!(restored, store);
  }

  #[test]
  fn cookie_store_nests_inside_caller_toml_structs() {
    #[derive(Serialize, Deserialize)]
    struct CredentialFile {
      service: String,
      // NB: Array-of-table fields go last so TOML stays valid.
      cookies: CookieStore,
    }

    let file = CredentialFile { service: "midjourney_cookies".to_string(), cookies: example_store() };

    let serialized = toml::to_string(&file).unwrap();
    let restored: CredentialFile = toml::from_str(&serialized).unwrap();

    assert_eq!(restored.service, "midjourney_cookies");
    assert_eq!(restored.cookies, file.cookies);
  }

  #[test]
  fn toml_output_is_human_editable() {
    #[derive(Serialize)]
    struct CredentialFile {
      cookies: CookieStore,
    }

    let site_url = Url::parse("https://www.example.com/").unwrap();
    let mut store = CookieStore::empty();
    store.apply_set_cookie_header("session=abc123; Secure; HttpOnly; Path=/", &site_url);

    let serialized = toml::to_string(&CredentialFile { cookies: store }).unwrap();

    // The whole cookie reads as a flat, obvious table.
    let expected = "\
[[cookies]]
name = \"session\"
value = \"abc123\"
domain = \"www.example.com\"
host_only = true
secure = true
http_only = true
";
    assert_eq!(serialized, expected);
  }

  #[test]
  fn hand_written_toml_with_defaults_parses() {
    #[derive(Deserialize)]
    struct CredentialFile {
      cookies: CookieStore,
    }

    let hand_written = r#"
      [[cookies]]
      name = "session"
      value = "abc123"
      domain = "example.com"
    "#;

    let file: CredentialFile = toml::from_str(hand_written).unwrap();
    assert_eq!(file.cookies.get_cookie_value("session"), Some("abc123"));

    // Domain cookies (the default) match subdomains.
    let subdomain_url = Url::parse("https://api.example.com/").unwrap();
    assert_eq!(file.cookies.cookie_header_for_url(&subdomain_url), Some("session=abc123".to_string()),);
  }

  #[test]
  fn expires_round_trips_and_expired_cookies_are_dropped() {
    let json = r#"[
      {"name": "fresh", "value": "1", "domain": "example.com", "expires": "2100-01-01T00:00:00+00:00"},
      {"name": "stale", "value": "2", "domain": "example.com", "expires": "2001-01-01T00:00:00+00:00"}
    ]"#;

    let restored: CookieStore = serde_json::from_str(json).unwrap();
    assert!(restored.has_cookie("fresh"));
    assert!(!restored.has_cookie("stale"));

    let reserialized = serde_json::to_string(&restored).unwrap();
    assert!(reserialized.contains("\"expires\":\"2100-01-01T00:00:00+00:00\""));
  }

  #[test]
  fn shared_cookie_store_round_trips_through_json() {
    let shared = SharedCookieStore::new(example_store());

    let serialized = serde_json::to_string(&shared).unwrap();
    let restored: SharedCookieStore = serde_json::from_str(&serialized).unwrap();

    assert!(restored.has_cookie("session"));
  }

  #[test]
  fn legacy_version_1_data_fails_to_parse() {
    let legacy_json = r#"{"cookies":[{"name":"session","value":"abc"}]}"#;
    let result = serde_json::from_str::<CookieStore>(legacy_json);
    assert!(result.is_err());
  }

  fn example_store() -> CookieStore {
    let site_url = Url::parse("https://www.example.com/").unwrap();
    let mut store = CookieStore::empty();
    store.insert_named("session", "abc123", &site_url);
    store.apply_set_cookie_header("pref=dark; Domain=example.com; Path=/", &site_url);
    store.apply_set_cookie_header("keeper=forever; Path=/; Expires=Tue, 03 Aug 2100 00:38:37 GMT", &site_url);
    store
  }
}
