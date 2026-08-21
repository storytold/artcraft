use fal_client::requests::api::splat::image::triposplat_image_to_splat::api::{
  TripoSplatImageToSplatRequest, TripoSplatOutputFormat,
};

use crate::api::image_list_ref::ImageListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_mesh::providers::reject_unsupported::reject_unsupported_option;
use crate::generate::generate_splat::generate_splat_request_builder::GenerateSplatRequestBuilder;
use crate::generate::generate_splat::providers::fal::triposplat::request::FalTripoSplatRequestState;
use crate::generate::generate_splat::splat_generation_draft_or_request::SplatGenerationDraftOrRequest;
use crate::generate::generate_splat::splat_generation_request::SplatGenerationRequest;

/// TripoSplat takes exactly one input image and nothing else. Prompts,
/// videos, panorama and recaption flags are unsupported: rejected under
/// `ErrorOut`, dropped otherwise.
pub fn build_fal_triposplat(builder: GenerateSplatRequestBuilder) -> Result<SplatGenerationDraftOrRequest, ArtcraftRouterError> {
  let state = build_fal_triposplat_state(builder)?;
  Ok(SplatGenerationDraftOrRequest::Request(SplatGenerationRequest::FalTripoSplat(state)))
}

pub(crate) fn build_fal_triposplat_state(
  mut builder: GenerateSplatRequestBuilder,
) -> Result<FalTripoSplatRequestState, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  reject_unsupported_option("prompt", builder.prompt.as_ref(), strategy)?;
  reject_unsupported_option("reference_video", builder.reference_video.as_ref(), strategy)?;
  if builder.is_panoramic == Some(true) {
    reject_unsupported_option("is_panoramic", builder.is_panoramic.as_ref(), strategy)?;
  }
  reject_unsupported_option("disable_recaption", builder.disable_recaption.as_ref(), strategy)?;

  let image_url = plan_single_image_url(builder.reference_images.take(), strategy)?
    .ok_or_else(|| {
      ArtcraftRouterError::InvalidInput(
        "TripoSplat requires an input image".to_string(),
      )
    })?;

  let request = TripoSplatImageToSplatRequest {
    image_url,
    num_gaussians: None,
    num_inference_steps: None,
    guidance_scale: None,
    // Always request PLY output — it's the format our pipeline stores.
    output_format: Some(TripoSplatOutputFormat::Ply),
    seed: None,
    enable_safety_checker: None,
  };
  Ok(FalTripoSplatRequestState { request })
}

/// Resolve the single input image from `reference_images`. More than one
/// image rejects under `ErrorOut`; the other strategies keep the first.
/// Fal only takes URLs; media file tokens are rejected.
fn plan_single_image_url(
  reference_images: Option<ImageListRef>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<String>, ArtcraftRouterError> {
  let urls = match reference_images {
    None => return Ok(None),
    Some(ImageListRef::Urls(urls)) => urls,
    Some(ImageListRef::MediaFileTokens(tokens)) if tokens.is_empty() => return Ok(None),
    Some(ImageListRef::MediaFileTokens(_)) => {
      return Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls));
    }
  };

  if urls.len() > 1 {
    if let RequestMismatchMitigationStrategy::ErrorOut = strategy {
      return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
        field: "reference_images",
        value: format!("Expected at most 1 image, got {}", urls.len()),
      }));
    }
  }
  Ok(urls.into_iter().next())
}

#[cfg(test)]
mod tests {
  use crate::api::router_provider::RouterProvider;
  use crate::api::router_splat_model::RouterSplatModel;
  use crate::api::video_ref::VideoRef;

  use super::*;

  const IMAGE_URL: &str = "https://example.com/object.png";

  mod input_tests {
    use super::*;

    #[test]
    fn single_image_builds() {
      let state = build_fal_triposplat_state(image_builder()).expect("build");
      assert_eq!(state.request.image_url, IMAGE_URL);
    }

    #[test]
    fn output_format_is_always_ply() {
      let state = build_fal_triposplat_state(image_builder()).expect("build");
      assert_eq!(state.request.output_format, Some(TripoSplatOutputFormat::Ply));
    }

    #[test]
    fn no_image_is_rejected() {
      let result = build_fal_triposplat_state(base_builder());
      assert!(matches!(result, Err(ArtcraftRouterError::InvalidInput(_))));
    }

    #[test]
    fn media_tokens_are_rejected() {
      use tokens::tokens::media_files::MediaFileToken;
      let builder = GenerateSplatRequestBuilder {
        reference_images: Some(ImageListRef::MediaFileTokens(vec![
          MediaFileToken::new("mf_test123".to_string()),
        ])),
        ..base_builder()
      };
      assert!(matches!(
        build_fal_triposplat_state(builder),
        Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
      ));
    }

    #[test]
    fn multiple_images_error_out_under_error_out() {
      let builder = GenerateSplatRequestBuilder {
        reference_images: Some(ImageListRef::Urls(vec![
          IMAGE_URL.to_string(),
          "https://example.com/second.png".to_string(),
        ])),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..base_builder()
      };
      assert!(build_fal_triposplat_state(builder).is_err());
    }

    #[test]
    fn multiple_images_keep_the_first_under_lenient_strategies() {
      let builder = GenerateSplatRequestBuilder {
        reference_images: Some(ImageListRef::Urls(vec![
          IMAGE_URL.to_string(),
          "https://example.com/second.png".to_string(),
        ])),
        ..base_builder()
      };
      let state = build_fal_triposplat_state(builder).expect("build");
      assert_eq!(state.request.image_url, IMAGE_URL);
    }
  }

  mod unsupported_option_tests {
    use super::*;

    #[test]
    fn unsupported_options_error_out_under_error_out() {
      let cases = [
        GenerateSplatRequestBuilder {
          prompt: Some("a cozy cabin".to_string()),
          ..strict_image_builder()
        },
        GenerateSplatRequestBuilder {
          reference_video: Some(VideoRef::Url("https://example.com/v.mp4".to_string())),
          ..strict_image_builder()
        },
        GenerateSplatRequestBuilder {
          is_panoramic: Some(true),
          ..strict_image_builder()
        },
        GenerateSplatRequestBuilder {
          disable_recaption: Some(true),
          ..strict_image_builder()
        },
      ];
      for builder in cases {
        assert!(build_fal_triposplat_state(builder).is_err());
      }
    }

    #[test]
    fn unsupported_options_are_dropped_under_lenient_strategies() {
      let builder = GenerateSplatRequestBuilder {
        prompt: Some("a cozy cabin".to_string()),
        is_panoramic: Some(true),
        disable_recaption: Some(true),
        ..image_builder()
      };
      assert!(build_fal_triposplat_state(builder).is_ok());
    }

    #[test]
    fn is_panoramic_false_is_not_a_mismatch() {
      let builder = GenerateSplatRequestBuilder {
        is_panoramic: Some(false),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..image_builder()
      };
      assert!(build_fal_triposplat_state(builder).is_ok());
    }
  }

  // ── Helpers ──

  fn base_builder() -> GenerateSplatRequestBuilder {
    GenerateSplatRequestBuilder {
      model: RouterSplatModel::TripoSplat,
      provider: RouterProvider::Fal,
      ..Default::default()
    }
  }

  fn image_builder() -> GenerateSplatRequestBuilder {
    GenerateSplatRequestBuilder {
      reference_images: Some(ImageListRef::Urls(vec![IMAGE_URL.to_string()])),
      ..base_builder()
    }
  }

  fn strict_image_builder() -> GenerateSplatRequestBuilder {
    GenerateSplatRequestBuilder {
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      ..image_builder()
    }
  }
}
