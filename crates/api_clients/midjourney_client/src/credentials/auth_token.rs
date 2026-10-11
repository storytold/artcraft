//! Reading Midjourney's Firebase auth token (the `__Host-Midjourney.AuthUserTokenV3_i` cookie).
//! Its JWT payload is decoded WITHOUT verifying the signature: it's only used to learn the user
//! id, the email and when the token expires, never to trust anything.

use base64::Engine;
use base64::prelude::BASE64_URL_SAFE_NO_PAD;
use serde_json::Value;

use crate::credentials::cookie_names::AUTH_COOKIE_NAME_I;
use crate::credentials::midjourney_user_id::MidjourneyUserId;

/// The claim holding the Midjourney user id (the `singleplayer_{...}` channel id is built from
/// it).
const MIDJOURNEY_ID_CLAIM: &str = "midjourney_id";
/// Refresh this long before the token expires (seconds).
const REFRESH_MARGIN_SECS: i64 = 120;

/// The (unverified) payload of a `header.payload.signature` JWT.
pub fn jwt_claims(token: &str) -> Option<Value> {
  let mut parts = token.split('.');
  let (_header, payload, _signature) = (parts.next()?, parts.next()?, parts.next()?);
  if parts.next().is_some() {
    return None;
  }
  serde_json::from_slice(&BASE64_URL_SAFE_NO_PAD.decode(payload).ok()?).ok()
}

/// Whether the token is missing, unreadable, expired or about to expire.
pub fn token_needs_refresh(maybe_token: Option<&str>, now: i64) -> bool {
  maybe_token.and_then(jwt_claims).and_then(|claims| claims.get("exp")?.as_i64()).is_none_or(|expires| expires <= now + REFRESH_MARGIN_SECS)
}

/// The Midjourney user id from the auth token's claims.
pub fn user_id_from_token(token: &str) -> Option<MidjourneyUserId> {
  let claims = jwt_claims(token)?;
  claims.get(MIDJOURNEY_ID_CLAIM).and_then(Value::as_str).filter(|id| !id.is_empty()).map(MidjourneyUserId::from_str)
}

/// The Midjourney user id from a raw `Cookie:` header (`"a=1; b=2"`), without hitting the
/// Cloudflare-gated index page.
pub fn extract_midjourney_user_id_from_cookie_header(cookie_header: &str) -> Option<MidjourneyUserId> {
  let token = cookie_header.split(';').filter_map(|pair| pair.trim().split_once('=')).find(|(name, _)| *name == AUTH_COOKIE_NAME_I).map(|(_, value)| value)?;
  user_id_from_token(token)
}

#[cfg(test)]
mod tests {
  use super::*;

  // Payload: {"midjourney_id":"26c9d38d-1f71-49c7-a356-b29dac58b54c","name":"u1"}
  const JWT: &str = "eyJhbGciOiJIUzI1NiJ9.eyJtaWRqb3VybmV5X2lkIjoiMjZjOWQzOGQtMWY3MS00OWM3LWEzNTYtYjI5ZGFjNThiNTRjIiwibmFtZSI6InUxIn0.sig";

  #[test]
  fn extracts_user_id_from_auth_cookie() {
    let header = format!("_fbp=abc; {}={}; other=x", AUTH_COOKIE_NAME_I, JWT);
    let user_id = extract_midjourney_user_id_from_cookie_header(&header).unwrap();
    assert_eq!(user_id.as_str(), "26c9d38d-1f71-49c7-a356-b29dac58b54c");
  }

  #[test]
  fn returns_none_without_auth_cookie() {
    assert!(extract_midjourney_user_id_from_cookie_header("_fbp=abc; other=x").is_none());
  }

  #[test]
  fn refreshes_before_expiry_but_does_not_refresh_a_fresh_token() {
    assert!(!token_needs_refresh(Some(&token(5000)), 1000));
    assert!(token_needs_refresh(Some(&token(1120)), 1000));
    assert!(token_needs_refresh(Some(&token(999)), 1000));
    assert!(token_needs_refresh(Some("invalid"), 1000));
    assert!(token_needs_refresh(None, 1000));
  }

  fn token(exp: i64) -> String {
    format!("header.{}.signature", BASE64_URL_SAFE_NO_PAD.encode(serde_json::json!({ "exp": exp }).to_string()))
  }
}
