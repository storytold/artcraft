use crate::errors::artcraft_router_error::ArtcraftRouterError;
use seedance2pro_client::creds::seedance2pro_session::Seedance2ProSession;
use seedance2pro_client::requests::prepare_file_upload::prepare_file_upload::{prepare_file_upload, PrepareFileUploadArgs};
use seedance2pro_client::requests::upload_file::upload_file::{upload_file, UploadFileArgs};
use url_utils::extension::extract_extension_from_url::{extract_extension_from_url_str, ExtractExtensions};
use crate::errors::provider_error::ProviderError;
use crate::utils::download_file::download_file;

pub(super) async fn upload_optional_url(
  session: &Seedance2ProSession,
  url: Option<&str>,
) -> Result<Option<String>, ArtcraftRouterError> {
  match url {
    None => Ok(None),
    Some(u) => Ok(Some(upload_to_seedance2pro(session, u).await?)),
  }
}

pub(super) async fn upload_optional_url_list(
  session: &Seedance2ProSession,
  urls: Option<&[String]>,
) -> Result<Option<Vec<String>>, ArtcraftRouterError> {
  match urls {
    None => Ok(None),
    Some(url_list) if url_list.is_empty() => Ok(None),
    Some(url_list) => {
      let mut uploaded = Vec::with_capacity(url_list.len());
      for url in url_list {
        uploaded.push(upload_to_seedance2pro(session, url).await?);
      }
      Ok(Some(uploaded))
    }
  }
}

/// Downloads a file from a source URL and re-uploads it to seedance2pro CDN.
pub(crate) async fn upload_to_seedance2pro(
  session: &seedance2pro_client::creds::seedance2pro_session::Seedance2ProSession,
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

