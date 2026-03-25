use errors::AnyhowResult;
use std::fs::read_to_string;

#[cfg(test)]
pub fn get_test_api_key() -> AnyhowResult<String> {
  let api_key = read_to_string("/Users/bt/Artcraft/credentials/rootly_api_key.txt")?;
  let api_key = api_key.trim().to_string();
  Ok(api_key)
}
