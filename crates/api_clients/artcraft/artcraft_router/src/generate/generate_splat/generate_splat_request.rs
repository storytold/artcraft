use crate::api::router_splat_model::RouterSplatModel;
use crate::api::image_list_ref::ImageListRef;
use crate::api::router_provider::RouterProvider;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_splat::plan::artcraft::plan_generate_splat_artcraft_marble_0p1_mini::plan_generate_splat_artcraft_marble_0p1_mini;
use crate::generate::generate_splat::plan::artcraft::plan_generate_splat_artcraft_marble_0p1_plus::plan_generate_splat_artcraft_marble_0p1_plus;
use crate::generate::generate_splat::splat_generation_plan::SplatGenerationPlan;

pub struct GenerateSplatRequest {
  /// Which model to use.
  pub model: RouterSplatModel,

  /// Which provider to use.
  pub provider: RouterProvider,

  /// The prompt for splat generation (optional).
  pub prompt: Option<String>,

  /// Reference images (optional).
  pub reference_images: Option<ImageListRef>,

  /// Some providers support idempotency.
  /// If not supplied, we'll generate one for the required providers.
  pub idempotency_token: Option<String>,
}

impl GenerateSplatRequest {
  /// Read the splat generation request, construct a plan, then yield a means to execute it.
  pub fn build(&self) -> Result<SplatGenerationPlan, ArtcraftRouterError> {
    match self.provider {
      RouterProvider::Artcraft => self.build_artcraft(),
      _ => self.unsupported_provider(),
    }
  }

  fn build_artcraft(&self) -> Result<SplatGenerationPlan, ArtcraftRouterError> {
    match self.model {
      RouterSplatModel::Marble0p1Mini => plan_generate_splat_artcraft_marble_0p1_mini(self),
      RouterSplatModel::Marble0p1Plus => plan_generate_splat_artcraft_marble_0p1_plus(self),
      // The marble 1.x models are only supported by the new
      // `GenerateSplatRequestBuilder::build2()` pipeline.
      _ => Err(ArtcraftRouterError::UnsupportedModel(
        format!("Splat generation for model `{:?}` is not supported by the legacy plan API; use GenerateSplatRequestBuilder::build2()", self.model)
      )),
    }
  }

  fn unsupported_provider(&self) -> Result<SplatGenerationPlan, ArtcraftRouterError> {
    Err(ArtcraftRouterError::UnsupportedModel(
      format!("Splat generation for model `{:?}` is not supported for provider {:?}", self.model, self.provider)
    ))
  }

  pub fn get_or_generate_idempotency_token(&self) -> String {
    self.idempotency_token.clone()
        .unwrap_or_else(|| uuid::Uuid::new_v4().to_string())
  }
}
