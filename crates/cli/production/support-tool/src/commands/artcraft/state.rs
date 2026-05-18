use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::utils::api_host::ApiHost;

pub struct ArtcraftState {
  pub creds: StorytellerCredentialSet,
  pub api_host: ApiHost,
}
