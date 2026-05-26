use crate::api::audio_list_ref::AudioListRef;
use crate::api::character_list_ref::CharacterListRef;
use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_resolution::CommonResolution;
use crate::api::common_video_model::CommonVideoModel;
use crate::api::image_list_ref::ImageListRef;
use crate::api::image_ref::ImageRef;
use crate::api::provider::Provider;
use crate::api::video_list_ref::VideoListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video_v2::providers::artcraft::grok_imagine_video::build::build_artcraft_grok_imagine_video;
use crate::generate::generate_video_v2::providers::artcraft::happy_horse_1p0::build::build_artcraft_happy_horse_1p0;
use crate::generate::generate_video_v2::providers::artcraft::kling_1_6_pro::build::build_artcraft_kling_1_6_pro;
use crate::generate::generate_video_v2::providers::artcraft::kling_2_1_master::build::build_artcraft_kling_2_1_master;
use crate::generate::generate_video_v2::providers::artcraft::kling_2_1_pro::build::build_artcraft_kling_2_1_pro;
use crate::generate::generate_video_v2::providers::artcraft::kling_2_5_turbo_pro::build::build_artcraft_kling_2_5_turbo_pro;
use crate::generate::generate_video_v2::providers::artcraft::kling_2_6_pro::build::build_artcraft_kling_2_6_pro;
use crate::generate::generate_video_v2::providers::artcraft::kling_3p0_pro::build::build_artcraft_kling_3p0_pro;
use crate::generate::generate_video_v2::providers::artcraft::kling_3p0_standard::build::build_artcraft_kling_3p0_standard;
use crate::generate::generate_video_v2::providers::artcraft::preview_model::build::build_artcraft_preview_model;
use crate::generate::generate_video_v2::providers::artcraft::preview_model_fast::build::build_artcraft_preview_model_fast;
use crate::generate::generate_video_v2::providers::artcraft::seedance_1p0_lite::build::build_artcraft_seedance_1p0_lite;
use crate::generate::generate_video_v2::providers::artcraft::seedance_1p5_pro::build::build_artcraft_seedance_1p5_pro;
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0::build::build_artcraft_seedance_2p0;
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0_fast::build::build_artcraft_seedance_2p0_fast;
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0_u::build::build_artcraft_seedance_2p0_u;
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0_u_fast::build::build_artcraft_seedance_2p0_u_fast;
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0_bp::build::build_artcraft_seedance_2p0_bp;
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0_bp_fast::build::build_artcraft_seedance_2p0_bp_fast;
use crate::generate::generate_video_v2::providers::artcraft::sora_2::build::build_artcraft_sora_2;
use crate::generate::generate_video_v2::providers::artcraft::sora_2_pro::build::build_artcraft_sora_2_pro;
use crate::generate::generate_video_v2::providers::artcraft::veo_2::build::build_artcraft_veo_2;
use crate::generate::generate_video_v2::providers::artcraft::veo_3::build::build_artcraft_veo_3;
use crate::generate::generate_video_v2::providers::artcraft::veo_3_fast::build::build_artcraft_veo_3_fast;
use crate::generate::generate_video_v2::providers::artcraft::veo_3p1::build::build_artcraft_veo_3p1;
use crate::generate::generate_video_v2::providers::artcraft::veo_3p1_fast::build::build_artcraft_veo_3p1_fast;
use crate::generate::generate_video_v2::providers::kinovi::happy_horse_1p0::build::build_kinovi_happy_horse_1p0;
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0::build::build_kinovi_seedance_2p0;
use crate::generate::generate_video_v2::providers::gmicloud::seedance_2p0_g::build::build_gmicloud_seedance_2p0_u;
use crate::generate::generate_video_v2::providers::gmicloud::seedance_2p0_fast_g::build::build_gmicloud_seedance_2p0_u_fast;
use crate::generate::generate_video_v2::providers::grok_api::grok_imagine_video::build::build_grok_api_grok_imagine_video;
use crate::generate::generate_video_v2::providers::fal::kling_1_6_pro::build::build_fal_kling_1_6_pro;
use crate::generate::generate_video_v2::providers::fal::kling_2_1_master::build::build_fal_kling_2_1_master;
use crate::generate::generate_video_v2::providers::fal::kling_2_1_pro::build::build_fal_kling_2_1_pro;
use crate::generate::generate_video_v2::providers::fal::kling_2_5_turbo_pro::build::build_fal_kling_2_5_turbo_pro;
use crate::generate::generate_video_v2::providers::fal::kling_2_6_pro::build::build_fal_kling_2_6_pro;
use crate::generate::generate_video_v2::providers::fal::kling_3p0_pro::build::build_fal_kling_3p0_pro;
use crate::generate::generate_video_v2::providers::fal::kling_3p0_standard::build::build_fal_kling_3p0_standard;
use crate::generate::generate_video_v2::providers::fal::seedance_1p0_lite::build::build_fal_seedance_1p0_lite;
use crate::generate::generate_video_v2::providers::fal::seedance_1p5_pro::build::build_fal_seedance_1p5_pro;
use crate::generate::generate_video_v2::providers::fal::sora_2::build::build_fal_sora_2;
use crate::generate::generate_video_v2::providers::fal::sora_2_pro::build::build_fal_sora_2_pro;
use crate::generate::generate_video_v2::providers::fal::veo_2::build::build_fal_veo_2;
use crate::generate::generate_video_v2::providers::fal::veo_3::build::build_fal_veo_3;
use crate::generate::generate_video_v2::providers::fal::veo_3_fast::build::build_fal_veo_3_fast;
use crate::generate::generate_video_v2::providers::fal::veo_3p1::build::build_fal_veo_3p1;
use crate::generate::generate_video_v2::providers::fal::veo_3p1_fast::build::build_fal_veo_3p1_fast;
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0_fast::build::build_kinovi_seedance_2p0_fast;
use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;

