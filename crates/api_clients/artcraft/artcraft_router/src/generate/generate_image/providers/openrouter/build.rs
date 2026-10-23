use openrouter_client::api::generate_image::{OpenRouterAspectRatio, OpenRouterImageRequest, OpenRouterInputReference, OpenRouterQuality, OpenRouterResolution};

use crate::api::image_list_ref::ImageListRef;
use crate::api::router_aspect_ratio::RouterAspectRatio;
use crate::api::router_quality::RouterQuality;
use crate::api::router_resolution::RouterResolution;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
use crate::generate::generate_image::image_generation_draft_or_request::ImageGenerationDraftOrRequest;
use crate::generate::generate_image::image_generation_request::ImageGenerationRequest;
use crate::generate::generate_image::providers::openrouter::models::{OpenRouterImageModel, openrouter_image_model};
use crate::generate::generate_image::providers::openrouter::request::OpenRouterImageRequestState;

/// OpenRouter's limit on `n`, and so the most images one generation can ask for.
const MAX_IMAGES: u16 = 10;

/// Resolution tiers, smallest first, for rounding to the nearest one a model has.
const RESOLUTION_ORDER: [OpenRouterResolution; 4] = [OpenRouterResolution::HalfK, OpenRouterResolution::OneK, OpenRouterResolution::TwoK, OpenRouterResolution::FourK];

/// Quality tiers, lowest first, for falling back to the best one a model has.
const QUALITY_ORDER: [OpenRouterQuality; 5] = [OpenRouterQuality::Low, OpenRouterQuality::Medium, OpenRouterQuality::High, OpenRouterQuality::XHigh, OpenRouterQuality::Max];

/// Builds the OpenRouter request(s) for any model in `models`. Models that make one image per
/// request get one request per image, so batch counts work everywhere.
pub fn build_openrouter(builder: GenerateImageRequestBuilder) -> Result<ImageGenerationDraftOrRequest, ArtcraftRouterError> {
  let spec = openrouter_image_model(builder.model).ok_or_else(|| ArtcraftRouterError::UnsupportedProviderAndModelForNewApi(
    format!("Image generation for model `{:?}` is not supported for provider OpenRouter", builder.model)
  ))?;
  let count = plan_count(builder.image_batch_count, builder.request_mismatch_mitigation_strategy)?;
  let input_references = plan_references(builder.image_inputs.clone(), spec)?;
  let template = OpenRouterImageRequest {
    model: spec.slug.to_owned(),
    prompt: builder.prompt.clone().unwrap_or_default(),
    n: None,
    resolution: builder.resolution.and_then(|r| plan_resolution(r, spec)),
    aspect_ratio: builder.aspect_ratio.and_then(|a| plan_aspect_ratio(a, spec)),
    quality: builder.quality.and_then(|q| plan_quality(q, spec)),
    input_references,
  };
  let requests = split_count(count, spec.max_images_per_request)
    .into_iter()
    .map(|n| OpenRouterImageRequest { n: Some(n), ..template.clone() })
    .collect();
  Ok(ImageGenerationDraftOrRequest::Request(ImageGenerationRequest::OpenRouter(OpenRouterImageRequestState { requests })))
}

fn plan_count(count: Option<u16>, strategy: RequestMismatchMitigationStrategy) -> Result<u16, ArtcraftRouterError> {
  match count.unwrap_or(1) {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    n if n <= MAX_IMAGES => Ok(n),
    n => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption { field: "image_batch_count", value: n.to_string() })),
      _ => Ok(MAX_IMAGES),
    },
  }
}

/// `count` images as requests of at most `per_request` each.
fn split_count(count: u16, per_request: u8) -> Vec<u8> {
  let per_request = u16::from(per_request.max(1));
  (0..count.div_ceil(per_request))
    .map(|i| (count - i * per_request).min(per_request) as u8)
    .collect()
}

