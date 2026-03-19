use crate::certs::key_map::KeyMap;
use crate::claims::claims::Claims;
use crate::claims::google_custom_claims::GoogleCustomClaims;
use crate::errors::VerifyError;
use crate::jwt::decode_jwt_header::decode_jwt_header;
use errors::anyhow;
use jwt_simple::algorithms::RS256PublicKey;
use jwt_simple::algorithms::RSAPublicKeyLike;
use jwt_simple::common::VerificationOptions;
use jwt_simple::JWTError;
use std::collections::HashSet;

/// Decode a Google Sign In JWT.
/// Verification options can be supplied to increase clock skew tolerance, etc.
pub fn decode_and_verify_token_claims(keys: &KeyMap, token: &str, mut options: Option<VerificationOptions>) -> Result<Claims, VerifyError> {
  let header = decode_jwt_header(token)
      .map_err(|err| VerifyError::JwtDecodeError { source: err })?;

  let key_id = header.kid.as_deref()
      .or_else(|| keys.keys().next().map(|k|k.as_str()))
      .ok_or_else(|| anyhow!("No key ID found"))?;

  let key = keys.get(key_id)
      .ok_or_else(|| VerifyError::JwtKeyMissing { requested_key: key_id.to_string() })?;

  if options.is_none() {
    options = Some(VerificationOptions {
      allowed_issuers: Some(HashSet::from([
        "https://accounts.google.com".to_string(),
        "accounts.google.com".to_string(),
      ])),
      ..Default::default()
    });
  }

  decode_and_verify_token_claims_with_key(key, token, options)
}

pub fn decode_and_verify_token_claims_with_key(key: &RS256PublicKey, token: &str, options: Option<VerificationOptions>) -> Result<Claims, VerifyError> {
  let result = key.verify_token::<GoogleCustomClaims>(token, options);

  let claims = match result {
    Ok(claims) => claims,
    Err(err) => {
      if let Some(inner_error) = err.downcast_ref::<JWTError>() {
        match inner_error {
          JWTError::RequiredAudienceMismatch => return Err(VerifyError::JwtInvalidAudience),
          JWTError::RequiredAudienceMissing => return Err(VerifyError::JwtInvalidAudience),
          JWTError::RequiredIssuerMismatch => return Err(VerifyError::JwtInvalidIssuer),
          JWTError::RequiredIssuerMissing => return Err(VerifyError::JwtInvalidIssuer),
          JWTError::TokenHasExpired => return Err(VerifyError::JwtExpired),
          _ => {}, // Fall-through
        }
      }
      return Err(VerifyError::AnyhowError(err));
    }
  };

  match claims.issuer.as_deref() {
    Some("https://accounts.google.com" | "accounts.google.com") => {} // Permitted
    _ => {
      return Err(VerifyError::JwtInvalidIssuer);
    }
  }

  Ok(Claims {
    claims,
  })
}

#[cfg(test)]
mod tests {
  use crate::certs::jwk_to_public_key::jwk_to_public_key;
  use crate::decode_and_verify_token_claims::decode_and_verify_token_claims;
  use crate::errors::VerifyError;
  use coarsetime::Duration;
  use jwt_simple::claims::Audiences;
  use jwt_simple::prelude::VerificationOptions;
  use std::collections::HashSet;
  use std::fs::read_to_string;
  use test_utils::test_file_path::test_file_path;
  /*
        Example payload:
          iss https://accounts.google.com
          azp 788843034237-uqcg8tbgofrcf1to37e1bqphd924jaf6.apps.googleusercontent.com
          aud 788843034237-uqcg8tbgofrcf1to37e1bqphd924jaf6.apps.googleusercontent.com
          sub 113101967612396793777
          email vocodes2020@gmail.com
          email_verified true
          nbf 1726786100
          name Vocodes Vocodes
          picture https://lh3.googleusercontent.com/a/ACg8ocLz2-2OaAm0MQxR6j8CNr-Po8_Xr-aryATiCn4c0i_TuDmL_g=s96-c
          given_name Vocodes
          family_name Vocodes
          iat 1726786400
          exp 1726790000
          jti 4d44eeac06ce79fc0ab2270cfeea30d8acf77613
         */

