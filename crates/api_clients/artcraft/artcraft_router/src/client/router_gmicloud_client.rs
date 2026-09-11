use gmicloud_client::creds::gmicloud_api_key::GmiCloudApiKey;

pub struct RouterGmiCloudClient {
  pub(crate) api_key: GmiCloudApiKey,
}

impl RouterGmiCloudClient {
  pub fn new(api_key: GmiCloudApiKey) -> Self {
    RouterGmiCloudClient { api_key }
  }
}
