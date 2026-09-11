use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::worldlabs::state::worldlabs_credential_holder::WorldlabsCredentialHolder;
use crate::services::worldlabs::state::worldlabs_serializable_state::{WorldlabsSerializableState, SERIALIZABLE_WORLDLABS_STATE_VERSION};
use cookie_store::cookie_store::CookieStore;
use errors::AnyhowResult;
use log::{info, warn};
use std::fs::read_to_string;
use std::sync::{Arc, RwLock};
use worldlabs_consumer_client::credentials::world_labs_bearer_token::WorldLabsBearerToken;
use worldlabs_consumer_client::credentials::world_labs_cookies::WorldLabsCookies;
use worldlabs_consumer_client::credentials::worldlabs_refresh_token::WorldLabsRefreshToken;

#[derive(Clone)]
pub struct WorldlabsCredentialManager {
  // TODO: Put last write/last read timestamps on these.
  credential_data: Arc<RwLock<WorldlabsCredentialHolder>>,

  //user_info: Arc<RwLock<Option<MidjourneyUserInfo>>>,
  app_data_root: AppDataRoot,
}

impl WorldlabsCredentialManager {
  pub fn initialize_empty(app_data_root: &AppDataRoot) -> Self {
    Self {
      credential_data: Arc::new(RwLock::new(WorldlabsCredentialHolder::empty())),
      app_data_root: app_data_root.clone(),
    }
  }

  pub fn initialize_from_disk_infallible(app_data_root: &AppDataRoot) -> Self {
    let mut credential_data;

    let result = WorldlabsSerializableState::read_from_disk(app_data_root);
    match result {
      Err(err) => {
        warn!("Failed to read worldlabs state from disk: {:?}", err);
        credential_data = Arc::new(RwLock::new(WorldlabsCredentialHolder::empty()));
      },
      Ok(None) => {
        credential_data = Arc::new(RwLock::new(WorldlabsCredentialHolder::empty()));
      }
      Ok(Some(state)) => {
        let maybe_browser_cookies = state.user_cookies
            .as_ref()
            .map(|cookies| cookies.to_cookie_store());

        let maybe_cookies = maybe_browser_cookies
            .as_ref()
            .map(|cookies| cookies.to_cookie_string())
            .map(|cookies| WorldLabsCookies::new(cookies));

        let maybe_bearer = state.bearer_token
            .map(|bearer| WorldLabsBearerToken::new(bearer));

        let maybe_refresh = state.refresh_token
            .map(|bearer| WorldLabsRefreshToken::new(bearer));

        credential_data = Arc::new(RwLock::new(WorldlabsCredentialHolder {
          browser_cookies: maybe_browser_cookies,
          world_labs_cookies: maybe_cookies,
          world_labs_bearer_token: maybe_bearer,
          world_labs_refresh_token: maybe_refresh,
        }));
      }
    };

    Self {
      credential_data,
      app_data_root: app_data_root.clone(),
    }
  }

  pub fn maybe_copy_cookie_store(&self) -> anyhow::Result<Option<CookieStore>> {
    match self.credential_data.read() {
      Err(err) => Err(anyhow::anyhow!("Failed to acquire read lock: {:?}", err)),
      Ok(holder) => Ok(holder.browser_cookies.clone()),
    }
  }

  pub fn maybe_copy_cookie_header_string(&self) -> anyhow::Result<Option<String>> {
    let maybe_cookies = self.maybe_copy_cookie_store()?;
    let maybe_cookies = maybe_cookies.map(|cookies| {
      cookies.to_cookie_string()
    });
    Ok(maybe_cookies)
  }

  pub fn maybe_copy_typed_cookies(&self) -> anyhow::Result<Option<WorldLabsCookies>> {
    let maybe_cookies = self.maybe_copy_cookie_header_string()?;
    let maybe_cookies = maybe_cookies.map(|cookies| {
      WorldLabsCookies::new(cookies)
    });
    Ok(maybe_cookies)
  }

  pub fn maybe_copy_bearer_token(&self) -> anyhow::Result<Option<WorldLabsBearerToken>> {
    match self.credential_data.read() {
      Err(err) => Err(anyhow::anyhow!("Failed to acquire read lock: {:?}", err)),
      Ok(holder) => Ok(holder.world_labs_bearer_token.clone()),
    }
  }

  pub fn maybe_copy_refresh_token(&self) -> anyhow::Result<Option<WorldLabsRefreshToken>> {
    match self.credential_data.read() {
      Err(err) => Err(anyhow::anyhow!("Failed to acquire read lock: {:?}", err)),
      Ok(holder) => Ok(holder.world_labs_refresh_token.clone()),
    }
  }

