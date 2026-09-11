
#[derive(Clone)]
pub struct GrokCookies {
  /// The entire cookies header (for now)
  cookies: String,
}

impl GrokCookies {
  pub fn new(cookies: String) -> Self {
    Self { cookies }
  }

  pub fn as_str(&self) -> &str {
    &self.cookies
  }

  pub fn as_bytes(&self) -> &[u8] {
    self.cookies.as_bytes()
  }

  pub fn to_string(&self) -> String {
    self.cookies.clone()
  }
}