/// Provider-agnostic video generation request. Distilled by `build2()` into a
/// `VideoGenerationDraftOrRequest` for the selected (provider, model) pair.
#[derive(Clone, Debug)]
pub struct GenerateVideoRequestBuilder {
  /// Which model to use.
  pub model: CommonVideoModel,

  /// Which provider to use.
  pub provider: Provider,

  /// The prompt for the video generation
  pub prompt: Option<String>,

  /// Some models support negative prompts
  pub negative_prompt: Option<String>,

  /// Starting keyframe (optional).
  pub start_frame: Option<ImageRef>,

  /// Ending keyframe (optional).
  pub end_frame: Option<ImageRef>,

  /// Reference images (optional).
  pub reference_images: Option<ImageListRef>,

  /// Reference videos (optional).
  pub reference_videos: Option<VideoListRef>,

  /// Reference audio (optional).
  pub reference_audio: Option<AudioListRef>,

  /// Reference characters (optional).
  pub reference_character_tokens: Option<CharacterListRef>,

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
  pub idempotency_token: Option<String>,
}

impl Default for GenerateVideoRequestBuilder {
  fn default() -> Self {
    Self {
      model: CommonVideoModel::Seedance2p0,
      provider: Provider::Artcraft,
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
      prompt: None,
      negative_prompt: None,
      start_frame: None,
      end_frame: None,
      reference_images: None,
      reference_videos: None,
      reference_audio: None,
      reference_character_tokens: None,
      resolution: None,
      aspect_ratio: None,
      duration_seconds: None,
      video_batch_count: None,
      generate_audio: None,
      idempotency_token: None,
    }
  }
}

impl GenerateVideoRequestBuilder {

