use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_image_model::CommonImageModel;
use crate::api::common_quality::CommonQuality;
use crate::api::common_resolution::CommonResolution;
use crate::api::image_list_ref::ImageListRef;
use crate::api::provider::Provider;
use crate::client::generation_mode_mismatch_strategy::GenerationModeMismatchStrategy;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_image_v2::image_generation_draft_or_request::ImageGenerationDraftOrRequest;
use crate::generate::generate_image_v2::providers::artcraft::flux_1_dev::build::build_artcraft_flux_1_dev;
use crate::generate::generate_image_v2::providers::artcraft::flux_1_schnell::build::build_artcraft_flux_1_schnell;
use crate::generate::generate_image_v2::providers::artcraft::flux_2_lora_angles::build::build_artcraft_flux_2_lora_angles;
use crate::generate::generate_image_v2::providers::artcraft::flux_pro_1p1::build::build_artcraft_flux_pro_1p1;
use crate::generate::generate_image_v2::providers::artcraft::flux_pro_1p1_ultra::build::build_artcraft_flux_pro_1p1_ultra;
use crate::generate::generate_image_v2::providers::artcraft::gpt_image_1::build::build_artcraft_gpt_image_1;
use crate::generate::generate_image_v2::providers::artcraft::gpt_image_1p5::build::build_artcraft_gpt_image_1p5;
use crate::generate::generate_image_v2::providers::artcraft::gpt_image_2::build::build_artcraft_gpt_image_2;
use crate::generate::generate_image_v2::providers::artcraft::nano_banana::build::build_artcraft_nano_banana;
use crate::generate::generate_image_v2::providers::artcraft::nano_banana_2::build::build_artcraft_nano_banana_2;
use crate::generate::generate_image_v2::providers::artcraft::nano_banana_pro::build::build_artcraft_nano_banana_pro;
use crate::generate::generate_image_v2::providers::artcraft::qwen_edit_2511_angles::build::build_artcraft_qwen_edit_2511_angles;
use crate::generate::generate_image_v2::providers::artcraft::seedream_4::build::build_artcraft_seedream_4;
use crate::generate::generate_image_v2::providers::artcraft::seedream_4p5::build::build_artcraft_seedream_4p5;
use crate::generate::generate_image_v2::providers::artcraft::seedream_5_lite::build::build_artcraft_seedream_5_lite;
use crate::generate::generate_image_v2::providers::fal::flux_1_dev::build::build_fal_flux_1_dev;
use crate::generate::generate_image_v2::providers::fal::flux_1_schnell::build::build_fal_flux_1_schnell;
use crate::generate::generate_image_v2::providers::fal::flux_2_lora_angles::build::build_fal_flux_2_lora_angles;
use crate::generate::generate_image_v2::providers::fal::flux_pro_1p1::build::build_fal_flux_pro_1p1;
use crate::generate::generate_image_v2::providers::fal::flux_pro_1p1_ultra::build::build_fal_flux_pro_1p1_ultra;
use crate::generate::generate_image_v2::providers::fal::gpt_image_1::build::build_fal_gpt_image_1;
use crate::generate::generate_image_v2::providers::fal::gpt_image_1p5::build::build_fal_gpt_image_1p5;
use crate::generate::generate_image_v2::providers::fal::gpt_image_2::build::build_fal_gpt_image_2;
use crate::generate::generate_image_v2::providers::fal::nano_banana::build::build_fal_nano_banana;
use crate::generate::generate_image_v2::providers::fal::nano_banana_2::build::build_fal_nano_banana_2;
use crate::generate::generate_image_v2::providers::fal::nano_banana_pro::build::build_fal_nano_banana_pro;
use crate::generate::generate_image_v2::providers::fal::qwen_edit_2511_angles::build::build_fal_qwen_edit_2511_angles;
use crate::generate::generate_image_v2::providers::fal::seedream_4::build::build_fal_seedream_4;
use crate::generate::generate_image_v2::providers::fal::seedream_4p5::build::build_fal_seedream_4p5;
use crate::generate::generate_image_v2::providers::fal::seedream_5_lite::build::build_fal_seedream_5_lite;

#[derive(Clone, Debug)]
pub struct GenerateImageRequestBuilder {
  /// Which model to use.
  pub model: CommonImageModel,

  /// Which provider to use.
  pub provider: Provider,

  /// The prompt for the image generation.
  pub prompt: Option<String>,

  /// Input images for image editing.
  /// If present, we're doing image editing (image-to-image).
  /// If absent, we're doing text-to-image.
  pub image_inputs: Option<ImageListRef>,

  /// The resolution to use.
  pub resolution: Option<CommonResolution>,

  /// The aspect ratio to use.
  pub aspect_ratio: Option<CommonAspectRatio>,

  /// The quality level for generation. Not all models use this.
  pub quality: Option<CommonQuality>,

  /// How many images to generate.
  pub image_batch_count: Option<u16>,

  /// Only for angle manipulation models.
  pub horizontal_angle: Option<f64>,

  /// Only for angle manipulation models.
  pub vertical_angle: Option<f64>,

  /// Only for angle manipulation models.
  pub zoom: Option<f64>,

