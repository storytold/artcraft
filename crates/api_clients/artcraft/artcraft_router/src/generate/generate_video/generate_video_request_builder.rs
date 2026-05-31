use crate::api::audio_list_ref::AudioListRef;
use crate::api::character_list_ref::CharacterListRef;
use crate::api::router_aspect_ratio::RouterAspectRatio;
use crate::api::router_resolution::RouterResolution;
use crate::api::router_video_model::RouterVideoModel;
use crate::api::image_list_ref::ImageListRef;
use crate::api::image_ref::ImageRef;
use crate::api::router_provider::RouterProvider;
use crate::api::video_list_ref::VideoListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video_v2::providers::artcraft::grok_imagine_video::build::build_artcraft_grok_imagine_video;
use crate::generate::generate_video_v2::providers::artcraft::grok_imagine_video_1p5::build::build_artcraft_grok_imagine_video_1p5;
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
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0_bpu::build::build_artcraft_seedance_2p0_bpu;
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0_bpu_fast::build::build_artcraft_seedance_2p0_bpu_fast;
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
use crate::generate::generate_video_v2::providers::grok_api::grok_imagine_video_1p5::build::build_grok_api_grok_imagine_video_1p5;
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

/// RouterProvider-agnostic video generation request. Distilled by `build2()` into a
/// `VideoGenerationDraftOrRequest` for the selected (provider, model) pair.
#[derive(Clone, Debug)]
pub struct GenerateVideoRequestBuilder {
  /// Which model to use.
  pub model: RouterVideoModel,

  /// Which provider to use.
  pub provider: RouterProvider,

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
  pub resolution: Option<RouterResolution>,