  pub fn build2(self) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
    match (self.provider, self.model) {
      // Artcraft
      (Provider::Artcraft, CommonVideoModel::GrokImagineVideo) => build_artcraft_grok_imagine_video(self),
      (Provider::Artcraft, CommonVideoModel::HappyHorse1p0) => build_artcraft_happy_horse_1p0(self),
      (Provider::Artcraft, CommonVideoModel::Kling16Pro) => build_artcraft_kling_1_6_pro(self),
      (Provider::Artcraft, CommonVideoModel::Kling21Master) => build_artcraft_kling_2_1_master(self),
      (Provider::Artcraft, CommonVideoModel::Kling21Pro) => build_artcraft_kling_2_1_pro(self),
      (Provider::Artcraft, CommonVideoModel::Kling2p5TurboPro) => build_artcraft_kling_2_5_turbo_pro(self),
      (Provider::Artcraft, CommonVideoModel::Kling2p6Pro) => build_artcraft_kling_2_6_pro(self),
      (Provider::Artcraft, CommonVideoModel::Kling3p0Pro) => build_artcraft_kling_3p0_pro(self),
      (Provider::Artcraft, CommonVideoModel::Kling3p0Standard) => build_artcraft_kling_3p0_standard(self),
      (Provider::Artcraft, CommonVideoModel::Seedance2p0) => build_artcraft_seedance_2p0(self),
      (Provider::Artcraft, CommonVideoModel::Seedance2p0Fast) => build_artcraft_seedance_2p0_fast(self),
      (Provider::Artcraft, CommonVideoModel::Seedance2p0Ultra) => build_artcraft_seedance_2p0_u(self),
      (Provider::Artcraft, CommonVideoModel::Seedance2p0UltraFast) => build_artcraft_seedance_2p0_u_fast(self),
      (Provider::Artcraft, CommonVideoModel::Seedance2p0BytePlus) => build_artcraft_seedance_2p0_bp(self),
      (Provider::Artcraft, CommonVideoModel::Seedance2p0BytePlusFast) => build_artcraft_seedance_2p0_bp_fast(self),
      (Provider::Artcraft, CommonVideoModel::PreviewModel) => build_artcraft_preview_model(self),
      (Provider::Artcraft, CommonVideoModel::PreviewModelFast) => build_artcraft_preview_model_fast(self),
      (Provider::Artcraft, CommonVideoModel::Seedance10Lite) => build_artcraft_seedance_1p0_lite(self),
      (Provider::Artcraft, CommonVideoModel::Seedance1p5Pro) => build_artcraft_seedance_1p5_pro(self),
      (Provider::Artcraft, CommonVideoModel::Sora2) => build_artcraft_sora_2(self),
      (Provider::Artcraft, CommonVideoModel::Sora2Pro) => build_artcraft_sora_2_pro(self),
      (Provider::Artcraft, CommonVideoModel::Veo2) => build_artcraft_veo_2(self),
      (Provider::Artcraft, CommonVideoModel::Veo3) => build_artcraft_veo_3(self),
      (Provider::Artcraft, CommonVideoModel::Veo3Fast) => build_artcraft_veo_3_fast(self),
      (Provider::Artcraft, CommonVideoModel::Veo3p1) => build_artcraft_veo_3p1(self),
      (Provider::Artcraft, CommonVideoModel::Veo3p1Fast) => build_artcraft_veo_3p1_fast(self),
      // Fal
      (Provider::Fal, CommonVideoModel::Kling16Pro) => build_fal_kling_1_6_pro(self),
      (Provider::Fal, CommonVideoModel::Kling21Master) => build_fal_kling_2_1_master(self),
      (Provider::Fal, CommonVideoModel::Kling21Pro) => build_fal_kling_2_1_pro(self),
      (Provider::Fal, CommonVideoModel::Kling2p5TurboPro) => build_fal_kling_2_5_turbo_pro(self),
      (Provider::Fal, CommonVideoModel::Kling2p6Pro) => build_fal_kling_2_6_pro(self),
      (Provider::Fal, CommonVideoModel::Kling3p0Pro) => build_fal_kling_3p0_pro(self),
      (Provider::Fal, CommonVideoModel::Kling3p0Standard) => build_fal_kling_3p0_standard(self),
      (Provider::Fal, CommonVideoModel::Seedance10Lite) => build_fal_seedance_1p0_lite(self),
      (Provider::Fal, CommonVideoModel::Seedance1p5Pro) => build_fal_seedance_1p5_pro(self),
      (Provider::Fal, CommonVideoModel::Sora2) => build_fal_sora_2(self),
      (Provider::Fal, CommonVideoModel::Sora2Pro) => build_fal_sora_2_pro(self),
      (Provider::Fal, CommonVideoModel::Veo2) => build_fal_veo_2(self),
      (Provider::Fal, CommonVideoModel::Veo3) => build_fal_veo_3(self),
      (Provider::Fal, CommonVideoModel::Veo3Fast) => build_fal_veo_3_fast(self),
      (Provider::Fal, CommonVideoModel::Veo3p1) => build_fal_veo_3p1(self),
      (Provider::Fal, CommonVideoModel::Veo3p1Fast) => build_fal_veo_3p1_fast(self),
      // GmiCloud
      (Provider::GmiCloud, CommonVideoModel::Seedance2p0Ultra) => build_gmicloud_seedance_2p0_u(self),
      (Provider::GmiCloud, CommonVideoModel::Seedance2p0UltraFast) => build_gmicloud_seedance_2p0_u_fast(self),
      // Grok
      (Provider::GrokApi, CommonVideoModel::GrokImagineVideo) => build_grok_api_grok_imagine_video(self),
      // Kinovi
      (Provider::Seedance2Pro, CommonVideoModel::HappyHorse1p0) => build_kinovi_happy_horse_1p0(self),
      (Provider::Seedance2Pro, CommonVideoModel::Seedance2p0) => build_kinovi_seedance_2p0(self),
      (Provider::Seedance2Pro, CommonVideoModel::Seedance2p0Fast) => build_kinovi_seedance_2p0_fast(self),
      _ => self.unsupported_provider_and_model(),
    }
  }

  fn unsupported_provider_and_model(&self) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
    Err(ArtcraftRouterError::UnsupportedProviderAndModelForNewApi(
      format!("Video generation for model `{:?}` is not supported for provider {:?}", self.model, self.provider)
    ))
  }

  pub fn get_or_generate_idempotency_token(&self) -> String {
    self.idempotency_token.clone()
        .unwrap_or_else(|| uuid::Uuid::new_v4().to_string())
  }
}
