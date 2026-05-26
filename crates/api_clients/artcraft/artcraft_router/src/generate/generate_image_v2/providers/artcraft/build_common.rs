use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_image_cost_and_generate_request::OmniGenImageCostAndGenerateRequest;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio as CommonAspectRatioEnum;
use enums::common::generation::common_image_model::CommonImageModel as CommonImageModelEnum;
use enums::common::generation::common_quality::CommonQuality as CommonQualityEnum;
use enums::common::generation::common_resolution::CommonResolution as CommonResolutionEnum;
use tokens::tokens::media_files::MediaFileToken;

use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_quality::CommonQuality;
use crate::api::common_resolution::CommonResolution;
use crate::api::image_list_ref::ImageListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;

/// Build an `OmniGenImageCostAndGenerateRequest` from the builder. All Artcraft
/// image models delegate to this helper — the omni-gen endpoint handles all
/// model-specific transformations server-side, so the client request stays
/// extremely lightweight.
///
/// Per-model build functions are expected to validate model-specific
/// constraints (e.g. unsupported aspect ratios) BEFORE calling this helper.
/// Validation that's identical across every Artcraft image model — batch count
/// (1..=4) and image_inputs shape — lives here.
pub fn build_artcraft_omni_image_request(
  builder: GenerateImageRequestBuilder,
  model: CommonImageModelEnum,
) -> Result<OmniGenImageCostAndGenerateRequest, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  let image_batch_count = plan_batch_count(builder.image_batch_count, strategy)?;
  let image_media_tokens = resolve_image_list_ref(builder.image_inputs.clone())?;

  let aspect_ratio = builder.aspect_ratio.map(to_aspect_ratio_enum);
  let resolution = builder.resolution.map(to_resolution_enum);
  let quality = builder.quality.map(to_quality_enum);
  let idempotency_token = builder.get_or_generate_idempotency_token();

  Ok(OmniGenImageCostAndGenerateRequest {
    idempotency_token: Some(idempotency_token),
    model: Some(model),
    prompt: builder.prompt.clone(),
    image_media_tokens,
    resolution,
    aspect_ratio,
    quality,
    image_batch_count: Some(image_batch_count),
    adjust_horizontal_angle: builder.horizontal_angle,
    adjust_vertical_angle: builder.vertical_angle,
    adjust_zoom: builder.zoom,
  })
}

/// Validate batch count (1..=4). Mirrors the v1 plan-level validation that
/// every Artcraft image model performs.
pub fn plan_batch_count(
  image_batch_count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<u16, ArtcraftRouterError> {
  let count = image_batch_count.unwrap_or(1);
  match count {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    1..=4 => Ok(count),
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "image_batch_count",
          value: format!("{}", count),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade
      | RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(4),
    },
  }
}

/// Resolve `image_inputs` to a `Vec<MediaFileToken>` for the omni-gen request.
///
/// Mirrors v1's behavior: URLs are accepted and dropped, because the omni-gen
/// distillation hydrates media tokens to URLs before the cost path runs.
/// Cost only depends on `num_images` + mode (derived from `image_inputs`
/// presence by callers), so URL-form inputs flow through cleanly.
pub fn resolve_image_list_ref(
  image_list_ref: Option<ImageListRef>,
) -> Result<Option<Vec<MediaFileToken>>, ArtcraftRouterError> {
  match image_list_ref {
    None => Ok(None),
    Some(ImageListRef::MediaFileTokens(tokens)) => Ok(Some(tokens)),
    Some(ImageListRef::Urls(_)) => Ok(None),
  }
}

fn to_aspect_ratio_enum(ar: CommonAspectRatio) -> CommonAspectRatioEnum {
  match ar {
    CommonAspectRatio::Auto => CommonAspectRatioEnum::Auto,
    CommonAspectRatio::Auto2k => CommonAspectRatioEnum::Auto2k,
    CommonAspectRatio::Auto3k => CommonAspectRatioEnum::Auto3k,
    CommonAspectRatio::Auto4k => CommonAspectRatioEnum::Auto4k,
    CommonAspectRatio::Square => CommonAspectRatioEnum::Square,
    CommonAspectRatio::SquareHd => CommonAspectRatioEnum::SquareHd,
    CommonAspectRatio::WideFourByThree => CommonAspectRatioEnum::WideFourByThree,
    CommonAspectRatio::WideFiveByFour => CommonAspectRatioEnum::WideFiveByFour,
    CommonAspectRatio::WideThreeByTwo => CommonAspectRatioEnum::WideThreeByTwo,
    CommonAspectRatio::WideSixteenByNine => CommonAspectRatioEnum::WideSixteenByNine,
    CommonAspectRatio::WideTwentyOneByNine => CommonAspectRatioEnum::WideTwentyOneByNine,
    CommonAspectRatio::Wide => CommonAspectRatioEnum::Wide,
    CommonAspectRatio::TallThreeByFour => CommonAspectRatioEnum::TallThreeByFour,
    CommonAspectRatio::TallFourByFive => CommonAspectRatioEnum::TallFourByFive,
    CommonAspectRatio::TallTwoByThree => CommonAspectRatioEnum::TallTwoByThree,
    CommonAspectRatio::TallNineBySixteen => CommonAspectRatioEnum::TallNineBySixteen,
    CommonAspectRatio::TallNineByTwentyOne => CommonAspectRatioEnum::TallNineByTwentyOne,
    CommonAspectRatio::Tall => CommonAspectRatioEnum::Tall,
  }
}

fn to_resolution_enum(r: CommonResolution) -> CommonResolutionEnum {
  match r {
    CommonResolution::HalfK => CommonResolutionEnum::HalfK,
    CommonResolution::OneK => CommonResolutionEnum::OneK,
    CommonResolution::TwoK => CommonResolutionEnum::TwoK,
    CommonResolution::ThreeK => CommonResolutionEnum::ThreeK,
    CommonResolution::FourK => CommonResolutionEnum::FourK,
    CommonResolution::FourEightyP => CommonResolutionEnum::FourEightyP,
    CommonResolution::SevenTwentyP => CommonResolutionEnum::SevenTwentyP,
    CommonResolution::TenEightyP => CommonResolutionEnum::TenEightyP,
  }
}

fn to_quality_enum(q: CommonQuality) -> CommonQualityEnum {
  match q {
    CommonQuality::Low => CommonQualityEnum::Low,
    CommonQuality::Medium => CommonQualityEnum::Medium,
    CommonQuality::High => CommonQualityEnum::High,
  }
}
