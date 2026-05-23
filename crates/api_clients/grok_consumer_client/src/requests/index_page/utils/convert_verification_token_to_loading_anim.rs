use crate::datatypes::api::verification_token::VerificationToken;
use crate::error::grok_client_error::GrokClientError;
use base64::prelude::BASE64_STANDARD;
use base64::Engine;
use log::{debug, error};

#[derive(Debug, Clone)]
pub struct LoadingAnim(pub(crate) usize);

impl LoadingAnim {
  pub fn to_id(&self) -> String {
    format!("loading-x-anim-{}", self.0)
  }
}

/// This arbitrary algorithm is used by Grok.
/// See https://github.com/realasfngl/Grok-Api
/// The verification token comes from the index HTML.
pub fn convert_verification_token_to_loading_anim(verification_token: &VerificationToken) -> Result<LoadingAnim, GrokClientError> {
  // array: list = list(b64decode(verification_token)) -- note: we don't need to convert to a list
  let decoded_bytes = BASE64_STANDARD.decode(&verification_token.0)
      .map_err(|err| {
        error!("Failed to decode verification token: {} ; err = {:?}", verification_token.0, err);
        GrokClientError::FailedToDecodeVerificationToken(err)
      })?;

  // anim: str = "loading-x-anim-" + str(array[5] % 4)
  let byte = decoded_bytes.get(5)
      .map(|byte| *byte)
      .ok_or(GrokClientError::InvalidVerificationTokenBytes)?;
  
  debug!("verification token byte: {}", byte);

  // note, we'll put the string construction in the `to_id()` method since we need the raw integer again
  let anim = (byte % 4) as usize;

  Ok(LoadingAnim(anim))
}

#[cfg(test)]
mod tests {
  use crate::datatypes::api::verification_token::VerificationToken;
  use crate::error::grok_client_error::GrokClientError;
  use crate::requests::index_page::utils::convert_verification_token_to_loading_anim::convert_verification_token_to_loading_anim;
  use errors::AnyhowResult;

  #[test]
  fn test() -> AnyhowResult<()> {
    assert_eq!(&to_id("aezWdJW6+WJhvtMA1faxopO11Q1JRcM6j7JcW/R0gO09CQhO7GzIs760yo1A0MnF")?, "loading-x-anim-2");
    assert_eq!(&to_id("wROL4+VivbPuVc37N+4VNq0K3cEMW0bPKuToO6JWxJ9fzsP3Rsn2eC8DDDZFFlov")?, "loading-x-anim-2");
    assert_eq!(&to_id("ckWUvquxT8AdPRpdjXTeNkkXRfKiGGnQFH3Hq4aznsUrSsjtDSI4JcO59j7U/+VQ")?, "loading-x-anim-1");
    Ok(())
  }

  fn to_id(verification_token: &str) -> Result<String, GrokClientError> {
    let verification_token = VerificationToken(verification_token.to_string());
    let anim = convert_verification_token_to_loading_anim(&verification_token)?;
    Ok(anim.to_id())
  }
}