  #[test]
  fn test_decode_success_path() {
    let jwk_file = test_file_path("test_data/crypto/google_sign_in.2024-09-20.jwk").unwrap();
    let jwk_payload = read_to_string(jwk_file).unwrap();
    let key_map = jwk_to_public_key(&jwk_payload).unwrap();

    //let credential = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImIyNjIwZDVlN2YxMzJiNTJhZmU4ODc1Y2RmMzc3NmMwNjQyNDlkMDQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI3ODg4NDMwMzQyMzctdXFjZzh0YmdvZnJjZjF0bzM3ZTFicXBoZDkyNGphZjYuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI3ODg4NDMwMzQyMzctdXFjZzh0YmdvZnJjZjF0bzM3ZTFicXBoZDkyNGphZjYuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTMxMDE5Njc2MTIzOTY3OTM3NzciLCJlbWFpbCI6InZvY29kZXMyMDIwQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYmYiOjE3MjY4Njk0OTgsIm5hbWUiOiJWb2NvZGVzIFZvY29kZXMiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jTHoyLTJPYUFtME1ReFI2ajhDTnItUG84X1hyLWFyeUFUaUNuNGMwaV9UdURtTF9nPXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6IlZvY29kZXMiLCJmYW1pbHlfbmFtZSI6IlZvY29kZXMiLCJpYXQiOjE3MjY4Njk3OTgsImV4cCI6MTcyNjg3MzM5OCwianRpIjoiMGUyZTI0ZjE0M2ZlODk1NDlkM2I0NTkxNjBmYTY0ODc0YzFkZmIyYiJ9.ciKy6sIbZx1Z4mtXdXwy6eVDW2Q96ed7MyP1jOdGow5p9FpDUR8lTqIdMiKEkrp3j99Ipjv2y7iMZH23pC5ipWKqkP_Z4yxotN3ULnKFqkFnyEsHtvQDfc5CSmICcREEwjf2n9ngGycxYZ342n9rKRr893TFzp5sjy2DHxv1zpt6hsA2NSjoKPA4fmBOdJ_GnyWZYMQ1ABVFFnCsEVME2C53DBAWNs3OSlDN4U-QCRlb0LtpxU9_f1GUN4Vff7aSuIyGKY9SCIWlbf772br4HEjLXCDygaTRTgBUa-f5XJaOKLnsORCQwki7EqHgGYemMoQCOVaFXHj7N_8xBxyDgw";
    let credential = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImIyNjIwZDVlN2YxMzJiNTJhZmU4ODc1Y2RmMzc3NmMwNjQyNDlkMDQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI3ODg4NDMwMzQyMzctdXFjZzh0YmdvZnJjZjF0bzM3ZTFicXBoZDkyNGphZjYuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI3ODg4NDMwMzQyMzctdXFjZzh0YmdvZnJjZjF0bzM3ZTFicXBoZDkyNGphZjYuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTMxMDE5Njc2MTIzOTY3OTM3NzciLCJlbWFpbCI6InZvY29kZXMyMDIwQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYmYiOjE3MjY3ODYxMDAsIm5hbWUiOiJWb2NvZGVzIFZvY29kZXMiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jTHoyLTJPYUFtME1ReFI2ajhDTnItUG84X1hyLWFyeUFUaUNuNGMwaV9UdURtTF9nPXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6IlZvY29kZXMiLCJmYW1pbHlfbmFtZSI6IlZvY29kZXMiLCJpYXQiOjE3MjY3ODY0MDAsImV4cCI6MTcyNjc5MDAwMCwianRpIjoiNGQ0NGVlYWMwNmNlNzlmYzBhYjIyNzBjZmVlYTMwZDhhY2Y3NzYxMyJ9.EYg71yIkvhxFGc8ZVCXeTOAmPAtLYDphHnkdf1sh8b_Jz4Y7S1DpmiTqQ1ytxu7J1xNixvdwhuIDzSlCvlxaFl8475GvAlyPTNtZtmWbFD5SRM_XHLOynijOp8WQ4nej-CHvT1KjjqMfkZ1EeQMoWk1H72PxPg_RiUgzsklkUs1wOkLAySk7R3EIAl7bIzpoY_WH2pxv9ccFpBtKDHaDqHkxAWBUQX0-G7ZXZBPVz07V28ZfdbzFDapjZaUFbumazh_-J2-9AA6JkcteF4h_gpbBcLYAuxt5bWI5FECWbYe42khwb93WJ5SK12Tt0EPoyzIObJs14NWGAajtHTg3wA";

    let options = VerificationOptions {
      time_tolerance: Some(Duration::from_days(365 * 30)),
      ..Default::default()
    };

    // As should this much more ergonomic method
    let claims = decode_and_verify_token_claims(&key_map, credential, Some(options)).unwrap();

    // Custom fields
    assert_eq!(claims.claims.custom.email, Some("vocodes2020@gmail.com".to_string()));
    assert_eq!(claims.claims.custom.email_verified, Some(true));
    assert_eq!(claims.claims.custom.azp, Some("788843034237-uqcg8tbgofrcf1to37e1bqphd924jaf6.apps.googleusercontent.com".to_string()));
    assert_eq!(claims.claims.custom.name, Some("Vocodes Vocodes".to_string()));
    assert_eq!(claims.claims.custom.picture, Some("https://lh3.googleusercontent.com/a/ACg8ocLz2-2OaAm0MQxR6j8CNr-Po8_Xr-aryATiCn4c0i_TuDmL_g=s96-c".to_string()));
    assert_eq!(claims.claims.custom.given_name, Some("Vocodes".to_string()));
    assert_eq!(claims.claims.custom.family_name, Some("Vocodes".to_string()));

    // Standard fields
    assert_eq!(claims.claims.jwt_id, Some("4d44eeac06ce79fc0ab2270cfeea30d8acf77613".to_string()));
    assert_eq!(claims.claims.issuer, Some("https://accounts.google.com".to_string()));
    assert_eq!(claims.claims.subject, Some("113101967612396793777".to_string()));
    assert_eq!(claims.claims.issued_at.unwrap().as_secs(), 1726786400);

    // Methods
    assert_eq!(claims.email_verified(), true);
    assert_eq!(claims.email(), Some("vocodes2020@gmail.com"));
    assert_eq!(claims.audience_matches("788843034237-uqcg8tbgofrcf1to37e1bqphd924jaf6.apps.googleusercontent.com").unwrap(), true);

    match claims.claims.audiences.unwrap() {
      Audiences::AsString(audience) => assert_eq!(audience, "788843034237-uqcg8tbgofrcf1to37e1bqphd924jaf6.apps.googleusercontent.com"),
      Audiences::AsSet(_audiences) => panic!("Expected a single audience"),
    }
  }

