use std::collections::BTreeMap;

use crate::sessions::http_user_session_payload::HttpUserSessionPayload;
use jwt_signer::jwt_signer::JwtSigner;
use errors::AnyhowResult;
use tokens::tokens::user_sessions::UserSessionToken;
use tokens::tokens::users::UserToken;

/**
 * Session payload version history
 *
 *  Version 1: Claims include "session_token" and "cookie_version"
 *  Version 2: The "user_token" is added to the claims, and the version is bumped to "2"
 *  Version 3: Rename "cookie_version" to "version". Should be harmless since we don't read it. Bump to "3".
 */
const PAYLOAD_VERSION : u32 = 3;

#[derive(Clone)]
pub struct HttpUserSessionPayloadSigner {
  jwt_signer: JwtSigner,
}

impl HttpUserSessionPayloadSigner {
  pub fn new(hmac_secret: &str) -> AnyhowResult<Self> {
    Ok(Self {
      jwt_signer: JwtSigner::new(hmac_secret)?
    })
  }

  pub fn encode(&self, session_token: &UserSessionToken, user_token: &UserToken) -> AnyhowResult<String> {
    let mut claims = BTreeMap::new();
    let payload_version = PAYLOAD_VERSION.to_string();

    claims.insert("session_token", session_token.as_str());
    claims.insert("user_token", user_token.as_str());
    claims.insert("version", &payload_version);

    let jwt_string = self.jwt_signer.claims_to_jwt(&claims)?;

    Ok(jwt_string)
  }

  pub fn decode(&self, session_payload_contents: &str) -> AnyhowResult<HttpUserSessionPayload> {
    let claims = self.jwt_signer.jwt_to_claims(&session_payload_contents)?;

    let session_token = claims["session_token"].clone();
    let maybe_user_token = claims.get("user_token")
        .map(|t| t.to_string());

    Ok(HttpUserSessionPayload {
      session_token,
      maybe_user_token,
    })
  }
}

#[cfg(test)]
mod tests {
  use crate::sessions::payload_signer::HttpUserSessionPayloadSigner;
  use tokens::tokens::user_sessions::UserSessionToken;
  use tokens::tokens::users::UserToken;

  #[test]
  fn test_encode() {
    let signer = HttpUserSessionPayloadSigner::new("fake_secret").unwrap();
    let encoded_payload = signer.encode(&UserSessionToken::new_from_str("ex_session_token"), &UserToken::new_from_str("ex_user_token")).unwrap();

    assert_eq!(
      encoded_payload,
      "eyJhbGciOiJIUzI1NiJ9.eyJzZXNzaW9uX3Rva2VuIjoiZXhfc2Vzc2lvbl90b2tlbiIsInVzZXJfdG9rZW4iOiJleF91c2VyX3Rva2VuIiwidmVyc2lvbiI6IjMifQ.e37pyJkaTqo1ifcL6JcNxB0q0LdL09BmTOzIahepiLE"
    );
  }

  #[test]
  fn test_decode_version_2() {
    // NB(1): Version 2 payload. The version field was named "cookie_version"
    // NB(2): A different fake secret was used to encode this.
    let payload =
        "eyJhbGciOiJIUzI1NiJ9.eyJjb29raWVfdmVyc2lvbiI6IjIiLCJzZXNzaW9uX3Rva2VuIjoiZXhfc2Vzc2lvbl90b2tlbiIsInVzZXJfdG9rZW4iOiJleF91c2VyX3Rva2VuIn0.94ly2gHhlPVtnANsNy6cJozFVmId4imwW5v-mei7jD8";

    let signer = HttpUserSessionPayloadSigner::new("secret").unwrap();
    let decoded_payload = signer.decode(&payload).unwrap();

    assert_eq!(decoded_payload.session_token.as_str(), "ex_session_token");
    assert_eq!(decoded_payload.maybe_user_token.unwrap().as_str(), "ex_user_token");
  }

  #[test]
  fn test_decode_version_3() {
    // NB: Version 3 payload.
    let payload =
        "eyJhbGciOiJIUzI1NiJ9.eyJzZXNzaW9uX3Rva2VuIjoiZXhfc2Vzc2lvbl90b2tlbiIsInVzZXJfdG9rZW4iOiJleF91c2VyX3Rva2VuIiwidmVyc2lvbiI6IjMifQ.e37pyJkaTqo1ifcL6JcNxB0q0LdL09BmTOzIahepiLE";

    let signer = HttpUserSessionPayloadSigner::new("fake_secret").unwrap();
    let decoded_payload = signer.decode(&payload).unwrap();

    assert_eq!(decoded_payload.session_token.as_str(), "ex_session_token");
    assert_eq!(decoded_payload.maybe_user_token.unwrap().as_str(), "ex_user_token");
  }

  #[test]
  fn test_round_trip() {
    let signer = HttpUserSessionPayloadSigner::new("fake_secret").unwrap();
    let encoded_payload = signer.encode(&UserSessionToken::new_from_str("ex_session_token"), &UserToken::new_from_str("ex_user_token")).unwrap();

    let decoded_payload = signer.decode(&encoded_payload).unwrap();

    assert_eq!(decoded_payload.session_token.as_str(), "ex_session_token");
    assert_eq!(decoded_payload.maybe_user_token.unwrap().as_str(), "ex_user_token");
  }
}
