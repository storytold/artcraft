use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_quality::CommonQuality;
use crate::api::image_list_ref::ImageListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_image::generate_image_request::GenerateImageRequest;
use crate::generate::generate_image::image_generation_plan::ImageGenerationPlan;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio as CommonAspectRatioEnum;
use enums::common::generation::common_quality::CommonQuality as CommonQualityEnum;
use tokens::tokens::media_files::MediaFileToken;

/// GPT Image 2 supports six image sizes.
#[derive(Debug, Clone, Copy)]
pub enum ArtcraftGptImage2ImageSize {
  SquareHd,
  Square,
  Portrait4x3,
  Portrait16x9,
  Landscape4x3,
  Landscape16x9,
  Auto,
}

/// Quality: Low / Medium / High.
#[derive(Debug, Clone, Copy)]
pub enum ArtcraftGptImage2Quality {
  Low,
  Medium,
  High,
}

#[derive(Debug, Clone, Copy)]
pub enum ArtcraftGptImage2NumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Debug, Clone)]
pub struct PlanArtcraftGptImage2 {
  pub prompt: Option<String>,
  pub image_inputs: Option<Vec<MediaFileToken>>,
  pub image_size: Option<ArtcraftGptImage2ImageSize>,
  pub quality: ArtcraftGptImage2Quality,
  pub num_images: ArtcraftGptImage2NumImages,
  pub idempotency_token: String,
}

pub fn plan_generate_image_artcraft_gpt_image_2(
  request: &GenerateImageRequest,
) -> Result<ImageGenerationPlan, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  let image_inputs = resolve_image_list_ref(request.image_inputs.clone())?;
  let image_size = plan_image_size(request.aspect_ratio);
  let quality = plan_quality(request.quality);
  let num_images = plan_num_images(request.image_batch_count, strategy)?;

  Ok(ImageGenerationPlan::ArtcraftGptImage2(PlanArtcraftGptImage2 {
    prompt: request.prompt.clone(),
    image_inputs,
    image_size,
    quality,
    num_images,
    idempotency_token: request.get_or_generate_idempotency_token(),
  }))
}

impl PlanArtcraftGptImage2 {
  /// Map the plan's aspect ratio to the `CommonAspectRatioEnum` used by the
  /// omni-gen request.
  pub fn aspect_ratio_enum(&self) -> Option<CommonAspectRatioEnum> {
    self.image_size.map(|s| match s {
      ArtcraftGptImage2ImageSize::SquareHd => CommonAspectRatioEnum::SquareHd,
      ArtcraftGptImage2ImageSize::Square => CommonAspectRatioEnum::Square,
      ArtcraftGptImage2ImageSize::Portrait4x3 => CommonAspectRatioEnum::TallThreeByFour,
      ArtcraftGptImage2ImageSize::Portrait16x9 => CommonAspectRatioEnum::TallNineBySixteen,
      ArtcraftGptImage2ImageSize::Landscape4x3 => CommonAspectRatioEnum::WideFourByThree,
      ArtcraftGptImage2ImageSize::Landscape16x9 => CommonAspectRatioEnum::WideSixteenByNine,
      ArtcraftGptImage2ImageSize::Auto => CommonAspectRatioEnum::Auto,
    })
  }

  /// Map the plan's quality to the `CommonQualityEnum` used by the omni-gen
  /// request.
  pub fn quality_enum(&self) -> CommonQualityEnum {
    match self.quality {
      ArtcraftGptImage2Quality::Low => CommonQualityEnum::Low,
      ArtcraftGptImage2Quality::Medium => CommonQualityEnum::Medium,
      ArtcraftGptImage2Quality::High => CommonQualityEnum::High,
    }
  }

  pub fn num_images_u16(&self) -> u16 {
    match self.num_images {
      ArtcraftGptImage2NumImages::One => 1,
      ArtcraftGptImage2NumImages::Two => 2,
      ArtcraftGptImage2NumImages::Three => 3,
      ArtcraftGptImage2NumImages::Four => 4,
    }
  }
}

