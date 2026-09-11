use crate::creds::kinovi_web_cookies::KinoviWebCookies;

/// Holds the full session data needed to make authenticated requests to Seedance2 Pro.
#[derive(Clone)]
pub struct KinoviWebSession {
  pub cookies: KinoviWebCookies,
}

impl KinoviWebSession {
  pub fn new(cookies: KinoviWebCookies) -> Self {
    KinoviWebSession { cookies }
  }

  pub fn from_cookies_string(cookies: String) -> Self {
    KinoviWebSession {
      cookies: KinoviWebCookies::new(cookies),
    }
  }
}
