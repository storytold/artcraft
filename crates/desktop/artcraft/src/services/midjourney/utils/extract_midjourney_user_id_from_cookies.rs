use base64::prelude::BASE64_URL_SAFE_NO_PAD;
use base64::Engine;
use midjourney_client::credentials::midjourney_user_id::MidjourneyUserId;
use serde_json::Value;

/// The Midjourney auth id-token cookie. Its (unverified) JWT payload carries
/// the Midjourney user id under `midjourney_id`.
const AUTH_ID_TOKEN_COOKIE: &str = "__Host-Midjourney.AuthUserTokenV3_i";

/// The JWT claim holding the Midjourney user id (the `singleplayer_{...}`
/// channel id is built from it).
const MIDJOURNEY_ID_CLAIM: &str = "midjourney_id";

/// Recover the Midjourney user id from the auth cookie's JWT, WITHOUT hitting
/// the Cloudflare-gated index page. `cookie_header` is a raw `Cookie:` header
/// string (`"a=1; b=2"`).
pub fn extract_midjourney_user_id_from_cookie_header(cookie_header: &str) -> Option<MidjourneyUserId> {
  let token = cookie_value(cookie_header, AUTH_ID_TOKEN_COOKIE)?;
  let claims = decode_jwt_payload(token)?;
  let id = claims.get(MIDJOURNEY_ID_CLAIM).and_then(Value::as_str)?;
  if id.is_empty() {
    return None;
  }
  Some(MidjourneyUserId::from_str(id))
}

fn cookie_value<'a>(cookie_header: &'a str, name: &str) -> Option<&'a str> {
  cookie_header.split(';').filter_map(|pair| pair.trim().split_once('=')).find(|(cookie_name, _)| *cookie_name == name).map(|(_, value)| value)
}

/// Decode the (unverified) payload of a `header.payload.signature` JWT.
fn decode_jwt_payload(token: &str) -> Option<Value> {
  let mut parts = token.split('.');
  let _header = parts.next()?;
  let payload = parts.next()?;
  let _signature = parts.next()?;
  if parts.next().is_some() {
    return None;
  }
  let bytes = BASE64_URL_SAFE_NO_PAD.decode(payload).ok()?;
  serde_json::from_slice(&bytes).ok()
}

#[cfg(test)]
mod tests {
  use super::*;

  // Payload: {"midjourney_id":"26c9d38d-1f71-49c7-a356-b29dac58b54c","name":"u1"}
  const JWT: &str = "eyJhbGciOiJIUzI1NiJ9.eyJtaWRqb3VybmV5X2lkIjoiMjZjOWQzOGQtMWY3MS00OWM3LWEzNTYtYjI5ZGFjNThiNTRjIiwibmFtZSI6InUxIn0.sig";

  #[test]
  fn extracts_user_id_from_auth_cookie() {
    let header = format!("_fbp=abc; {}={}; other=x", AUTH_ID_TOKEN_COOKIE, JWT);
    let user_id = extract_midjourney_user_id_from_cookie_header(&header).unwrap();
    assert_eq!(user_id.as_str(), "26c9d38d-1f71-49c7-a356-b29dac58b54c");
  }

  #[test]
  fn returns_none_without_auth_cookie() {
    assert!(extract_midjourney_user_id_from_cookie_header("_fbp=abc; other=x").is_none());
  }
}
