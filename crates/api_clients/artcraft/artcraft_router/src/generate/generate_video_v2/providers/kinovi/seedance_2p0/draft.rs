use crate::client::router_seedance2pro_client::RouterSeedance2ProClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0::request::KinoviSeedance2p0RequestState;
use seedance2pro_client::requests::generate_video::generate_video::{KinoviAspectRatio, KinoviBatchCount, KinoviGenerateVideoRequest, KinoviModelType, KinoviOutputResolution};

#[derive(Debug, Clone)]
pub struct KinoviSeedance2p0DraftState {
  // Materialized / finalized types

  pub prompt: String,
  pub aspect_ratio: KinoviAspectRatio,
  pub resolution: Option<KinoviOutputResolution>,
  pub duration_seconds: u8,
  pub batch_count: KinoviBatchCount,

  // // Draft -
  // pub start_frame_url: Option<String>,
  // pub end_frame_url: Option<String>,
  // pub reference_image_urls: Option<Vec<String>>,
  // pub reference_video_urls: Option<Vec<String>>,
  // pub reference_audio_urls: Option<Vec<String>>,
  // pub character_ids: Option<Vec<String>>,

  // Pending types that need to be queried.

  pub remaining_request: Option<GenerateVideoRequestBuilder>,

  // pub start_frame: Option<ImageRef>,
  // pub end_frame: Option<ImageRef>,
  // pub reference_images: Option<ImageListRef>,
  // pub reference_videos: Option<VideoListRef>,
  // pub reference_audio: Option<AudioListRef>,
  // pub reference_character_tokens: Option<CharacterListRef>,
}

impl KinoviSeedance2p0DraftState {
  pub async fn to_request(
    &mut self,
    client: &RouterSeedance2ProClient,
  ) -> Result<KinoviSeedance2p0RequestState, ArtcraftRouterError> {
    let _session = &client.session;

    // Upload media files to seedance2pro CDN
    let mut start_frame_url = None;
    let mut end_frame_url = None;
    let mut reference_image_urls = None;
    let mut reference_video_urls = None;
    let mut reference_audio_urls = None;

    if let Some(ref _remaining_request) = self.remaining_request.as_mut() {
      // TODO: Upload these references if they are present.
      //start_frame_url = upload_optional_url(session, remaining_request.start_frame_url.as_deref()).await?;
      //end_frame_url = upload_optional_url(session, remaining_request.end_frame_url.as_deref()).await?;
      //reference_image_urls = upload_optional_url_list(session, remaining_request.reference_image_urls.as_deref()).await?;
      //reference_video_urls = upload_optional_url_list(session, remaining_request.reference_video_urls.as_deref()).await?;
      //reference_audio_urls = upload_optional_url_list(session, remaining_request.reference_audio_urls.as_deref()).await?;
    }

    let request = KinoviGenerateVideoRequest {
      model_type: KinoviModelType::Seedance2Pro,
      prompt: self.prompt.clone(),
      aspect_ratio: self.aspect_ratio,
      output_resolution: self.resolution,
      duration_seconds: self.duration_seconds,
      batch_count: self.batch_count,
      start_frame_url, // TODO
      end_frame_url, // TODO
      reference_image_urls, // TODO
      reference_video_urls, // TODO
      reference_audio_urls, // TODO
      character_ids: None, // TODO
      use_face_blur_hack: None,
    };

    Ok(KinoviSeedance2p0RequestState { request })
  }
}
