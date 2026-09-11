use crate::error::JwtError;
use crate::utils::decode_base64::decode_base64;
use crate::utils::split_components::split_components;

pub (crate) fn raw_jwt_to_raw_json(raw_jwt: &str) -> Result<String, JwtError> {
  let [_header_str, claims_str, _signature_str] = split_components(raw_jwt)?;
  let raw_json = decode_base64(claims_str)?;
  Ok(raw_json)
}
