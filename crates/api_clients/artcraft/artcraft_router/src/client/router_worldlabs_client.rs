use worldlabs_api_client::credentials::world_labs_api_creds::WorldLabsApiCreds;

/// A client for the official World Labs (Marble) API.
pub struct RouterWorldLabsClient {
  pub(crate) creds: WorldLabsApiCreds,
}

impl RouterWorldLabsClient {
  pub fn new(creds: WorldLabsApiCreds) -> Self {
    Self { creds }
  }

  pub fn new_from_raw_key(api_key: &str) -> Self {
    Self::new(WorldLabsApiCreds::new(api_key.to_string()))
  }
}