/// References are sent as links; too many is an error rather than silently dropping some.
fn plan_references(image_inputs: Option<ImageListRef>, spec: &OpenRouterImageModel) -> Result<Vec<OpenRouterInputReference>, ArtcraftRouterError> {
  let urls = match image_inputs {
    None => return Ok(Vec::new()),
    Some(ImageListRef::Urls(urls)) => urls,
    Some(ImageListRef::MediaFileTokens(_)) => return Err(ArtcraftRouterError::Client(ClientError::OpenRouterOnlySupportsUrls)),
  };
  if urls.len() > usize::from(spec.max_reference_images) {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption { field: "image_inputs", value: format!("{} images (at most {})", urls.len(), spec.max_reference_images) }));
  }
  Ok(urls.into_iter().map(OpenRouterInputReference::from_url).collect())
}

/// The nearest tier the model has (the larger one on a tie); none if it has no tiers.
fn plan_resolution(resolution: RouterResolution, spec: &OpenRouterImageModel) -> Option<OpenRouterResolution> {
  let wanted = match resolution {
    RouterResolution::HalfK => OpenRouterResolution::HalfK,
    RouterResolution::FourEightyP | RouterResolution::SevenTwentyP | RouterResolution::OneK | RouterResolution::TenEightyP => OpenRouterResolution::OneK,
    RouterResolution::TwoK | RouterResolution::ThreeK => OpenRouterResolution::TwoK,
    RouterResolution::FourK => OpenRouterResolution::FourK,
  };
  let rank = |r: &OpenRouterResolution| RESOLUTION_ORDER.iter().position(|o| o == r).unwrap_or(0) as i32;
  spec.resolutions.iter()
    .min_by_key(|r| ((rank(r) - rank(&wanted)).abs(), -rank(r)))
    .copied()
}

/// The ratio if the model has it, else its nearest one; `auto` is left out when unsupported.
fn plan_aspect_ratio(aspect_ratio: RouterAspectRatio, spec: &OpenRouterImageModel) -> Option<OpenRouterAspectRatio> {
  let wanted = match aspect_ratio {
    RouterAspectRatio::Auto | RouterAspectRatio::Auto2k | RouterAspectRatio::Auto3k | RouterAspectRatio::Auto4k => OpenRouterAspectRatio::Auto,
    RouterAspectRatio::Square | RouterAspectRatio::SquareHd => OpenRouterAspectRatio::OneByOne,
    RouterAspectRatio::WideThreeByTwo | RouterAspectRatio::Wide => OpenRouterAspectRatio::ThreeByTwo,
    RouterAspectRatio::WideFourByThree => OpenRouterAspectRatio::FourByThree,
    RouterAspectRatio::WideFiveByFour => OpenRouterAspectRatio::FiveByFour,
    RouterAspectRatio::WideSixteenByNine => OpenRouterAspectRatio::SixteenByNine,
    RouterAspectRatio::WideTwentyOneByNine => OpenRouterAspectRatio::TwentyOneByNine,
    RouterAspectRatio::TallTwoByThree | RouterAspectRatio::Tall => OpenRouterAspectRatio::TwoByThree,
    RouterAspectRatio::TallThreeByFour => OpenRouterAspectRatio::ThreeByFour,
    RouterAspectRatio::TallFourByFive => OpenRouterAspectRatio::FourByFive,
    RouterAspectRatio::TallNineBySixteen => OpenRouterAspectRatio::NineBySixteen,
    RouterAspectRatio::TallNineByTwentyOne => OpenRouterAspectRatio::NineByTwentyOne,
  };
  if spec.aspect_ratios.contains(&wanted) {
    return Some(wanted);
  }
  let wanted_ratio = ratio(wanted)?;
  spec.aspect_ratios.iter()
    .filter_map(|a| ratio(*a).map(|r| (*a, (r.ln() - wanted_ratio.ln()).abs())))
    .min_by(|(_, a), (_, b)| a.total_cmp(b))
    .map(|(a, _)| a)
}

