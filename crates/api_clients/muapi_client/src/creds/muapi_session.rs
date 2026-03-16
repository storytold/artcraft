use crate::creds::muapi_cookies::MuapiCookies;

/// Holds the full session data needed to make authenticated requests to Muapi.
#[derive(Clone)]
pub struct MuapiSession {
  pub cookies: MuapiCookies,
}

impl MuapiSession {
  pub fn new(cookies: MuapiCookies) -> Self {
    MuapiSession { cookies }
  }

  pub fn from_cookies_string(cookies: String) -> Self {
    MuapiSession {
      cookies: MuapiCookies::new(cookies),
    }
  }
}
