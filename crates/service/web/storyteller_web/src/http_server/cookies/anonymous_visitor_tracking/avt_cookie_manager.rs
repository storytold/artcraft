use actix_web::cookie::time::OffsetDateTime;
use actix_web::cookie::{Cookie, SameSite};
use actix_web::HttpRequest;
use anyhow::anyhow;
use log::warn;

use crate::error::internal_error::InternalError;
use crate::http_server::cookies::anonymous_visitor_tracking::avt_cookie_payload::AvtCookiePayload;
use jwt_signer::jwt_signer::JwtSigner;
use errors::AnyhowResult;
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

  pub fn new(cookie_domain: &str, hmac_secret: &str) -> AnyhowResult<Self> {
    Ok(Self {
      cookie_domain: cookie_domain.to_string(),
      jwt_signer: JwtSigner::new(hmac_secret)?,
    })
  }

  pub fn make_new_cookie(&self) -> AnyhowResult<Cookie> {
    let token = AnonymousVisitorTrackingToken::generate();
    self.make_new_cookie_with_apriori_token(&token)
  }

  pub fn make_new_cookie_with_apriori_token(&self, token: &AnonymousVisitorTrackingToken) -> AnyhowResult<Cookie> {
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

  pub fn decode_cookie_payload(&self, visitor_cookie: &Cookie) -> AnyhowResult<AvtCookiePayload> {
    let cookie_contents = visitor_cookie.value().to_string();
    let claims = self.jwt_signer.jwt_to_claims(&cookie_contents)?;
    let payload = AvtCookiePayload::from_map(claims)?;
    Ok(payload)
  }

  pub fn decode_cookie_payload_from_request(&self, request: &HttpRequest) -> Result<Option<AvtCookiePayload>, InternalError> {
    let cookie = match request.cookie(VISITOR_COOKIE_NAME) {
      None => return Ok(None),
      Some(cookie) => cookie,
    };

    match self.decode_cookie_payload(&cookie) {
      Err(e) => {
        warn!("Visitor cookie decode error: {:?}", e);
        Err(InternalError::VisitorCookieError(e.to_string()))
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
