use crate::credentials::storyteller_avt_cookie::StorytellerAvtCookie;
use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::credentials::storyteller_session_cookie::StorytellerSessionCookie;
use cookie::Cookie;

/// Parses a multi-cookie header string (e.g. `"visitor=abc; session=xyz"`) and extracts
/// the known Storyteller cookies by name.
///
/// Returns `Ok(Some(...))` if at least one recognised cookie is present,
/// `Ok(None)` if the input is empty or contains no recognised cookies,
/// and `Err` if any individual cookie segment fails to parse.
pub fn parse_multi_cookie_header(header: &str) -> Result<Option<StorytellerCredentialSet>, cookie::ParseError> {
  let mut avt: Option<StorytellerAvtCookie> = None;
  let mut session: Option<StorytellerSessionCookie> = None;

  for segment in header.split(';') {
    let segment = segment.trim();
    if segment.is_empty() {
      continue;
    }
    let cookie = Cookie::parse(segment.to_owned())?;
    if avt.is_none() {
      avt = StorytellerAvtCookie::maybe_from_cookie(&cookie);
    }
    if session.is_none() {
      session = StorytellerSessionCookie::maybe_from_cookie(&cookie);
    }
  }

  if avt.is_none() && session.is_none() {
    return Ok(None);
  }

  Ok(Some(StorytellerCredentialSet::initialize(avt, session)))
}
