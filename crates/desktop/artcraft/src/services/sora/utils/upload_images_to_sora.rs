use crate::core::state::app_env_configs::app_env_configs_serializeable::StorytellerApiHost;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use crate::core::utils::get_url_file_extension::get_url_file_extension;
use crate::core::utils::simple_http_download::simple_http_download;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use errors::AnyhowResult;
use log::{error, info};
use openai_sora_client::creds::sora_credential_set::SoraCredentialSet;
use openai_sora_client::recipes::image_upload_from_file_with_session_auto_renew::{image_upload_from_file_with_session_auto_renew, ImageUploadFromFileAutoRenewRequest};
use openai_sora_client::recipes::maybe_upgrade_or_renew_session::maybe_upgrade_or_renew_session;
use std::time::Duration;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::endpoints::media_files::get_media_file::get_media_file;
use artcraft_client::utils::api_host::ApiHost;
use tokens::tokens::media_files::MediaFileToken;

const SORA_IMAGE_UPLOAD_TIMEOUT: Duration = Duration::from_millis(1000 * 30); // 30 seconds

pub struct UploadImagesToSoraArgs<'a> {
  pub storyteller_host: &'a ApiHost,
  pub image_media_tokens: &'a [MediaFileToken],

  pub app_data_root: &'a AppDataRoot,
  pub sora_creds_manager: &'a SoraCredentialManager,
}

pub struct UploadImagesToSoraResult {
  pub sora_media_tokens: Vec<String>,
  pub maybe_new_sora_credentials: Option<SoraCredentialSet>,
}

pub async fn upload_images_to_sora(
  args: UploadImagesToSoraArgs<'_>,
) -> AnyhowResult<UploadImagesToSoraResult> {

  let mut updated_sora_creds = false;

  info!("Calling get media file API: {:?}", args.storyteller_host);

  let mut files_to_upload_to_sora = Vec::with_capacity(10);

  // TODO(bt,2025-07-07): This is inefficient. Cache and parallelize this.
  for media_token in args.image_media_tokens.iter() {
    info!("Using media token: {:?}", media_token);

    let response = get_media_file(
      args.storyteller_host,
      media_token
    ).await?;

    let media_file_url = &response.media_file.media_links.cdn_url;
    let extension_with_dot = get_url_file_extension(media_file_url)
        .map(|ext| format!(".{}", ext))
        .unwrap_or_else(|| ".png".to_string());

    let filename = format!("{}{}", response.media_file.token.as_str(), extension_with_dot);
    let filename = args.app_data_root.downloads_dir().path().join(&filename);

    simple_http_download(&media_file_url, &filename).await?;

    files_to_upload_to_sora.push(filename);
  }

  let mut sora_creds = args.sora_creds_manager.get_credentials_required()?;

  // TODO: We don't need sentinel anymore?
  let credential_updated = maybe_upgrade_or_renew_session(&mut sora_creds)
      .await
      .map_err(|err| {
        error!("Failed to upgrade or renew session: {:?}", err);
        err
      })?;

  if credential_updated {
    info!("Storing updated credentials");
    args.sora_creds_manager.set_credentials(&sora_creds)?;
    updated_sora_creds = true;
  }

  let mut sora_media_tokens = Vec::with_capacity(files_to_upload_to_sora.len());

  for (i, file_path) in files_to_upload_to_sora.iter().enumerate() {
    info!("Uploading image {} of {}...", (i+1), files_to_upload_to_sora.len());

    let (response, maybe_new_credentials) =
        image_upload_from_file_with_session_auto_renew(ImageUploadFromFileAutoRenewRequest {
          file_path,
          credentials: &sora_creds,
          request_timeout: Some(SORA_IMAGE_UPLOAD_TIMEOUT), // TODO: Centralize and make configurable.
        }).await?;

    if let Some(new_creds) = maybe_new_credentials {
      info!("Storing updated credentials.");
      args.sora_creds_manager.set_credentials(&new_creds)?;
      sora_creds = new_creds;
      updated_sora_creds = true;
    }

    sora_media_tokens.push(response.id);
  }

  let maybe_new_sora_credentials = if updated_sora_creds {
    Some(sora_creds)
  } else {
    None
  };

  Ok(UploadImagesToSoraResult {
    sora_media_tokens,
    maybe_new_sora_credentials,
  })
}
