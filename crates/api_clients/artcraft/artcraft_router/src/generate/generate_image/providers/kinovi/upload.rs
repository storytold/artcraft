use seedance2pro_client::creds::seedance2pro_session::Seedance2ProSession;
use seedance2pro_client::requests::prepare_file_upload::prepare_file_upload::{prepare_file_upload, PrepareFileUploadArgs};
use seedance2pro_client::requests::upload_file::upload_file::{upload_file, UploadFileArgs};
use url_utils::extension::extract_extension_from_url::{extract_extension_from_url_str, ExtractExtensions};

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::utils::download_file::download_file;

/// Downloads an image from a source URL and re-uploads it to the
/// Seedance2Pro/Kinovi CDN. Returns the public URL.
///
/// This is the image-side twin of `generate_video::providers::kinovi::upload`.
/// The actual upload path doesn't care whether the file is a video or an
/// image, but keeping the two helpers separate lets each side evolve
/// independently and makes intent clear at call sites.
pub(crate) async fn upload_to_seedance2pro(
  session: &Seedance2ProSession,
  source_url: &str,
) -> Result<String, ArtcraftRouterError> {
  let extension = extract_extension_from_url_str(source_url, &ExtractExtensions::All)
    .map(|ext| ext.without_period().to_string())
    .unwrap_or_else(|| "jpg".to_string());

  let file_bytes = download_file(source_url).await?;

  let prepare_response = prepare_file_upload(PrepareFileUploadArgs {
    session,
    extension,
    host_override: None,
  })
    .await
    .map_err(|err| ArtcraftRouterError::Provider(ProviderError::Seedance2Pro(err)))?;

  let upload_response = upload_file(UploadFileArgs {
    upload_url: prepare_response.upload_url,
    file_bytes,
    host_override: None,
  })
    .await
    .map_err(|err| ArtcraftRouterError::Provider(ProviderError::Seedance2Pro(err)))?;

  Ok(upload_response.public_url)
}
