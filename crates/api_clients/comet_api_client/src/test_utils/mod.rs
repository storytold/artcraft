use std::fs::read_to_string;

use crate::creds::comet_api_key::CometApiKey;

const API_KEY_PATH: &str = "/Users/bt/Artcraft/credentials/comet_api_key.txt";

pub fn load_api_key() -> CometApiKey {
  let secret = read_to_string(API_KEY_PATH)
    .expect("Failed to read Comet API key file");
  CometApiKey::from_str(&secret)
}