  /// The aspect ratio to use
  pub aspect_ratio: Option<RouterAspectRatio>,

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
      model: RouterVideoModel::Seedance2p0,
      provider: RouterProvider::Artcraft,
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
      (RouterProvider::Artcraft, RouterVideoModel::GrokImagineVideo) => build_artcraft_grok_imagine_video(self),
      (RouterProvider::Artcraft, RouterVideoModel::GrokImagineVideo1p5) => build_artcraft_grok_imagine_video_1p5(self),
      (RouterProvider::Artcraft, RouterVideoModel::HappyHorse1p0) => build_artcraft_happy_horse_1p0(self),
      (RouterProvider::Artcraft, RouterVideoModel::Kling16Pro) => build_artcraft_kling_1_6_pro(self),
      (RouterProvider::Artcraft, RouterVideoModel::Kling21Master) => build_artcraft_kling_2_1_master(self),
      (RouterProvider::Artcraft, RouterVideoModel::Kling21Pro) => build_artcraft_kling_2_1_pro(self),
      (RouterProvider::Artcraft, RouterVideoModel::Kling2p5TurboPro) => build_artcraft_kling_2_5_turbo_pro(self),
      (RouterProvider::Artcraft, RouterVideoModel::Kling2p6Pro) => build_artcraft_kling_2_6_pro(self),
      (RouterProvider::Artcraft, RouterVideoModel::Kling3p0Pro) => build_artcraft_kling_3p0_pro(self),
      (RouterProvider::Artcraft, RouterVideoModel::Kling3p0Standard) => build_artcraft_kling_3p0_standard(self),
      (RouterProvider::Artcraft, RouterVideoModel::Seedance2p0) => build_artcraft_seedance_2p0(self),
      (RouterProvider::Artcraft, RouterVideoModel::Seedance2p0Fast) => build_artcraft_seedance_2p0_fast(self),
      (RouterProvider::Artcraft, RouterVideoModel::Seedance2p0Ultra) => build_artcraft_seedance_2p0_u(self),
      (RouterProvider::Artcraft, RouterVideoModel::Seedance2p0UltraFast) => build_artcraft_seedance_2p0_u_fast(self),
      (RouterProvider::Artcraft, RouterVideoModel::Seedance2p0BytePlus) => build_artcraft_seedance_2p0_bp(self),
      (RouterProvider::Artcraft, RouterVideoModel::Seedance2p0BytePlusFast) => build_artcraft_seedance_2p0_bp_fast(self),
      (RouterProvider::Artcraft, RouterVideoModel::Seedance2p0BytePlusUltra) => build_artcraft_seedance_2p0_bpu(self),
      (RouterProvider::Artcraft, RouterVideoModel::Seedance2p0BytePlusUltraFast) => build_artcraft_seedance_2p0_bpu_fast(self),
      (RouterProvider::Artcraft, RouterVideoModel::PreviewModel) => build_artcraft_preview_model(self),
      (RouterProvider::Artcraft, RouterVideoModel::PreviewModelFast) => build_artcraft_preview_model_fast(self),
      (RouterProvider::Artcraft, RouterVideoModel::Seedance10Lite) => build_artcraft_seedance_1p0_lite(self),
      (RouterProvider::Artcraft, RouterVideoModel::Seedance1p5Pro) => build_artcraft_seedance_1p5_pro(self),
      (RouterProvider::Artcraft, RouterVideoModel::Sora2) => build_artcraft_sora_2(self),
      (RouterProvider::Artcraft, RouterVideoModel::Sora2Pro) => build_artcraft_sora_2_pro(self),
      (RouterProvider::Artcraft, RouterVideoModel::Veo2) => build_artcraft_veo_2(self),
      (RouterProvider::Artcraft, RouterVideoModel::Veo3) => build_artcraft_veo_3(self),
      (RouterProvider::Artcraft, RouterVideoModel::Veo3Fast) => build_artcraft_veo_3_fast(self),
      (RouterProvider::Artcraft, RouterVideoModel::Veo3p1) => build_artcraft_veo_3p1(self),
      (RouterProvider::Artcraft, RouterVideoModel::Veo3p1Fast) => build_artcraft_veo_3p1_fast(self),
      // Fal
      (RouterProvider::Fal, RouterVideoModel::Kling16Pro) => build_fal_kling_1_6_pro(self),
      (RouterProvider::Fal, RouterVideoModel::Kling21Master) => build_fal_kling_2_1_master(self),
      (RouterProvider::Fal, RouterVideoModel::Kling21Pro) => build_fal_kling_2_1_pro(self),
      (RouterProvider::Fal, RouterVideoModel::Kling2p5TurboPro) => build_fal_kling_2_5_turbo_pro(self),
      (RouterProvider::Fal, RouterVideoModel::Kling2p6Pro) => build_fal_kling_2_6_pro(self),
      (RouterProvider::Fal, RouterVideoModel::Kling3p0Pro) => build_fal_kling_3p0_pro(self),
      (RouterProvider::Fal, RouterVideoModel::Kling3p0Standard) => build_fal_kling_3p0_standard(self),
      (RouterProvider::Fal, RouterVideoModel::Seedance10Lite) => build_fal_seedance_1p0_lite(self),
      (RouterProvider::Fal, RouterVideoModel::Seedance1p5Pro) => build_fal_seedance_1p5_pro(self),
      (RouterProvider::Fal, RouterVideoModel::Sora2) => build_fal_sora_2(self),
      (RouterProvider::Fal, RouterVideoModel::Sora2Pro) => build_fal_sora_2_pro(self),
      (RouterProvider::Fal, RouterVideoModel::Veo2) => build_fal_veo_2(self),
      (RouterProvider::Fal, RouterVideoModel::Veo3) => build_fal_veo_3(self),
      (RouterProvider::Fal, RouterVideoModel::Veo3Fast) => build_fal_veo_3_fast(self),
      (RouterProvider::Fal, RouterVideoModel::Veo3p1) => build_fal_veo_3p1(self),
      (RouterProvider::Fal, RouterVideoModel::Veo3p1Fast) => build_fal_veo_3p1_fast(self),
      // GmiCloud
      (RouterProvider::GmiCloud, RouterVideoModel::Seedance2p0Ultra) => build_gmicloud_seedance_2p0_u(self),
      (RouterProvider::GmiCloud, RouterVideoModel::Seedance2p0UltraFast) => build_gmicloud_seedance_2p0_u_fast(self),
      // Grok
      (RouterProvider::GrokApi, RouterVideoModel::GrokImagineVideo) => build_grok_api_grok_imagine_video(self),
      (RouterProvider::GrokApi, RouterVideoModel::GrokImagineVideo1p5) => build_grok_api_grok_imagine_video_1p5(self),
      // Kinovi
      (RouterProvider::Seedance2Pro, RouterVideoModel::HappyHorse1p0) => build_kinovi_happy_horse_1p0(self),
      (RouterProvider::Seedance2Pro, RouterVideoModel::Seedance2p0) => build_kinovi_seedance_2p0(self),
      (RouterProvider::Seedance2Pro, RouterVideoModel::Seedance2p0Fast) => build_kinovi_seedance_2p0_fast(self),
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
