use actix_web::cookie::time::OffsetDateTime;
use actix_web::cookie::{Cookie, SameSite};
use actix_web::HttpRequest;
use log::warn;

use crate::anonymous_visitor_tracking::avt_cookie_error::AvtCookieError;
use crate::anonymous_visitor_tracking::avt_cookie_payload::AvtCookiePayload;
use jwt_signer::jwt_signer::JwtSigner;
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;

const VISITOR_COOKIE_NAME : &str = "visitor";

/// Handle "anonymous visitor tracking" cookies.
/// This enables us to associate results with an anonymous user for a better experience,
/// as well as do some form of return visitor tracking.
#[derive(Clone)]
pub struct AvtCookieManager {
  cookie_domain: String,
  jwt_signer: JwtSigner,
}

impl AvtCookieManager {

  pub fn new(cookie_domain: &str, hmac_secret: &str) -> Result<Self, AvtCookieError> {
    Ok(Self {
      cookie_domain: cookie_domain.to_string(),
      jwt_signer: JwtSigner::new(hmac_secret)?,
    })
  }

  pub fn make_new_cookie(&self) -> Result<Cookie, AvtCookieError> {
    let token = AnonymousVisitorTrackingToken::generate();
    self.make_new_cookie_with_apriori_token(&token)
  }

  pub fn make_new_cookie_with_apriori_token(&self, token: &AnonymousVisitorTrackingToken) -> Result<Cookie, AvtCookieError> {
    let payload = AvtCookiePayload::from_token(token.clone());
    let claims = payload.to_map();
    let jwt_string = self.jwt_signer.claims_to_jwt(&claims)?;

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

  pub fn decode_cookie_payload(&self, visitor_cookie: &Cookie) -> Result<AvtCookiePayload, AvtCookieError> {
    let cookie_contents = visitor_cookie.value().to_string();
    let claims = self.jwt_signer.jwt_to_claims(&cookie_contents)?;
    let payload = AvtCookiePayload::from_map(claims)?;
    Ok(payload)
  }

  pub fn decode_cookie_payload_from_request(&self, request: &HttpRequest) -> Result<Option<AvtCookiePayload>, AvtCookieError> {
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

  pub fn get_avt_token_from_request(&self, request: &HttpRequest) -> Option<AnonymousVisitorTrackingToken> {
    self.decode_cookie_payload_from_request(request)
        .ok()
        .flatten()
        .map(|payload| payload.avt_token)
  }
}

#[cfg(test)]
mod tests {
  use actix_web::test::TestRequest;

  use crate::anonymous_visitor_tracking::avt_cookie_manager::AvtCookieManager;
  use crate::anonymous_visitor_tracking::avt_cookie_payload::AvtCookiePayload;
  use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;

  #[test]
  fn test_create_cookie() {
    // NB: Let's make extra sure this always works when migrating cookies, else we'll accidentally invalidate visitor tracking.
    // (These are version 1 cookies.)
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

  #[test]
  fn test_encode() {
    // NB: Stable encoding test. If this changes we should bump the cookie version.
    let manager = AvtCookieManager::new("fakeyou.com", "fake_secret").unwrap();
    let token = AnonymousVisitorTrackingToken::new_from_str("avt_ex_anonymous_visitor_tracking_token");
    let payload = AvtCookiePayload::from_token(token);
    let claims = payload.to_map();
    let jwt_string = manager.jwt_signer.claims_to_jwt(&claims).unwrap();

    assert_eq!(
      jwt_string,
      "eyJhbGciOiJIUzI1NiJ9.eyJhdnRfdG9rZW4iOiJhdnRfZXhfYW5vbnltb3VzX3Zpc2l0b3JfdHJhY2tpbmdfdG9rZW4iLCJjb29raWVfdmVyc2lvbiI6IjEifQ.5jgQfSXue684okKBzW3847jEhL7eLQKzelyAkgnwe_I"
    );
  }

  #[test]
  fn test_decode_version_1() {
    // NB: Version 1 payload. The expected encoded value below was generated by `test_encode`.
    let payload =
        "eyJhbGciOiJIUzI1NiJ9.eyJhdnRfdG9rZW4iOiJhdnRfZXhfYW5vbnltb3VzX3Zpc2l0b3JfdHJhY2tpbmdfdG9rZW4iLCJjb29raWVfdmVyc2lvbiI6IjEifQ.5jgQfSXue684okKBzW3847jEhL7eLQKzelyAkgnwe_I";

    let manager = AvtCookieManager::new("fakeyou.com", "fake_secret").unwrap();
    let claims = manager.jwt_signer.jwt_to_claims(payload).unwrap();
    let decoded_payload = AvtCookiePayload::from_map(claims).unwrap();

    assert_eq!(decoded_payload.avt_token.as_str(), "avt_ex_anonymous_visitor_tracking_token");
    assert_eq!(decoded_payload.cookie_version, 1);
  }

  #[test]
  fn test_round_trip() {
    let manager = AvtCookieManager::new("fakeyou.com", "fake_secret").unwrap();
    let token = AnonymousVisitorTrackingToken::new_from_str("avt_ex_anonymous_visitor_tracking_token");

    // Encode
    let payload = AvtCookiePayload::from_token(token);
    let claims = payload.to_map();
    let jwt_string = manager.jwt_signer.claims_to_jwt(&claims).unwrap();

    // Decode
    let claims = manager.jwt_signer.jwt_to_claims(&jwt_string).unwrap();
    let decoded_payload = AvtCookiePayload::from_map(claims).unwrap();

    assert_eq!(decoded_payload.avt_token.as_str(), "avt_ex_anonymous_visitor_tracking_token");
    assert_eq!(decoded_payload.cookie_version, 1);
  }
}
