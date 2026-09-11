use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_image_cost_and_generate_request::OmniGenImageCostAndGenerateRequest;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio as CommonAspectRatioEnum;
use enums::common::generation::common_image_model::CommonImageModel as CommonImageModelEnum;
use enums::common::generation::common_quality::CommonQuality as CommonQualityEnum;
use enums::common::generation::common_resolution::CommonResolution as CommonResolutionEnum;
use tokens::tokens::media_files::MediaFileToken;

use crate::api::router_aspect_ratio::RouterAspectRatio;
use crate::api::router_quality::RouterQuality;
use crate::api::router_resolution::RouterResolution;
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
/// (1..=[`max_batch_count`]) and image_inputs shape — lives here.
pub fn build_artcraft_omni_image_request(
  builder: GenerateImageRequestBuilder,
  model: CommonImageModelEnum,
) -> Result<OmniGenImageCostAndGenerateRequest, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  let image_batch_count =
    plan_batch_count_with_max(builder.image_batch_count, strategy, max_batch_count(model))?;
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

/// The largest batch each Artcraft image model accepts. Seedream 5.0 Pro and
/// Ultra accept batches of up to 8; every other model caps at 4.
pub fn max_batch_count(model: CommonImageModelEnum) -> u16 {
  match model {
    CommonImageModelEnum::Seedream5p0Pro | CommonImageModelEnum::Seedream5p0ProUltra => 8,
    _ => 4,
  }
}

/// Validate batch count (1..=4). Mirrors the v1 plan-level validation that
/// every Artcraft image model performs.
pub fn plan_batch_count(
  image_batch_count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<u16, ArtcraftRouterError> {
  plan_batch_count_with_max(image_batch_count, strategy, 4)
}

/// Validate batch count (1..=`max`), clamping or erroring per the mitigation
/// strategy when the request exceeds the model's cap.
pub fn plan_batch_count_with_max(
  image_batch_count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
  max: u16,
) -> Result<u16, ArtcraftRouterError> {
  let count = image_batch_count.unwrap_or(1);
  if count == 0 {
    return Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations));
  }
  if count <= max {
    return Ok(count);
  }
  match strategy {
    RequestMismatchMitigationStrategy::ErrorOut => {
      Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
        field: "image_batch_count",
        value: format!("{}", count),
      }))
    }
    RequestMismatchMitigationStrategy::PayMoreUpgrade
    | RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(max),
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

fn to_aspect_ratio_enum(ar: RouterAspectRatio) -> CommonAspectRatioEnum {
  match ar {
    RouterAspectRatio::Auto => CommonAspectRatioEnum::Auto,
    RouterAspectRatio::Auto2k => CommonAspectRatioEnum::Auto2k,
    RouterAspectRatio::Auto3k => CommonAspectRatioEnum::Auto3k,
    RouterAspectRatio::Auto4k => CommonAspectRatioEnum::Auto4k,
    RouterAspectRatio::Square => CommonAspectRatioEnum::Square,
    RouterAspectRatio::SquareHd => CommonAspectRatioEnum::SquareHd,
    RouterAspectRatio::WideFourByThree => CommonAspectRatioEnum::WideFourByThree,
    RouterAspectRatio::WideFiveByFour => CommonAspectRatioEnum::WideFiveByFour,
    RouterAspectRatio::WideThreeByTwo => CommonAspectRatioEnum::WideThreeByTwo,
    RouterAspectRatio::WideSixteenByNine => CommonAspectRatioEnum::WideSixteenByNine,
    RouterAspectRatio::WideTwentyOneByNine => CommonAspectRatioEnum::WideTwentyOneByNine,
    RouterAspectRatio::Wide => CommonAspectRatioEnum::Wide,
    RouterAspectRatio::TallThreeByFour => CommonAspectRatioEnum::TallThreeByFour,
    RouterAspectRatio::TallFourByFive => CommonAspectRatioEnum::TallFourByFive,
    RouterAspectRatio::TallTwoByThree => CommonAspectRatioEnum::TallTwoByThree,
    RouterAspectRatio::TallNineBySixteen => CommonAspectRatioEnum::TallNineBySixteen,
    RouterAspectRatio::TallNineByTwentyOne => CommonAspectRatioEnum::TallNineByTwentyOne,
    RouterAspectRatio::Tall => CommonAspectRatioEnum::Tall,
  }
}

fn to_resolution_enum(r: RouterResolution) -> CommonResolutionEnum {
  match r {
    RouterResolution::HalfK => CommonResolutionEnum::HalfK,
    RouterResolution::OneK => CommonResolutionEnum::OneK,
    RouterResolution::TwoK => CommonResolutionEnum::TwoK,
    RouterResolution::ThreeK => CommonResolutionEnum::ThreeK,
    RouterResolution::FourK => CommonResolutionEnum::FourK,
    RouterResolution::FourEightyP => CommonResolutionEnum::FourEightyP,
    RouterResolution::SevenTwentyP => CommonResolutionEnum::SevenTwentyP,
    RouterResolution::TenEightyP => CommonResolutionEnum::TenEightyP,
  }
}

fn to_quality_enum(q: RouterQuality) -> CommonQualityEnum {
  match q {
    RouterQuality::Low => CommonQualityEnum::Low,
    RouterQuality::Medium => CommonQualityEnum::Medium,
    RouterQuality::High => CommonQualityEnum::High,
  }
}
