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
