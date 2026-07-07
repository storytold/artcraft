use crate::api::image_list_ref::ImageListRef;
use crate::api::router_provider::RouterProvider;
use crate::api::router_splat_model::RouterSplatModel;
use crate::api::video_ref::VideoRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_splat::providers::artcraft::marble_1p0::build::build_artcraft_marble_1p0;
use crate::generate::generate_splat::providers::artcraft::marble_1p0_draft::build::build_artcraft_marble_1p0_draft;
use crate::generate::generate_splat::providers::artcraft::marble_1p1::build::build_artcraft_marble_1p1;
use crate::generate::generate_splat::providers::artcraft::marble_1p1_plus::build::build_artcraft_marble_1p1_plus;
use crate::generate::generate_splat::providers::worldlabs::marble_1p0::build::build_worldlabs_marble_1p0;
use crate::generate::generate_splat::providers::worldlabs::marble_1p0_draft::build::build_worldlabs_marble_1p0_draft;
use crate::generate::generate_splat::providers::worldlabs::marble_1p1::build::build_worldlabs_marble_1p1;
use crate::generate::generate_splat::providers::worldlabs::marble_1p1_plus::build::build_worldlabs_marble_1p1_plus;
use crate::generate::generate_splat::splat_generation_draft_or_request::SplatGenerationDraftOrRequest;

/// RouterProvider-agnostic splat (gaussian world) generation request.
/// Distilled by `build2()` into a `SplatGenerationDraftOrRequest` for the
/// selected (provider, model) pair.
///
/// NB: The deprecated marble 0.1 models are treated as their marble 1.x
/// successors (`Marble0p1Mini` → `Marble1p0Draft`, `Marble0p1Plus` →
/// `Marble1p0`).
#[derive(Clone, Debug)]
pub struct GenerateSplatRequestBuilder {
  /// Which model to use.
  pub model: RouterSplatModel,

  /// Which provider to use.
  pub provider: RouterProvider,

  /// The text prompt for the splat generation.
  pub prompt: Option<String>,

  /// Reference images (optional).
  /// One image generates from a single view; multiple images are treated as
  /// multi-view input of the same world.
  pub reference_images: Option<ImageListRef>,

  /// Reference video (optional). Cannot be combined with reference images.
  pub reference_video: Option<VideoRef>,

  /// Whether the single reference image is a 360-degree panorama.
  pub is_panoramic: Option<bool>,

  /// Whether to disable prompt recaptioning.
  pub disable_recaption: Option<bool>,

  /// If the request is a mismatch with the (model/provider), how to mitigate it.
  pub request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy,

  /// Some providers support idempotency.
  /// If not supplied, we'll generate one for the required providers.
  pub idempotency_token: Option<String>,
}

impl Default for GenerateSplatRequestBuilder {
  fn default() -> Self {
    Self {
      model: RouterSplatModel::Marble1p0Draft,
      provider: RouterProvider::Artcraft,
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
      prompt: None,
      reference_images: None,
      reference_video: None,
      is_panoramic: None,
      disable_recaption: None,
      idempotency_token: None,
    }
  }
}

impl GenerateSplatRequestBuilder {

  pub fn build2(self) -> Result<SplatGenerationDraftOrRequest, ArtcraftRouterError> {
    match (self.provider, self.model) {
      // Artcraft
      (RouterProvider::Artcraft, RouterSplatModel::Marble1p0 | RouterSplatModel::Marble0p1Plus) => build_artcraft_marble_1p0(self),
      (RouterProvider::Artcraft, RouterSplatModel::Marble1p0Draft | RouterSplatModel::Marble0p1Mini) => build_artcraft_marble_1p0_draft(self),
      (RouterProvider::Artcraft, RouterSplatModel::Marble1p1) => build_artcraft_marble_1p1(self),
      (RouterProvider::Artcraft, RouterSplatModel::Marble1p1Plus) => build_artcraft_marble_1p1_plus(self),
      // World Labs
      (RouterProvider::WorldLabs, RouterSplatModel::Marble1p0 | RouterSplatModel::Marble0p1Plus) => build_worldlabs_marble_1p0(self),
      (RouterProvider::WorldLabs, RouterSplatModel::Marble1p0Draft | RouterSplatModel::Marble0p1Mini) => build_worldlabs_marble_1p0_draft(self),
      (RouterProvider::WorldLabs, RouterSplatModel::Marble1p1) => build_worldlabs_marble_1p1(self),
      (RouterProvider::WorldLabs, RouterSplatModel::Marble1p1Plus) => build_worldlabs_marble_1p1_plus(self),
      _ => self.unsupported_provider_and_model(),
    }
  }

