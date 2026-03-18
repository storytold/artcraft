/// Cookies are the credential required to interact with the Seedance2 Pro API.

#[derive(Clone)]
pub struct Seedance2ProCookies {
  cookies: String,
}

impl Seedance2ProCookies {
  pub fn new(cookies: String) -> Self {
    Seedance2ProCookies { cookies }
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
