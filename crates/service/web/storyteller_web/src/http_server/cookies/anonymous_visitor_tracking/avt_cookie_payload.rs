use std::collections::BTreeMap;
use std::str::FromStr;

use crate::error::internal_error::InternalError;
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;

/**
 * Cookie version history
 *
 *  Version 1: Claims include "avt_token" and "cookie_version"
 */
const COOKIE_VERSION : u32 = 1;

// TODO: Should probably use protobuf or nom for handling
//  data-migration sensitive wire formats rather than
//  hand-rolling these.

/// The payload of AVT cookies.
///
///  Version 1 - only `avt_token` and `version`.
#[derive(Clone, Eq, PartialEq, Debug)]
pub struct AvtCookiePayload {
  // TODO: Strongly type
  pub avt_token: AnonymousVisitorTrackingToken,
  pub cookie_version: u32,
}

impl AvtCookiePayload {

  pub fn new() -> Self {
    let avt_token = AnonymousVisitorTrackingToken::generate();

    AvtCookiePayload {
      avt_token,
      cookie_version: COOKIE_VERSION,
    }
  }

  pub fn from_token(avt_token: AnonymousVisitorTrackingToken) -> Self {
    AvtCookiePayload {
      avt_token,
      cookie_version: COOKIE_VERSION,
    }
  }

  pub fn from_map(map: BTreeMap<String, String>) -> Result<Self, InternalError> {
    let avt_token = map.get("avt_token")
        .ok_or_else(|| InternalError::VisitorCookieMissingField("avt_token"))?;

    let cookie_version = map
        .get("cookie_version")
        .ok_or_else(|| InternalError::VisitorCookieMissingField("cookie_version"))?;

    let avt_token = AnonymousVisitorTrackingToken::new_from_str(avt_token);

    let cookie_version = u32::from_str(cookie_version)
        .map_err(|e| InternalError::VisitorCookieError(
          format!("invalid integer for cookie_version: {:?}, version: {}", e, cookie_version)))?;

    Ok(AvtCookiePayload {
      avt_token,
      cookie_version,
    })
  }

  pub fn to_map(&self) -> BTreeMap<String, String> {
    let mut map = BTreeMap::new();
    map.insert("avt_token".to_string(), self.avt_token.to_string());
    map.insert("cookie_version".to_string(), self.cookie_version.to_string());
    map
  }
}

#[cfg(test)]
mod tests {
  use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;

  use crate::http_server::cookies::anonymous_visitor_tracking::avt_cookie_payload::AvtCookiePayload;

  #[test]
  fn test_new() {
    let payload = AvtCookiePayload::new();

    assert_eq!(payload.cookie_version, 1);
    assert_eq!(payload.avt_token.0.len(), 32);
    assert!(payload.avt_token.to_string().starts_with("avt_"));
  }

  #[test]
  fn round_trip_test() {
    let payload = AvtCookiePayload {
      avt_token: AnonymousVisitorTrackingToken::generate(),
      cookie_version: 123,
    };

    let round_trip_payload= AvtCookiePayload::from_map(payload.to_map())
        .unwrap();

    assert_eq!(&payload, &round_trip_payload);
  }
}
