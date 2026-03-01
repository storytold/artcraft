use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_image_model::CommonImageModel;
use crate::api::common_resolution::CommonResolution;
use crate::api::image_list_ref::ImageListRef;
use crate::api::provider::Provider;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_image::image_generation_plan::ImageGenerationPlan;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_nano_banana_pro::plan_generate_image_artcraft_nano_banana_pro;

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

  /// If the request is a mismatch with the (model/provider), how to mitigate it.
  pub request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy,

  /// Some providers support idempotency.
  /// If not supplied, we'll generate one for the required providers.
  pub idempotency_token: Option<&'a str>,
}

impl<'a> GenerateImageRequest<'a> {
  /// Read the image generation request, construct a plan, then yield a means to execute it.
  pub fn build(&self) -> Result<ImageGenerationPlan<'_>, ArtcraftRouterError> {
    match self.provider {
      Provider::Artcraft => match self.model {
        CommonImageModel::NanaBananaPro => {
          plan_generate_image_artcraft_nano_banana_pro(self).map(ImageGenerationPlan::ArtcraftNanaBananaPro)
        }
      },
    }
  }

  pub fn get_or_generate_idempotency_token(&self) -> String {
    self.idempotency_token.map(|t| t.to_string())
        .unwrap_or_else(|| uuid::Uuid::new_v4().to_string())
  }
}
