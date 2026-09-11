use cookie::Cookie;

const SESSION_COOKIE_NAME : &str = "session";

/// The primary FakeYou / Storyteller / Artcraft backend session identifier.
#[derive(Clone)]
pub struct StorytellerSessionCookie {
  cookie: String,
}

impl StorytellerSessionCookie {
  pub fn new(cookie: String) -> Self {
    Self { cookie }
  }
  
  pub fn maybe_from_cookie(cookie: &Cookie) -> Option<Self> {
    if cookie.name() == SESSION_COOKIE_NAME {
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
    format!("{}={}", SESSION_COOKIE_NAME, self.cookie)
  }
}
