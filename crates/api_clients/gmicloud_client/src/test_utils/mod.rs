use crate::creds::gmicloud_api_key::GmiCloudApiKey;
use std::fs::read_to_string;

const API_KEY_PATH: &str = "/Users/bt/Artcraft/credentials/gmicloud_api_key.txt";

pub fn load_api_key() -> GmiCloudApiKey {
  let secret = read_to_string(API_KEY_PATH)
    .expect("Failed to read GmiCloud API key file");
  GmiCloudApiKey::from_str(&secret)
}
