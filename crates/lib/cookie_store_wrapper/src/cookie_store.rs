use crate::change_log::{CookieChangeAction, CookieChangeLog};
use log::warn;
use ::cookie_store::{CookieError, CookieStore as CookieStoreRfc, RawCookie, StoreAction};
use url::Url;

/// A cookie jar with RFC 6265 storage semantics.
///
/// Cookies are keyed by `(domain, path, name)` — not just name — and a repeat
/// `Set-Cookie` for the same key replaces the old value, while an expired
/// `Set-Cookie` deletes it (the standard server-side removal mechanism).
/// Every mutation is recorded in a bounded [`CookieChangeLog`] for debugging.
///
/// This is a plain value type; wrap it in
/// [`crate::shared_cookie_store::SharedCookieStore`] to share it between
/// threads.
#[derive(Clone, Debug, Default)]
pub struct CookieStore {
  store: CookieStoreRfc,
  change_log: CookieChangeLog,
}

/// A cookie captured from a browser or webview, with as much metadata as the
/// browser reported.
#[derive(Clone, Debug)]
pub struct CapturedCookie {
  pub name: String,
  pub value: String,

  /// Domain as reported by the browser. May carry a leading dot
  /// (e.g. `.storyteller.ai`), which marks a parent-domain cookie.
  pub maybe_domain: Option<String>,

  pub maybe_path: Option<String>,
}

impl CookieStore {
  pub fn empty() -> Self {
    Self::default()
  }

  /// Parse a raw `Cookie:` request-header string (`"a=1; b=2"`) into a new
  /// store of host-only cookies for `source_url`'s host. This is the entry
  /// point for hand-entered cookie headers, where per-cookie attributes are
  /// not known.
  pub fn from_cookie_header(cookie_header: &str, source_url: &Url) -> Self {
    let mut store = Self::empty();
    store.insert_cookie_header(cookie_header, source_url);
    store
  }

  pub(crate) fn from_rfc_store(store: CookieStoreRfc) -> Self {
    Self { store, change_log: CookieChangeLog::default() }
  }

  /// Insert a bare name/value cookie as a host-only cookie for `source_url`'s
  /// host. Returns whether the cookie was stored (or expired an existing one).
  pub fn insert_named(&mut self, name: &str, value: &str, source_url: &Url) -> bool {
    let raw = RawCookie::new(name.to_owned(), value.to_owned());
    self.insert_raw(&raw, source_url)
  }

  /// Insert a cookie captured from a browser or webview.
  ///
  /// When the capture carries a domain, the cookie is stored as a
  /// domain-suffix cookie for it (so it matches subdomains, mirroring how the
  /// browser scoped it). Without a domain it falls back to a host-only cookie
  /// for `fallback_source_url`.
  pub fn insert_captured(&mut self, captured: CapturedCookie, fallback_source_url: &Url) -> bool {
    let maybe_domain = captured.maybe_domain.as_deref().map(|domain| domain.trim_start_matches('.').to_ascii_lowercase()).filter(|domain| !domain.is_empty());

    let Some(domain) = maybe_domain else {
      return self.insert_named(&captured.name, &captured.value, fallback_source_url);
    };

    let source_url = match Url::parse(&format!("https://{domain}/")) {
      Ok(url) => url,
      Err(err) => {
        warn!("Cannot build source URL for captured cookie {:?} (domain {:?}): {:?}", captured.name, domain, err);
        return false;
      },
    };

    let mut raw = RawCookie::new(captured.name, captured.value);
    raw.set_domain(domain);
    raw.set_path(captured.maybe_path.unwrap_or_else(|| "/".to_owned()));
    self.insert_raw(&raw, &source_url)
  }

  /// Insert every `name=value` pair of a raw `Cookie:` request-header string
  /// as a host-only cookie for `source_url`'s host. Returns how many cookies
  /// were stored.
  pub fn insert_cookie_header(&mut self, cookie_header: &str, source_url: &Url) -> usize {
    cookie_header.split(';').filter_map(|pair| pair.trim().split_once('=')).filter(|(name, _)| !name.trim().is_empty()).map(|(name, value)| (name.trim().to_owned(), value.trim().to_owned())).collect::<Vec<(String, String)>>().into_iter().filter(|(name, value)| self.insert_named(name, value, source_url)).count()
  }

