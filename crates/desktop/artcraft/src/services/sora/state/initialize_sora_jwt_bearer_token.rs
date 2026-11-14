use crate::core::state::data_dir::app_data_root::AppDataRoot;
use anyhow::anyhow;
use errors::AnyhowResult;
use log::info;
use openai_sora_client::requests::auth_bearer::generate_bearer_jwt_with_cookie::generate_bearer_jwt_with_cookie;

/// Loading the JWT bearer token for the first time.
pub async fn initialize_sora_jwt_bearer_token(app_data_root: &AppDataRoot) -> AnyhowResult<()> {
  if !app_data_root.get_sora_cookie_file_path().exists() {
    return Err(anyhow!("Cookie file does not exist"));
  }

  if app_data_root.get_sora_bearer_token_file_path().exists() {
    return Ok(()); // Bearer token already exists.
  }

  let cookie = std::fs::read_to_string(app_data_root.get_sora_cookie_file_path())?
      .trim()
      .to_string();

  info!("Requesting initial JWT bearer token...");

  let bearer = generate_bearer_jwt_with_cookie(&cookie).await?;

  std::fs::write(app_data_root.get_sora_bearer_token_file_path(), bearer)?;

  Ok(())
}