  #[test]
  fn test_decode_success_path_with_expectations() {
    let jwk_file = test_file_path("test_data/crypto/google_sign_in.2024-09-20.jwk").unwrap();
    let jwk_payload = read_to_string(jwk_file).unwrap();
    let key_map = jwk_to_public_key(&jwk_payload).unwrap();

    let credential = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImIyNjIwZDVlN2YxMzJiNTJhZmU4ODc1Y2RmMzc3NmMwNjQyNDlkMDQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI3ODg4NDMwMzQyMzctdXFjZzh0YmdvZnJjZjF0bzM3ZTFicXBoZDkyNGphZjYuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI3ODg4NDMwMzQyMzctdXFjZzh0YmdvZnJjZjF0bzM3ZTFicXBoZDkyNGphZjYuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTMxMDE5Njc2MTIzOTY3OTM3NzciLCJlbWFpbCI6InZvY29kZXMyMDIwQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYmYiOjE3MjY3ODYxMDAsIm5hbWUiOiJWb2NvZGVzIFZvY29kZXMiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jTHoyLTJPYUFtME1ReFI2ajhDTnItUG84X1hyLWFyeUFUaUNuNGMwaV9UdURtTF9nPXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6IlZvY29kZXMiLCJmYW1pbHlfbmFtZSI6IlZvY29kZXMiLCJpYXQiOjE3MjY3ODY0MDAsImV4cCI6MTcyNjc5MDAwMCwianRpIjoiNGQ0NGVlYWMwNmNlNzlmYzBhYjIyNzBjZmVlYTMwZDhhY2Y3NzYxMyJ9.EYg71yIkvhxFGc8ZVCXeTOAmPAtLYDphHnkdf1sh8b_Jz4Y7S1DpmiTqQ1ytxu7J1xNixvdwhuIDzSlCvlxaFl8475GvAlyPTNtZtmWbFD5SRM_XHLOynijOp8WQ4nej-CHvT1KjjqMfkZ1EeQMoWk1H72PxPg_RiUgzsklkUs1wOkLAySk7R3EIAl7bIzpoY_WH2pxv9ccFpBtKDHaDqHkxAWBUQX0-G7ZXZBPVz07V28ZfdbzFDapjZaUFbumazh_-J2-9AA6JkcteF4h_gpbBcLYAuxt5bWI5FECWbYe42khwb93WJ5SK12Tt0EPoyzIObJs14NWGAajtHTg3wA";

    let options = VerificationOptions {
      time_tolerance: Some(Duration::from_days(365 * 30)),
      allowed_audiences: Some(HashSet::from([
        "788843034237-uqcg8tbgofrcf1to37e1bqphd924jaf6.apps.googleusercontent.com".to_string(),
      ])),
      allowed_issuers: Some(HashSet::from([
        "https://accounts.google.com".to_string(),
        "accounts.google.com".to_string(),
      ])),
      ..Default::default()
    };

    let claims = decode_and_verify_token_claims(&key_map, credential, Some(options)).unwrap();

    assert_eq!(claims.claims.issuer, Some("https://accounts.google.com".to_string()));
    assert_eq!(claims.audience_matches("788843034237-uqcg8tbgofrcf1to37e1bqphd924jaf6.apps.googleusercontent.com").unwrap(), true);
  }

