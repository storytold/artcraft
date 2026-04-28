use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_quality::CommonQuality;
use crate::api::image_list_ref::ImageListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_image::generate_image_request::GenerateImageRequest;
use crate::generate::generate_image::image_generation_plan::ImageGenerationPlan;
use fal_client::requests::webhook::image::edit::enqueue_gpt_image_2_edit_image_webhook::{
  EnqueueGptImage2EditImageNumImages, EnqueueGptImage2EditImageQuality,
  EnqueueGptImage2EditImageSize,
};
use fal_client::requests::webhook::image::text::enqueue_gpt_image_2_text_to_image_webhook::{
  EnqueueGptImage2TextToImageNumImages, EnqueueGptImage2TextToImageQuality,
  EnqueueGptImage2TextToImageSize,
};

#[derive(Debug, Clone, Copy)]
pub enum FalGptImage2NumImages {
  One,
  Two,
  Three,
  Four,
}

/// Quality is shared between t2i and edit (Low / Medium / High).
#[derive(Debug, Clone, Copy)]
pub enum FalGptImage2Quality {
  Low,
  Medium,
  High,
}

/// GPT Image 2 supports six image sizes.
#[derive(Debug, Clone, Copy)]
pub enum FalGptImage2ImageSize {
  SquareHd,
  Square,
  Portrait4x3,
  Portrait16x9,
  Landscape4x3,
  Landscape16x9,
  Auto,
}

#[derive(Debug, Clone)]
pub struct PlanFalGptImage2 {
  pub prompt: Option<String>,
  pub image_urls: Vec<String>,
  pub image_size: Option<FalGptImage2ImageSize>,
  pub quality: FalGptImage2Quality,
  pub num_images: FalGptImage2NumImages,
}

pub fn plan_generate_image_fal_gpt_image_2(
  request: &GenerateImageRequest,
) -> Result<ImageGenerationPlan, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;
  let image_urls = resolve_image_list_ref(request.image_inputs.clone())?;
  let image_size = plan_image_size(request.aspect_ratio);
  let quality = plan_quality(request.quality);
  let num_images = plan_num_images(request.image_batch_count, strategy)?;

  Ok(ImageGenerationPlan::FalGptImage2(PlanFalGptImage2 {
    prompt: request.prompt.clone(),
    image_urls,
    image_size,
    quality,
    num_images,
  }))
}

fn resolve_image_list_ref(
  image_list_ref: Option<ImageListRef>,
) -> Result<Vec<String>, ArtcraftRouterError> {
  match image_list_ref {
    None => Ok(vec![]),
    Some(ImageListRef::Urls(urls)) => Ok(urls.clone()),
    Some(ImageListRef::MediaFileTokens(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
    }
  }
}

fn plan_quality(quality: Option<CommonQuality>) -> FalGptImage2Quality {
  match quality {
    Some(CommonQuality::Low) => FalGptImage2Quality::Low,
    Some(CommonQuality::Medium) => FalGptImage2Quality::Medium,
    Some(CommonQuality::High) => FalGptImage2Quality::High,
    None => FalGptImage2Quality::High,
  }
}

fn plan_image_size(aspect_ratio: Option<CommonAspectRatio>) -> Option<FalGptImage2ImageSize> {
  use FalGptImage2ImageSize as S;
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
) -> Result<FalGptImage2NumImages, ArtcraftRouterError> {
  let count = image_batch_count.unwrap_or(1);
  match count {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    1 => Ok(FalGptImage2NumImages::One),
    2 => Ok(FalGptImage2NumImages::Two),
    3 => Ok(FalGptImage2NumImages::Three),
    4 => Ok(FalGptImage2NumImages::Four),
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "image_batch_count",
          value: format!("{}", count),
        }))
      }
      _ => Ok(FalGptImage2NumImages::Four),
    },
  }
}

impl FalGptImage2NumImages {
  pub fn to_t2i(self) -> EnqueueGptImage2TextToImageNumImages {
    use EnqueueGptImage2TextToImageNumImages as T;
    match self {
      Self::One => T::One,
      Self::Two => T::Two,
      Self::Three => T::Three,
      Self::Four => T::Four,
    }
  }

