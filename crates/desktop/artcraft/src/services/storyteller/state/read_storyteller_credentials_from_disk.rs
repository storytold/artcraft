use crate::core::state::data_dir::app_data_root::AppDataRoot;
use errors::AnyhowResult;
use std::fs::read_to_string;
use artcraft_client::credentials::storyteller_avt_cookie::StorytellerAvtCookie;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::credentials::storyteller_session_cookie::StorytellerSessionCookie;

pub fn read_storyteller_credentials_from_disk(app_data_root: &AppDataRoot) -> AnyhowResult<StorytellerCredentialSet> {
  let creds_dir= app_data_root.credentials_dir();

  let mut avt = None;

  {
    let avt_file = creds_dir.get_storyteller_avt_cookie_file_path();
    if avt_file.exists() {
      let contents = read_to_string(&avt_file)?
          .trim()
          .to_string();
      avt = Some(StorytellerAvtCookie::new(contents));
    }
  }  

  let mut session = None;

  {
    let session_file = creds_dir.get_storyteller_session_cookie_file_path();
    if session_file.exists() {
      let contents = read_to_string(&session_file)?
          .trim()
          .to_string();
      session = Some(StorytellerSessionCookie::new(contents));
    }
  }

  Ok(StorytellerCredentialSet::initialize(
    avt,
    session,
  ))
}
