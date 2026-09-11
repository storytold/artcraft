/// Cookies are the credential required to interact with the Seedance2 Pro API.

#[derive(Clone)]
pub struct KinoviWebCookies {
  cookies: String,
}

impl KinoviWebCookies {
  pub fn new(cookies: String) -> Self {
    KinoviWebCookies { cookies }
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
