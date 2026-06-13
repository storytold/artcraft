use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::utils::api_host::ApiHost;
use log::info;

pub struct ArtCraftClient {
    pub api_host: ApiHost,
    pub credentials: Option<StorytellerCredentialSet>,
}

impl ArtCraftClient {
    pub fn new(credentials: Option<StorytellerCredentialSet>) -> Self {
        let api_host = ApiHost::Storyteller;
        info!("ArtCraft client initialized with host: Storyteller");
        Self {
            api_host,
            credentials,
        }
    }

    pub fn creds_ref(&self) -> Option<&StorytellerCredentialSet> {
        self.credentials.as_ref()
    }
}
