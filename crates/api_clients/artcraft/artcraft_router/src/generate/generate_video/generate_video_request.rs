use tokens::tokens::characters::CharacterToken;
use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_resolution::CommonResolution;
use crate::api::common_video_model::CommonVideoModel;
use crate::api::audio_list_ref::AudioListRef;
use crate::api::character_list_ref::CharacterListRef;
use crate::api::image_list_ref::ImageListRef;
use crate::api::image_ref::ImageRef;
use crate::api::provider::Provider;
use crate::api::video_list_ref::VideoListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_kling3p0_pro::plan_generate_video_artcraft_kling3p0_pro;
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_kling3p0_standard::plan_generate_video_artcraft_kling3p0_standard;
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_seedance1p5_pro::plan_generate_video_artcraft_seedance1p5_pro;
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_seedance2p0::plan_generate_video_artcraft_seedance2p0;
use crate::generate::generate_video::plan::muapi::plan_generate_video_muapi_seedance2p0::plan_generate_video_muapi_seedance2p0;
use crate::generate::generate_video::plan::seedance2pro::plan_generate_video_seedance2pro_seedance2p0::plan_generate_video_seedance2pro_seedance2p0;
use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;

/// Plan to either (1) generate a video or (2) determine how much it costs to generate that video.
/// This works across multiple providers by shaping a generic "GenerateVideoRequest" into a provider-specific plan.
/// That plan can then be used to return a cost estimate for that given provider or return a struct that can be used to send a real generation request.
pub struct GenerateVideoRequest<'a> {
  /// Which model to use.
  pub model: CommonVideoModel,

  /// Which provider to use.
  pub provider: Provider,

  /// The prompt for the video generation
  pub prompt: Option<&'a str>,

  /// Some models support negative prompts
  pub negative_prompt: Option<&'a str>,

  /// Starting keyframe (optional).
  pub start_frame: Option<ImageRef<'a>>,

  /// Ending keyframe (optional).
  pub end_frame: Option<ImageRef<'a>>,

  /// Reference images (optional).
  pub reference_images: Option<ImageListRef<'a>>,

  /// Reference videos (optional).
  pub reference_videos: Option<VideoListRef<'a>>,

  /// Reference audio (optional).
  pub reference_audio: Option<AudioListRef<'a>>,

  /// Reference characters (optional).
  pub reference_character_tokens: Option<CharacterListRef<'a>>,

  /// The resolution to use
  pub resolution: Option<CommonResolution>,

  /// The aspect ratio to use
  pub aspect_ratio: Option<CommonAspectRatio>,

  /// How many seconds to generate.
  pub duration_seconds: Option<u16>,

  /// How many videos to generate.
  pub video_batch_count: Option<u16>,

  /// Whether to turn on/off audio.
  /// Not all models support audio, not all models have a choice.
  /// Some models will default this to true, others will default it to false,
  /// so it's best to be explicit.
  pub generate_audio: Option<bool>,

  /// If the request is a mismatch with the (model/provider), how to mitigate it.
  pub request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy,

  /// Some providers support idempotency.
  /// If not supplied, we'll generate one for the required providers.
  pub idempotency_token: Option<&'a str>,
}

impl<'a> GenerateVideoRequest<'a> {
  /// Read the video generation request, construct a plan, then yield a means to execute it.
  pub fn build(&self) -> Result<VideoGenerationPlan<'_>, ArtcraftRouterError> {
    match self.provider {
      Provider::Artcraft => self.build_artcraft(),
      Provider::Muapi => self.build_muapi(),
      Provider::Seedance2Pro => self.build_seedance2pro(),
      _ => self.unsupported_provider(),
    }
  }

  fn build_artcraft(&self) -> Result<VideoGenerationPlan<'_>, ArtcraftRouterError> {
    match self.model {
      CommonVideoModel::Kling3p0Pro => plan_generate_video_artcraft_kling3p0_pro(self),
      CommonVideoModel::Kling3p0Standard => plan_generate_video_artcraft_kling3p0_standard(self),
      CommonVideoModel::Seedance1p5Pro => plan_generate_video_artcraft_seedance1p5_pro(self),
      CommonVideoModel::Seedance2p0 => plan_generate_video_artcraft_seedance2p0(self),
      _ => Err(ArtcraftRouterError::UnsupportedModel(format!("{:?}", self.model))),
    }
  }

  fn build_muapi(&self) -> Result<VideoGenerationPlan<'_>, ArtcraftRouterError> {
    match self.model {
      CommonVideoModel::Seedance2p0 => plan_generate_video_muapi_seedance2p0(self),
      _ => Err(ArtcraftRouterError::UnsupportedModel(format!("{:?}", self.model))),
    }
  }

  fn build_seedance2pro(&self) -> Result<VideoGenerationPlan<'_>, ArtcraftRouterError> {
    match self.model {
      CommonVideoModel::Seedance2p0 => plan_generate_video_seedance2pro_seedance2p0(self),
      _ => Err(ArtcraftRouterError::UnsupportedModel(format!("{:?}", self.model))),
    }
  }

  fn unsupported_provider(&self) -> Result<VideoGenerationPlan<'_>, ArtcraftRouterError> {
    Err(ArtcraftRouterError::UnsupportedModel(
      format!("Video generation for model `{:?}` is not supported for provider {:?}", self.model, self.provider)
    ))
  }

  pub fn get_or_generate_idempotency_token(&self) -> String {
    self.idempotency_token.map(|t| t.to_string())
        .unwrap_or_else(|| uuid::Uuid::new_v4().to_string())
  }
}
