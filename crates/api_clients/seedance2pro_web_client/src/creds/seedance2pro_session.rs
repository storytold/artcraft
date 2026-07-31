use crate::creds::seedance2pro_cookies::Seedance2ProCookies;

/// Holds the full session data needed to make authenticated requests to Seedance2 Pro.
#[derive(Clone)]
pub struct Seedance2ProSession {
  pub cookies: Seedance2ProCookies,
}

impl Seedance2ProSession {
  pub fn new(cookies: Seedance2ProCookies) -> Self {
    Seedance2ProSession { cookies }
  }

  pub fn from_cookies_string(cookies: String) -> Self {
    Seedance2ProSession {
      cookies: Seedance2ProCookies::new(cookies),
    }
  }
}