  pub fn to_edit(self) -> EnqueueGptImage2EditImageNumImages {
    use EnqueueGptImage2EditImageNumImages as E;
    match self {
      Self::One => E::One,
      Self::Two => E::Two,
      Self::Three => E::Three,
      Self::Four => E::Four,
    }
  }

  pub fn as_u64(self) -> u64 {
    match self {
      Self::One => 1,
      Self::Two => 2,
      Self::Three => 3,
      Self::Four => 4,
    }
  }
}

impl FalGptImage2Quality {
  pub fn to_t2i(self) -> EnqueueGptImage2TextToImageQuality {
    use EnqueueGptImage2TextToImageQuality as T;
    match self {
      Self::Low => T::Low,
      Self::Medium => T::Medium,
      Self::High => T::High,
    }
  }

  pub fn to_edit(self) -> EnqueueGptImage2EditImageQuality {
    use EnqueueGptImage2EditImageQuality as E;
    match self {
      Self::Low => E::Low,
      Self::Medium => E::Medium,
      Self::High => E::High,
    }
  }
}

impl FalGptImage2ImageSize {
  pub fn to_t2i(self) -> EnqueueGptImage2TextToImageSize {
    use EnqueueGptImage2TextToImageSize as T;
    match self {
      Self::SquareHd => T::SquareHd,
      Self::Square => T::Square,
      Self::Portrait4x3 => T::Portrait4x3,
      Self::Portrait16x9 => T::Portrait16x9,
      Self::Landscape4x3 => T::Landscape4x3,
      Self::Landscape16x9 => T::Landscape16x9,
      Self::Auto => T::SquareHd,
    }
  }

