use crate::cookie_store::CookieStore;
use std::sync::{Arc, PoisonError, RwLock};
use url::Url;

/// A cheaply clonable, thread-safe handle to a [`CookieStore`].
///
/// Clones share the same underlying store, so a mutation made by one thread
/// (e.g. a Set-Cookie applied by an HTTP client) is visible to all holders.
/// With the `wreq` feature enabled this type implements wreq's `CookieStore`
/// trait and can be passed to `ClientBuilder::cookie_provider`.
#[derive(Clone, Debug, Default)]
pub struct SharedCookieStore {
  inner: Arc<RwLock<CookieStore>>,
}

impl SharedCookieStore {
  pub fn empty() -> Self {
    Self::default()
  }

  pub fn new(store: CookieStore) -> Self {
    Self { inner: Arc::new(RwLock::new(store)) }
  }

  /// A point-in-time copy of the underlying store.
  pub fn snapshot(&self) -> CookieStore {
    self.with_read(|store| store.clone())
  }

  /// Swap the underlying store for all holders of this handle.
  pub fn replace(&self, store: CookieStore) {
    self.with_write(|current| *current = store);
  }

  pub fn with_read<R>(&self, reader: impl FnOnce(&CookieStore) -> R) -> R {
    // NB: A panic mid-read cannot corrupt the store, so recover from poison.
    let guard = self.inner.read().unwrap_or_else(PoisonError::into_inner);
    reader(&guard)
  }

  pub fn with_write<R>(&self, writer: impl FnOnce(&mut CookieStore) -> R) -> R {
    let mut guard = self.inner.write().unwrap_or_else(PoisonError::into_inner);
    writer(&mut guard)
  }

  pub fn has_cookie(&self, name: &str) -> bool {
    self.with_read(|store| store.has_cookie(name))
  }

  pub fn to_cookie_string(&self) -> String {
    self.with_read(|store| store.to_cookie_string())
  }

  pub fn cookie_header_for_url(&self, request_url: &Url) -> Option<String> {
    self.with_read(|store| store.cookie_header_for_url(request_url))
  }

  pub fn apply_set_cookie_header(&self, set_cookie_value: &str, request_url: &Url) -> bool {
    self.with_write(|store| store.apply_set_cookie_header(set_cookie_value, request_url))
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn clones_share_mutations() {
    let site_url = Url::parse("https://www.example.com/").unwrap();
    let shared = SharedCookieStore::empty();
    let clone = shared.clone();

    clone.apply_set_cookie_header("session=abc; Path=/", &site_url);

    assert!(shared.has_cookie("session"));
    assert_eq!(shared.cookie_header_for_url(&site_url), Some("session=abc".to_string()));
  }
}
