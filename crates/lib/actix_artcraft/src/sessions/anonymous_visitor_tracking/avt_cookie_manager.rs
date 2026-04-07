use actix_web::cookie::time::OffsetDateTime;
use actix_web::cookie::{Cookie, SameSite};
use actix_web::HttpRequest;
use log::warn;

use crate::sessions::anonymous_visitor_tracking::avt_cookie_payload::AvtCookiePayload;
use crate::sessions::anonymous_visitor_tracking::avt_cookie_payload_error::AvtCookiePayloadError;
use crate::sessions::anonymous_visitor_tracking::avt_payload_signer::AvtPayloadSigner;
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;

const VISITOR_COOKIE_NAME : &str = "visitor";

/// Handle "anonymous visitor tracking" cookies.
/// This enables us to associate results with an anonymous user for a better experience,
/// as well as do some form of return visitor tracking.
#[derive(Clone)]
pub struct AvtCookieManager {
  cookie_domain: String,
  payload_signer: AvtPayloadSigner,
}

impl AvtCookieManager {

  pub fn new(cookie_domain: &str, hmac_secret: &str) -> Result<Self, AvtCookiePayloadError> {
    Ok(Self {
      cookie_domain: cookie_domain.to_string(),
      payload_signer: AvtPayloadSigner::new(hmac_secret)?,
    })
  }

  pub fn make_new_cookie(&self) -> Result<Cookie, AvtCookiePayloadError> {
    let token = AnonymousVisitorTrackingToken::generate();
    self.make_new_cookie_with_apriori_token(&token)
  }

  pub fn make_new_cookie_with_apriori_token(
    &self,
    token: &AnonymousVisitorTrackingToken,
  ) -> Result<Cookie, AvtCookiePayloadError> {
    let payload = AvtCookiePayload::from_token(token.clone());
    let jwt_string = self.payload_signer.encode(&payload)?;

    let make_secure = !self.cookie_domain.to_lowercase().contains("jungle.horse")
        && !self.cookie_domain.to_lowercase().contains("localhost");

    let same_site = if make_secure {
      SameSite::None // NB: Allow usage from other domains
    } else {
      SameSite::Lax // NB: You can't set "SameSite=None" on non-secure cookies
    };

    Ok(Cookie::build(VISITOR_COOKIE_NAME, jwt_string)
        .secure(make_secure) // HTTPS-only
        .same_site(same_site)
        .permanent()
        .path("/") // NB: Otherwise it'll be set to `/v1`
        //.domain(&self.cookie_domain)
        //.http_only(true) // Not exposed to Javascript
        .finish())
  }

  pub fn make_delete_cookie(&self) -> Cookie {
    let mut cookie = Cookie::build(VISITOR_COOKIE_NAME, "DELETED")
        .expires(OffsetDateTime::UNIX_EPOCH)
        .path("/") // NB: Otherwise it'll be set to `/v1`
        .finish();
    cookie.make_removal();
    cookie
  }

  pub fn decode_cookie_payload(
    &self,
    visitor_cookie: &Cookie,
  ) -> Result<AvtCookiePayload, AvtCookiePayloadError> {
    self.payload_signer.decode(visitor_cookie.value())
  }

  pub fn decode_cookie_payload_from_request(
    &self,
    request: &HttpRequest,
  ) -> Result<Option<AvtCookiePayload>, AvtCookiePayloadError> {
    let cookie = match request.cookie(VISITOR_COOKIE_NAME) {
      None => return Ok(None),
      Some(cookie) => cookie,
    };

    match self.decode_cookie_payload(&cookie) {
      Err(e) => {
        warn!("Visitor cookie decode error: {:?}", e);
        Err(e)
      },
      Ok(payload) => Ok(Some(payload)),
    }
  }

  pub fn get_avt_token_from_request(
    &self,
    request: &HttpRequest,
  ) -> Option<AnonymousVisitorTrackingToken> {
    self.decode_cookie_payload_from_request(request)
        .ok()
        .flatten()
        .map(|payload| payload.avt_token)
  }
}

#[cfg(test)]
mod tests {
  use actix_web::test::TestRequest;

  use crate::sessions::anonymous_visitor_tracking::avt_cookie_manager::AvtCookieManager;
  use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;

  #[test]
  fn test_create_cookie() {
    // NB: Stable encoding test. If this changes we should bump the cookie version
    //     so we don't accidentally invalidate visitor tracking on existing cookies.
    let manager = AvtCookieManager::new("fakeyou.com", "secret").unwrap();
    let token = AnonymousVisitorTrackingToken::new_from_str("avt_ex_anonymous_visitor_tracking_token");
    let cookie = manager.make_new_cookie_with_apriori_token(&token).unwrap();

    assert_eq!(cookie.value(), "eyJhbGciOiJIUzI1NiJ9.eyJhdnRfdG9rZW4iOiJhdnRfZXhfYW5vbnltb3VzX3Zpc2l0b3JfdHJhY2tpbmdfdG9rZW4iLCJjb29raWVfdmVyc2lvbiI6IjEifQ.w0KRxBxiyBfTZGxaezRa0IgD8ojmCnhRH4SS33Nq3O8");
  }

  #[test]
  fn test_cookie_round_trip() {
    let manager = AvtCookieManager::new("fakeyou.com", "secret").unwrap();
    let token = AnonymousVisitorTrackingToken::new_from_str("avt_ex_anonymous_visitor_tracking_token");
    let cookie = manager.make_new_cookie_with_apriori_token(&token).unwrap();

    let http_request = TestRequest::default()
        .cookie(cookie)
        .to_http_request();

    let decoded = manager.decode_cookie_payload_from_request(&http_request)
        .expect("no error")
        .expect("must exist");

    assert_eq!(decoded.avt_token.as_str(), "avt_ex_anonymous_visitor_tracking_token");
    assert_eq!(decoded.cookie_version, 1);
  }
}