  pub fn get_or_generate_idempotency_token(&self) -> String {
    self.idempotency_token.clone()
        .unwrap_or_else(|| uuid::Uuid::new_v4().to_string())
  }

  fn unsupported_provider_and_model(&self) -> Result<SplatGenerationDraftOrRequest, ArtcraftRouterError> {
    Err(ArtcraftRouterError::UnsupportedProviderAndModelForNewApi(
      format!("Splat generation for model `{:?}` is not supported for provider {:?}", self.model, self.provider)
    ))
  }
}

#[cfg(test)]
mod tests {
  use tokens::tokens::media_files::MediaFileToken;

  use crate::generate::generate_splat::splat_generation_draft::SplatGenerationDraftRequest;
  use crate::generate::generate_splat::splat_generation_request::SplatGenerationRequest;

  use super::*;

  const IMAGE_URL: &str = "https://example.com/room.png";

  mod artcraft_dispatch_tests {
    use super::*;

    #[test]
    fn all_models_dispatch_to_requests() {
      let cases = [
        RouterSplatModel::Marble1p0,
        RouterSplatModel::Marble1p0Draft,
        RouterSplatModel::Marble1p1,
        RouterSplatModel::Marble1p1Plus,
      ];
      for model in cases {
        let result = artcraft_builder(model).build2()
          .unwrap_or_else(|e| panic!("build should succeed for {model:?}: {e}"));
        let request = expect_request(result);
        let matches = matches!(
          (model, &request),
          (RouterSplatModel::Marble1p0, SplatGenerationRequest::ArtcraftMarble1p0(_))
            | (RouterSplatModel::Marble1p0Draft, SplatGenerationRequest::ArtcraftMarble1p0Draft(_))
            | (RouterSplatModel::Marble1p1, SplatGenerationRequest::ArtcraftMarble1p1(_))
            | (RouterSplatModel::Marble1p1Plus, SplatGenerationRequest::ArtcraftMarble1p1Plus(_))
        );
        assert!(matches, "unexpected dispatch for {model:?}: {request:?}");
      }
    }

    #[test]
    fn legacy_marble_0p1_mini_is_treated_as_marble_1p0_draft() {
      let result = artcraft_builder(RouterSplatModel::Marble0p1Mini).build2().expect("build");
      assert!(matches!(
        expect_request(result),
        SplatGenerationRequest::ArtcraftMarble1p0Draft(_)
      ));
    }

    #[test]
    fn legacy_marble_0p1_plus_is_treated_as_marble_1p0() {
      let result = artcraft_builder(RouterSplatModel::Marble0p1Plus).build2().expect("build");
      assert!(matches!(
        expect_request(result),
        SplatGenerationRequest::ArtcraftMarble1p0(_)
      ));
    }
  }

  mod worldlabs_dispatch_tests {
    use super::*;

    #[test]
    fn text_prompts_dispatch_to_direct_requests() {
      let cases = [
        RouterSplatModel::Marble1p0,
        RouterSplatModel::Marble1p0Draft,
        RouterSplatModel::Marble1p1,
        RouterSplatModel::Marble1p1Plus,
      ];
      for model in cases {
        let result = worldlabs_text_builder(model).build2()
          .unwrap_or_else(|e| panic!("build should succeed for {model:?}: {e}"));
        let request = expect_request(result);
        let matches = matches!(
          (model, &request),
          (RouterSplatModel::Marble1p0, SplatGenerationRequest::WorldLabsMarble1p0(_))
            | (RouterSplatModel::Marble1p0Draft, SplatGenerationRequest::WorldLabsMarble1p0Draft(_))
            | (RouterSplatModel::Marble1p1, SplatGenerationRequest::WorldLabsMarble1p1(_))
            | (RouterSplatModel::Marble1p1Plus, SplatGenerationRequest::WorldLabsMarble1p1Plus(_))
        );
        assert!(matches, "unexpected dispatch for {model:?}: {request:?}");
      }
    }

