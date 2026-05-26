use fal_client::requests::webhook::image::text::enqueue_flux_pro_11_text_to_image_webhook::{
  FluxPro11AspectRatio, FluxPro11NumImages, FluxPro11Request,
};

use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
use crate::generate::generate_image_v2::image_generation_draft_or_request::ImageGenerationDraftOrRequest;
use crate::generate::generate_image_v2::image_generation_request::ImageGenerationRequest;
use crate::generate::generate_image_v2::providers::fal::flux_pro_1p1::request::FalFluxPro1p1RequestState;

pub fn build_fal_flux_pro_1p1(
  builder: GenerateImageRequestBuilder,
) -> Result<ImageGenerationDraftOrRequest, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  // Flux Pro 1.1 is text-to-image only. v1 hard-errors on any image_inputs
  // (regardless of generation_mode_mismatch_strategy) — match that.
  if builder.image_inputs.is_some() {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "image_inputs",
      value: "Flux Pro 1.1 is text-to-image only".to_string(),
    }));
  }

  let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio, strategy)?;
  let num_images = plan_num_images(builder.image_batch_count, strategy)?;

  let request = FluxPro11Request {
    prompt: builder.prompt.clone().unwrap_or_default(),
    aspect_ratio,
    num_images,
  };

  Ok(ImageGenerationDraftOrRequest::Request(
    ImageGenerationRequest::FalFluxPro1p1(FalFluxPro1p1RequestState { request }),
  ))
}

fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<FluxPro11AspectRatio, ArtcraftRouterError> {
  use FluxPro11AspectRatio as Ar;
  match aspect_ratio {
    None => Ok(Ar::Square),

    Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => Ok(Ar::Square),

    Some(CommonAspectRatio::Square) => Ok(Ar::Square),
    Some(CommonAspectRatio::SquareHd) => Ok(Ar::SquareHd),
    Some(CommonAspectRatio::WideFourByThree) => Ok(Ar::LandscapeFourByThree),
    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => Ok(Ar::LandscapeSixteenByNine),
    Some(CommonAspectRatio::TallThreeByFour) => Ok(Ar::PortraitThreeByFour),
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => Ok(Ar::PortraitNineBySixteen),

    Some(CommonAspectRatio::WideFiveByFour) => Ok(Ar::LandscapeFourByThree),
    Some(CommonAspectRatio::WideThreeByTwo) => Ok(Ar::LandscapeFourByThree),
    Some(CommonAspectRatio::WideTwentyOneByNine) => Ok(Ar::LandscapeSixteenByNine),
    Some(CommonAspectRatio::TallFourByFive) => Ok(Ar::PortraitThreeByFour),
    Some(CommonAspectRatio::TallTwoByThree) => Ok(Ar::PortraitThreeByFour),
    Some(CommonAspectRatio::TallNineByTwentyOne) => Ok(Ar::PortraitNineBySixteen),

    Some(unsupported) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", unsupported),
        }))
      }
      _ => Ok(Ar::Square),
    },
  }
}

