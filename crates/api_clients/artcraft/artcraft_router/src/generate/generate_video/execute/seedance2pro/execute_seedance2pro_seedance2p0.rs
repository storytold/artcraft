use crate::client::router_seedance2pro_client::RouterSeedance2ProClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  GenerateVideoResponse, Seedance2proVideoResponsePayload,
};
use crate::generate::generate_video::plan::seedance2pro::plan_generate_video_seedance2pro_seedance2p0::PlanSeedance2proSeedance2p0;
use seedance2pro::requests::generate_video::generate_video::{
  GenerateVideoArgs, generate_video,
};
use seedance2pro::requests::prepare_file_upload::prepare_file_upload::{
  PrepareFileUploadArgs, prepare_file_upload,
};
use seedance2pro::requests::upload_file::upload_file::{
  UploadFileArgs, upload_file,
};

pub async fn execute_seedance2pro_seedance2p0(
  plan: &PlanSeedance2proSeedance2p0,
  seedance2pro_client: &RouterSeedance2ProClient,
) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
  let session = &seedance2pro_client.session;

  // Upload media files to seedance2pro CDN
  let start_frame_url = upload_optional_url(session, plan.start_frame_url.as_deref()).await?;
  let end_frame_url = upload_optional_url(session, plan.end_frame_url.as_deref()).await?;
  let reference_image_urls = upload_optional_url_list(session, plan.reference_image_urls.as_deref()).await?;
  let reference_video_urls = upload_optional_url_list(session, plan.reference_video_urls.as_deref()).await?;
  let reference_audio_urls = upload_optional_url_list(session, plan.reference_audio_urls.as_deref()).await?;

  let args = GenerateVideoArgs {
    session,
    prompt: plan.prompt.clone().unwrap_or_default(),
    resolution: plan.resolution,
    duration_seconds: plan.duration_seconds,
    batch_count: plan.batch_count,
    start_frame_url,
    end_frame_url,
    reference_image_urls,
    reference_video_urls,
    reference_audio_urls,
    use_face_blur_hack: None,
  };

  let response = generate_video(args)
    .await
    .map_err(|err| ArtcraftRouterError::Provider(ProviderError::Seedance2Pro(err)))?;

  Ok(GenerateVideoResponse::Seedance2Pro(Seedance2proVideoResponsePayload {
    order_id: response.order_id,
    task_id: response.task_id,
  }))
}

/// Downloads a file from a source URL and re-uploads it to seedance2pro CDN.
async fn upload_to_seedance2pro(
  session: &seedance2pro::creds::seedance2pro_session::Seedance2ProSession,
  source_url: &str,
) -> Result<String, ArtcraftRouterError> {
  // Extract file extension from URL
  let extension = extract_extension(source_url).unwrap_or("bin");

  // Download the file
  let file_bytes = download_file(source_url).await?;

  // Prepare the upload (get a signed URL)
  let prepare_response = prepare_file_upload(PrepareFileUploadArgs {
    session,
    extension: extension.to_string(),
  })
    .await
    .map_err(|err| ArtcraftRouterError::Provider(ProviderError::Seedance2Pro(err)))?;

  // Upload the file
  let upload_response = upload_file(UploadFileArgs {
    upload_url: prepare_response.upload_url,
    file_bytes,
  })
    .await
    .map_err(|err| ArtcraftRouterError::Provider(ProviderError::Seedance2Pro(err)))?;

  Ok(upload_response.public_url)
}

async fn upload_optional_url(
  session: &seedance2pro::creds::seedance2pro_session::Seedance2ProSession,
  url: Option<&str>,
) -> Result<Option<String>, ArtcraftRouterError> {
  match url {
    None => Ok(None),
    Some(u) => Ok(Some(upload_to_seedance2pro(session, u).await?)),
  }
}

async fn upload_optional_url_list(
  session: &seedance2pro::creds::seedance2pro_session::Seedance2ProSession,
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

/// Download a file from a URL, returning its bytes.
async fn download_file(url: &str) -> Result<Vec<u8>, ArtcraftRouterError> {
  let response = reqwest::get(url)
    .await
    .map_err(|err| ArtcraftRouterError::FileDownload(format!("Failed to download {}: {}", url, err)))?;

  if !response.status().is_success() {
    return Err(ArtcraftRouterError::FileDownload(
      format!("Download failed for {} with status {}", url, response.status())
    ));
  }

  response.bytes()
    .await
    .map(|b| b.to_vec())
    .map_err(|err| ArtcraftRouterError::FileDownload(format!("Failed to read bytes from {}: {}", url, err)))
}

/// Extract the file extension from a URL path, ignoring query parameters.
fn extract_extension(url: &str) -> Option<&str> {
  let path = url.split('?').next().unwrap_or(url);
  let filename = path.rsplit('/').next()?;
  let dot_pos = filename.rfind('.')?;
  Some(&filename[dot_pos + 1..])
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_extract_extension() {
    assert_eq!(extract_extension("https://example.com/image.png"), Some("png"));
    assert_eq!(extract_extension("https://example.com/video.mp4?token=abc"), Some("mp4"));
    assert_eq!(extract_extension("https://example.com/path/to/file.jpg"), Some("jpg"));
    assert_eq!(extract_extension("https://example.com/noext"), None);
  }
}