  #[test]
  fn test_invalid_jwk_keys() {
    let jwk_file = test_file_path("test_data/crypto/google_sign_in.2024-04-01.jwk").unwrap();
    let jwk_payload = read_to_string(jwk_file).unwrap();
    let key_map = jwk_to_public_key(&jwk_payload).unwrap();

    let credential = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImIyNjIwZDVlN2YxMzJiNTJhZmU4ODc1Y2RmMzc3NmMwNjQyNDlkMDQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI3ODg4NDMwMzQyMzctdXFjZzh0YmdvZnJjZjF0bzM3ZTFicXBoZDkyNGphZjYuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI3ODg4NDMwMzQyMzctdXFjZzh0YmdvZnJjZjF0bzM3ZTFicXBoZDkyNGphZjYuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTMxMDE5Njc2MTIzOTY3OTM3NzciLCJlbWFpbCI6InZvY29kZXMyMDIwQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYmYiOjE3MjY3ODYxMDAsIm5hbWUiOiJWb2NvZGVzIFZvY29kZXMiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jTHoyLTJPYUFtME1ReFI2ajhDTnItUG84X1hyLWFyeUFUaUNuNGMwaV9UdURtTF9nPXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6IlZvY29kZXMiLCJmYW1pbHlfbmFtZSI6IlZvY29kZXMiLCJpYXQiOjE3MjY3ODY0MDAsImV4cCI6MTcyNjc5MDAwMCwianRpIjoiNGQ0NGVlYWMwNmNlNzlmYzBhYjIyNzBjZmVlYTMwZDhhY2Y3NzYxMyJ9.EYg71yIkvhxFGc8ZVCXeTOAmPAtLYDphHnkdf1sh8b_Jz4Y7S1DpmiTqQ1ytxu7J1xNixvdwhuIDzSlCvlxaFl8475GvAlyPTNtZtmWbFD5SRM_XHLOynijOp8WQ4nej-CHvT1KjjqMfkZ1EeQMoWk1H72PxPg_RiUgzsklkUs1wOkLAySk7R3EIAl7bIzpoY_WH2pxv9ccFpBtKDHaDqHkxAWBUQX0-G7ZXZBPVz07V28ZfdbzFDapjZaUFbumazh_-J2-9AA6JkcteF4h_gpbBcLYAuxt5bWI5FECWbYe42khwb93WJ5SK12Tt0EPoyzIObJs14NWGAajtHTg3wA";

    let options = VerificationOptions {
      time_tolerance: Some(Duration::from_days(365 * 30)),
      ..Default::default()
    };

    match decode_and_verify_token_claims(&key_map, credential, Some(options)) {
      Err(VerifyError::JwtKeyMissing { requested_key}) => {
        assert_eq!(requested_key, "b2620d5e7f132b52afe8875cdf3776c064249d04");
      }
      Err(err) => {
        panic!("Unexpected error: {:?}", err);
      }
      Ok(value) => {
        panic!("Unexpected success: {:?}", value.claims);
      }
    }
  }

