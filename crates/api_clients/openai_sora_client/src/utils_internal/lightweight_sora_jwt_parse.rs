//! Adapted from 'jwt' crate

use crate::error::sora_client_error::SoraClientError;
use crate::error::sora_error::SoraError;
use base64::prelude::BASE64_URL_SAFE_NO_PAD;
use base64::Engine;
use chrono::{DateTime, Utc};
use errors::AnyhowResult;
use log::warn;
use serde_json::Value;

const SEPARATOR: &str = ".";

#[derive(Clone, Debug)]
pub struct SoraJwtClaims {
  pub created: DateTime<Utc>,
  pub expiration: DateTime<Utc>,
  pub user_id: String,
  pub email: String,
  pub email_verified: bool,
}

pub fn lightweight_sora_jwt_parse(token: &str) -> Result<SoraJwtClaims, SoraError> {
  let [_header_str, claims_str, _signature_str] = split_components(token)?;

  let claims = decode_base64(claims_str)
      .map_err(|err| as_jwt_error(format!("failure to parse claims base64: {:?}", err)))?;
  
  let claims : serde_json::Map<String, Value> = serde_json::from_str(&claims)
      .map_err(|err| as_jwt_error(
        format!("failure to parse claims json: {:?}", err)))?;

  let iat = claims.get("iat")
      .map(|val| val.as_number())
      .flatten()
      .ok_or_else(|| jwt_error("no iat claim"))?;

  let iat = iat.as_i64()
      .ok_or_else(|| jwt_error("iat is not a number"))?;

  let iat = DateTime::from_timestamp(iat, 0)
      .ok_or_else(|| jwt_error("iat is not a valid timestamp"))?;

  let exp = claims.get("exp")
      .map(|val| val.as_number())
      .flatten()
      .ok_or_else(|| jwt_error("no exp claim"))?;

  let exp = exp.as_i64()
      .ok_or_else(|| jwt_error("exp is not a number"))?;

  let exp = DateTime::from_timestamp(exp, 0)
      .ok_or_else(|| jwt_error("iat is not a valid timestamp"))?;

  let user_id = claims.get("https://api.openai.com/auth")
      .map(|val| val.get("user_id"))
      .flatten()
      .map(|val| val.as_str())
      .flatten()
      .ok_or_else(|| jwt_error("no user_id claim"))?;

  let profile = claims.get("https://api.openai.com/profile")
      .ok_or_else(|| jwt_error("no user_id claim"))?;

  let email = profile.get("email")
      .map(|val| val.as_str())
      .flatten()
      .ok_or_else(|| jwt_error("no email claim"))?;

  let email_verified = profile.get("email_verified")
      .map(|val| val.as_bool())
      .flatten()
      .unwrap_or_else(|| {
        warn!("no email_verified claim");
        false
      });

  Ok(SoraJwtClaims {
    created: iat,
    expiration: exp,
    user_id: user_id.to_string(),
    email: email.to_string(),
    email_verified,
  })
}

fn split_components(token: &str) -> Result<[&str; 3], SoraError> {
  let mut components = token.split(SEPARATOR);
  let header = components.next()
      .ok_or_else(|| jwt_error("no header component"))?;
  
  let claims = components.next()
      .ok_or_else(|| jwt_error("no claims component"))?;
  
  let signature = components.next()
      .ok_or_else(|| jwt_error("no signature component"))?;

  if components.next().is_some() {
    return Err(jwt_error("too many components"));
  }

  Ok([header, claims, signature])
}

fn decode_base64(raw: &str) -> AnyhowResult<String> {
  let json_bytes = BASE64_URL_SAFE_NO_PAD.decode(raw)?;
  let json_str = String::from_utf8(json_bytes.clone())?;
  Ok(json_str)
}

fn jwt_error(reason: &str) -> SoraError {
  SoraError::Client(SoraClientError::LocalJwtClaimsParseError(reason.to_string()))
}

fn as_jwt_error(reason: String) -> SoraError {
  SoraError::Client(SoraClientError::LocalJwtClaimsParseError(reason))
}

#[cfg(test)]
mod tests {
  use crate::utils_internal::lightweight_sora_jwt_parse::lightweight_sora_jwt_parse;