impl ArtcraftGptImage2NumImages {
  pub fn as_u64(self) -> u64 {
    match self {
      Self::One => 1,
      Self::Two => 2,
      Self::Three => 3,
      Self::Four => 4,
    }
  }
}

fn resolve_image_list_ref(
  image_list_ref: Option<ImageListRef>,
) -> Result<Option<Vec<MediaFileToken>>, ArtcraftRouterError> {
  match image_list_ref {
    None => Ok(None),
    Some(ImageListRef::MediaFileTokens(tokens)) => Ok(Some(tokens)),
    Some(ImageListRef::Urls(_)) => Ok(None),
  }
}

fn plan_quality(quality: Option<CommonQuality>) -> ArtcraftGptImage2Quality {
  match quality {
    Some(CommonQuality::Low) => ArtcraftGptImage2Quality::Low,
    Some(CommonQuality::Medium) => ArtcraftGptImage2Quality::Medium,
    Some(CommonQuality::High) => ArtcraftGptImage2Quality::High,
    None => ArtcraftGptImage2Quality::High,
  }
}

fn plan_image_size(aspect_ratio: Option<CommonAspectRatio>) -> Option<ArtcraftGptImage2ImageSize> {
  use ArtcraftGptImage2ImageSize as S;
  match aspect_ratio {
    None
    | Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto3k)
    | Some(CommonAspectRatio::Auto4k) => Some(S::Auto),

    Some(CommonAspectRatio::Square) => Some(S::Square),
    Some(CommonAspectRatio::SquareHd) => Some(S::SquareHd),

    Some(CommonAspectRatio::WideFourByThree)
    | Some(CommonAspectRatio::WideFiveByFour) => Some(S::Landscape4x3),

    Some(CommonAspectRatio::WideThreeByTwo)
    | Some(CommonAspectRatio::WideSixteenByNine)
    | Some(CommonAspectRatio::WideTwentyOneByNine)
    | Some(CommonAspectRatio::Wide) => Some(S::Landscape16x9),

    Some(CommonAspectRatio::TallThreeByFour)
    | Some(CommonAspectRatio::TallFourByFive) => Some(S::Portrait4x3),

    Some(CommonAspectRatio::TallTwoByThree)
    | Some(CommonAspectRatio::TallNineBySixteen)
    | Some(CommonAspectRatio::TallNineByTwentyOne)
    | Some(CommonAspectRatio::Tall) => Some(S::Portrait16x9),
  }
}

