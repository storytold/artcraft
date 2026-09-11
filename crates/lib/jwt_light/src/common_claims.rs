use crate::error::JwtError;
use crate::utils::json_number_to_datetime::json_number_to_datetime;
use chrono::{DateTime, Utc};
use serde_json::Value;

pub struct CommonClaims {
  /// From the "iat" field
  pub created: DateTime<Utc>,

  /// From the "exp" field
  pub expiration: DateTime<Utc>,
}

impl CommonClaims {
  pub fn from_json(raw_json_claims: &str) -> Result<Self, JwtError> {
    let claims : serde_json::Map<String, Value> = serde_json::from_str(&raw_json_claims)
        .map_err(|err| JwtError::CommonFieldError(
          format!("failure to parse claims json: {:?}", err)))?;

    // NB: Some JWTs have "iat" and "exp" as integer numbers, some have them as floats
    let iat = {
      let iat = claims.get("iat")
          .map(|val| val.as_number())
          .flatten()
          .ok_or_else(|| JwtError::CommonFieldError("no iat claim".to_string()))?;

      json_number_to_datetime(iat, "iat")?
    };

    let exp = {
      let exp = claims.get("exp")
          .map(|val| val.as_number())
          .flatten()
          .ok_or_else(|| JwtError::CommonFieldError("no exp claim".to_string()))?;
      
      json_number_to_datetime(exp, "exp")?
    };

    Ok(Self {
      created: iat,
      expiration: exp,
    })
  }
}

#[cfg(test)]
mod tests {
  use crate::common_claims::CommonClaims;
  use crate::utils::raw_jwt_to_raw_json::raw_jwt_to_raw_json;
  use chrono::DateTime;

  #[test]
  fn test_runwayml() {
    let jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjMxMjk0MDUsImVtYWlsIjoiZWNoZWxvbkBnbWFpbC5jb20iLCJleHAiOjE3NTAyMDEyNTYuNDksImlhdCI6MTc0NzYwOTI1Ni40OSwic3NvIjpmYWxzZX0.UxbJozIiHSApqI8_Vl7o2d7q7CzqpXIzsZoazCtY75s";

    let json = raw_jwt_to_raw_json(jwt).unwrap();
    
    let claims = CommonClaims::from_json(&json).unwrap();
    
    // jwt payload: 
    // {
    //   "id": 23129405,
    //   "email": "echelon@gmail.com",
    //   "exp": 1750201256.49,
    //   "iat": 1747609256.49,
    //   "sso": false
    // }
    
    assert_eq!(claims.created, DateTime::from_timestamp(1747609256, 0).unwrap());
    assert_eq!(claims.expiration, DateTime::from_timestamp(1750201256, 0).unwrap());
  }
  
  #[test]
  fn test_sora() {
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

    let json = raw_jwt_to_raw_json(token).unwrap();
    
    // jwt payload :
    //  - "https://api.openai.com/auth".user_id = "user-6NxJflAHoEBDJzZl9iXhqbDG"
    //  - "https://api.openai.com/profile".email = "vocodes2020@gmail.com"
    //  - "https://api.openai.com/profile".email_verified = true
    //  - "iat": 1744936471, - issued at claim (5 days ago)
    //  - "nbf": 1744936471, - not before, don't use before date
    //  - "exp": 1745800472, - in 5 days, expiry

    let claims = CommonClaims::from_json(&json).unwrap();
    
    assert_eq!(claims.created, DateTime::from_timestamp(1744936471, 0).unwrap());
    assert_eq!(claims.expiration, DateTime::from_timestamp(1745800472, 0).unwrap());
  }
}
