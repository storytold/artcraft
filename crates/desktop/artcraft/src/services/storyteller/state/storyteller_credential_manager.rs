use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::storyteller::state::read_storyteller_credentials_from_disk::read_storyteller_credentials_from_disk;
use crate::services::storyteller::state::storyteller_credential_holder::StorytellerCredentialHolder;
use errors::AnyhowResult;
use log::{info, warn};
use std::fs::OpenOptions;
use std::io::Write;
use artcraft_client::credentials::storyteller_avt_cookie::StorytellerAvtCookie;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::credentials::storyteller_session_cookie::StorytellerSessionCookie;

#[derive(Clone)]
pub struct StorytellerCredentialManager {
  holder: StorytellerCredentialHolder,
  app_data_root: AppDataRoot,
}

impl StorytellerCredentialManager {

  pub fn initialize_empty(app_data_root: &AppDataRoot) -> Self {
    Self {
      holder: StorytellerCredentialHolder::new(),
      app_data_root: app_data_root.clone(),
    }
  }
  
  pub fn initialize_from_disk_infallible(app_data_root: &AppDataRoot) -> Self {
    let holder = StorytellerCredentialHolder::new();

    match read_storyteller_credentials_from_disk(app_data_root) {
      Err(err) => warn!("Failed to read credentials from disk: {:?}", err),
      Ok(creds) => {
        holder.set_credentials(&creds).expect("Failed to set credentials");
      }
    }

    Self {
      holder,
      app_data_root: app_data_root.clone(),
    }
  }

  pub fn set_credentials(&self, creds: &StorytellerCredentialSet) -> AnyhowResult<()> {
    self.holder.set_credentials(creds)
  }

  pub fn clear_credentials(&self) -> AnyhowResult<()> {
    self.holder.clear_credentials()?;
    Ok(())
  }

  pub fn get_credentials(&self) -> AnyhowResult<Option<StorytellerCredentialSet>> {
    self.holder.get_credentials()
  }

  pub fn get_credentials_required(&self) -> AnyhowResult<StorytellerCredentialSet> {
    self.holder.get_credentials_required()
  }

  pub fn reset_from_disk(&self) -> AnyhowResult<StorytellerCredentialSet> {
    let creds = read_storyteller_credentials_from_disk(&self.app_data_root)?;
    self.holder.set_credentials(&creds)?;
    Ok(creds)
  }

  pub fn persist_all_to_disk(&self) -> AnyhowResult<()> {
    let credentials = self.holder.get_credentials_required()?;

    info!("Persisting avt cookie to disk...");
    if let Some(avt) = credentials.avt.as_ref() {
      persist_avt_to_disk(&avt, &self.app_data_root)?;
    }

    info!("Persisting session cookie to disk...");
    if let Some(session) = credentials.session.as_ref() {
      persist_session_to_disk(&session, &self.app_data_root)?;
    }

    Ok(())
  }

  pub fn delete_persisted_copies_on_disk(&self) -> AnyhowResult<()> {
    let creds_dir = self.app_data_root.credentials_dir();

    let session_file = creds_dir.get_storyteller_session_cookie_file_path();
    if session_file.exists() {
      std::fs::remove_file(session_file)?;
    }

    let avt_file = creds_dir.get_storyteller_avt_cookie_file_path();
    if avt_file.exists() {
      std::fs::remove_file(avt_file)?;
    }

    Ok(())
  }
}

fn persist_session_to_disk(session: &StorytellerSessionCookie, app_data_root: &AppDataRoot) -> AnyhowResult<()> {
  let creds_dir = app_data_root.credentials_dir();
  let filename = creds_dir.get_storyteller_session_cookie_file_path();

  let mut file = OpenOptions::new()
      .create(true)
      .write(true)
      .truncate(true)
      .open(filename)?;

  file.write_all(session.as_bytes())?;
  file.flush()?;

  Ok(())
}

fn persist_avt_to_disk(avt: &StorytellerAvtCookie, app_data_root: &AppDataRoot) -> AnyhowResult<()> {
  let creds_dir = app_data_root.credentials_dir();
  let filename = creds_dir.get_storyteller_avt_cookie_file_path();

  let mut file = OpenOptions::new()
      .create(true)
      .write(true)
      .truncate(true)
      .open(filename)?;

  file.write_all(avt.as_bytes())?;
  file.flush()?;

  Ok(())
}