fn plan_num_images(
  image_batch_count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<ArtcraftGptImage2NumImages, ArtcraftRouterError> {
  let count = image_batch_count.unwrap_or(1);
  match count {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    1 => Ok(ArtcraftGptImage2NumImages::One),
    2 => Ok(ArtcraftGptImage2NumImages::Two),
    3 => Ok(ArtcraftGptImage2NumImages::Three),
    4 => Ok(ArtcraftGptImage2NumImages::Four),
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "image_batch_count",
          value: format!("{}", count),
        }))
      }
      _ => Ok(ArtcraftGptImage2NumImages::Four),
    },
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::api::common_image_model::CommonImageModel;
  use crate::api::provider::Provider;

  // ── Mode detection ──

  mod mode_detection {
    use super::*;

    #[test]
    fn no_image_inputs_yields_none() {
      let plan = build_plan(&GenerateImageRequest { image_inputs: None, ..base_request() });
      assert!(plan.image_inputs.is_none());
    }

    #[test]
    fn media_token_inputs_are_extracted() {
      let tokens = vec![
        MediaFileToken::new_from_str("mf_test_a"),
        MediaFileToken::new_from_str("mf_test_b"),
      ];
      let plan = build_plan(&GenerateImageRequest {
        image_inputs: Some(ImageListRef::MediaFileTokens(tokens.clone())),
        ..base_request()
      });
      assert!(plan.image_inputs.is_some());
      assert_eq!(plan.image_inputs.unwrap().len(), 2);
    }

    #[test]
    fn url_inputs_are_accepted_for_cost_path() {
      let urls = vec!["https://example.com/a.jpg".to_string()];
      let plan = build_plan(&GenerateImageRequest {
        image_inputs: Some(ImageListRef::Urls(urls)),
        ..base_request()
      });
      assert!(plan.image_inputs.is_none());
    }
  }

  // ── Quality ──

  mod quality_tests {
    use super::*;

    #[test]
    fn defaults_to_high() {
      let plan = build_plan(&base_request());
      assert!(matches!(plan.quality, ArtcraftGptImage2Quality::High));
    }

    #[test]
    fn low() {
      let plan = build_plan(&GenerateImageRequest { quality: Some(CommonQuality::Low), ..base_request() });
      assert!(matches!(plan.quality, ArtcraftGptImage2Quality::Low));
    }

    #[test]
    fn medium() {
      let plan = build_plan(&GenerateImageRequest { quality: Some(CommonQuality::Medium), ..base_request() });
      assert!(matches!(plan.quality, ArtcraftGptImage2Quality::Medium));
    }

    #[test]
    fn high() {
      let plan = build_plan(&GenerateImageRequest { quality: Some(CommonQuality::High), ..base_request() });
      assert!(matches!(plan.quality, ArtcraftGptImage2Quality::High));
    }
  }

  // ── Image size mapping ──

  mod image_size_tests {
    use super::*;

    #[test]
    fn none_yields_auto() {
      let plan = build_plan(&GenerateImageRequest { aspect_ratio: None, ..base_request() });
      assert!(matches!(plan.image_size, Some(ArtcraftGptImage2ImageSize::Auto)));
    }

    #[test]
    fn auto_variants_yield_auto() {
      for ar in [CommonAspectRatio::Auto, CommonAspectRatio::Auto2k, CommonAspectRatio::Auto4k] {
        let plan = build_plan(&GenerateImageRequest { aspect_ratio: Some(ar), ..base_request() });
        assert!(matches!(plan.image_size, Some(ArtcraftGptImage2ImageSize::Auto)), "expected Auto for {:?}", ar);
      }
    }

    #[test]
    fn square() {
      let plan = build_plan(&GenerateImageRequest { aspect_ratio: Some(CommonAspectRatio::Square), ..base_request() });
      assert!(matches!(plan.image_size, Some(ArtcraftGptImage2ImageSize::Square)));
    }

    #[test]
    fn square_hd() {
      let plan = build_plan(&GenerateImageRequest { aspect_ratio: Some(CommonAspectRatio::SquareHd), ..base_request() });
      assert!(matches!(plan.image_size, Some(ArtcraftGptImage2ImageSize::SquareHd)));
    }

    #[test]
    fn landscape_4x3_variants() {
      for ar in [CommonAspectRatio::WideFourByThree, CommonAspectRatio::WideFiveByFour] {
        let plan = build_plan(&GenerateImageRequest { aspect_ratio: Some(ar), ..base_request() });
        assert!(matches!(plan.image_size, Some(ArtcraftGptImage2ImageSize::Landscape4x3)), "expected Landscape4x3 for {:?}", ar);
      }
    }

    #[test]
    fn landscape_16x9_variants() {
      for ar in [
        CommonAspectRatio::WideThreeByTwo,
        CommonAspectRatio::WideSixteenByNine,
        CommonAspectRatio::WideTwentyOneByNine,
        CommonAspectRatio::Wide,
      ] {
        let plan = build_plan(&GenerateImageRequest { aspect_ratio: Some(ar), ..base_request() });
        assert!(matches!(plan.image_size, Some(ArtcraftGptImage2ImageSize::Landscape16x9)), "expected Landscape16x9 for {:?}", ar);
      }
    }

    #[test]
    fn portrait_4x3_variants() {
      for ar in [CommonAspectRatio::TallThreeByFour, CommonAspectRatio::TallFourByFive] {
        let plan = build_plan(&GenerateImageRequest { aspect_ratio: Some(ar), ..base_request() });
        assert!(matches!(plan.image_size, Some(ArtcraftGptImage2ImageSize::Portrait4x3)), "expected Portrait4x3 for {:?}", ar);
      }
    }

    #[test]
    fn portrait_16x9_variants() {
      for ar in [
        CommonAspectRatio::TallTwoByThree,
        CommonAspectRatio::TallNineBySixteen,
        CommonAspectRatio::TallNineByTwentyOne,
        CommonAspectRatio::Tall,
      ] {
        let plan = build_plan(&GenerateImageRequest { aspect_ratio: Some(ar), ..base_request() });
        assert!(matches!(plan.image_size, Some(ArtcraftGptImage2ImageSize::Portrait16x9)), "expected Portrait16x9 for {:?}", ar);
      }
    }
  }

  // ── Num images ──

  mod num_images_tests {
    use super::*;

    #[test]
    fn default_is_one() {
      let plan = build_plan(&GenerateImageRequest { image_batch_count: None, ..base_request() });
      assert!(matches!(plan.num_images, ArtcraftGptImage2NumImages::One));
    }

    #[test]
    fn direct_mapping() {
      for (count, expected) in [(1, 1), (2, 2), (3, 3), (4, 4)] {
        let plan = build_plan(&GenerateImageRequest { image_batch_count: Some(count), ..base_request() });
        assert_eq!(plan.num_images.as_u64(), expected);
      }
    }

    #[test]
    fn zero_is_always_error() {
      for strategy in [
        RequestMismatchMitigationStrategy::ErrorOut,
        RequestMismatchMitigationStrategy::PayMoreUpgrade,
        RequestMismatchMitigationStrategy::PayLessDowngrade,
      ] {
        let result = plan_generate_image_artcraft_gpt_image_2(&GenerateImageRequest {
          image_batch_count: Some(0),
          request_mismatch_mitigation_strategy: strategy,
          ..base_request()
        });
        assert!(matches!(result, Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations))));
      }
    }

    #[test]
    fn out_of_range_error_out() {
      let result = plan_generate_image_artcraft_gpt_image_2(&GenerateImageRequest {
        image_batch_count: Some(5),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..base_request()
      });
      assert!(matches!(result, Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption { .. }))));
    }

    #[test]
    fn out_of_range_clamps_to_four() {
      for strategy in [
        RequestMismatchMitigationStrategy::PayMoreUpgrade,
        RequestMismatchMitigationStrategy::PayLessDowngrade,
      ] {
        let plan = build_plan(&GenerateImageRequest {
          image_batch_count: Some(9),
          request_mismatch_mitigation_strategy: strategy,
          ..base_request()
        });
        assert!(matches!(plan.num_images, ArtcraftGptImage2NumImages::Four));
      }
    }
  }

  // ── as_u64 ──

  #[test]
  fn num_images_as_u64() {
    assert_eq!(ArtcraftGptImage2NumImages::One.as_u64(), 1);
    assert_eq!(ArtcraftGptImage2NumImages::Two.as_u64(), 2);
    assert_eq!(ArtcraftGptImage2NumImages::Three.as_u64(), 3);
    assert_eq!(ArtcraftGptImage2NumImages::Four.as_u64(), 4);
  }

  // ── Helpers ──

  fn base_request() -> GenerateImageRequest {
    GenerateImageRequest {
      model: CommonImageModel::GptImage2,
      provider: Provider::Artcraft,
      prompt: Some("a cat in space".to_string()),
      image_inputs: None,
      resolution: None,
      aspect_ratio: None,
      quality: None,
      image_batch_count: None,
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      generation_mode_mismatch_strategy: None,
      idempotency_token: None,
      horizontal_angle: None,
      vertical_angle: None,
      zoom: None,
    }
  }

  fn build_plan(request: &GenerateImageRequest) -> PlanArtcraftGptImage2 {
    let ImageGenerationPlan::ArtcraftGptImage2(plan) =
      plan_generate_image_artcraft_gpt_image_2(request).expect("plan should succeed")
    else {
      panic!("expected ArtcraftGptImage2 variant")
    };
    plan
  }
}