  #[test]
  fn test_sora_jwt_bearer_token() {
    let token =
        "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE5MzQ0ZTY1LWJiYzktNDRkMS1hOWQwLWY5NTdiMDc5YmQwZSIsInR5cCI6Ik\
        pXVCJ9.eyJhdWQiOlsiaHR0cHM6Ly9hcGkub3BlbmFpLmNvbS92MSJdLCJjbGllbnRfaWQiOiJhcHBfTTFuUTN0UjV2\
        VzdYOWpMMnBFNmdIOGRLNCIsImV4cCI6MTc0NTgwMDQ3MiwiaHR0cHM6Ly9hcGkub3BlbmFpLmNvbS9hdXRoIjp7InV\
        zZXJfaWQiOiJ1c2VyLTZOeEpmbEFIb0VCREp6Wmw5aVhocWJERyJ9LCJodHRwczovL2FwaS5vcGVuYWkuY29tL3Byb2\
        ZpbGUiOnsiZW1haWwiOiJ2b2NvZGVzMjAyMEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZX0sImlhdCI6M\
        Tc0NDkzNjQ3MSwiaXNzIjoiaHR0cHM6Ly9hdXRoLm9wZW5haS5jb20iLCJqdGkiOiI0NTZmZjY5Yi0xZTZhLTQzOWYt\
        YTYzMC1jNmFjYzI3NzU1YjAiLCJuYmYiOjE3NDQ5MzY0NzEsInB3ZF9hdXRoX3RpbWUiOjE3NDQwNTkzMTc3NTAsInN\
        jcCI6WyJvcGVuaWQiLCJlbWFpbCIsInByb2ZpbGUiLCJvZmZsaW5lX2FjY2VzcyJdLCJzZXNzaW9uX2lkIjoiYXV0aH\
        Nlc3NfcEE4UGl3V0trNmJsSE1qQnVCQnVSRmh2Iiwic3ViIjoiZ29vZ2xlLW9hdXRoMnwxMTMxMDE5Njc2MTIzOTY3O\
        TM3NzcifQ.JOxYfrQSIsHdf-VN1zcOqDOS3tF1HpUYnRVfPKgi65am3sNiniOM1kWTNrKE5-sh4DaZ33G_XniGkhg-9\
        QKF8tspXpZ6BnTNkf-QdGqR_v89AIO8pZgQ7oECLXhnmg-31G-LAHlGfwWedJ6qPVy4dL5zoR0wVyoQ8gYv5QzQC-zd\
        IF7uY-umKKloAAYP_tkKLlQHackjTynN-bpu2mKv55-h7a3hSEPfxvgX0SsvL69xtNsZkwb43bqyP1x_c2ErfYoPyzg\
        rqgMIRZjCw9TI33vISKM_BfQXBiZT_BHkX4s0Jng3ph4vrwvnBsa0HpNxBhQYKb1u9gZXs7XjLZhjZJZsDTQI1V4Wov\
        iAL7ihvZkLxJRtDCOmX7-5BTEsMInFgXUAhCDhQUMwSfLLJuinBS96NGSX5_TfIVMkbCl-HWzdQx7KZAsahNe_CmuYT\
        lZH32NuRn78ohY4eViRyfC8OXVLwoLxxpen2CWlV2dxV5wwXeij_kHt5wOXSGYpSfxz37cK0CaK8K2pwudasxQ0lv2V\
        _Xx_z4UaEOr5wqT_BK1A1HO4HRjvFX2soF-qm4GCSWAbmFZs7DVEClrotxRx2romifRVb8XRia2M6YTmDyIT0YphFgG\
        nnrDIZNKO23uDYT60LVMVYpCCY2RiwxCR9bn7AeGbmi7cpL9aYZ5uJRM";

    // jwt payload :
    //  - "https://api.openai.com/auth".user_id = "user-6NxJflAHoEBDJzZl9iXhqbDG"
    //  - "https://api.openai.com/profile".email = "vocodes2020@gmail.com"
    //  - "https://api.openai.com/profile".email_verified = true
    //  - "iat": 1744936471, - issued at claim (5 days ago)
    //  - "nbf": 1744936471, - not before, don't use before date
    //  - "exp": 1745800472, - in 5 days, expiry

    let result = lightweight_sora_jwt_parse(token).expect("claim should parse");

    assert_eq!(result.email, "vocodes2020@gmail.com");
    assert_eq!(result.email_verified, true);
  }
}
