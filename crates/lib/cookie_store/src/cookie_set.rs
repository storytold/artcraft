use crate::cookie::Cookie;
use std::collections::HashMap;

pub struct CookieSet {
  // TODO: This doesn't yet handle partial paths, subddomain rules, etc.
  pub cookies: HashMap<String, Cookie>,
}

impl CookieSet {
  pub fn new() -> Self {
    Self {
      cookies: HashMap::new(),
    }
  }

  pub fn add_cookie(&mut self, cookie: Cookie) {
    self.cookies.insert(cookie.name.clone(), cookie);
  }

  pub fn get_cookie(&self, name: &str) -> Option<&Cookie> {
    self.cookies.get(name)
  }

  pub fn remove_cookie(&mut self, name: &str) {
    self.cookies.remove(name);
  }

  pub fn to_cookie_string(&self) -> String {
    self
      .cookies
      .values()
      .map(|cookie| format!("{}={}", cookie.name, cookie.value))
      .collect::<Vec<String>>()
      .join("; ")
  }
}
