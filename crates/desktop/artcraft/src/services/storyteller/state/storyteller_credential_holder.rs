use anyhow::anyhow;
use errors::AnyhowResult;
use std::sync::{Arc, RwLock};
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;

/// Hold credentials for the application.
#[derive(Clone)]
pub struct StorytellerCredentialHolder {
  credentials: Arc<RwLock<Option<StorytellerCredentialSet>>>,
}

impl StorytellerCredentialHolder {
  pub fn new() -> Self {
    Self {
      credentials: Arc::new(RwLock::new(None)),
    }
  }

  pub fn set_credentials(&self, credentials: &StorytellerCredentialSet) -> AnyhowResult<()> {
    match self.credentials.write() {
      Err(err) => Err(anyhow!("Failed to acquire write lock: {:?}", err)),
      Ok(mut creds) => {
        *creds = Some(credentials.clone());
        Ok(())
      }
    }
  }

  pub fn clear_credentials(&self) -> AnyhowResult<()> {
    match self.credentials.write() {
      Err(err) => Err(anyhow!("Failed to acquire write lock: {:?}", err)),
      Ok(mut creds) => {
        *creds = None;
        Ok(())
      }
    }
  }

  pub fn get_credentials(&self) -> AnyhowResult<Option<StorytellerCredentialSet>> {
    match self.credentials.read() {
      Err(err) => Err(anyhow!("Failed to acquire read lock: {:?}", err)),
      Ok(creds) => {
        Ok(creds.clone())
      }
    }
  }

  pub fn get_credentials_required(&self) -> AnyhowResult<StorytellerCredentialSet> {
    match self.credentials.read() {
      Err(err) => Err(anyhow!("Failed to acquire read lock: {:?}", err)),
      Ok(creds) => match &*creds {
        None => Err(anyhow!("Storyteller credentials not set")),
        Some(creds) => Ok(creds.clone()),
      }
    }
  }
}
