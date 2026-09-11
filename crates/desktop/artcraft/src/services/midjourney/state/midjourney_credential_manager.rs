use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::midjourney::state::midjourney_user_info::MidjourneyUserInfo;
use crate::services::midjourney::state::serializable_midjourney_state::{SerializableMidjourneyState, SERIALIZABLE_MIDJOURNEY_STATE_VERSION};
use crate::services::storyteller::state::read_storyteller_credentials_from_disk::read_storyteller_credentials_from_disk;
use crate::services::storyteller::state::storyteller_credential_holder::StorytellerCredentialHolder;
use cookie_store::cookie_store::CookieStore;
use errors::AnyhowResult;
use log::{info, warn};
use std::fs::read_to_string;
use std::sync::{Arc, RwLock};
use midjourney_client::credentials::cookie_store_has_auth_cookies::cookie_store_has_auth_cookies;
use artcraft_client::credentials::storyteller_avt_cookie::StorytellerAvtCookie;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::credentials::storyteller_session_cookie::StorytellerSessionCookie;

#[derive(Clone)]
pub struct MidjourneyCredentialManager {
  // TODO: Put last write/last read timestamps on these.
  cookies: Arc<RwLock<Option<CookieStore>>>,
  user_info: Arc<RwLock<Option<MidjourneyUserInfo>>>,
  app_data_root: AppDataRoot,
}

impl MidjourneyCredentialManager {
  pub fn initialize_empty(app_data_root: &AppDataRoot) -> Self {
    Self {
      cookies: Arc::new(RwLock::new(None)),
      user_info: Arc::new(RwLock::new(None)),
      app_data_root: app_data_root.clone(),
    }
  }

  pub fn initialize_from_disk_infallible(app_data_root: &AppDataRoot) -> Self {
    let mut cookies;
    let mut user_info;
    
    match read_midjourney_state_from_disk(app_data_root) {
      Err(err) => {
        warn!("Failed to read midjourney state from disk: {:?}", err);
        cookies = Arc::new(RwLock::new(None));
        user_info = Arc::new(RwLock::new(None));
      },
      Ok(None) => {
        cookies = Arc::new(RwLock::new(None));
        user_info = Arc::new(RwLock::new(None));
      }
      Ok(Some(state)) => {
        let maybe_cookies = state.user_cookies
            .map(|cookies| cookies.to_cookie_store());
        let maybe_user_info = state.user_info
            .map(|info| info.to_user_info());
        cookies = Arc::new(RwLock::new(maybe_cookies));
        user_info = Arc::new(RwLock::new(maybe_user_info));
      }
    };

    Self {
      cookies,
      user_info,
      app_data_root: app_data_root.clone(),
    }
  }
  
  pub fn maybe_copy_cookie_store(&self) -> anyhow::Result<Option<CookieStore>> {
    match self.cookies.read() {
      Err(err) => Err(anyhow::anyhow!("Failed to acquire write lock: {:?}", err)),
      Ok(store) => Ok(store.clone()),
    }
  }
  
  pub fn maybe_copy_user_info(&self) -> anyhow::Result<Option<MidjourneyUserInfo>> {
    match self.user_info.read() {
      Err(err) => Err(anyhow::anyhow!("Failed to acquire read lock: {:?}", err)),
      Ok(info) => Ok(info.clone()),
    }
  }
  
  pub fn replace_cookie_store(&self, store: CookieStore) -> anyhow::Result<()> {
    match self.cookies.write() {
      Err(err) => Err(anyhow::anyhow!("Failed to acquire write lock: {:?}", err)),
      Ok(mut current_store) => {
        *current_store = Some(store);
        Ok(())
      }
    }
  }

  pub fn replace_user_info(&self, user_info: MidjourneyUserInfo) -> anyhow::Result<()> {
    match self.user_info.write() {
      Err(err) => Err(anyhow::anyhow!("Failed to acquire write lock: {:?}", err)),
      Ok(mut current_info) => {
        *current_info = Some(user_info);
        Ok(())
      }
    }
  }

  // NB: This is just a heuristic. We'll add better checks later.
  pub fn session_appears_active(&self) -> anyhow::Result<bool> {
    let maybe_cookies = match self.cookies.read() {
      Err(err) => return Err(anyhow::anyhow!("Failed to acquire read lock: {:?}", err)),
      Ok(store) => store.clone(),
    };

    let maybe_user_info = match self.user_info.read() {
      Err(err) => return Err(anyhow::anyhow!("Failed to acquire read lock: {:?}", err)),
      Ok(info) => info.clone(),
    };

    if maybe_cookies.is_none() || maybe_user_info.is_none() {
      return Ok(false);
    }

    let cookies = maybe_cookies.unwrap();
    let user_info = maybe_user_info.unwrap();

    // NB: We consider the session active if we have auth cookies and a user id.
    let has_user_id = user_info.user_id.is_some();
    let maybe_has_auth_cookies = cookie_store_has_auth_cookies(&cookies);

    // Misc cookies without login cookies are ~1055 length
    // AUTH_I is ~1500 length
    // AUTH_R is ~500 length
    let maybe_has_big_enough_cookie = cookies.calculate_approx_cookie_character_length() > 2100;

    // TODO: Heuristic should count.
    // TODO: Consolidate with "login window thread" logic.
    // TODO: Check timestamp of last valid request.
    Ok(has_user_id && maybe_has_auth_cookies && maybe_has_big_enough_cookie && maybe_has_big_enough_cookie)
  }

  pub fn clear_credentials(&self) -> anyhow::Result<()> {
    match self.cookies.write() {
      Err(err) => return Err(anyhow::anyhow!("Failed to acquire write lock: {:?}", err)),
      Ok(mut store) => *store = None,
    }
    match self.user_info.write() {
      Err(err) => return Err(anyhow::anyhow!("Failed to acquire write lock: {:?}", err)),
      Ok(mut info) => *info = None,
    }
    Ok(())
  }
  
  pub fn persist_to_disk(&self) -> anyhow::Result<()> {
    let maybe_cookies = match self.cookies.read() {
      Err(err) => return Err(anyhow::anyhow!("Failed to acquire read lock: {:?}", err)),
      Ok(store) => store.clone(),
    };

    let maybe_user_info = match self.user_info.read() {
      Err(err) => return Err(anyhow::anyhow!("Failed to acquire read lock: {:?}", err)),
      Ok(info) => info.clone(),
    };
    
    let maybe_cookies= maybe_cookies
        .map(|cookies| cookies.to_serializable());
    
    let maybe_user_info= maybe_user_info
        .map(|info| info.to_serializable());

    if maybe_cookies.is_none() && maybe_user_info.is_none() {
      info!("Nothing to write to disk, skipping.");
      return Ok(());
      
    }

    let state = SerializableMidjourneyState {
      version: SERIALIZABLE_MIDJOURNEY_STATE_VERSION,
      user_cookies: maybe_cookies,
      user_info: maybe_user_info,
    };

    let path = self.app_data_root.credentials_dir().get_midjourney_state_path();
    let serialized = serde_json::to_string(&state)?;
    
    std::fs::write(path, serialized)?;

    Ok(())
  }
}

fn read_midjourney_state_from_disk(root: &AppDataRoot) -> AnyhowResult<Option<SerializableMidjourneyState>> {
  let midjourney_state_path= root.credentials_dir().get_midjourney_state_path();

  if !midjourney_state_path.exists() {
    return Ok(None);
  }
  
  let contents = read_to_string(&midjourney_state_path)?
      .trim()
      .to_string();
  
  let state: SerializableMidjourneyState = serde_json::from_str(&contents)?;

  Ok(Some(state))
}
