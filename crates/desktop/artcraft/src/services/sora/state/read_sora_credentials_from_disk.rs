use crate::core::state::data_dir::app_data_root::AppDataRoot;
use anyhow::anyhow;
use errors::AnyhowResult;
use openai_sora_client::creds::sora_cookies::SoraCookies;
use openai_sora_client::creds::sora_credential_set::SoraCredentialSet;
use openai_sora_client::creds::sora_jwt_bearer_token::SoraJwtBearerToken;
use openai_sora_client::creds::sora_sentinel::SoraSentinel;
use std::fs::read_to_string;
use openai_sora_client::creds::sora_sentinel_token::SoraSentinelToken;

pub fn read_sora_credentials_from_disk(app_data_root: &AppDataRoot) -> AnyhowResult<SoraCredentialSet> {
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

  Ok(SoraCredentialSet::initialize(
    cookie,
    bearer,
    sentinel,
    sentinel_token,
  ))
}
