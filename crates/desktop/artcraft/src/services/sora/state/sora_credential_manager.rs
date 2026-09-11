use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::sora::state::read_sora_credentials_from_disk::read_sora_credentials_from_disk;
use crate::services::sora::state::sora_credential_holder::SoraCredentialHolder;
use crate::services::sora::state::sora_credential_stats::SoraCredentialStats;
use errors::AnyhowResult;
use log::{error, info, warn};
use memory_store::clone_cell::CloneCell;
use openai_sora_client::creds::sora_cookies::SoraCookies;
use openai_sora_client::creds::sora_credential_set::SoraCredentialSet;
use openai_sora_client::creds::sora_jwt_bearer_token::SoraJwtBearerToken;
use openai_sora_client::creds::sora_sentinel::SoraSentinel;
use openai_sora_client::requests::auth_sentinel::generate_sentinel_token::generate_sentinel_token;
use std::fs::OpenOptions;
use std::io::Write;
use std::path::Path;
use std::{fs, io};

#[derive(Clone)]
pub struct SoraCredentialManager {
  holder: SoraCredentialHolder,
  app_data_root: AppDataRoot,
  
  /// This is meant to help debug credential issues, keep credentials cached, fresh, etc.
  // TODO: Put this into the same structure as the credentials and also persist to disk.
  stats: CloneCell<SoraCredentialStats>,
}

impl SoraCredentialManager {

  pub fn initialize_from_disk_infallible(app_data_root: &AppDataRoot) -> Self {
    let holder = SoraCredentialHolder::new();

    match read_sora_credentials_from_disk(app_data_root) {
      Err(err) => warn!("Failed to read credentials from disk: {:?}", err),
      Ok(creds) => {
        holder.set_credentials(&creds).expect("Failed to set credentials");
      }
    }

    Self {
      holder,
      app_data_root: app_data_root.clone(),
      stats: CloneCell::with_owned(SoraCredentialStats::new()),
    }
  }

  pub fn record_credential_success(&self) -> AnyhowResult<()> {
    let mut stats = self.stats.get_clone()?;
    stats.record_credential_success();
    self.stats.set_owned(stats)?;
    Ok(())
  }

  pub fn record_credential_failure(&self) -> AnyhowResult<()> {
    let mut stats = self.stats.get_clone()?;
    stats.record_credential_failure();
    self.stats.set_owned(stats)?;
    Ok(())
  }
  
  pub fn reset_credential_stats(&self) -> AnyhowResult<()> {
    self.stats.set_owned(SoraCredentialStats::new())
  }
  
  /// This does not guarantee the credentials are correct
  pub fn has_apparently_complete_credentials(&self) -> AnyhowResult<bool> {
    self.holder.has_apparently_complete_credentials()
  }
  
  pub fn get_credential_stats(&self) -> AnyhowResult<SoraCredentialStats> {
    self.stats.get_clone()
  }

  pub fn set_credential_stats(&self, stats: SoraCredentialStats) -> AnyhowResult<()> {
    self.stats.set_owned(stats)
  }

  pub fn set_credentials(&self, creds: &SoraCredentialSet) -> AnyhowResult<()> {
    self.holder.set_credentials(creds)
  }

  pub fn clear_credentials(&self) -> AnyhowResult<()> {
    self.holder.clear_credentials()?;
    Ok(())
  }

  /// This is meant to be infallible.
  pub fn purge_credentials_from_disk(&self) -> Result<(), io::Error> {
    let creds_dir = self.app_data_root.credentials_dir();

    remove_file_if_exists(creds_dir.get_sora_cookie_file_path())?;
    remove_file_if_exists(creds_dir.get_sora_bearer_token_file_path())?;
    remove_file_if_exists(creds_dir.get_sora_legacy_sentinel_file_path())?;
    
    Ok(())
  }
  
