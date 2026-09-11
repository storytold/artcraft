/// Cookies are the credential that are always required.
/// You can mint a JWT bearer token with just the cookies.

#[derive(Clone)]
pub struct SoraCookies {
  cookies: String,
}

impl SoraCookies {
  pub fn new(cookies: String) -> Self {
    SoraCookies { cookies }
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
