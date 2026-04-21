use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use seedance2pro_client::requests::generate_video::generate_video::{KinoviAspectRatio, KinoviBatchCount, KinoviOutputResolution};

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
