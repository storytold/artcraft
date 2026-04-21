use crate::client::router_seedance2pro_client::RouterSeedance2ProClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{GenerateVideoResponse, Seedance2proVideoResponsePayload};
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0::draft::KinoviSeedance2p0DraftState;
use seedance2pro_client::requests::generate_video::generate_video::{generate_video, GenerateVideoArgs, KinoviGenerateVideoRequest, KinoviModelType};

#[derive(Debug, Clone)]
pub struct KinoviSeedance2p0RequestState {
  /// Final materialized request; ready to fire.
  pub request: KinoviGenerateVideoRequest,
}

impl KinoviSeedance2p0RequestState {
  
  pub async fn from_draft(
    mut request: KinoviSeedance2p0DraftState,
    client: &RouterSeedance2ProClient,
  ) -> Result<Self, ArtcraftRouterError> {
    let session = &client.session;

    // Upload media files to seedance2pro CDN
    let mut start_frame_url = None;
    let mut end_frame_url = None;
    let mut reference_image_urls = None;
    let mut reference_video_urls = None;
    let mut reference_audio_urls = None;
    
    if let Some(ref remaining_request) = request.remaining_request.as_mut() {
      // TODO: Upload these references if they are present.
      //start_frame_url = upload_optional_url(session, remaining_request.start_frame_url.as_deref()).await?;
      //end_frame_url = upload_optional_url(session, remaining_request.end_frame_url.as_deref()).await?;
      //reference_image_urls = upload_optional_url_list(session, remaining_request.reference_image_urls.as_deref()).await?;
      //reference_video_urls = upload_optional_url_list(session, remaining_request.reference_video_urls.as_deref()).await?;
      //reference_audio_urls = upload_optional_url_list(session, remaining_request.reference_audio_urls.as_deref()).await?;
    }
    
    let request = KinoviGenerateVideoRequest {
      model_type: KinoviModelType::Seedance2Pro,
      prompt: request.prompt.clone(),
      aspect_ratio: request.aspect_ratio,
      output_resolution: request.resolution,
      duration_seconds: request.duration_seconds,
      batch_count: request.batch_count,
      start_frame_url, // TODO
      end_frame_url, // TODO
      reference_image_urls, // TODO
      reference_video_urls, // TODO
      reference_audio_urls, // TODO
      character_ids: None, // TODO
      use_face_blur_hack: None,
    };

    Ok(Self {
      request,
    })
  }
  
  pub async fn send(&self, client: &RouterSeedance2ProClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    let session = &client.session;

    let args = GenerateVideoArgs {
      session,
      host_override: None,
      request: self.request.clone(), // TODO: Yuck.
    };

    let response = generate_video(args)
        .await
        .map_err(|err| ArtcraftRouterError::Provider(ProviderError::Seedance2Pro(err)))?;

    Ok(GenerateVideoResponse::Seedance2Pro(Seedance2proVideoResponsePayload {
      order_id: response.order_id,
      task_id: response.task_id,
    }))
  }
}
