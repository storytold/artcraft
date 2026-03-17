use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_image_model::CommonImageModel;
use crate::api::common_resolution::CommonResolution;
use crate::api::image_list_ref::ImageListRef;
use crate::api::provider::Provider;
use crate::client::generation_mode_mismatch_strategy::GenerationModeMismatchStrategy;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_image::image_generation_plan::ImageGenerationPlan;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_flux_1_dev::plan_generate_image_artcraft_flux_1_dev;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_flux_1_schnell::plan_generate_image_artcraft_flux_1_schnell;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_flux_pro_1p1::plan_generate_image_artcraft_flux_pro_1p1;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_flux_pro_1p1_ultra::plan_generate_image_artcraft_flux_pro_1p1_ultra;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_gpt_image_1p5::plan_generate_image_artcraft_gpt_image_1p5;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_nano_banana::plan_generate_image_artcraft_nano_banana;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_nano_banana_2::plan_generate_image_artcraft_nano_banana_2;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_nano_banana_pro::plan_generate_image_artcraft_nano_banana_pro;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_seedream_4::plan_generate_image_artcraft_seedream_4;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_seedream_4p5::plan_generate_image_artcraft_seedream_4p5;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_seedream_5_lite::plan_generate_image_artcraft_seedream_5_lite;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_qwen_edit_2511_angles::plan_generate_image_artcraft_qwen_edit_2511_angles;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_flux_2_lora_angles::plan_generate_image_artcraft_flux_2_lora_angles;
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_nano_banana_pro::plan_generate_image_fal_nano_banana_pro;

pub struct GenerateImageRequest<'a> {
  /// Which model to use.
  pub model: CommonImageModel,

  /// Which provider to use.
  pub provider: Provider,

  /// The prompt for the image generation.
  pub prompt: Option<&'a str>,

  /// Input images for image editing.
  /// If present, we're doing image editing (image-to-image).
  /// If absent, we're doing text-to-image.
  pub image_inputs: Option<ImageListRef<'a>>,

  /// The resolution to use.
  pub resolution: Option<CommonResolution>,

  /// The aspect ratio to use.
  pub aspect_ratio: Option<CommonAspectRatio>,

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
  pub idempotency_token: Option<&'a str>,
}

impl<'a> GenerateImageRequest<'a> {
  /// Read the image generation request, construct a plan, then yield a means to execute it.
  pub fn build(&self) -> Result<ImageGenerationPlan<'_>, ArtcraftRouterError> {
    match self.provider {
      Provider::Artcraft => self.build_artcraft(),
      Provider::Fal => self.build_fal(),
      _ => self.unsupported_provider(),
    }
  }

  fn build_artcraft(&self) -> Result<ImageGenerationPlan<'_>, ArtcraftRouterError> {
    match self.model {
      CommonImageModel::Flux1Dev => plan_generate_image_artcraft_flux_1_dev(self),
      CommonImageModel::Flux1Schnell => plan_generate_image_artcraft_flux_1_schnell(self),
      CommonImageModel::FluxPro11 => plan_generate_image_artcraft_flux_pro_1p1(self),
      CommonImageModel::FluxPro11Ultra => plan_generate_image_artcraft_flux_pro_1p1_ultra(self),
      CommonImageModel::GptImage1p5 => plan_generate_image_artcraft_gpt_image_1p5(self),
      CommonImageModel::NanaBanana => plan_generate_image_artcraft_nano_banana(self),
      CommonImageModel::NanaBanana2 => plan_generate_image_artcraft_nano_banana_2(self),
      CommonImageModel::NanaBananaPro => plan_generate_image_artcraft_nano_banana_pro(self),
      CommonImageModel::Seedream4 => plan_generate_image_artcraft_seedream_4(self),
      CommonImageModel::Seedream4p5 => plan_generate_image_artcraft_seedream_4p5(self),
      CommonImageModel::Seedream5Lite => plan_generate_image_artcraft_seedream_5_lite(self),
      CommonImageModel::QwenEdit2511Angles => plan_generate_image_artcraft_qwen_edit_2511_angles(self),
      CommonImageModel::Flux2LoraAngles => plan_generate_image_artcraft_flux_2_lora_angles(self),
    }
  }

  fn build_fal(&self) -> Result<ImageGenerationPlan<'_>, ArtcraftRouterError> {
    match self.model {
      CommonImageModel::NanaBananaPro => plan_generate_image_fal_nano_banana_pro(self),
      _ => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "provider",
          value: format!("{:?} is only available on the Artcraft provider", self.model),
        }))
      }
    }
  }

  fn unsupported_provider(&self) -> Result<ImageGenerationPlan<'_>, ArtcraftRouterError> {
    Err(ArtcraftRouterError::UnsupportedModel(
      format!("Image generation for model `{:?}` is not supported for provider {:?}", self.model, self.provider)
    ))
  }

  pub fn get_or_generate_idempotency_token(&self) -> String {
    self.idempotency_token.map(|t| t.to_string())
        .unwrap_or_else(|| uuid::Uuid::new_v4().to_string())
  }
}
