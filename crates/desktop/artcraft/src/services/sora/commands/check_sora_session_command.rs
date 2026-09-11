use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use chrono::{TimeDelta, Utc};
use errors::AnyhowResult;
use log::{error, info};
use openai_sora_client::recipes::maybe_upgrade_or_renew_session::maybe_upgrade_or_renew_session;
use openai_sora_client::requests::list_classic_tasks::list_classic_tasks::list_classic_tasks;
use serde_derive::Serialize;
use std::ops::Add;
use tauri::{AppHandle, State};

const CACHE_PERIOD : TimeDelta = TimeDelta::milliseconds(1000 * 60 * 5); // 5 minutes

#[derive(Serialize)]
#[serde(rename_all = "snake_case")]
pub struct CheckSoraSessionCommand {
  pub state: SoraSessionState,
  pub maybe_account_email: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "snake_case")]
pub enum SoraSessionState{
  #[serde(rename = "not_set_up")]
  NotSetUp,
  #[serde(rename = "expired_or_error")]
  ExpiredOrError,
  #[serde(rename = "valid")]
  Valid,
}

// TODO: Deprecate this
#[deprecated(note="Not 100% deprecated yet - it may still have uses. But use sora_get_credential_info_command instead.")]
#[tauri::command]
pub async fn check_sora_session_command(
  app: AppHandle,
  sora_creds_manager: State<'_, SoraCredentialManager>,
) -> Result<CheckSoraSessionCommand, CheckSoraSessionCommand> {
  info!("check_sora_session_command called");

  match do_check(&sora_creds_manager).await {
    Ok(state) => Ok(state),
    Err(err) => {
      error!("Error checking session state: {:?}", err);
      Err(CheckSoraSessionCommand {
        state: SoraSessionState::ExpiredOrError,
        maybe_account_email: None,
      })
    }
  }
}

async fn do_check(
  sora_creds_manager: &SoraCredentialManager,
) -> AnyhowResult<CheckSoraSessionCommand> {
  
  let mut creds = match sora_creds_manager.get_credentials()? {
    Some(creds) => creds,
    None => {
      return Ok(CheckSoraSessionCommand {
        state: SoraSessionState::NotSetUp,
        maybe_account_email: None,
      });
    }
  };

  let mut needs_upgrade_or_check = false;
  
  let stats = sora_creds_manager.get_credential_stats()?;

  match stats.last_consecutive_credential_success {
    None => {
      info!("Session never checked, needs upgrade or status checking.");
      needs_upgrade_or_check= true;
    }
    Some(last_success) => {
      let now = chrono::Utc::now();
      let expires = last_success.add(CACHE_PERIOD);
      if now.gt(&expires) {
        info!("Session success expired, needs upgrade or status checking.");
        needs_upgrade_or_check = true;
      }
    }
  }
  
  let mut upgraded = false;
  
  if needs_upgrade_or_check {
    info!("Attempting to upgrade session...");
    upgraded = maybe_upgrade_or_renew_session(&mut creds).await?;
    info!("Attempting to check session...");
    list_classic_tasks(&creds).await?; // Intent here is to make sure the upgrade request worked.
    sora_creds_manager.record_credential_success()?;
  }

  if upgraded {
    info!("Saving upgraded session to manager and disk...");
    sora_creds_manager.set_credentials(&creds)?;
    sora_creds_manager.persist_all_to_disk()?;
  }
  
  let maybe_account_email = creds
      .jwt_bearer_token
      .map(|token| token.jwt_claims().email.clone());

  Ok(CheckSoraSessionCommand {
    state: SoraSessionState::Valid,
    maybe_account_email,
  })
}
