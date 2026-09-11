use cookie::Cookie;

const AVT_COOKIE_NAME : &str = "visitor";

/// The "anonymous visitor token" cookie allows users to interact with
/// the service in a logged-out state with some continuity.
#[derive(Clone)]
pub struct StorytellerAvtCookie {
  cookie: String,
}

impl StorytellerAvtCookie {
  pub fn new(cookie: String) -> Self {
    Self { cookie }
  }

  pub fn maybe_from_cookie(cookie: &Cookie) -> Option<Self> {
    if cookie.name() == AVT_COOKIE_NAME {
      Some(Self::new(cookie.value().to_string()))
    } else {
      None
    }
  }

  pub fn as_str(&self) -> &str {
    &self.cookie
  }

  pub fn as_bytes(&self) -> &[u8] {
    self.cookie.as_bytes()
  }

  pub fn to_string(&self) -> String {
    self.cookie.clone()
  }
  
  pub fn equals(&self, other: &Self) -> bool {
    self.cookie == other.cookie
  }

  pub fn as_cookie_header(&self) -> String {
    format!("{}={}", AVT_COOKIE_NAME, self.cookie)
  }
}
