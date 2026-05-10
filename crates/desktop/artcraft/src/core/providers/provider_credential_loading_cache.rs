use std::error::Error;
use std::fmt::Display;
use crate::core::providers::payload::provider_credential_payload::ProviderCredentialPayload;
use crate::core::providers::provider_credential_key::ProviderCredentialKey;
use crate::core::state::data_dir::app_data_root::AppDataRoot;

#[derive(Clone)]
pub struct ProviderCredentialLoadingCache {
  // TODO: Some kind of Arc<Lock<Cache<key,value>>>
  app_data_root: AppDataRoot,
}

impl ProviderCredentialLoadingCache {
  
  pub fn new(app_data_root: AppDataRoot) -> Self {
    Self {
      app_data_root,
    } 
  }
  
  pub fn get_credentials(&self, key: ProviderCredentialKey) -> Result<Option<ProviderCredentialPayload>, ProviderCredentialLoadingCacheError> {
    unimplemented!()
  }
  
  pub fn save_credentials(&self, key: ProviderCredentialKey, payload: ProviderCredentialPayload) -> Result<(), ProviderCredentialLoadingCacheError> {
    unimplemented!()
  }
}

#[derive(Debug)]
pub enum ProviderCredentialLoadingCacheError {
  IoError(std::io::Error),
}

impl Error for ProviderCredentialLoadingCacheError {
  fn source(&self) -> Option<&(dyn Error + 'static)> {
    match self {
      ProviderCredentialLoadingCacheError::IoError(err) => Some(err),
    }
  } 
}

impl Display for ProviderCredentialLoadingCacheError {
  
}

