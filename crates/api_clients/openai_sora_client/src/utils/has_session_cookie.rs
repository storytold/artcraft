use cookie::Cookie;
use errors::AnyhowResult;
use once_cell::sync::Lazy;
use std::collections::HashSet;

pub const SESSION_COOKIE_NAME_OLD : &str = "__Secure-authjs.session-token";
pub const SESSION_COOKIE_NAME_NEW : &str = "__Secure-next-auth.session-token";

/// Cookies Sora.com mints that are not the session cookie. We can ignore these.
/// This list is very likely to change over time.
const IRRELEVANT_COOKIE_NAMES: Lazy<HashSet<&'static str>> = Lazy::new(|| {
  HashSet::from([
    "cf_clearance",
    "oai-did",
    "_cfuvid",
    "__cflb",
    "__cf_bm",
    "__Host-authjs.csrf-token",
    "__Secure-authjs.callback-url",
    "__Secure-authjs.pkce.code_verifier",
    "__Secure-authjs.state",
  ])
});

/// Super naive heuristic for "logged out" total cookie length being ~1972 characters.
const SESSION_COOKIE_LENGTH_HEURISTIC : usize = 2000;

//pub fn has_session_cookie(cookies: &str) -> bool {
//  // NB: This is not a valid check for cookies, just a cheap heuristic.
//  cookies.contains(SESSION_COOKIE_NAME)
//}

#[derive(Copy,Clone,Eq,PartialEq,Debug)]
pub enum SessionCookiePresence {
  Present,
  MaybePresent,
  Absent,
}

/// OpenAI might change the name of the session cookie, and we don't want to break clients,
/// so we use some heuristics to determine if the cookie might be present.
pub fn has_session_cookie(cookies_header: &str) -> AnyhowResult<SessionCookiePresence> {
  let cookies_header = cookies_header.trim();
  if (cookies_header.is_empty()) {
    return Ok(SessionCookiePresence::Absent);
  }

  let cookies = Cookie::split_parse(cookies_header);
  let mut unknown_cookie_count = 0; // NB: In the event they change their session cookie

  for cookie in cookies {
    let cookie= cookie?;
    let cookie_name = cookie.name();
    if cookie_name == SESSION_COOKIE_NAME_NEW {
      return Ok(SessionCookiePresence::Present);
    } else if cookie_name == SESSION_COOKIE_NAME_OLD {
      return Ok(SessionCookiePresence::Present);
    } else if !IRRELEVANT_COOKIE_NAMES.contains(cookie_name) {
      unknown_cookie_count += 1;
    }
  }

  // This is a really stupid heuristic, but we want to be safe.
  if cookies_header.len() > SESSION_COOKIE_LENGTH_HEURISTIC {
    return Ok(SessionCookiePresence::MaybePresent);
  }

  // Another stupid heuristic.
  if unknown_cookie_count > 3 {
    return Ok(SessionCookiePresence::MaybePresent);
  }

  Ok(SessionCookiePresence::Absent)
}

#[cfg(test)]
mod tests {
  use crate::utils::has_session_cookie::{has_session_cookie, SessionCookiePresence};

  #[test]
  fn test() {
    assert_eq!(has_session_cookie("").unwrap(), SessionCookiePresence::Absent);
    assert_eq!(has_session_cookie("foo=bar").unwrap(), SessionCookiePresence::Absent);

    // Heuristic: unknown cookies.
    assert_eq!(has_session_cookie("foo=bar;bin=baz;bat=ban;bash=barn").unwrap(), SessionCookiePresence::MaybePresent);

    // Heuristic: cookie length
    let cookies = format!("cookie={}", "a".repeat(10000));
    assert_eq!(has_session_cookie(&cookies).unwrap(), SessionCookiePresence::MaybePresent);

    // Synthetic fixture (the original real session token was redacted); the session
    // cookie name is what matters for detection.
    let cookies = "__Host-authjs.csrf-token=abc123; \
      __Secure-authjs.callback-url=https%3A%2F%2Fsora.com%2F; \
      __Secure-authjs.session-token=fake-session-token-value";

    assert_eq!(has_session_cookie(cookies).unwrap(), SessionCookiePresence::Present);

    let cookies = "__Secure-next-auth.session-token=fake-session-token-value";

    assert_eq!(has_session_cookie(cookies).unwrap(), SessionCookiePresence::Present);
  }
}