  #[test]
  fn test_expired_jwt_token() {
    let jwk_file = test_file_path("test_data/crypto/google_sign_in.2024-09-20.jwk").unwrap();
    let jwk_payload = read_to_string(jwk_file).unwrap();
    let key_map = jwk_to_public_key(&jwk_payload).unwrap();

    let credential = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImIyNjIwZDVlN2YxMzJiNTJhZmU4ODc1Y2RmMzc3NmMwNjQyNDlkMDQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI3ODg4NDMwMzQyMzctdXFjZzh0YmdvZnJjZjF0bzM3ZTFicXBoZDkyNGphZjYuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI3ODg4NDMwMzQyMzctdXFjZzh0YmdvZnJjZjF0bzM3ZTFicXBoZDkyNGphZjYuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTMxMDE5Njc2MTIzOTY3OTM3NzciLCJlbWFpbCI6InZvY29kZXMyMDIwQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYmYiOjE3MjY3ODYxMDAsIm5hbWUiOiJWb2NvZGVzIFZvY29kZXMiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jTHoyLTJPYUFtME1ReFI2ajhDTnItUG84X1hyLWFyeUFUaUNuNGMwaV9UdURtTF9nPXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6IlZvY29kZXMiLCJmYW1pbHlfbmFtZSI6IlZvY29kZXMiLCJpYXQiOjE3MjY3ODY0MDAsImV4cCI6MTcyNjc5MDAwMCwianRpIjoiNGQ0NGVlYWMwNmNlNzlmYzBhYjIyNzBjZmVlYTMwZDhhY2Y3NzYxMyJ9.EYg71yIkvhxFGc8ZVCXeTOAmPAtLYDphHnkdf1sh8b_Jz4Y7S1DpmiTqQ1ytxu7J1xNixvdwhuIDzSlCvlxaFl8475GvAlyPTNtZtmWbFD5SRM_XHLOynijOp8WQ4nej-CHvT1KjjqMfkZ1EeQMoWk1H72PxPg_RiUgzsklkUs1wOkLAySk7R3EIAl7bIzpoY_WH2pxv9ccFpBtKDHaDqHkxAWBUQX0-G7ZXZBPVz07V28ZfdbzFDapjZaUFbumazh_-J2-9AA6JkcteF4h_gpbBcLYAuxt5bWI5FECWbYe42khwb93WJ5SK12Tt0EPoyzIObJs14NWGAajtHTg3wA";

    match decode_and_verify_token_claims(&key_map, credential, None) {
      Err(VerifyError::JwtExpired) => {
        // Expected error case
      }
      Err(err) => {
        panic!("Unexpected error: {:?}", err);
      }
      Ok(value) => {
        panic!("Unexpected success: {:?}", value.claims);
      }
    }
  }

  #[test]
  fn test_invalid_issuer() {
    let jwk_file = test_file_path("test_data/crypto/google_sign_in.2024-09-20.jwk").unwrap();
    let jwk_payload = read_to_string(jwk_file).unwrap();
    let key_map = jwk_to_public_key(&jwk_payload).unwrap();

    let credential = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImIyNjIwZDVlN2YxMzJiNTJhZmU4ODc1Y2RmMzc3NmMwNjQyNDlkMDQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI3ODg4NDMwMzQyMzctdXFjZzh0YmdvZnJjZjF0bzM3ZTFicXBoZDkyNGphZjYuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI3ODg4NDMwMzQyMzctdXFjZzh0YmdvZnJjZjF0bzM3ZTFicXBoZDkyNGphZjYuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTMxMDE5Njc2MTIzOTY3OTM3NzciLCJlbWFpbCI6InZvY29kZXMyMDIwQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYmYiOjE3MjY3ODYxMDAsIm5hbWUiOiJWb2NvZGVzIFZvY29kZXMiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jTHoyLTJPYUFtME1ReFI2ajhDTnItUG84X1hyLWFyeUFUaUNuNGMwaV9UdURtTF9nPXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6IlZvY29kZXMiLCJmYW1pbHlfbmFtZSI6IlZvY29kZXMiLCJpYXQiOjE3MjY3ODY0MDAsImV4cCI6MTcyNjc5MDAwMCwianRpIjoiNGQ0NGVlYWMwNmNlNzlmYzBhYjIyNzBjZmVlYTMwZDhhY2Y3NzYxMyJ9.EYg71yIkvhxFGc8ZVCXeTOAmPAtLYDphHnkdf1sh8b_Jz4Y7S1DpmiTqQ1ytxu7J1xNixvdwhuIDzSlCvlxaFl8475GvAlyPTNtZtmWbFD5SRM_XHLOynijOp8WQ4nej-CHvT1KjjqMfkZ1EeQMoWk1H72PxPg_RiUgzsklkUs1wOkLAySk7R3EIAl7bIzpoY_WH2pxv9ccFpBtKDHaDqHkxAWBUQX0-G7ZXZBPVz07V28ZfdbzFDapjZaUFbumazh_-J2-9AA6JkcteF4h_gpbBcLYAuxt5bWI5FECWbYe42khwb93WJ5SK12Tt0EPoyzIObJs14NWGAajtHTg3wA";

    let options = VerificationOptions {
      time_tolerance: Some(Duration::from_days(365 * 30)),
      allowed_issuers: Some(HashSet::from([
        "ISSUER_1".to_string(),
        "ISSUER_2".to_string(),
      ])),
      ..Default::default()
    };

    match decode_and_verify_token_claims(&key_map, credential, Some(options)) {
      Err(VerifyError::JwtInvalidIssuer) => {
        // Expected error case
      }
      Err(err) => {
        panic!("Unexpected error: {:?}", err);
      }
      Ok(value) => {
        panic!("Unexpected success: {:?}", value.claims);
      }
    }
  }

