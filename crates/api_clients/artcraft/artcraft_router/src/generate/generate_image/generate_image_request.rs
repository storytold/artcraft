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
      Provider::Artcraft => match self.model {
        CommonImageModel::Flux1Dev => {
          plan_generate_image_artcraft_flux_1_dev(self).map(ImageGenerationPlan::ArtcraftFlux1Dev)
        }
        CommonImageModel::Flux1Schnell => {
          plan_generate_image_artcraft_flux_1_schnell(self).map(ImageGenerationPlan::ArtcraftFlux1Schnell)
        }
        CommonImageModel::FluxPro11 => {
          plan_generate_image_artcraft_flux_pro_1p1(self).map(ImageGenerationPlan::ArtcraftFluxPro11)
        }
        CommonImageModel::FluxPro11Ultra => {
          plan_generate_image_artcraft_flux_pro_1p1_ultra(self).map(ImageGenerationPlan::ArtcraftFluxPro11Ultra)
        }
        CommonImageModel::GptImage1p5 => {
          plan_generate_image_artcraft_gpt_image_1p5(self).map(ImageGenerationPlan::ArtcraftGptImage1p5)
        }
        CommonImageModel::NanaBanana => {
          plan_generate_image_artcraft_nano_banana(self).map(ImageGenerationPlan::ArtcraftNanaBanana)
        }
        CommonImageModel::NanaBanana2 => {
          plan_generate_image_artcraft_nano_banana_2(self).map(ImageGenerationPlan::ArtcraftNanaBanana2)
        }
        CommonImageModel::NanaBananaPro => {
          plan_generate_image_artcraft_nano_banana_pro(self).map(ImageGenerationPlan::ArtcraftNanaBananaPro)
        }
        CommonImageModel::Seedream4 => {
          plan_generate_image_artcraft_seedream_4(self).map(ImageGenerationPlan::ArtcraftSeedream4)
        }
        CommonImageModel::Seedream4p5 => {
          plan_generate_image_artcraft_seedream_4p5(self).map(ImageGenerationPlan::ArtcraftSeedream4p5)
        }
        CommonImageModel::Seedream5Lite => {
          plan_generate_image_artcraft_seedream_5_lite(self).map(ImageGenerationPlan::ArtcraftSeedream5Lite)
        }
        CommonImageModel::QwenEdit2511Angles => {
          plan_generate_image_artcraft_qwen_edit_2511_angles(self).map(ImageGenerationPlan::ArtcraftQwenEdit2511Angles)
        }
        CommonImageModel::Flux2LoraAngles => {
          plan_generate_image_artcraft_flux_2_lora_angles(self).map(ImageGenerationPlan::ArtcraftFlux2LoraAngles)
        }
      },
      Provider::Fal => match self.model {
        CommonImageModel::NanaBananaPro => {
          plan_generate_image_fal_nano_banana_pro(self).map(ImageGenerationPlan::FalNanaBananaPro)
        }
        CommonImageModel::Flux1Dev
        | CommonImageModel::Flux1Schnell
        | CommonImageModel::FluxPro11
        | CommonImageModel::FluxPro11Ultra
        | CommonImageModel::GptImage1p5
        | CommonImageModel::NanaBanana
        | CommonImageModel::NanaBanana2
        | CommonImageModel::Seedream4
        | CommonImageModel::Seedream4p5
        | CommonImageModel::Seedream5Lite
        | CommonImageModel::QwenEdit2511Angles
        | CommonImageModel::Flux2LoraAngles => {
          Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
            field: "provider",
            value: format!("{:?} is only available on the Artcraft provider", self.model),
          }))
        }
      },
    }
  }

  pub fn get_or_generate_idempotency_token(&self) -> String {
    self.idempotency_token.map(|t| t.to_string())
        .unwrap_or_else(|| uuid::Uuid::new_v4().to_string())
  }
}