fn plan_num_images(
  image_batch_count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<FluxPro11NumImages, ArtcraftRouterError> {
  let count = image_batch_count.unwrap_or(1);
  match count {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    1 => Ok(FluxPro11NumImages::One),
    2 => Ok(FluxPro11NumImages::Two),
    3 => Ok(FluxPro11NumImages::Three),
    4 => Ok(FluxPro11NumImages::Four),
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "image_batch_count",
          value: format!("{}", count),
        }))
      }
      _ => Ok(FluxPro11NumImages::Four),
    },
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::api::common_image_model::CommonImageModel;
  use crate::api::image_list_ref::ImageListRef;
  use crate::api::provider::Provider;

  fn base_builder() -> GenerateImageRequestBuilder {
    GenerateImageRequestBuilder {
      model: CommonImageModel::FluxPro11,
      provider: Provider::Fal,
      prompt: Some("a cat in space".to_string()),
      image_inputs: None,
      resolution: None,
      aspect_ratio: None,
      quality: None,
      image_batch_count: None,
      horizontal_angle: None,
      vertical_angle: None,
      zoom: None,
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      generation_mode_mismatch_strategy: None,
      idempotency_token: None,
    }
  }

  fn unwrap_request(result: Result<ImageGenerationDraftOrRequest, ArtcraftRouterError>) -> FluxPro11Request {
    let ImageGenerationDraftOrRequest::Request(
      ImageGenerationRequest::FalFluxPro1p1(state)
    ) = result.expect("build should succeed") else {
      panic!("expected FalFluxPro1p1 variant")
    };
    state.request
  }

  // ── Mode rejection ──

  #[test]
  fn image_inputs_present_yields_error() {
    let builder = GenerateImageRequestBuilder {
      image_inputs: Some(ImageListRef::Urls(vec!["https://example.com/img.jpg".to_string()])),
      ..base_builder()
    };
    assert!(matches!(
      build_fal_flux_pro_1p1(builder),
      Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption { field: "image_inputs", .. }))
    ));
  }

  // ── Prompt ──

  mod prompt_tests {
    use super::*;

    #[test]
    fn prompt_passed_through() {
      let builder = GenerateImageRequestBuilder {
        prompt: Some("my custom prompt".to_string()),
        ..base_builder()
      };
      let req = unwrap_request(build_fal_flux_pro_1p1(builder));
      assert_eq!(req.prompt, "my custom prompt");
    }

    #[test]
    fn missing_prompt_defaults_to_empty() {
      let builder = GenerateImageRequestBuilder { prompt: None, ..base_builder() };
      let req = unwrap_request(build_fal_flux_pro_1p1(builder));
      assert_eq!(req.prompt, "");
    }
  }

  // ── Aspect ratio ──

  mod aspect_ratio_tests {
    use super::*;

    #[test]
    fn default_is_square() {
      let req = unwrap_request(build_fal_flux_pro_1p1(base_builder()));
      assert!(matches!(req.aspect_ratio, FluxPro11AspectRatio::Square));
    }

    #[test]
    fn auto_maps_to_square() {
      let builder = GenerateImageRequestBuilder {
        aspect_ratio: Some(CommonAspectRatio::Auto),
        ..base_builder()
      };
      let req = unwrap_request(build_fal_flux_pro_1p1(builder));
      assert!(matches!(req.aspect_ratio, FluxPro11AspectRatio::Square));
    }

    #[test]
    fn square_hd() {
      let builder = GenerateImageRequestBuilder {
        aspect_ratio: Some(CommonAspectRatio::SquareHd),
        ..base_builder()
      };
      let req = unwrap_request(build_fal_flux_pro_1p1(builder));
      assert!(matches!(req.aspect_ratio, FluxPro11AspectRatio::SquareHd));
    }

    #[test]
    fn wide_sixteen_by_nine() {
      let builder = GenerateImageRequestBuilder {
        aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
        ..base_builder()
      };
      let req = unwrap_request(build_fal_flux_pro_1p1(builder));
      assert!(matches!(req.aspect_ratio, FluxPro11AspectRatio::LandscapeSixteenByNine));
    }

    #[test]
    fn tall_nine_by_sixteen() {
      let builder = GenerateImageRequestBuilder {
        aspect_ratio: Some(CommonAspectRatio::TallNineBySixteen),
        ..base_builder()
      };
      let req = unwrap_request(build_fal_flux_pro_1p1(builder));
      assert!(matches!(req.aspect_ratio, FluxPro11AspectRatio::PortraitNineBySixteen));
    }

    #[test]
    fn wide_twenty_one_by_nine_collapses_to_sixteen_by_nine() {
      let builder = GenerateImageRequestBuilder {
        aspect_ratio: Some(CommonAspectRatio::WideTwentyOneByNine),
        ..base_builder()
      };
      let req = unwrap_request(build_fal_flux_pro_1p1(builder));
      assert!(matches!(req.aspect_ratio, FluxPro11AspectRatio::LandscapeSixteenByNine));
    }

    #[test]
    fn tall_four_by_five_collapses_to_three_by_four() {
      let builder = GenerateImageRequestBuilder {
        aspect_ratio: Some(CommonAspectRatio::TallFourByFive),
        ..base_builder()
      };
      let req = unwrap_request(build_fal_flux_pro_1p1(builder));
      assert!(matches!(req.aspect_ratio, FluxPro11AspectRatio::PortraitThreeByFour));
    }
  }

  // ── Num images ──

  mod num_images_tests {
    use super::*;

    #[test]
    fn default_is_one() {
      let req = unwrap_request(build_fal_flux_pro_1p1(base_builder()));
      assert!(matches!(req.num_images, FluxPro11NumImages::One));
    }

    #[test]
    fn explicit_three() {
      let builder = GenerateImageRequestBuilder {
        image_batch_count: Some(3),
        ..base_builder()
      };
      let req = unwrap_request(build_fal_flux_pro_1p1(builder));
      assert!(matches!(req.num_images, FluxPro11NumImages::Three));
    }

    #[test]
    fn zero_is_error() {
      let builder = GenerateImageRequestBuilder {
        image_batch_count: Some(0),
        ..base_builder()
      };
      assert!(matches!(
        build_fal_flux_pro_1p1(builder),
        Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations))
      ));
    }

    #[test]
    fn over_four_error_out() {
      let builder = GenerateImageRequestBuilder {
        image_batch_count: Some(7),
        ..base_builder()
      };
      assert!(matches!(
        build_fal_flux_pro_1p1(builder),
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption { field: "image_batch_count", .. }))
      ));
    }

    #[test]
    fn over_four_clamps_with_upgrade() {
      let builder = GenerateImageRequestBuilder {
        image_batch_count: Some(7),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
        ..base_builder()
      };
      let req = unwrap_request(build_fal_flux_pro_1p1(builder));
      assert!(matches!(req.num_images, FluxPro11NumImages::Four));
    }
  }
}
