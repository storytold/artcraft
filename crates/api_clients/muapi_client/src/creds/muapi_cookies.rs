/// Cookies are the credential required to interact with the Muapi API.

#[derive(Clone)]
pub struct MuapiCookies {
  cookies: String,
}

impl MuapiCookies {
  pub fn new(cookies: String) -> Self {
    MuapiCookies { cookies }
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