  /// This is meant to be infallible.
  pub fn try_purge_credentials_from_disk(&self) {
    let creds_dir = self.app_data_root.credentials_dir();
    if let Err(err) = fs::remove_file(creds_dir.get_sora_cookie_file_path()) {
      error!("Failed to remove cookie file: {:?}", err);
    }
    if let Err(err) = fs::remove_file(creds_dir.get_sora_bearer_token_file_path()) {
      error!("Failed to remove bearer token file: {:?}", err);
    }
    if let Err(err) = fs::remove_file(creds_dir.get_sora_legacy_sentinel_file_path()) {
      error!("Failed to remove sentinel file: {:?}", err);
    }
  }

  pub fn get_credentials(&self) -> AnyhowResult<Option<SoraCredentialSet>> {
    self.holder.get_credentials()
  }

  pub fn get_credentials_required(&self) -> AnyhowResult<SoraCredentialSet> {
    self.holder.get_credentials_required()
  }

  pub fn reset_from_disk(&self) -> AnyhowResult<SoraCredentialSet> {
    let creds = read_sora_credentials_from_disk(&self.app_data_root)?;
    self.holder.set_credentials(&creds)?;
    Ok(creds)
  }

  pub fn persist_all_to_disk(&self) -> AnyhowResult<()> {
    let credentials = self.holder.get_credentials_required()?;

    info!("Persisting cookies to disk...");
    persist_cookies_to_disk(&credentials.cookies, &self.app_data_root)?;

    if let Some(bearer) = &credentials.jwt_bearer_token {
      info!("Persisting JWT to disk...");
      persist_jwt_bearer_to_disk(bearer, &self.app_data_root)?;
    }

    if let Some(sentinel) = &credentials.sora_sentinel {
      info!("Persisting sentinel to disk...");
      persist_sentinel_to_disk(sentinel, &self.app_data_root)?;
    }

    Ok(())
  }

  /// Refresh the sentinel token from Sora's API
  pub async fn call_sentinel_refresh(&self) -> AnyhowResult<SoraCredentialSet> {
    // NB(bt,2025-04-21): Technically we don't need credentials to get a sentinel.
    let mut creds = self.holder.get_credentials_required()?;

    info!("Generating token...");

    let sentinel = generate_sentinel_token()
        .await
        .map_err(|err| {
          error!("Failed to refresh: {:?}", err);
          err
        })?;

    info!("Token obtained.");

    creds.sora_sentinel = Some(SoraSentinel::new(sentinel.clone()));

    self.holder.set_credentials(&creds)?;

    let mut file = OpenOptions::new()
        .create(true)
        .write(true)
        .truncate(true)
        .open(self.app_data_root.get_sora_legacy_sentinel_file_path())?;

    file.write_all(sentinel.as_bytes())?;
    file.flush()?;

    Ok(creds)
  }
}

fn persist_cookies_to_disk(cookies: &SoraCookies, app_data_root: &AppDataRoot) -> AnyhowResult<()> {
  let filename = app_data_root.get_sora_cookie_file_path();

  let mut file = OpenOptions::new()
      .create(true)
      .write(true)
      .truncate(true)
      .open(filename)?;

  file.write_all(cookies.as_bytes())?;
  file.flush()?;

  Ok(())
}

fn persist_jwt_bearer_to_disk(bearer: &SoraJwtBearerToken, app_data_root: &AppDataRoot) -> AnyhowResult<()> {
  let filename = app_data_root.get_sora_bearer_token_file_path();

  let mut file = OpenOptions::new()
      .create(true)
      .write(true)
      .truncate(true)
      .open(filename)?;

  file.write_all(bearer.as_bytes())?;
  file.flush()?;

  Ok(())
}

fn persist_sentinel_to_disk(sentinel: &SoraSentinel, app_data_root: &AppDataRoot) -> AnyhowResult<()> {
  let filename = app_data_root.get_sora_legacy_sentinel_file_path();

  let mut file = OpenOptions::new()
      .create(true)
      .write(true)
      .truncate(true)
      .open(filename)?;

  file.write_all(sentinel.as_bytes())?;
  file.flush()?;

  Ok(())
}

fn remove_file_if_exists<P: AsRef<Path>>(path: P) -> Result<(), io::Error> {
  let p = path.as_ref();
  if p.exists() && p.is_file() {
    fs::remove_file(p)?;
  }
  Ok(())
}
