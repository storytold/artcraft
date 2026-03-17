use crate::api::common_splat_model::CommonSplatModel;
use crate::api::image_list_ref::ImageListRef;
use crate::api::provider::Provider;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_splat::plan::artcraft::plan_generate_splat_artcraft_marble_0p1_mini::plan_generate_splat_artcraft_marble_0p1_mini;
use crate::generate::generate_splat::plan::artcraft::plan_generate_splat_artcraft_marble_0p1_plus::plan_generate_splat_artcraft_marble_0p1_plus;
use crate::generate::generate_splat::splat_generation_plan::SplatGenerationPlan;

pub struct GenerateSplatRequest<'a> {
  /// Which model to use.
  pub model: CommonSplatModel,

  /// Which provider to use.
  pub provider: Provider,

  /// The prompt for splat generation (optional).
  pub prompt: Option<&'a str>,

  /// Reference images (optional).
  pub reference_images: Option<ImageListRef<'a>>,

  /// Some providers support idempotency.
  /// If not supplied, we'll generate one for the required providers.
  pub idempotency_token: Option<&'a str>,
}

impl<'a> GenerateSplatRequest<'a> {
  /// Read the splat generation request, construct a plan, then yield a means to execute it.
  pub fn build(&self) -> Result<SplatGenerationPlan<'_>, ArtcraftRouterError> {
    match self.provider {
      Provider::Artcraft => self.build_artcraft(),
      _ => self.unsupported_provider(),
    }
  }

  fn build_artcraft(&self) -> Result<SplatGenerationPlan<'_>, ArtcraftRouterError> {
    match self.model {
      CommonSplatModel::Marble0p1Mini => plan_generate_splat_artcraft_marble_0p1_mini(self),
      CommonSplatModel::Marble0p1Plus => plan_generate_splat_artcraft_marble_0p1_plus(self),
    }
  }

  fn unsupported_provider(&self) -> Result<SplatGenerationPlan<'_>, ArtcraftRouterError> {
    Err(ArtcraftRouterError::UnsupportedModel(
      format!("Splat generation for model `{:?}` is not supported for provider {:?}", self.model, self.provider)
    ))
  }

  pub fn get_or_generate_idempotency_token(&self) -> String {
    self.idempotency_token.map(|t| t.to_string())
        .unwrap_or_else(|| uuid::Uuid::new_v4().to_string())
  }
}
