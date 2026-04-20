use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0::type_conversions::{map_common_resolution_to_kinovi, plan_aspect_ratio, plan_batch_count, plan_duration};
use crate::generate::generate_video_v2::video_generation_draft_request::VideoGenerationDraftRequest;
use seedance2pro_client::requests::generate_video::generate_video::{KinoviAspectRatio, KinoviBatchCount, KinoviGenerateVideoRequest, KinoviModelType, KinoviOutputResolution};

#[derive(Debug, Clone)]
pub struct KinoviSeedance2p0DraftRequest {
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

impl KinoviSeedance2p0DraftRequest {
  pub fn from_builder(mut request: GenerateVideoRequestBuilder) -> Result<VideoGenerationDraftRequest, ArtcraftRouterError> {
    let strategy = request.request_mismatch_mitigation_strategy;

    let aspect_ratio = plan_aspect_ratio(request.aspect_ratio, strategy)?;
    let resolution = request.resolution.map(map_common_resolution_to_kinovi);
    let batch_count = plan_batch_count(request.video_batch_count, strategy)?;
    let duration_seconds = plan_duration(request.duration_seconds, strategy)?;
    let prompt = request.prompt.take().unwrap_or_default();

    // TODO: Fill out body
    Ok(VideoGenerationDraftRequest::KinoviSeedance2p0(Self {
      aspect_ratio,
      resolution,
      batch_count,
      duration_seconds,
      prompt,
      remaining_request: Some(request),
    }))
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    let request = KinoviGenerateVideoRequest {
      model_type: KinoviModelType::Seedance2Pro,
      prompt: self.prompt.clone(),
      aspect_ratio: self.aspect_ratio,
      output_resolution: self.resolution,
      duration_seconds: self.duration_seconds,
      batch_count: self.batch_count,
      start_frame_url: None, // TODO
      end_frame_url: None, // TODO
      reference_image_urls: None, // TODO
      reference_video_urls: None, // TODO
      reference_audio_urls: None, // TODO
      character_ids: None, // TODO
      use_face_blur_hack: None,
    };
    
    let cost_in_credits = request.estimate_credits();
    let cost_in_usd_cents = request.estimate_cost_in_usd_cents();

    VideoGenerationCostEstimate {
      cost_in_credits: Some(cost_in_credits as u64),
      cost_in_usd_cents: Some(cost_in_usd_cents),
      is_free: false,
      is_unlimited: false,
      is_rate_limited: false,
      has_watermark: false,
    }
  }
}