  #[test]
  fn test_invalid_audience() {
    let jwk_file = test_file_path("test_data/crypto/google_sign_in.2024-09-20.jwk").unwrap();
    let jwk_payload = read_to_string(jwk_file).unwrap();
    let key_map = jwk_to_public_key(&jwk_payload).unwrap();

    let credential = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImIyNjIwZDVlN2YxMzJiNTJhZmU4ODc1Y2RmMzc3NmMwNjQyNDlkMDQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI3ODg4NDMwMzQyMzctdXFjZzh0YmdvZnJjZjF0bzM3ZTFicXBoZDkyNGphZjYuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI3ODg4NDMwMzQyMzctdXFjZzh0YmdvZnJjZjF0bzM3ZTFicXBoZDkyNGphZjYuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTMxMDE5Njc2MTIzOTY3OTM3NzciLCJlbWFpbCI6InZvY29kZXMyMDIwQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYmYiOjE3MjY3ODYxMDAsIm5hbWUiOiJWb2NvZGVzIFZvY29kZXMiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jTHoyLTJPYUFtME1ReFI2ajhDTnItUG84X1hyLWFyeUFUaUNuNGMwaV9UdURtTF9nPXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6IlZvY29kZXMiLCJmYW1pbHlfbmFtZSI6IlZvY29kZXMiLCJpYXQiOjE3MjY3ODY0MDAsImV4cCI6MTcyNjc5MDAwMCwianRpIjoiNGQ0NGVlYWMwNmNlNzlmYzBhYjIyNzBjZmVlYTMwZDhhY2Y3NzYxMyJ9.EYg71yIkvhxFGc8ZVCXeTOAmPAtLYDphHnkdf1sh8b_Jz4Y7S1DpmiTqQ1ytxu7J1xNixvdwhuIDzSlCvlxaFl8475GvAlyPTNtZtmWbFD5SRM_XHLOynijOp8WQ4nej-CHvT1KjjqMfkZ1EeQMoWk1H72PxPg_RiUgzsklkUs1wOkLAySk7R3EIAl7bIzpoY_WH2pxv9ccFpBtKDHaDqHkxAWBUQX0-G7ZXZBPVz07V28ZfdbzFDapjZaUFbumazh_-J2-9AA6JkcteF4h_gpbBcLYAuxt5bWI5FECWbYe42khwb93WJ5SK12Tt0EPoyzIObJs14NWGAajtHTg3wA";

    let options = VerificationOptions {
      time_tolerance: Some(Duration::from_days(365 * 30)),
      allowed_audiences: Some(HashSet::from([
        "AUDIENCE_1".to_string(),
        "AUDIENCE_2".to_string(),
      ])),
      ..Default::default()
    };

    match decode_and_verify_token_claims(&key_map, credential, Some(options)) {
      Err(VerifyError::JwtInvalidAudience) => {
        // Expected error case
      }
      Err(err) => {
        panic!("Unexpected error: {:?}", err);
      }
      Ok(value) => {
        panic!("Unexpected success: {:?}", value.claims);
      }
    }
  }
}
