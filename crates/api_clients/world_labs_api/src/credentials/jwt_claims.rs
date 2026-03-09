use base64::Engine;
use chrono::{DateTime, Utc};
use jwt_light::common_claims::CommonClaims;
use jwt_light::error::JwtError;
use jwt_light::parse_jwt_claims_trait::ParseJwtClaims;
use serde_json::{Map, Value};


#[derive(Clone, Debug)]
pub struct JwtClaims {
  /// From the "iat" field
  pub created: DateTime<Utc>,

  /// From the "exp" field
  pub expiration: DateTime<Utc>,

  /// From the "user_id" field
  pub user_id: Option<String>,

  /// From the "email" field
  pub email: Option<String>,
}

impl ParseJwtClaims for JwtClaims {
  fn extract_claims(common_claims: CommonClaims, extra_claims: Map<String, Value>) -> Result<Self, JwtError> {
    let user_id = extra_claims.get("user_id")
        .map(|val| val.as_str())
        .flatten()
        .map(|val| val.to_string());

    let mut email = extra_claims.get("email")
        .map(|val| val.as_str())
        .flatten()
        .map(|val| val.to_string());

    if email.is_none() {
      // Parse out email from this field:
      //  "firebase": {
      //    "identities": {
      //      "email": [
      //      "sabalid234@crsay.com"
      //      ]
      //    },
      //  },
      email = extra_claims.get("firebase")
          .and_then(|val| val.as_object())
          .and_then(|fb| fb.get("identities"))
          .and_then(|val| val.as_object())
          .and_then(|id| id.get("email"))
          .and_then(|emails| emails.as_array())
          .and_then(|emails| emails.get(0))
          .and_then(|email| email.as_str())
          .map(|email| email.to_string());
    }

    Ok(Self {
      created: common_claims.created,
      expiration: common_claims.expiration,
      user_id,
      email,
    })
  }
}

#[cfg(test)]
mod tests {
  use crate::credentials::jwt_claims::JwtClaims;
  use jwt_light::parse_jwt_claims_trait::ParseJwtClaims;

  #[test]
  fn test_token() {
    /*
    {
      "iss": "https://securetoken.google.com/wlt-training-gsc",
      "aud": "wlt-training-gsc",
      "auth_time": 1766002923,
      "user_id": "CArJJ2PQFFd8l2Rf8uptZhl86d33",
      "sub": "CArJJ2PQFFd8l2Rf8uptZhl86d33",
      "iat": 1766099113,
      "exp": 1766102713,
      "email": "sabalid234@crsay.com",
      "email_verified": true,
      "firebase": {
        "identities": {
          "email": [
            "sabalid234@crsay.com"
          ]
        },
        "sign_in_provider": "password"
      }
    }
    */
    let jwt = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjM4MTFiMDdmMjhiODQxZjRiNDllNDgyNTg1ZmQ2NmQ1NWUzOGRiNWQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vd2x0LXRyYWluaW5nLWdzYyIsImF1ZCI6IndsdC10cmFpbmluZy1nc2MiLCJhdXRoX3RpbWUiOjE3NjYwMDI5MjMsInVzZXJfaWQiOiJDQXJKSjJQUUZGZDhsMlJmOHVwdFpobDg2ZDMzIiwic3ViIjoiQ0FySkoyUFFGRmQ4bDJSZjh1cHRaaGw4NmQzMyIsImlhdCI6MTc2NjA5OTExMywiZXhwIjoxNzY2MTAyNzEzLCJlbWFpbCI6InNhYmFsaWQyMzRAY3JzYXkuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsic2FiYWxpZDIzNEBjcnNheS5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJwYXNzd29yZCJ9fQ.byDW2QiRfajxDgQMD89YNdlRxO5rsHves3nwK_Ry5ZLFThARbdU9-wTgbCz1mzz9P3amUkM_XM9E4rEAnj2u-kCv5iW_FIfRDeJ0Z8FlwqxCt6ekvJgwYE80BUIedEvTiNpP_AilThz1ILqAu3gVQ2GXUcolquvS9i12iGTl-thJH6gnZgv3UdP2Vrr5ZP9VhKgMi5gQER5umFQ4Ud64kD9P9SLttRI2RJdolavJengQBAfec8hOEk6uikw20rEBeT_xzl8TpLNG6i4SIGYqJQHfRALGNniYoU9RlIoFR9VGeyk_6BFFGRd8I_EgL-fxnfmpV8w-riXHlOUg6uNRgw";
    let claims = JwtClaims::parse_claims(jwt).unwrap();

    assert_eq!(claims.user_id, Some("CArJJ2PQFFd8l2Rf8uptZhl86d33".to_string()));
    assert_eq!(claims.email, Some("sabalid234@crsay.com".to_string()));
    assert_eq!(claims.created.timestamp(), 1766099113);
    assert_eq!(claims.expiration.timestamp(), 1766102713);
  }
}