    #[test]
    fn media_inputs_dispatch_to_drafts() {
      let cases = [
        RouterSplatModel::Marble1p0,
        RouterSplatModel::Marble1p0Draft,
        RouterSplatModel::Marble1p1,
        RouterSplatModel::Marble1p1Plus,
      ];
      for model in cases {
        let builder = GenerateSplatRequestBuilder {
          reference_images: Some(ImageListRef::Urls(vec![IMAGE_URL.to_string()])),
          ..worldlabs_text_builder(model)
        };
        let result = builder.build2()
          .unwrap_or_else(|e| panic!("build should succeed for {model:?}: {e}"));
        let draft = expect_draft(result);
        let matches = matches!(
          (model, &draft),
          (RouterSplatModel::Marble1p0, SplatGenerationDraftRequest::WorldLabsMarble1p0(_))
            | (RouterSplatModel::Marble1p0Draft, SplatGenerationDraftRequest::WorldLabsMarble1p0Draft(_))
            | (RouterSplatModel::Marble1p1, SplatGenerationDraftRequest::WorldLabsMarble1p1(_))
            | (RouterSplatModel::Marble1p1Plus, SplatGenerationDraftRequest::WorldLabsMarble1p1Plus(_))
        );
        assert!(matches, "unexpected dispatch for {model:?}: {draft:?}");
      }
    }

    #[test]
    fn legacy_models_are_treated_as_their_successors() {
      let mini = worldlabs_text_builder(RouterSplatModel::Marble0p1Mini).build2().expect("build");
      assert!(matches!(
        expect_request(mini),
        SplatGenerationRequest::WorldLabsMarble1p0Draft(_)
      ));

      let plus = worldlabs_text_builder(RouterSplatModel::Marble0p1Plus).build2().expect("build");
      assert!(matches!(
        expect_request(plus),
        SplatGenerationRequest::WorldLabsMarble1p0(_)
      ));
    }

    #[test]
    fn media_token_inputs_dispatch_to_drafts() {
      let builder = GenerateSplatRequestBuilder {
        prompt: None,
        reference_images: Some(ImageListRef::MediaFileTokens(vec![
          MediaFileToken::new("mf_test123".to_string()),
        ])),
        ..worldlabs_text_builder(RouterSplatModel::Marble1p0)
      };
      let result = builder.build2().expect("build");
      assert!(matches!(result, SplatGenerationDraftOrRequest::Draft(_)));
    }
  }

  mod unsupported_combo_tests {
    use super::*;

    #[test]
    fn non_splat_providers_are_unsupported() {
      for provider in [
        RouterProvider::Fal,
        RouterProvider::GmiCloud,
        RouterProvider::GrokApi,
        RouterProvider::Seedance2Pro,
      ] {
        let result = GenerateSplatRequestBuilder {
          provider,
          model: RouterSplatModel::Marble1p0,
          prompt: Some("a cozy cabin".to_string()),
          ..Default::default()
        }.build2();
        assert!(
          matches!(result, Err(ArtcraftRouterError::UnsupportedProviderAndModelForNewApi(_))),
          "expected unsupported error for {provider:?}",
        );
      }
    }
  }

  // ── Helpers ──

  fn artcraft_builder(model: RouterSplatModel) -> GenerateSplatRequestBuilder {
    GenerateSplatRequestBuilder {
      provider: RouterProvider::Artcraft,
      model,
      prompt: Some("a cozy cabin in the snowy mountains".to_string()),
      ..Default::default()
    }
  }

  fn worldlabs_text_builder(model: RouterSplatModel) -> GenerateSplatRequestBuilder {
    GenerateSplatRequestBuilder {
      provider: RouterProvider::WorldLabs,
      model,
      prompt: Some("a cozy cabin in the snowy mountains".to_string()),
      ..Default::default()
    }
  }

  fn expect_request(result: SplatGenerationDraftOrRequest) -> SplatGenerationRequest {
    match result {
      SplatGenerationDraftOrRequest::Request(request) => request,
      SplatGenerationDraftOrRequest::Draft(draft) => panic!("expected Request, got Draft: {draft:?}"),
    }
  }

  fn expect_draft(result: SplatGenerationDraftOrRequest) -> SplatGenerationDraftRequest {
    match result {
      SplatGenerationDraftOrRequest::Draft(draft) => draft,
      SplatGenerationDraftOrRequest::Request(request) => panic!("expected Draft, got Request: {request:?}"),
    }
  }
}