  pub fn to_edit(self) -> EnqueueGptImage2EditImageSize {
    use EnqueueGptImage2EditImageSize as E;
    match self {
      Self::SquareHd => E::SquareHd,
      Self::Square => E::Square,
      Self::Portrait4x3 => E::Portrait4x3,
      Self::Portrait16x9 => E::Portrait16x9,
      Self::Landscape4x3 => E::Landscape4x3,
      Self::Landscape16x9 => E::Landscape16x9,
      Self::Auto => E::Auto,
    }
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
    fn no_image_inputs_yields_empty_urls() {
      let plan = build_plan(&GenerateImageRequest { image_inputs: None, ..base_request() });
      assert!(plan.image_urls.is_empty());
    }

    #[test]
    fn url_image_inputs_are_extracted() {
      let urls = vec![
        "https://example.com/a.jpg".to_string(),
        "https://example.com/b.jpg".to_string(),
      ];
      let plan = build_plan(&GenerateImageRequest {
        image_inputs: Some(ImageListRef::Urls(urls.clone())),
        ..base_request()
      });
      assert_eq!(plan.image_urls, urls);
    }

    #[test]
    fn media_token_inputs_return_error() {
      let result = plan_generate_image_fal_gpt_image_2(&GenerateImageRequest {
        image_inputs: Some(ImageListRef::MediaFileTokens(vec![])),
        ..base_request()
      });
      assert!(matches!(result, Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))));
    }
  }

  // ── Quality ──

  mod quality_tests {
    use super::*;

    #[test]
    fn defaults_to_high() {
      let plan = build_plan(&base_request());
      assert!(matches!(plan.quality, FalGptImage2Quality::High));
    }

    #[test]
    fn low() {
      let plan = build_plan(&GenerateImageRequest { quality: Some(CommonQuality::Low), ..base_request() });
      assert!(matches!(plan.quality, FalGptImage2Quality::Low));
    }

    #[test]
    fn medium() {
      let plan = build_plan(&GenerateImageRequest { quality: Some(CommonQuality::Medium), ..base_request() });
      assert!(matches!(plan.quality, FalGptImage2Quality::Medium));
    }

    #[test]
    fn high() {
      let plan = build_plan(&GenerateImageRequest { quality: Some(CommonQuality::High), ..base_request() });
      assert!(matches!(plan.quality, FalGptImage2Quality::High));
    }
  }

  // ── Image size mapping ──

  mod image_size_tests {
    use super::*;

    #[test]
    fn none_yields_auto() {
      let plan = build_plan(&GenerateImageRequest { aspect_ratio: None, ..base_request() });
      assert!(matches!(plan.image_size, Some(FalGptImage2ImageSize::Auto)));
    }

    #[test]
    fn auto_variants_yield_auto() {
      for ar in [CommonAspectRatio::Auto, CommonAspectRatio::Auto2k, CommonAspectRatio::Auto4k] {
        let plan = build_plan(&GenerateImageRequest { aspect_ratio: Some(ar), ..base_request() });
        assert!(matches!(plan.image_size, Some(FalGptImage2ImageSize::Auto)), "expected Auto for {:?}", ar);
      }
    }

    #[test]
    fn square() {
      let plan = build_plan(&GenerateImageRequest { aspect_ratio: Some(CommonAspectRatio::Square), ..base_request() });
      assert!(matches!(plan.image_size, Some(FalGptImage2ImageSize::Square)));
    }

    #[test]
    fn square_hd() {
      let plan = build_plan(&GenerateImageRequest { aspect_ratio: Some(CommonAspectRatio::SquareHd), ..base_request() });
      assert!(matches!(plan.image_size, Some(FalGptImage2ImageSize::SquareHd)));
    }

    #[test]
    fn landscape_4x3_variants() {
      for ar in [CommonAspectRatio::WideFourByThree, CommonAspectRatio::WideFiveByFour] {
        let plan = build_plan(&GenerateImageRequest { aspect_ratio: Some(ar), ..base_request() });
        assert!(matches!(plan.image_size, Some(FalGptImage2ImageSize::Landscape4x3)), "expected Landscape4x3 for {:?}", ar);
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
        assert!(matches!(plan.image_size, Some(FalGptImage2ImageSize::Landscape16x9)), "expected Landscape16x9 for {:?}", ar);
      }
    }

    #[test]
    fn portrait_4x3_variants() {
      for ar in [CommonAspectRatio::TallThreeByFour, CommonAspectRatio::TallFourByFive] {
        let plan = build_plan(&GenerateImageRequest { aspect_ratio: Some(ar), ..base_request() });
        assert!(matches!(plan.image_size, Some(FalGptImage2ImageSize::Portrait4x3)), "expected Portrait4x3 for {:?}", ar);
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
        assert!(matches!(plan.image_size, Some(FalGptImage2ImageSize::Portrait16x9)), "expected Portrait16x9 for {:?}", ar);
      }
    }
  }

  // ── Num images ──

  mod num_images_tests {
    use super::*;

    #[test]
    fn default_is_one() {
      let plan = build_plan(&GenerateImageRequest { image_batch_count: None, ..base_request() });
      assert!(matches!(plan.num_images, FalGptImage2NumImages::One));
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
        let result = plan_generate_image_fal_gpt_image_2(&GenerateImageRequest {
          image_batch_count: Some(0),
          request_mismatch_mitigation_strategy: strategy,
          ..base_request()
        });
        assert!(matches!(result, Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations))));
      }
    }

    #[test]
    fn out_of_range_error_out() {
      let result = plan_generate_image_fal_gpt_image_2(&GenerateImageRequest {
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
        assert!(matches!(plan.num_images, FalGptImage2NumImages::Four));
      }
    }
  }

  // ── as_u64 ──

  #[test]
  fn num_images_as_u64() {
    assert_eq!(FalGptImage2NumImages::One.as_u64(), 1);
    assert_eq!(FalGptImage2NumImages::Two.as_u64(), 2);
    assert_eq!(FalGptImage2NumImages::Three.as_u64(), 3);
    assert_eq!(FalGptImage2NumImages::Four.as_u64(), 4);
  }

  // ── Conversions to fal-client enqueue enums ──

  mod conversion_tests {
    use super::*;

    #[test]
    fn num_images_to_t2i() {
      use EnqueueGptImage2TextToImageNumImages as T;
      assert!(matches!(FalGptImage2NumImages::One.to_t2i(), T::One));
      assert!(matches!(FalGptImage2NumImages::Two.to_t2i(), T::Two));
      assert!(matches!(FalGptImage2NumImages::Three.to_t2i(), T::Three));
      assert!(matches!(FalGptImage2NumImages::Four.to_t2i(), T::Four));
    }

    #[test]
    fn num_images_to_edit() {
      use EnqueueGptImage2EditImageNumImages as E;
      assert!(matches!(FalGptImage2NumImages::One.to_edit(), E::One));
      assert!(matches!(FalGptImage2NumImages::Two.to_edit(), E::Two));
      assert!(matches!(FalGptImage2NumImages::Three.to_edit(), E::Three));
      assert!(matches!(FalGptImage2NumImages::Four.to_edit(), E::Four));
    }

    #[test]
    fn quality_to_t2i() {
      use EnqueueGptImage2TextToImageQuality as T;
      assert!(matches!(FalGptImage2Quality::Low.to_t2i(), T::Low));
      assert!(matches!(FalGptImage2Quality::Medium.to_t2i(), T::Medium));
      assert!(matches!(FalGptImage2Quality::High.to_t2i(), T::High));
    }

    #[test]
    fn quality_to_edit() {
      use EnqueueGptImage2EditImageQuality as E;
      assert!(matches!(FalGptImage2Quality::Low.to_edit(), E::Low));
      assert!(matches!(FalGptImage2Quality::Medium.to_edit(), E::Medium));
      assert!(matches!(FalGptImage2Quality::High.to_edit(), E::High));
    }

    #[test]
    fn size_to_t2i() {
      use EnqueueGptImage2TextToImageSize as T;
      assert!(matches!(FalGptImage2ImageSize::SquareHd.to_t2i(), T::SquareHd));
      assert!(matches!(FalGptImage2ImageSize::Square.to_t2i(), T::Square));
      assert!(matches!(FalGptImage2ImageSize::Portrait4x3.to_t2i(), T::Portrait4x3));
      assert!(matches!(FalGptImage2ImageSize::Portrait16x9.to_t2i(), T::Portrait16x9));
      assert!(matches!(FalGptImage2ImageSize::Landscape4x3.to_t2i(), T::Landscape4x3));
      assert!(matches!(FalGptImage2ImageSize::Landscape16x9.to_t2i(), T::Landscape16x9));
      // Auto falls back to SquareHd for t2i (which doesn't have an Auto variant)
      assert!(matches!(FalGptImage2ImageSize::Auto.to_t2i(), T::SquareHd));
    }

    #[test]
    fn size_to_edit() {
      use EnqueueGptImage2EditImageSize as E;
      assert!(matches!(FalGptImage2ImageSize::SquareHd.to_edit(), E::SquareHd));
      assert!(matches!(FalGptImage2ImageSize::Square.to_edit(), E::Square));
      assert!(matches!(FalGptImage2ImageSize::Portrait4x3.to_edit(), E::Portrait4x3));
      assert!(matches!(FalGptImage2ImageSize::Portrait16x9.to_edit(), E::Portrait16x9));
      assert!(matches!(FalGptImage2ImageSize::Landscape4x3.to_edit(), E::Landscape4x3));
      assert!(matches!(FalGptImage2ImageSize::Landscape16x9.to_edit(), E::Landscape16x9));
      assert!(matches!(FalGptImage2ImageSize::Auto.to_edit(), E::Auto));
    }
  }

  // ── Helpers ──

  fn base_request() -> GenerateImageRequest {
    GenerateImageRequest {
      model: CommonImageModel::GptImage2,
      provider: Provider::Fal,
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

  fn build_plan(request: &GenerateImageRequest) -> PlanFalGptImage2 {
    let ImageGenerationPlan::FalGptImage2(plan) =
      plan_generate_image_fal_gpt_image_2(request).expect("plan should succeed")
    else {
      panic!("expected FalGptImage2 variant")
    };
    plan
  }
}
