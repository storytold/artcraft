use crate::common_claims::CommonClaims;
use crate::error::JwtError;
use crate::utils::decode_base64::decode_base64;
use crate::utils::split_components::split_components;
use serde_json::Value;

/// Trait for simple JWT claims parsing
pub trait ParseJwtClaims : Sized {
  /// Parse any special fields relevant to the struct
  /// Implement this method to complete the parsing.
  fn extract_claims(
    common_claims: CommonClaims,
    extra_claims: serde_json::Map<String, Value>,
  ) -> Result<Self, JwtError>;

  fn parse_claims(raw_jwt: &str) -> Result<Self, JwtError> {
    let [_header_str, claims_str, _signature_str] = split_components(raw_jwt)?;

    let raw_json = decode_base64(claims_str)?;

    let common_claims = CommonClaims::from_json(&raw_json)?;

    let extra_claims : serde_json::Map<String, Value> = serde_json::from_str(&raw_json)?;

    Self::extract_claims(common_claims, extra_claims)
  }
}