/// The quality if the model has it, else the best one below it (or its lowest).
fn plan_quality(quality: RouterQuality, spec: &OpenRouterImageModel) -> Option<OpenRouterQuality> {
  let wanted = match quality {
    RouterQuality::Auto => OpenRouterQuality::Auto,
    RouterQuality::Low => OpenRouterQuality::Low,
    RouterQuality::Medium => OpenRouterQuality::Medium,
    RouterQuality::High => OpenRouterQuality::High,
    RouterQuality::XHigh => OpenRouterQuality::XHigh,
    RouterQuality::Max => OpenRouterQuality::Max,
  };
  if spec.qualities.contains(&wanted) {
    return Some(wanted);
  }
  let rank = QUALITY_ORDER.iter().position(|q| *q == wanted)?;
  QUALITY_ORDER[..rank].iter().rev().chain(QUALITY_ORDER.iter())
    .find(|q| spec.qualities.contains(q))
    .copied()
}

/// Width over height; `None` for auto.
fn ratio(aspect_ratio: OpenRouterAspectRatio) -> Option<f64> {
  let (w, h) = match aspect_ratio {
    OpenRouterAspectRatio::Auto => return None,
    OpenRouterAspectRatio::OneByOne => (1.0, 1.0),
    OpenRouterAspectRatio::ThreeByTwo => (3.0, 2.0),
    OpenRouterAspectRatio::FourByThree => (4.0, 3.0),
    OpenRouterAspectRatio::FiveByFour => (5.0, 4.0),
    OpenRouterAspectRatio::SixteenByNine => (16.0, 9.0),
    OpenRouterAspectRatio::TwentyOneByNine => (21.0, 9.0),
    OpenRouterAspectRatio::TwoByThree => (2.0, 3.0),
    OpenRouterAspectRatio::ThreeByFour => (3.0, 4.0),
    OpenRouterAspectRatio::FourByFive => (4.0, 5.0),
    OpenRouterAspectRatio::NineBySixteen => (9.0, 16.0),
    OpenRouterAspectRatio::NineByTwentyOne => (9.0, 21.0),
  };
  Some(w / h)
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::api::router_image_model::RouterImageModel;
  use crate::api::router_provider::RouterProvider;

  const REFERENCE_URL: &str = "https://cdn.example.com/ref.png";

  mod request_shape_tests {
    use super::*;

    #[test]
    fn text_to_image_uses_the_models_slug() {
      let requests = build(base_builder(RouterImageModel::NanoBananaPro));
      assert_eq!(requests.len(), 1);
      assert_eq!(requests[0].model, "google/gemini-3-pro-image");
      assert_eq!((requests[0].prompt.as_str(), requests[0].n), ("a cat in space", Some(1)));
      assert!(requests[0].input_references.is_empty());
    }

    #[test]
    fn references_are_sent_as_links() {
      let builder = GenerateImageRequestBuilder { image_inputs: Some(ImageListRef::Urls(vec![REFERENCE_URL.to_owned()])), ..base_builder(RouterImageModel::GptImage2) };
      assert_eq!(build(builder)[0].input_references, vec![OpenRouterInputReference::from_url(REFERENCE_URL)]);
    }

    #[test]
    fn media_tokens_and_too_many_references_are_errors() {
      let tokens = GenerateImageRequestBuilder { image_inputs: Some(ImageListRef::MediaFileTokens(vec![])), ..base_builder(RouterImageModel::NanoBananaPro) };
      assert!(matches!(build_openrouter(tokens), Err(ArtcraftRouterError::Client(ClientError::OpenRouterOnlySupportsUrls))));
      let four = GenerateImageRequestBuilder { image_inputs: Some(ImageListRef::Urls(vec![REFERENCE_URL.to_owned(); 4])), ..base_builder(RouterImageModel::NanoBanana) };
      assert!(matches!(build_openrouter(four), Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption { field: "image_inputs", .. }))));
    }

    #[test]
    fn models_openrouter_doesnt_run_are_errors() {
      assert!(matches!(build_openrouter(base_builder(RouterImageModel::Flux1Dev)), Err(ArtcraftRouterError::UnsupportedProviderAndModelForNewApi(_))));
    }
  }

  mod batch_tests {
    use super::*;

    #[test]
    fn single_image_models_get_one_request_per_image() {
      let builder = GenerateImageRequestBuilder { image_batch_count: Some(3), ..base_builder(RouterImageModel::NanoBananaPro) };
      let counts: Vec<_> = build(builder).iter().map(|r| r.n).collect();
      assert_eq!(counts, vec![Some(1), Some(1), Some(1)]);
    }

    #[test]
    fn multi_image_models_batch_in_one_request() {
      let builder = GenerateImageRequestBuilder { image_batch_count: Some(4), ..base_builder(RouterImageModel::GptImage2) };
      let counts: Vec<_> = build(builder).iter().map(|r| r.n).collect();
      assert_eq!(counts, vec![Some(4)]);
      assert_eq!(split_count(9, 4), vec![4, 4, 1]);
    }

    #[test]
    fn zero_and_too_many_images() {
      let zero = GenerateImageRequestBuilder { image_batch_count: Some(0), ..base_builder(RouterImageModel::GptImage2) };
      assert!(matches!(build_openrouter(zero), Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations))));
      let many = GenerateImageRequestBuilder { image_batch_count: Some(12), ..base_builder(RouterImageModel::GptImage2) };
      assert!(matches!(build_openrouter(many), Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption { .. }))));
      let clamped = GenerateImageRequestBuilder { image_batch_count: Some(12), request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade, ..base_builder(RouterImageModel::GptImage2) };
      assert_eq!(build(clamped)[0].n, Some(10));
    }
  }

  mod option_tests {
    use super::*;

    #[test]
    fn resolution_rounds_to_the_models_tiers() {
      let with = |model, resolution| build(GenerateImageRequestBuilder { resolution: Some(resolution), ..base_builder(model) })[0].resolution;
      assert_eq!(with(RouterImageModel::NanoBananaPro, RouterResolution::TwoK), Some(OpenRouterResolution::TwoK));
      assert_eq!(with(RouterImageModel::NanoBananaPro, RouterResolution::ThreeK), Some(OpenRouterResolution::TwoK));
      assert_eq!(with(RouterImageModel::NanoBananaPro, RouterResolution::HalfK), Some(OpenRouterResolution::OneK));
      assert_eq!(with(RouterImageModel::Seedream5Lite, RouterResolution::OneK), Some(OpenRouterResolution::TwoK));
      assert_eq!(with(RouterImageModel::GptImage2, RouterResolution::FourK), None, "GPT Image has no resolution option");
    }

    #[test]
    fn aspect_ratio_falls_back_to_the_nearest() {
      let with = |model, aspect_ratio| build(GenerateImageRequestBuilder { aspect_ratio: Some(aspect_ratio), ..base_builder(model) })[0].aspect_ratio;
      assert_eq!(with(RouterImageModel::NanoBananaPro, RouterAspectRatio::WideSixteenByNine), Some(OpenRouterAspectRatio::SixteenByNine));
      assert_eq!(with(RouterImageModel::GptImage1, RouterAspectRatio::WideSixteenByNine), Some(OpenRouterAspectRatio::ThreeByTwo));
      assert_eq!(with(RouterImageModel::GptImage1, RouterAspectRatio::TallNineBySixteen), Some(OpenRouterAspectRatio::TwoByThree));
      assert_eq!(with(RouterImageModel::NanoBananaPro, RouterAspectRatio::TallNineByTwentyOne), Some(OpenRouterAspectRatio::NineBySixteen));
      assert_eq!(with(RouterImageModel::NanoBananaPro, RouterAspectRatio::Auto), None, "Gemini has no auto");
      assert_eq!(with(RouterImageModel::Seedream4p5, RouterAspectRatio::Auto2k), Some(OpenRouterAspectRatio::Auto));
    }

    #[test]
    fn quality_falls_back_to_the_best_below() {
      let with = |model, quality| build(GenerateImageRequestBuilder { quality: Some(quality), ..base_builder(model) })[0].quality;
      assert_eq!(with(RouterImageModel::GptImage2p5Flare, RouterQuality::Max), Some(OpenRouterQuality::Max));
      assert_eq!(with(RouterImageModel::GptImage2, RouterQuality::Max), Some(OpenRouterQuality::High));
      assert_eq!(with(RouterImageModel::GptImage2, RouterQuality::Low), Some(OpenRouterQuality::Low));
      assert_eq!(with(RouterImageModel::NanoBananaPro, RouterQuality::High), None, "Gemini has no quality option");
    }
  }

  /// Live: spends a few cents of the `OPENROUTER_API_KEY` account's credits; images are saved to
  /// the temp dir for a look.
  mod live_tests {
    use test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL;

    use super::*;
    use crate::client::router_client::RouterClient;
    use crate::client::router_openrouter_client::RouterOpenRouterClient;

    #[tokio::test]
    #[ignore]
    async fn live_text_to_image() {
      let builder = GenerateImageRequestBuilder { aspect_ratio: Some(RouterAspectRatio::WideSixteenByNine), ..base_builder(RouterImageModel::NanoBanana) };
      let images = send_live(builder, "text-to-image").await;
      assert_eq!(images, 1);
    }

    #[tokio::test]
    #[ignore]
    async fn live_batch_with_a_reference_image() {
      let builder = GenerateImageRequestBuilder {
        prompt: Some("this dog as a watercolor painting".to_owned()),
        image_inputs: Some(ImageListRef::Urls(vec![JUNO_AT_LAKE_IMAGE_URL.to_owned()])),
        image_batch_count: Some(2),
        ..base_builder(RouterImageModel::NanoBanana)
      };
      let images = send_live(builder, "reference-batch").await;
      assert_eq!(images, 2);
    }

    async fn send_live(builder: GenerateImageRequestBuilder, name: &str) -> usize {
      let key = std::env::var("OPENROUTER_API_KEY").expect("set OPENROUTER_API_KEY");
      let client = RouterClient::OpenRouter(RouterOpenRouterClient::new_from_raw_key(&key));
      let ImageGenerationDraftOrRequest::Request(request) = builder.build2().unwrap() else { panic!("expected a request") };
      let response = request.send_request(&client).await.unwrap_or_else(|err| panic!("{err:?}"));
      let payload = response.get_openrouter_payload().expect("an OpenRouter payload");
      for (i, image) in payload.images.iter().enumerate() {
        assert!(image.bytes.len() > 1000, "image {i} is only {} bytes", image.bytes.len());
        let path = std::env::temp_dir().join(format!("openrouter-live-{name}-{i}.png"));
        std::fs::write(&path, &image.bytes).unwrap();
        println!("{name}: {} ({} bytes, {:?})", path.display(), image.bytes.len(), image.maybe_media_type);
      }
      println!("{name}: cost {:?} USD", payload.maybe_cost_usd);
      payload.images.len()
    }
  }

  fn base_builder(model: RouterImageModel) -> GenerateImageRequestBuilder {
    GenerateImageRequestBuilder {
      model,
      provider: RouterProvider::OpenRouter,
      prompt: Some("a cat in space".to_owned()),
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

  fn build(builder: GenerateImageRequestBuilder) -> Vec<OpenRouterImageRequest> {
    match builder.build2().expect("build should succeed") {
      ImageGenerationDraftOrRequest::Request(ImageGenerationRequest::OpenRouter(state)) => state.requests,
      other => panic!("expected an OpenRouter request, got {other:?}"),
    }
  }
}