  pub fn replace_cookie_store(&self, store: CookieStore) -> anyhow::Result<()> {
    match self.credential_data.write() {
      Err(err) => Err(anyhow::anyhow!("Failed to acquire write lock: {:?}", err)),
      Ok(mut holder) => {
        holder.browser_cookies = Some(store);
        Ok(())
      }
    }
  }

  pub fn replace_bearer_token(&self, token: WorldLabsBearerToken) -> anyhow::Result<()> {
    match self.credential_data.write() {
      Err(err) => Err(anyhow::anyhow!("Failed to acquire write lock: {:?}", err)),
      Ok(mut holder) => {
        holder.world_labs_bearer_token = Some(token);
        Ok(())
      }
    }
  }

  pub fn replace_refresh_token(&self, token: WorldLabsRefreshToken) -> anyhow::Result<()> {
    match self.credential_data.write() {
      Err(err) => Err(anyhow::anyhow!("Failed to acquire write lock: {:?}", err)),
      Ok(mut holder) => {
        holder.world_labs_refresh_token = Some(token);
        Ok(())
      }
    }
  }

  pub fn replace_bearer_and_refresh_token(&self, bearer_token: WorldLabsBearerToken, refresh_token: WorldLabsRefreshToken) -> anyhow::Result<()> {
    match self.credential_data.write() {
      Err(err) => Err(anyhow::anyhow!("Failed to acquire write lock: {:?}", err)),
      Ok(mut holder) => {
        holder.world_labs_bearer_token = Some(bearer_token);
        holder.world_labs_refresh_token = Some(refresh_token);
        Ok(())
      }
    }
  }

  // NB: This is just a heuristic. We'll add better checks later.
  pub fn do_task_polling(&self) -> anyhow::Result<bool> {
    self.session_appears_active()
  }

  // NB: This is just a heuristic. We'll add better checks later.
  pub fn session_appears_active(&self) -> anyhow::Result<bool> {
    let holder = match self.credential_data.read() {
      Err(err) => return Err(anyhow::anyhow!("Failed to acquire read lock: {:?}", err)),
      Ok(store) => store.clone(),
    };

    if holder.world_labs_bearer_token.is_some() {
      return Ok(true);
    }

    if holder.browser_cookies.is_none() {
      return Ok(false);
    }

    Ok(false)
  }

  pub fn clear_credentials(&self) -> anyhow::Result<()> {
    match self.credential_data.write() {
      Err(err) => return Err(anyhow::anyhow!("Failed to acquire write lock: {:?}", err)),
      Ok(mut store) => *store = WorldlabsCredentialHolder::empty(),
    }
    Ok(())
  }

  pub fn persist_to_disk(&self) -> anyhow::Result<()> {
    let creds = match self.credential_data.read() {
      Err(err) => return Err(anyhow::anyhow!("Failed to acquire read lock: {:?}", err)),
      Ok(store) => store.clone(),
    };

    let state = WorldlabsSerializableState {
      version: SERIALIZABLE_WORLDLABS_STATE_VERSION,
      user_cookies: creds.browser_cookies
          .as_ref()
          .map(|cookies| cookies.to_serializable()),
      user_id: None, // TODO
      user_email: None, // TODO
      bearer_token: creds.world_labs_bearer_token
          .as_ref()
          .map(|token| token.to_raw_string()),
      refresh_token: creds.world_labs_refresh_token
          .as_ref()
          .map(|token| token.to_raw_string()),
    };

    let path = self.app_data_root.credentials_dir().get_worldlabs_state_path();
    let serialized = serde_json::to_string(&state)?;

    std::fs::write(path, serialized)?;

    // TODO: This is just for building the client and testing.
    {
      if let Some(cookies) = creds.browser_cookies.as_ref() {
        let cookies_header = cookies.to_cookie_string();
        let path = self.app_data_root.credentials_dir().get_worldlabs_cookies_path();
        std::fs::write(path, cookies_header)?;
      }

      // TODO: This is just for building the client and testing.
      if let Some(bearer) = creds.world_labs_bearer_token.as_ref() {
        let value = bearer.to_raw_string();
        let path = self.app_data_root.credentials_dir().get_worldlabs_bearer_path();
        std::fs::write(path, value)?;
      }

      if let Some(refresh) = creds.world_labs_refresh_token.as_ref() {
        let value = refresh.to_raw_string();
        let path = self.app_data_root.credentials_dir().get_worldlabs_refresh_path();
        std::fs::write(path, value)?;
      }
    }

    Ok(())
  }
}
