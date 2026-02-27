use crate::credentials::parse_multi_cookie_header::parse_multi_cookie_header;
use crate::credentials::storyteller_avt_cookie::StorytellerAvtCookie;
use crate::credentials::storyteller_session_cookie::StorytellerSessionCookie;

#[derive(Clone)]
pub struct StorytellerCredentialSet {
  pub avt: Option<StorytellerAvtCookie>,
  pub session: Option<StorytellerSessionCookie>,
}

impl StorytellerCredentialSet {
  pub fn empty() -> Self {
    Self {
      avt: None,
      session: None,
    }
  }
  
  pub fn initialize(
    avt: Option<StorytellerAvtCookie>,
    session: Option<StorytellerSessionCookie>,
  ) -> Self {
    Self {
      avt,
      session,
    }
  }

  pub fn parse_multi_cookie_header(header: &str) -> Result<Option<Self>, cookie::ParseError> {
    parse_multi_cookie_header(header)
  }

  pub fn initialize_with_just_cookie(session: StorytellerSessionCookie) -> Self {
    Self {
      avt: None,
      session: Some(session),
    }
  }

  pub fn initialize_with_just_avt(avt: StorytellerAvtCookie) -> Self {
    Self {
      avt: Some(avt),
      session: None,
    }
  }
  
  pub fn is_empty(&self) -> bool {
    self.avt.is_none() && self.session.is_none()
  }
  
  pub fn equals(&self, other: &Self) -> bool {
    match (&self.avt, &other.avt) {
      (None, None) => {} // Fallthrough
      (Some(avt), Some(other_avt)) => {
        if !avt.equals(other_avt) {
          return false;
        }
      }
      _ => return false,
    }

    match (&self.session, &other.session) {
      (None, None) => {} // Fallthrough
      (Some(session), Some(other_session)) => {
        if !session.equals(other_session) {
          return false;
        }
      }
      _ => return false,
    }

    true
  }
  
  pub fn maybe_as_cookie_header(&self) -> Option<String> {
    let mut cookies = Vec::new();
    
    if let Some(avt) = &self.avt {
      cookies.push(avt.as_cookie_header());
    }

    if let Some(session) = &self.session {
      cookies.push(session.as_cookie_header());
    }

    if cookies.is_empty() {
      None
    } else {
      Some(cookies.join("; "))
    }
  }
}

#[cfg(test)]
mod tests {
  use crate::credentials::storyteller_avt_cookie::StorytellerAvtCookie;
  use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
  use crate::credentials::storyteller_session_cookie::StorytellerSessionCookie;

  mod cookies_header {
    use super::*;

    #[test]
    fn no_cookie() {
      let creds = StorytellerCredentialSet::empty();
      let header = creds.maybe_as_cookie_header();
      assert_eq!(header, None);
    }

    #[test]
    fn avt_cookies_header() {
      let creds = StorytellerCredentialSet::initialize_with_just_avt(
        StorytellerAvtCookie::new("bob".to_string()),
      );

      let header = creds.maybe_as_cookie_header();
      assert_eq!(header, Some("visitor=bob".to_string()));
    }
    
    #[test]
    fn session_cookies_header() {
      let creds = StorytellerCredentialSet::initialize_with_just_cookie(
        StorytellerSessionCookie::new("bob".to_string()),
      );

      let header = creds.maybe_as_cookie_header();
      assert_eq!(header, Some("session=bob".to_string()));
    }
    
    #[test]
    fn both_cookies_header() {
      let creds = StorytellerCredentialSet::initialize(
        Some(StorytellerAvtCookie::new("bob".to_string())),
        Some(StorytellerSessionCookie::new("alice".to_string())),
      );

      let header = creds.maybe_as_cookie_header();
      assert_eq!(header, Some("visitor=bob; session=alice".to_string()));
    }
  }
}
