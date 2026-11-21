use crate::core::state::data_dir::app_data_root::AppDataRoot;
use anyhow::anyhow;
use errors::AnyhowResult;
use log::{info, warn};
use openai_sora_client::creds::sora_cookies::SoraCookies;
use openai_sora_client::creds::sora_credential_set::SoraCredentialSet;
use openai_sora_client::creds::sora_jwt_bearer_token::SoraJwtBearerToken;
use openai_sora_client::creds::sora_sentinel::SoraSentinel;
use openai_sora_client::creds::sora_sentinel_token::SoraSentinelToken;
use openai_sora_client::recipes::maybe_upgrade_or_renew_session::maybe_upgrade_or_renew_session;
use std::fs::{read_to_string, OpenOptions};
use std::io::Write;

pub async fn read_sora_credentials_from_disk_with_upgrade(app_data_root: &AppDataRoot) -> AnyhowResult<SoraCredentialSet> {
  let cookie_file = app_data_root.get_sora_cookie_file_path();
  let bearer_file = app_data_root.get_sora_bearer_token_file_path();
  let legacy_sentinel_file = app_data_root.get_sora_legacy_sentinel_file_path();
  let sentinel_token_file = app_data_root.get_sora_sentinel_token_file_path();

  if !cookie_file.exists() {
    return Err(anyhow!("Cookie file does not exist: {:?}", cookie_file));
  }

  let value = read_to_string(cookie_file)?
      .trim()
      .to_string();

  let cookie = SoraCookies::new(value);

  let mut bearer = None;
  let mut sentinel = None;
  let mut sentinel_token = None;

  if bearer_file.exists() {
    let value = read_to_string(&bearer_file)?
        .trim()
        .to_string();
    bearer = Some(SoraJwtBearerToken::new(value)?);
  }

  if legacy_sentinel_file.exists() {
    let value = read_to_string(&legacy_sentinel_file)?
        .trim()
        .to_string();

    sentinel = Some(SoraSentinel::new(value));
  }

  if sentinel_token_file.exists() {
    let value = read_to_string(&sentinel_token_file)?
        .trim()
        .to_string();

    sentinel_token = Some(SoraSentinelToken::from_persistent_storage_json(&value)?);
  }

  let mut credentials = SoraCredentialSet::initialize(
    cookie,
    bearer,
    sentinel,
    sentinel_token,
  );

  let response = maybe_upgrade_or_renew_session(&mut credentials).await;

  if let Err(err) = response {
    // NB: Make this portion infallible. Don't die on setup. We can recover downstream.
    warn!("Failed to upgrade or renew session: {:?}", err);
  }

  if !bearer_file.exists() {
    if let Some(bearer) = &credentials.jwt_bearer_token {
      info!("Persisting bearer token value...");
      let value = bearer.token_str();

      let mut file = OpenOptions::new()
          .create(true)
          .write(true)
          .truncate(true)
          .open(&bearer_file)?;

      file.write_all(value.as_bytes())?;
      file.flush()?;
    }
  }

  if !legacy_sentinel_file.exists() {
    if let Some(sentinel) = &credentials.sora_sentinel {
      info!("Persisting sentinel value...");
      let value = sentinel.get_sentinel();

      let mut file = OpenOptions::new()
          .create(true)
          .write(true)
          .truncate(true)
          .open(&legacy_sentinel_file)?;

      file.write_all(value.as_bytes())?;
      file.flush()?;
    }
  }
  
  if !sentinel_token_file.exists() {
    if let Some(sentinel_token) = &credentials.sora_sentinel_token {
      info!("Persisting sentinel token...");
      let value = sentinel_token.to_persistent_storage_json()?;

      let mut file = OpenOptions::new()
          .create(true)
          .write(true)
          .truncate(true)
          .open(&sentinel_token_file)?;

      file.write_all(value.as_bytes())?;
      file.flush()?;
    }
  }

  Ok(credentials)
}