  /// Apply one `Set-Cookie` header value received from `request_url`,
  /// following the RFC 6265 storage model (replace / expire / reject).
  pub fn apply_set_cookie_header(&mut self, set_cookie_value: &str, request_url: &Url) -> bool {
    let cookie_name = set_cookie_value.split('=').next().unwrap_or(set_cookie_value).trim().to_owned();
    let result = self.store.parse(set_cookie_value, request_url);
    self.record_insert_result(result, &cookie_name, request_url)
  }

  /// Apply several `Set-Cookie` header values received from `request_url`.
  /// Returns how many were accepted.
  pub fn apply_set_cookie_headers<'a>(&mut self, set_cookie_values: impl Iterator<Item = &'a str>, request_url: &Url) -> usize {
    set_cookie_values.filter(|value| self.apply_set_cookie_header(value, request_url)).count()
  }

  pub fn clear_all(&mut self) {
    self.store.clear();
    self.change_log.record(CookieChangeAction::Cleared, "*", None);
  }

  /// Whether an unexpired cookie with this name exists on any domain.
  pub fn has_cookie(&self, name: &str) -> bool {
    self.store.iter_unexpired().any(|cookie| cookie.name() == name)
  }

  /// The value of the first unexpired cookie with this name, on any domain.
  pub fn get_cookie_value(&self, name: &str) -> Option<&str> {
    self.store.iter_unexpired().find(|cookie| cookie.name() == name).map(|cookie| cookie.value())
  }

  /// `(name, value)` pairs of every unexpired cookie, across all domains.
  pub fn iter_name_values(&self) -> impl Iterator<Item = (&str, &str)> {
    self.store.iter_unexpired().map(|cookie| (cookie.name(), cookie.value()))
  }

  /// Names of every unexpired cookie, across all domains.
  pub fn cookie_names(&self) -> Vec<String> {
    self.iter_name_values().map(|(name, _)| name.to_owned()).collect()
  }

  pub fn len(&self) -> usize {
    self.store.iter_unexpired().count()
  }

  pub fn is_empty(&self) -> bool {
    self.store.iter_unexpired().next().is_none()
  }

  /// NB: Just use this as a heuristic, and do not call it in a loop.
  pub fn calculate_approx_cookie_character_length(&self) -> usize {
    const COOKIE_SEP_LENGTH: usize = 2; // '=' and ';'
    self.iter_name_values().map(|(name, value)| name.len() + value.len() + COOKIE_SEP_LENGTH).sum()
  }

  /// Every unexpired cookie joined into one `Cookie:` header string,
  /// regardless of domain or path.
  ///
  /// This is a blunt tool for scraping clients that captured cookies for one
  /// known site and want to send them all back. It performs no request
  /// matching; two same-named cookies on different domains both appear.
  /// Prefer [`Self::cookie_header_for_url`] when the request URL is known.
  pub fn to_cookie_string(&self) -> String {
    self.iter_name_values().map(|(name, value)| format!("{}={}", name, value)).collect::<Vec<String>>().join("; ")
  }

  /// A `Cookie:` header value containing only the cookies that RFC 6265
  /// domain/path/secure matching would send to `request_url`, or `None` when
  /// no cookies match.
  pub fn cookie_header_for_url(&self, request_url: &Url) -> Option<String> {
    let header = self.store.get_request_values(request_url).map(|(name, value)| format!("{}={}", name, value)).collect::<Vec<String>>().join("; ");
    if header.is_empty() { None } else { Some(header) }
  }

  /// The recent mutation history, for debugging.
  pub fn change_log(&self) -> &CookieChangeLog {
    &self.change_log
  }

  pub(crate) fn rfc_store(&self) -> &CookieStoreRfc {
    &self.store
  }

  pub(crate) fn insert_raw(&mut self, raw: &RawCookie<'static>, source_url: &Url) -> bool {
    let cookie_name = raw.name().to_owned();
    let result = self.store.insert_raw(raw, source_url);
    self.record_insert_result(result, &cookie_name, source_url)
  }

  fn record_insert_result(&mut self, result: Result<StoreAction, CookieError>, cookie_name: &str, request_url: &Url) -> bool {
    let maybe_domain = request_url.host_str().map(str::to_owned);
    match result {
      Ok(StoreAction::Inserted) => {
        self.change_log.record(CookieChangeAction::Inserted, cookie_name, maybe_domain);
        true
      },
      Ok(StoreAction::UpdatedExisting) => {
        self.change_log.record(CookieChangeAction::Updated, cookie_name, maybe_domain);
        true
      },
      Ok(StoreAction::ExpiredExisting) => {
        self.change_log.record(CookieChangeAction::ExpiredByServer, cookie_name, maybe_domain);
        true
      },
      Err(err) => {
        warn!("Rejected cookie {:?} from {}: {:?}", cookie_name, request_url, err);
        self.change_log.record(CookieChangeAction::Rejected, cookie_name, maybe_domain);
        false
      },
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::change_log::CookieChangeAction;

  const SITE_URL: &str = "https://www.example.com/";

  mod insert_tests {
    use super::*;

    #[test]
    fn insert_named_stores_host_only_cookie() {
      let mut store = CookieStore::empty();
      assert!(store.insert_named("session", "abc123", &site_url()));

      assert!(store.has_cookie("session"));
      assert_eq!(store.get_cookie_value("session"), Some("abc123"));
      assert_eq!(store.len(), 1);
    }

    #[test]
    fn insert_named_replaces_existing_value() {
      let mut store = CookieStore::empty();
      store.insert_named("session", "old", &site_url());
      store.insert_named("session", "new", &site_url());

      assert_eq!(store.len(), 1);
      assert_eq!(store.get_cookie_value("session"), Some("new"));
    }

    #[test]
    fn insert_captured_with_parent_domain_matches_subdomains() {
      let mut store = CookieStore::empty();
      let captured = CapturedCookie { name: "auth".to_string(), value: "token".to_string(), maybe_domain: Some(".example.com".to_string()), maybe_path: None };
      assert!(store.insert_captured(captured, &site_url()));

      let subdomain_url = Url::parse("https://api.example.com/v1/things").unwrap();
      assert_eq!(store.cookie_header_for_url(&subdomain_url), Some("auth=token".to_string()));
    }

    #[test]
    fn insert_captured_without_domain_falls_back_to_source_url() {
      let mut store = CookieStore::empty();
      let captured = CapturedCookie { name: "sid".to_string(), value: "xyz".to_string(), maybe_domain: None, maybe_path: None };
      assert!(store.insert_captured(captured, &site_url()));

      assert_eq!(store.cookie_header_for_url(&site_url()), Some("sid=xyz".to_string()));
    }
  }

  mod set_cookie_header_tests {
    use super::*;

    #[test]
    fn apply_set_cookie_header_stores_cookie() {
      let mut store = CookieStore::empty();
      assert!(store.apply_set_cookie_header("session=abc; Path=/; HttpOnly", &site_url()));
      assert_eq!(store.get_cookie_value("session"), Some("abc"));
    }

    #[test]
    fn expired_set_cookie_deletes_existing_cookie() {
      let mut store = CookieStore::empty();
      store.apply_set_cookie_header("session=abc; Path=/", &site_url());
      assert!(store.has_cookie("session"));

      let accepted = store.apply_set_cookie_header("session=gone; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT", &site_url());
      assert!(accepted);
      assert!(!store.has_cookie("session"));
    }

    #[test]
    fn set_cookie_for_mismatched_domain_is_rejected() {
      let mut store = CookieStore::empty();
      let accepted = store.apply_set_cookie_header("evil=1; Domain=other.com", &site_url());
      assert!(!accepted);
      assert!(!store.has_cookie("evil"));
    }
  }

  mod header_rendering_tests {
    use super::*;

    #[test]
    fn to_cookie_string_joins_all_cookies() {
      let mut store = CookieStore::empty();
      store.insert_named("a", "1", &site_url());
      store.insert_named("b", "2", &site_url());

      let header = store.to_cookie_string();
      let mut parts = header.split("; ").collect::<Vec<_>>();
      parts.sort();
      assert_eq!(parts, vec!["a=1", "b=2"]);
    }

    #[test]
    fn cookie_header_for_url_excludes_other_hosts() {
      let mut store = CookieStore::empty();
      store.insert_named("mine", "1", &site_url());
      store.insert_named("theirs", "2", &Url::parse("https://other.example.org/").unwrap());

      assert_eq!(store.cookie_header_for_url(&site_url()), Some("mine=1".to_string()));
    }
  }

  mod change_log_tests {
    use super::*;

    #[test]
    fn mutations_are_recorded() {
      let mut store = CookieStore::empty();
      store.insert_named("session", "a", &site_url());
      store.insert_named("session", "b", &site_url());

      let actions = store.change_log().iter().map(|record| record.action).collect::<Vec<_>>();
      assert_eq!(actions, vec![CookieChangeAction::Inserted, CookieChangeAction::Updated]);
    }
  }

  fn site_url() -> Url {
    Url::parse(SITE_URL).unwrap()
  }
}
