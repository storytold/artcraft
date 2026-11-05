use crate::cookie::Cookie;
use crate::serialized_cookie_store::{SerializableCookieStore, SerializedCookie};
use std::collections::HashMap;

#[derive(Clone)]
pub struct CookieStore {
  // TODO: This doesn't yet handle partial paths, subdomain rules, etc.
  pub cookies: HashMap<String, Cookie>,
}

impl CookieStore {
  pub fn empty() -> Self {
    Self {
      cookies: HashMap::new(),
    }
  }

  pub fn add_cookie(&mut self, cookie: Cookie) {
    self.cookies.insert(cookie.name.clone(), cookie);
  }

  pub fn add_cookie_name_and_value(&mut self, name: String, value: String) {
    self.add_cookie(Cookie {
      name,
      value,
    });
  }

  pub fn get_cookie(&self, name: &str) -> Option<&Cookie> {
    self.cookies.get(name)
  }
  
  pub fn has_cookie(&self, name: &str) -> bool {
    self.cookies.contains_key(name)
  }

  pub fn remove_cookie(&mut self, name: &str) {
    self.cookies.remove(name);
  }
  
  pub fn len(&self) -> usize {
    self.cookies.len()
  }

  pub fn clear_all(&mut self) {
    self.cookies.clear();
  }

  /// NB: Just use this as a heuristic, and do not call it in a loop.
  pub fn calculate_approx_cookie_character_length(&self) -> usize {
    const COOKIE_SEP_LENGTH: usize = 2; // '=' and ';'
    self.cookies
        .values()
        .map(|cookie| cookie.name.len() + cookie.value.len() + COOKIE_SEP_LENGTH)
        .sum()
  }

  pub fn to_cookie_string(&self) -> String {
    self
      .cookies
      .values()
      .map(|cookie| format!("{}={}", cookie.name, cookie.value))
      .collect::<Vec<String>>()
      .join("; ")
  }

  pub fn to_serializable(&self) -> SerializableCookieStore {
    let cookies = self
      .cookies
      .values()
      .map(|cookie| SerializedCookie {
        name: cookie.name.clone(),
        value: cookie.value.clone(),
      })
      .collect();
    SerializableCookieStore { cookies }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn adding_a_cookie_with_the_same_name_replaces_it() {
    let mut store = CookieStore::empty();
    store.add_cookie_name_and_value("session".to_string(), "old".to_string());
    store.add_cookie_name_and_value("session".to_string(), "new".to_string());
    assert_eq!(store.len(), 1);
    assert_eq!(store.get_cookie("session").unwrap().value, "new");
  }

  #[test]
  fn has_cookie_and_remove_cookie() {
    let mut store = CookieStore::empty();
    store.add_cookie_name_and_value("a".to_string(), "1".to_string());
    assert!(store.has_cookie("a"));
    assert!(!store.has_cookie("b"));
    store.remove_cookie("a");
    assert!(!store.has_cookie("a"));
    store.remove_cookie("never-added"); // Removing a missing cookie does nothing.
    assert_eq!(store.len(), 0);
  }

  #[test]
  fn clear_all_removes_every_cookie() {
    let mut store = CookieStore::empty();
    store.add_cookie_name_and_value("a".to_string(), "1".to_string());
    store.add_cookie_name_and_value("b".to_string(), "2".to_string());
    store.clear_all();
    assert_eq!(store.len(), 0);
    assert_eq!(store.to_cookie_string(), "");
  }

  #[test]
  fn cookie_string_joins_name_value_pairs_with_semicolons() {
    let mut store = CookieStore::empty();
    assert_eq!(store.to_cookie_string(), "");
    store.add_cookie_name_and_value("a".to_string(), "1".to_string());
    assert_eq!(store.to_cookie_string(), "a=1");
    store.add_cookie_name_and_value("b".to_string(), "2".to_string());
    // NB: The order of a HashMap is not defined, so compare as a set of pairs.
    let string = store.to_cookie_string();
    let mut pairs = string.split("; ").collect::<Vec<_>>();
    pairs.sort();
    assert_eq!(pairs, vec!["a=1", "b=2"]);
  }

  #[test]
  fn serializable_form_keeps_every_cookie() {
    let mut store = CookieStore::empty();
    store.add_cookie_name_and_value("a".to_string(), "1".to_string());
    store.add_cookie_name_and_value("b".to_string(), "2".to_string());
    let serializable = store.to_serializable();
    let mut cookies = serializable.cookies.iter().map(|c| (c.name.clone(), c.value.clone())).collect::<Vec<_>>();
    cookies.sort();
    assert_eq!(cookies, vec![("a".to_string(), "1".to_string()), ("b".to_string(), "2".to_string())]);
  }
}
