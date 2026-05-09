use errors::AnyhowResult;
use std::fs::read_to_string;

use crate::creds::beeble_api_key::BeebleApiKey;

#[cfg(test)]
pub fn get_test_api_key() -> AnyhowResult<BeebleApiKey> {
  let api_key = read_to_string("/Users/bt/Artcraft/credentials/beeble_api_key.txt")?;
  let api_key = api_key.trim().to_string();
  Ok(BeebleApiKey::new(api_key))
}
