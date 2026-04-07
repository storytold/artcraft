// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use actix_web::cookie::time::OffsetDateTime;
use actix_web::cookie::{Cookie, SameSite};
use actix_web::HttpRequest;
use log::warn;

use crate::sessions::http_user_session_payload::HttpUserSessionPayload;
use crate::sessions::http_user_session_payload_signer::HttpUserSessionPayloadSigner;
use crate::sessions::http_user_session_payload_error::HttpUserSessionPayloadError;
use tokens::tokens::user_sessions::UserSessionToken;
use tokens::tokens::users::UserToken;

/// Name of the HTTP cookie that carries the session payload
const SESSION_COOKIE_NAME : &str = "session";

/// Name of the HTTP header that carries the session payload
const SESSION_HEADER_NAME : &str = "session";

// TODO(echelon,2022-08-29): Make a CryptedCookieManager that this uses.
// TODO(echelon,2022-08-29): Fix how domains and "secure" cookies are handled

#[derive(Clone)]
pub struct HttpUserSessionManager {
  cookie_domain: String,
  payload_signer: HttpUserSessionPayloadSigner,
}

impl HttpUserSessionManager {
  pub fn new(cookie_domain: &str, hmac_secret: &str) -> Result<Self, HttpUserSessionPayloadError> {
    let payload_signer = HttpUserSessionPayloadSigner::new(hmac_secret)
      .map_err(|e| {
        warn!("Failed to construct HttpUserSessionPayloadSigner: {}", e);
        e
      })?;

    Ok(Self {
      cookie_domain: cookie_domain.to_string(),
      payload_signer,
    })
  }

  pub fn encode_session_payload(
    &self,
    session_token: &UserSessionToken,
    user_token: &UserToken,
  ) -> Result<String, HttpUserSessionPayloadError> {
    self.payload_signer.encode(session_token, user_token)
      .map_err(|e| {
        warn!("Failed to encode session payload: {}", e);
        e
      })
  }

  pub fn create_cookie(
    &self,
    session_token: &UserSessionToken,
    user_token: &UserToken,
  ) -> Result<Cookie, HttpUserSessionPayloadError> {
    let jwt_string = self.payload_signer.encode(session_token, user_token)
      .map_err(|e| {
        warn!("Failed to encode session cookie payload: {}", e);
        e
      })?;

    let make_secure = !self.cookie_domain.to_lowercase().contains("jungle.horse")
      && !self.cookie_domain.to_lowercase().contains("localhost");

    let same_site = if make_secure {
      SameSite::None // NB: Allow usage from other domains
    } else {
      SameSite::Lax // NB: You can't set "SameSite=None" on non-secure cookies
    };

    Ok(Cookie::build(SESSION_COOKIE_NAME, jwt_string)
      .secure(make_secure) // HTTPS-only
      .same_site(same_site)
      .permanent()
      .path("/") // NB: Otherwise it'll be set to `/v1`
      //.domain(&self.cookie_domain)
      //.http_only(true) // Not exposed to Javascript
      //.expires(OffsetDateTime::now_utc() + time::Duration::days(365))
      .finish())
  }

  pub fn delete_cookie(&self) -> Cookie {
    let mut cookie = Cookie::build(SESSION_COOKIE_NAME, "DELETED")
      .path("/") // NB: Otherwise it'll be set to `/v1`
      .expires(OffsetDateTime::UNIX_EPOCH)
      .finish();
    cookie.make_removal();
    cookie
  }

  pub fn decode_session_payload_from_request(
    &self,
    request: &HttpRequest,
  ) -> Result<Option<HttpUserSessionPayload>, HttpUserSessionPayloadError>
  {
    let signed_session_payload = self.session_payload_from_request(request)?;

    let signed_session_payload = match signed_session_payload {
      Some(payload) => payload,
      None => return Ok(None),
    };

    match self.payload_signer.decode(&signed_session_payload) {
      Err(e) => {
        warn!("Session cookie decode error: {}", e);
        Err(e)
      },
      Ok(payload) => Ok(Some(payload)),
    }
  }

