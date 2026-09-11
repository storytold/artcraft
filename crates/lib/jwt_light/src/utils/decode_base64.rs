use crate::error::JwtError;
use base64::prelude::BASE64_URL_SAFE_NO_PAD;
use base64::Engine;

pub fn decode_base64(raw: &str) -> Result<String, JwtError> {
  let json_bytes = BASE64_URL_SAFE_NO_PAD.decode(raw)?;
  let json_str = String::from_utf8(json_bytes.clone())?;
  Ok(json_str)
}
