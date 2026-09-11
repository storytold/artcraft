use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::utils::api_host::ApiHost;

pub struct RouterArtcraftClient {
  pub(crate) api_host: ApiHost,
  pub(crate) credentials: StorytellerCredentialSet,
}

impl RouterArtcraftClient {
  pub fn new(api_host: ApiHost, credentials: StorytellerCredentialSet) -> Self {
    Self { api_host, credentials }
  }
}