  // NB: THIS IS ONLY FOR A QUICK HACK FOR FREAKING CORS UGH
  // THIS IS A HUGE STUPID SECURITY VULN. DAMNIT GOOGLE DAMNIT CORS.
  pub fn check_and_return_session_token_decodes(
    &self,
    request: &HttpRequest,
  ) -> Result<Option<String>, HttpUserSessionPayloadError> {
    let signed_session_payload = self.session_payload_from_request(request)?;

    let signed_session_payload = match signed_session_payload {
      Some(payload) => payload,
      None => return Ok(None),
    };

    match self.payload_signer.decode(&signed_session_payload) {
      Err(e) => {
        warn!("Session cookie decode error: {}", e);
        return Err(e);
      },
      Ok(_payload) => {}, // Good! We'll just discard this.
    }

    Ok(Some(signed_session_payload))
  }

  fn session_payload_from_request(
    &self,
    request: &HttpRequest,
  ) -> Result<Option<String>, HttpUserSessionPayloadError> {
    let mut signed_session_payload = request.cookie(SESSION_COOKIE_NAME)
        .map(|cookie| cookie.value().to_string());

    if signed_session_payload.is_none() {
      let maybe_header = request.headers().get(SESSION_HEADER_NAME);
      if let Some(header) = maybe_header {
        let header_str = header.to_str()
          .map_err(|e| {
            warn!("Failed to read session HTTP header as str: {}", e);
            HttpUserSessionPayloadError::HttpSessionHeaderError(e.to_string())
          })?;
        signed_session_payload = Some(header_str.to_string());
      }
    }

    Ok(signed_session_payload)
  }
}

#[cfg(test)]
mod tests {
  use actix_web::test::TestRequest;

  use tokens::tokens::user_sessions::UserSessionToken;
  use tokens::tokens::users::UserToken;

  use crate::sessions::http_user_session_manager::HttpUserSessionManager;

  #[test]
  fn test_create_cookie_payload() {
    // NB: Let's make extra sure this always works when migrating cookies, else we'll accidentally log out logged-in users.
    // (These are version 3 cookies.)
    let manager = HttpUserSessionManager::new("fakeyou.com", "secret").unwrap();
    let cookie = manager.create_cookie(&UserSessionToken::new_from_str("ex_session_token"), &UserToken::new_from_str("ex_user_token")).unwrap();

    assert_eq!(cookie.value(), "eyJhbGciOiJIUzI1NiJ9.eyJzZXNzaW9uX3Rva2VuIjoiZXhfc2Vzc2lvbl90b2tlbiIsInVzZXJfdG9rZW4iOiJleF91c2VyX3Rva2VuIiwidmVyc2lvbiI6IjMifQ.HvWfrH8PpozpxN4HKh9mcW6f2Q4yZmi2ycdJw3WNR9o");
  }

  #[test]
  fn test_cookie_round_trip() {
    // NB: Let's make extra sure this always works when migrating cookies, else we'll accidentally log out logged-in users.
    // (These are version 3 cookies.)
    let manager = HttpUserSessionManager::new("fakeyou.com", "secret").unwrap();
    let cookie = manager.create_cookie(&UserSessionToken::new_from_str("ex_session_token"), &UserToken::new_from_str("ex_user_token")).unwrap();

    let http_request = TestRequest::default()
        .cookie(cookie)
        .to_http_request();

    let decoded = manager.decode_session_payload_from_request(&http_request)
        .expect("no error")
        .expect("must exist");

    assert_eq!(decoded.session_token, "ex_session_token".to_string());
    assert_eq!(decoded.maybe_user_token, Some("ex_user_token".to_string()));
  }

  #[test]
  fn test_header() {
    let manager = HttpUserSessionManager::new("fakeyou.com", "secret").unwrap();
    let encoded_value = manager.payload_signer.encode(&UserSessionToken::new_from_str("ex_session_token"), &UserToken::new_from_str("ex_user_token")).unwrap();

    let http_request = TestRequest::default()
        .insert_header(("session", encoded_value.as_str()))
        .to_http_request();

    let decoded = manager.decode_session_payload_from_request(&http_request)
        .expect("no error")
        .expect("must exist");

    assert_eq!(decoded.session_token, "ex_session_token".to_string());
    assert_eq!(decoded.maybe_user_token, Some("ex_user_token".to_string()));
  }
}
