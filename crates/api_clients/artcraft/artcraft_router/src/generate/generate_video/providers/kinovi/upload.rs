use std::path::Path;

use log::{info, warn};

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::utils::download_file::download_file;
use kinovi_web_client::creds::kinovi_web_session::KinoviWebSession;
use kinovi_web_client::requests::prepare_file_upload::prepare_file_upload::{prepare_file_upload, PrepareFileUploadArgs};
use kinovi_web_client::requests::upload_file::upload_file::{upload_file, UploadFileArgs};
use url_utils::extension::extract_extension_from_url::{extract_extension_from_url_str, ExtractExtensions};

/// Re-uploads a file to the kinovi_web CDN, reading it from
/// `maybe_local_path` when the caller already downloaded it (e.g. reference
/// videos probed for billing), or downloading it from the source URL
/// otherwise.
pub(crate) async fn upload_to_kinovi_web(
  session: &KinoviWebSession,
  source_url: &str,
  maybe_local_path: Option<&Path>,
) -> Result<String, ArtcraftRouterError> {
  let extension = extract_extension_from_url_str(source_url, &ExtractExtensions::All)
      .map(|ext| ext.without_period().to_string())
      .unwrap_or_else(|| "jpg".to_string());

  let file_bytes = match maybe_local_path {
    Some(local_path) => match std::fs::read(local_path) {
      Ok(bytes) => {
        info!("Reusing predownloaded file for kinovi upload: {}", source_url);
        bytes
      }
      Err(err) => {
        // The file should exist; fall back to downloading rather than fail.
        warn!("Failed to read predownloaded file {:?} ({:?}); re-downloading {}",
          local_path, err, source_url);
        download_file(source_url).await?
      }
    },
    None => download_file(source_url).await?,
  };

  let prepare_response = prepare_file_upload(PrepareFileUploadArgs {
    session,
    extension,
    host_override: None,
  })
      .await
      .map_err(|err| ArtcraftRouterError::Provider(ProviderError::KinoviWeb(err)))?;

  let upload_response = upload_file(UploadFileArgs {
    upload_url: prepare_response.upload_url,
    file_bytes,
    host_override: None,
  })
      .await
      .map_err(|err| ArtcraftRouterError::Provider(ProviderError::KinoviWeb(err)))?;

  Ok(upload_response.public_url)
}