  /// If the request is a mismatch with the (model/provider), how to mitigate it.
  pub request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy,

  /// Controls behavior when `image_inputs` are supplied to a text-to-image-only model.
  /// `None` is equivalent to `GenerateAnyway` — image inputs are silently ignored.
  /// Set `AbortGeneration` to return an error instead.
  pub generation_mode_mismatch_strategy: Option<GenerationModeMismatchStrategy>,

  /// Some providers support idempotency.
  /// If not supplied, we'll generate one for the required providers.
  pub idempotency_token: Option<String>,
}

impl GenerateImageRequestBuilder {

  /// Build an executable image generation request for the configured
  /// (provider, model) pair. Returns either a directly-sendable `Request`
  /// or a `Draft` that needs media-token resolution before sending.
  ///
  /// Named `build2` for historical reasons — this is the only build method
  /// since v1 was removed. The name is preserved for consistency with
  /// `GenerateVideoRequestBuilder::build2`.
  pub fn build2(self) -> Result<ImageGenerationDraftOrRequest, ArtcraftRouterError> {
    match (self.provider, self.model) {
      (Provider::Artcraft, CommonImageModel::Flux1Dev) => build_artcraft_flux_1_dev(self),
      (Provider::Artcraft, CommonImageModel::Flux1Schnell) => build_artcraft_flux_1_schnell(self),
      (Provider::Artcraft, CommonImageModel::FluxPro11) => build_artcraft_flux_pro_1p1(self),
      (Provider::Artcraft, CommonImageModel::FluxPro11Ultra) => build_artcraft_flux_pro_1p1_ultra(self),
      (Provider::Artcraft, CommonImageModel::GptImage1) => build_artcraft_gpt_image_1(self),
      (Provider::Artcraft, CommonImageModel::GptImage1p5) => build_artcraft_gpt_image_1p5(self),
      (Provider::Artcraft, CommonImageModel::GptImage2) => build_artcraft_gpt_image_2(self),
      (Provider::Artcraft, CommonImageModel::NanoBanana) => build_artcraft_nano_banana(self),
      (Provider::Artcraft, CommonImageModel::NanoBanana2) => build_artcraft_nano_banana_2(self),
      (Provider::Artcraft, CommonImageModel::NanoBananaPro) => build_artcraft_nano_banana_pro(self),
      (Provider::Artcraft, CommonImageModel::Seedream4) => build_artcraft_seedream_4(self),
      (Provider::Artcraft, CommonImageModel::Seedream4p5) => build_artcraft_seedream_4p5(self),
      (Provider::Artcraft, CommonImageModel::Seedream5Lite) => build_artcraft_seedream_5_lite(self),
      (Provider::Artcraft, CommonImageModel::QwenEdit2511Angles) => build_artcraft_qwen_edit_2511_angles(self),
      (Provider::Artcraft, CommonImageModel::Flux2LoraAngles) => build_artcraft_flux_2_lora_angles(self),

      (Provider::Fal, CommonImageModel::Flux1Dev) => build_fal_flux_1_dev(self),
      (Provider::Fal, CommonImageModel::Flux1Schnell) => build_fal_flux_1_schnell(self),
      (Provider::Fal, CommonImageModel::FluxPro11) => build_fal_flux_pro_1p1(self),
      (Provider::Fal, CommonImageModel::FluxPro11Ultra) => build_fal_flux_pro_1p1_ultra(self),
      (Provider::Fal, CommonImageModel::GptImage1) => build_fal_gpt_image_1(self),
      (Provider::Fal, CommonImageModel::GptImage1p5) => build_fal_gpt_image_1p5(self),
      (Provider::Fal, CommonImageModel::GptImage2) => build_fal_gpt_image_2(self),
      (Provider::Fal, CommonImageModel::NanoBanana) => build_fal_nano_banana(self),
      (Provider::Fal, CommonImageModel::NanoBanana2) => build_fal_nano_banana_2(self),
      (Provider::Fal, CommonImageModel::NanoBananaPro) => build_fal_nano_banana_pro(self),
      (Provider::Fal, CommonImageModel::Seedream4) => build_fal_seedream_4(self),
      (Provider::Fal, CommonImageModel::Seedream4p5) => build_fal_seedream_4p5(self),
      (Provider::Fal, CommonImageModel::Seedream5Lite) => build_fal_seedream_5_lite(self),
      (Provider::Fal, CommonImageModel::QwenEdit2511Angles) => build_fal_qwen_edit_2511_angles(self),
      (Provider::Fal, CommonImageModel::Flux2LoraAngles) => build_fal_flux_2_lora_angles(self),

      _ => self.unsupported_provider_and_model(),
    }
  }

  fn unsupported_provider_and_model(&self) -> Result<ImageGenerationDraftOrRequest, ArtcraftRouterError> {
    Err(ArtcraftRouterError::UnsupportedProviderAndModelForNewApi(
      format!("Image generation for model `{:?}` is not supported for provider {:?}", self.model, self.provider)
    ))
  }

  pub fn get_or_generate_idempotency_token(&self) -> String {
    self.idempotency_token.clone()
        .unwrap_or_else(|| uuid::Uuid::new_v4().to_string())
  }
}
