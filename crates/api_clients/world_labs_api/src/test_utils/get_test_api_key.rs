use crate::credentials::world_labs_api_creds::WorldLabsApiCreds;
use anyhow::Result as AnyhowResult;

const API_KEY_FILE: &str = "/Users/bt/Artcraft/credentials/world_labs_api_key.txt";

#[cfg(test)]
pub(crate) fn get_test_api_key() -> AnyhowResult<WorldLabsApiCreds> {
  let api_key = std::fs::read_to_string(API_KEY_FILE)?.trim().to_string();
  Ok(WorldLabsApiCreds::new(api_key))
}
