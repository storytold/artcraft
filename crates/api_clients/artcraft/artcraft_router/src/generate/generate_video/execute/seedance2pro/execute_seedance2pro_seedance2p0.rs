use crate::client::router_seedance2pro_client::RouterSeedance2ProClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  GenerateVideoResponse, Seedance2proVideoResponsePayload,
};
use crate::generate::generate_video::plan::seedance2pro::plan_generate_video_seedance2pro_seedance2p0::PlanSeedance2proSeedance2p0;
use crate::utils::download_file::download_file;
use seedance2pro_client::requests::generate_video::generate_video::{
  generate_video, GenerateVideoArgs, ModelType,
};
use seedance2pro_client::requests::prepare_file_upload::prepare_file_upload::{
  prepare_file_upload, PrepareFileUploadArgs,
};
use seedance2pro_client::requests::upload_file::upload_file::{
  upload_file, UploadFileArgs,
};
use url_utils::extension::extract_extension_from_url::{
  extract_extension_from_url_str, ExtractExtensions,
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
    model_type: ModelType::Seedance2Pro,
    prompt: plan.prompt.clone().unwrap_or_default(),
    resolution: plan.resolution,
    duration_seconds: plan.duration_seconds,
    batch_count: plan.batch_count,
    start_frame_url,
    end_frame_url,
    reference_image_urls,
    reference_video_urls,
    reference_audio_urls,
    character_ids: None,
    use_face_blur_hack: None,
    host_override: None,
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

async fn upload_optional_url(
  session: &seedance2pro_client::creds::seedance2pro_session::Seedance2ProSession,
  url: Option<&str>,
) -> Result<Option<String>, ArtcraftRouterError> {
  match url {
    None => Ok(None),
    Some(u) => Ok(Some(upload_to_seedance2pro(session, u).await?)),
  }
}

async fn upload_optional_url_list(
  session: &seedance2pro_client::creds::seedance2pro_session::Seedance2ProSession,
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
