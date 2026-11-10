use wavespeed_client::{ImageModel, GenerateImageRequest as WaveSpeedGenerateImageRequest};

use crate::api::image_list_ref::ImageListRef;
use crate::api::router_aspect_ratio::RouterAspectRatio;
use crate::api::router_image_model::RouterImageModel;
use crate::api::router_quality::RouterQuality;
use crate::api::router_resolution::RouterResolution;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::client::router_wavespeed_client::RouterWaveSpeedClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
use crate::generate::generate_image::generate_image_response::{GenerateImageResponse, WaveSpeedImageResponsePayload};
use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::image_generation_draft_or_request::ImageGenerationDraftOrRequest;
use crate::generate::generate_image::image_generation_request::ImageGenerationRequest;

#[derive(Clone, Debug)]
pub struct WaveSpeedImageRequest {
  pub model: ImageModel,
  pub request: WaveSpeedGenerateImageRequest,
}

impl WaveSpeedImageRequest {
  pub async fn send(&self, client: &RouterWaveSpeedClient) -> Result<GenerateImageResponse, ArtcraftRouterError> {
    let prediction = client.generate_image(self.model, &self.request).await.map_err(ProviderError::WaveSpeed)?;
    Ok(GenerateImageResponse::WaveSpeed(WaveSpeedImageResponsePayload { prediction_id: prediction.id }))
  }

  pub fn estimate_cost(&self) -> ImageGenerationCostEstimate {
    let maybe_tenths_of_cent = match self.model {
      ImageModel::FluxDev => Some(12),
      ImageModel::FluxSchnell => Some(3),
      _ => None,
    };
    let maybe_cost = maybe_tenths_of_cent.map(|price| (price * u64::from(self.request.maybe_num_images.unwrap_or(1))).div_ceil(10));
    ImageGenerationCostEstimate { cost_in_credits: None, cost_in_usd_cents: maybe_cost, is_free: false, is_unlimited: false, is_rate_limited: false, has_watermark: false, failures_are_refunded: None }
  }
}

pub fn build_wavespeed(builder: GenerateImageRequestBuilder) -> Result<ImageGenerationDraftOrRequest, ArtcraftRouterError> {
  let model = map_model(builder.model)?;
  let prompt = builder.prompt.filter(|prompt| !prompt.trim().is_empty()).ok_or_else(|| ArtcraftRouterError::InvalidInput("WaveSpeed requires a prompt".into()))?;
  let count = builder.image_batch_count.unwrap_or(1);
  if count == 0 {
    return Err(ClientError::UserRequestedZeroGenerations.into());
  }
  let max_count = model.max_output_images();
  if count > max_count && matches!(builder.request_mismatch_mitigation_strategy, RequestMismatchMitigationStrategy::ErrorOut) {
    return Err(unsupported_option("image_batch_count", format!("This WaveSpeed endpoint supports at most {max_count} image(s)")));
  }
  let images = match builder.image_inputs {
    None => Vec::new(),
    Some(ImageListRef::Urls(urls)) => urls,
    Some(_) => return Err(unsupported_option("image_inputs", "WaveSpeed requires image URLs".into())),
  };
  if images.len() > model.max_reference_images() {
    return Err(unsupported_option("image_inputs", format!("This WaveSpeed model supports at most {} reference images", model.max_reference_images())));
  }
  if builder.horizontal_angle.is_some() || builder.vertical_angle.is_some() || builder.zoom.is_some() {
    return Err(unsupported_option("angle", "WaveSpeed angle controls are not supported".into()));
  }
  let is_seedream = matches!(model, ImageModel::Seedream4 | ImageModel::Seedream4p5 | ImageModel::Seedream5Lite);
  let maybe_resolution = effective_resolution(builder.resolution, builder.aspect_ratio, is_seedream)?;
  let mut request = WaveSpeedGenerateImageRequest { prompt, images, ..Default::default() };
  match model {
    ImageModel::FluxDev | ImageModel::FluxSchnell => {
      require_default_resolution(maybe_resolution)?;
      request.maybe_size = Some(dimensions(builder.aspect_ratio)?);
      request.maybe_num_images = Some(count.min(max_count));
      request.maybe_image = request.images.pop();
    },
    ImageModel::FluxPro11 | ImageModel::FluxPro11Ultra => {
      require_default_resolution(maybe_resolution)?;
      let ratio = aspect_ratio(builder.aspect_ratio, false)?;
      if !matches!(ratio.as_deref(), Some("1:1" | "4:3" | "3:4" | "16:9" | "9:16")) {
        return Err(unsupported_option("aspect_ratio", format!("{:?}", builder.aspect_ratio)));
      }
      request.maybe_aspect_ratio = ratio;
    },
    ImageModel::NanoBanana => {
      require_default_resolution(maybe_resolution)?;
      request.maybe_aspect_ratio = aspect_ratio(builder.aspect_ratio, !request.images.is_empty())?;
    },
    ImageModel::NanoBanana2 | ImageModel::NanoBananaPro | ImageModel::GptImage2 | ImageModel::GptImage2p5Flare | ImageModel::GptImage2p5Sunburst => {
      request.maybe_aspect_ratio = aspect_ratio(builder.aspect_ratio, !request.images.is_empty())?;
      if request.maybe_aspect_ratio.as_deref() == Some("9:21") && matches!(model, ImageModel::NanoBanana2 | ImageModel::NanoBananaPro | ImageModel::GptImage2) {
        return Err(unsupported_option("aspect_ratio", "9:21".into()));
      }
      request.maybe_resolution = Some(
        match maybe_resolution.unwrap_or(RouterResolution::OneK) {
          RouterResolution::OneK => "1k",
          RouterResolution::TwoK => "2k",
          RouterResolution::FourK => "4k",
          RouterResolution::HalfK if model == ImageModel::NanoBanana2 => "0.5k",
          other => return Err(unsupported_option("resolution", format!("{other:?}"))),
        }
        .into(),
      );
    },
    ImageModel::Seedream4 | ImageModel::Seedream4p5 | ImageModel::Seedream5Lite => {
      request.maybe_size = Some(seedream_dimensions(builder.aspect_ratio, maybe_resolution)?);
    },
    ImageModel::GptImage1p5 => {
      require_default_resolution(maybe_resolution)?;
      request.maybe_size = Some(
        match aspect_ratio(builder.aspect_ratio, !request.images.is_empty())?.as_deref() {
          None => "auto",
          Some("1:1") => "1024*1024",
          Some("3:2") => "1536*1024",
          Some("2:3") => "1024*1536",
          _ => return Err(unsupported_option("aspect_ratio", format!("{:?}", builder.aspect_ratio))),
        }
        .into(),
      );
    },
  }
  request.maybe_quality = quality(model, builder.quality)?;
  Ok(ImageGenerationDraftOrRequest::Request(ImageGenerationRequest::WaveSpeed(WaveSpeedImageRequest { model, request })))
}

fn map_model(model: RouterImageModel) -> Result<ImageModel, ArtcraftRouterError> {
  Ok(match model {
    RouterImageModel::Flux1Dev => ImageModel::FluxDev,
    RouterImageModel::Flux1Schnell => ImageModel::FluxSchnell,
    RouterImageModel::FluxPro11 => ImageModel::FluxPro11,
    RouterImageModel::FluxPro11Ultra => ImageModel::FluxPro11Ultra,
    RouterImageModel::NanoBanana => ImageModel::NanoBanana,
    RouterImageModel::NanoBanana2 => ImageModel::NanoBanana2,
    RouterImageModel::NanoBananaPro => ImageModel::NanoBananaPro,
    RouterImageModel::Seedream4 => ImageModel::Seedream4,
    RouterImageModel::Seedream4p5 => ImageModel::Seedream4p5,
    RouterImageModel::Seedream5Lite => ImageModel::Seedream5Lite,
    RouterImageModel::GptImage1p5 => ImageModel::GptImage1p5,
    RouterImageModel::GptImage2 => ImageModel::GptImage2,
    RouterImageModel::GptImage2p5Flare => ImageModel::GptImage2p5Flare,
    RouterImageModel::GptImage2p5Sunburst => ImageModel::GptImage2p5Sunburst,
    _ => return Err(ArtcraftRouterError::UnsupportedModel(format!("{model:?}"))),
  })
}

fn effective_resolution(maybe_resolution: Option<RouterResolution>, maybe_ratio: Option<RouterAspectRatio>, is_seedream: bool) -> Result<Option<RouterResolution>, ArtcraftRouterError> {
  let baked = match maybe_ratio {
    Some(RouterAspectRatio::Auto2k) => Some(RouterResolution::TwoK),
    Some(RouterAspectRatio::Auto3k) => Some(RouterResolution::ThreeK),
    Some(RouterAspectRatio::Auto4k) => Some(RouterResolution::FourK),
    _ => None,
  };
  if baked.is_some() && !is_seedream {
    return Err(unsupported_option("aspect_ratio", format!("{maybe_ratio:?}")));
  }
  if let (Some(baked), Some(resolution)) = (baked, maybe_resolution) {
    if std::mem::discriminant(&baked) != std::mem::discriminant(&resolution) {
      return Err(unsupported_option("resolution", "Aspect ratio and resolution conflict".into()));
    }
  }
  Ok(baked.or(maybe_resolution))
}

fn require_default_resolution(maybe_resolution: Option<RouterResolution>) -> Result<(), ArtcraftRouterError> {
  match maybe_resolution {
    None | Some(RouterResolution::OneK) => Ok(()),
    Some(other) => Err(unsupported_option("resolution", format!("{other:?}"))),
  }
}

fn quality(model: ImageModel, maybe_quality: Option<RouterQuality>) -> Result<Option<String>, ArtcraftRouterError> {
  let supports_quality = matches!(model, ImageModel::GptImage1p5 | ImageModel::GptImage2 | ImageModel::GptImage2p5Flare | ImageModel::GptImage2p5Sunburst);
  if !supports_quality {
    return match maybe_quality {
      None | Some(RouterQuality::Auto) => Ok(None),
      Some(other) => Err(unsupported_option("quality", format!("{other:?}"))),
    };
  }
  Ok(Some(
    match maybe_quality.unwrap_or(RouterQuality::Medium) {
      RouterQuality::Auto | RouterQuality::Medium => "medium",
      RouterQuality::Low => "low",
      RouterQuality::High => "high",
      RouterQuality::XHigh if matches!(model, ImageModel::GptImage2p5Flare | ImageModel::GptImage2p5Sunburst) => "xhigh",
      RouterQuality::Max if matches!(model, ImageModel::GptImage2p5Flare | ImageModel::GptImage2p5Sunburst) => "max",
      other => return Err(unsupported_option("quality", format!("{other:?}"))),
    }
    .into(),
  ))
}

fn aspect_ratio(maybe_ratio: Option<RouterAspectRatio>, editing: bool) -> Result<Option<String>, ArtcraftRouterError> {
  use RouterAspectRatio as Ratio;
  Ok(
    match maybe_ratio {
      None | Some(Ratio::Auto) if editing => None,
      None | Some(Ratio::Auto | Ratio::Square | Ratio::SquareHd) => Some("1:1"),
      Some(Ratio::Wide | Ratio::WideFourByThree) => Some("4:3"),
      Some(Ratio::WideThreeByTwo) => Some("3:2"),
      Some(Ratio::WideFiveByFour) => Some("5:4"),
      Some(Ratio::WideSixteenByNine) => Some("16:9"),
      Some(Ratio::WideTwentyOneByNine) => Some("21:9"),
      Some(Ratio::Tall | Ratio::TallThreeByFour) => Some("3:4"),
      Some(Ratio::TallTwoByThree) => Some("2:3"),
      Some(Ratio::TallFourByFive) => Some("4:5"),
      Some(Ratio::TallNineBySixteen) => Some("9:16"),
      Some(Ratio::TallNineByTwentyOne) => Some("9:21"),
      Some(other) => return Err(unsupported_option("aspect_ratio", format!("{other:?}"))),
    }
    .map(str::to_string),
  )
}

fn dimensions(ratio: Option<RouterAspectRatio>) -> Result<String, ArtcraftRouterError> {
  let (width, height) = match aspect_ratio(ratio, false)?.as_deref() {
    Some("1:1") => (1024, 1024),
    Some("4:3") => (1024, 768),
    Some("3:2") => (1152, 768),
    Some("5:4") => (1280, 1024),
    Some("16:9") => (1024, 576),
    Some("21:9") => (1344, 576),
    Some("3:4") => (768, 1024),
    Some("2:3") => (768, 1152),
    Some("4:5") => (1024, 1280),
    Some("9:16") => (576, 1024),
    Some("9:21") => (576, 1344),
    other => return Err(unsupported_option("aspect_ratio", format!("{other:?}"))),
  };
  Ok(format!("{width}*{height}"))
}

fn seedream_dimensions(maybe_ratio: Option<RouterAspectRatio>, maybe_resolution: Option<RouterResolution>) -> Result<String, ArtcraftRouterError> {
  let target: f64 = match maybe_resolution.unwrap_or(RouterResolution::TwoK) {
    RouterResolution::TwoK => 2048.0,
    RouterResolution::ThreeK => 3072.0,
    RouterResolution::FourK => 4096.0,
    other => return Err(unsupported_option("resolution", format!("{other:?}"))),
  };
  let ratio = match maybe_ratio {
    Some(RouterAspectRatio::Auto2k | RouterAspectRatio::Auto3k | RouterAspectRatio::Auto4k) => None,
    other => other,
  };
  let ratio = aspect_ratio(ratio, false)?.and_then(|ratio| {
    let (width, height) = ratio.split_once(':')?;
    Some(width.parse::<f64>().ok()? / height.parse::<f64>().ok()?)
  }).filter(|ratio| ratio.is_finite() && *ratio > 0.0)
    .ok_or_else(|| unsupported_option("aspect_ratio", format!("{maybe_ratio:?}")))?;
  let round = |value: f64| {
    let units = value / 64.0;
    if target == 4096.0 { units.floor() as u32 * 64 } else { units.ceil() as u32 * 64 }
  };
  Ok(format!("{}*{}", round(target * ratio.sqrt()), round(target / ratio.sqrt())))
}

fn unsupported_option(field: &'static str, value: String) -> ArtcraftRouterError {
  ClientError::ModelDoesNotSupportOption { field, value }.into()
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::api::router_provider::RouterProvider;

  const MODELS: &[(RouterImageModel, &str, usize)] = &[
    (RouterImageModel::Flux1Dev, "wavespeed-ai/flux-dev", 1),
    (RouterImageModel::Flux1Schnell, "wavespeed-ai/flux-schnell", 1),
    (RouterImageModel::FluxPro11, "wavespeed-ai/flux-1.1-pro", 0),
    (RouterImageModel::FluxPro11Ultra, "wavespeed-ai/flux-1.1-pro-ultra", 0),
    (RouterImageModel::NanoBanana, "google/nano-banana/text-to-image", 10),
    (RouterImageModel::NanoBanana2, "google/nano-banana-2/text-to-image", 14),
    (RouterImageModel::NanoBananaPro, "google/nano-banana-pro/text-to-image", 14),
    (RouterImageModel::Seedream4, "bytedance/seedream-v4", 10),
    (RouterImageModel::Seedream4p5, "bytedance/seedream-v4.5", 10),
    (RouterImageModel::Seedream5Lite, "bytedance/seedream-v5.0-lite", 10),
    (RouterImageModel::GptImage1p5, "openai/gpt-image-1.5/text-to-image", 10),
    (RouterImageModel::GptImage2, "openai/gpt-image-2/text-to-image", 16),
    (RouterImageModel::GptImage2p5Flare, "openai/gpt-image-2.5-flare/text-to-image", 16),
    (RouterImageModel::GptImage2p5Sunburst, "openai/gpt-image-2.5-sunburst/text-to-image", 16),
  ];

  #[test]
  fn routes_every_supported_model_and_enforces_reference_limits() {
    for &(model, endpoint, max_refs) in MODELS {
      let request = build(GenerateImageRequestBuilder { model, ..base_builder() });
      assert_eq!(request.model.endpoint(false), endpoint);
      let too_many = GenerateImageRequestBuilder { model, image_inputs: Some(ImageListRef::Urls(vec!["https://example.com/ref.png".into(); max_refs + 1])), ..base_builder() };
      assert!(too_many.build2().is_err(), "{model:?}");
      if max_refs == 0 {
        continue;
      }
      let edit = build(GenerateImageRequestBuilder { model, image_inputs: Some(ImageListRef::Urls(vec!["https://example.com/ref.png".into(); max_refs])), ..base_builder() });
      let editing = edit.request.maybe_image.is_some() || !edit.request.images.is_empty();
      assert!(editing);
      if max_refs > 1 {
        assert!(edit.model.endpoint(editing).ends_with("/edit"));
      }
    }
  }

  #[test]
  fn serializes_only_the_fields_the_endpoint_accepts() {
    for (model, expected) in [(RouterImageModel::Flux1Dev, serde_json::json!({"prompt":"a wave","size":"1024*1024","num_images":1})), (RouterImageModel::FluxPro11, serde_json::json!({"prompt":"a wave","aspect_ratio":"1:1"})), (RouterImageModel::NanoBanana, serde_json::json!({"prompt":"a wave","aspect_ratio":"1:1"})), (RouterImageModel::NanoBananaPro, serde_json::json!({"prompt":"a wave","aspect_ratio":"1:1","resolution":"1k"})), (RouterImageModel::Seedream4p5, serde_json::json!({"prompt":"a wave","size":"2048*2048"})), (RouterImageModel::GptImage1p5, serde_json::json!({"prompt":"a wave","size":"1024*1024","quality":"medium"})), (RouterImageModel::GptImage2, serde_json::json!({"prompt":"a wave","aspect_ratio":"1:1","resolution":"1k","quality":"medium"}))] {
      let request = build(GenerateImageRequestBuilder { model, ..base_builder() });
      assert_eq!(serde_json::to_value(request.request).unwrap(), expected, "{model:?}");
    }
  }

  #[test]
  fn only_gpt_image_2p5_supports_the_extended_portrait_ratio() {
    for image_inputs in [None, Some(ImageListRef::Urls(vec!["https://example.com/ref.png".into()]))] {
      let builder = GenerateImageRequestBuilder { model: RouterImageModel::GptImage2, aspect_ratio: Some(RouterAspectRatio::TallNineByTwentyOne), image_inputs: image_inputs.clone(), ..base_builder() };
      assert!(matches!(builder.build2(), Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption { field: "aspect_ratio", value })) if value == "9:21"));
      let landscape = build(GenerateImageRequestBuilder { model: RouterImageModel::GptImage2, aspect_ratio: Some(RouterAspectRatio::WideTwentyOneByNine), image_inputs: image_inputs.clone(), ..base_builder() });
      assert_eq!(landscape.request.maybe_aspect_ratio.as_deref(), Some("21:9"));
      for model in [RouterImageModel::GptImage2p5Flare, RouterImageModel::GptImage2p5Sunburst] {
        let request = build(GenerateImageRequestBuilder { model, aspect_ratio: Some(RouterAspectRatio::TallNineByTwentyOne), image_inputs: image_inputs.clone(), ..base_builder() });
        assert_eq!(request.request.maybe_aspect_ratio.as_deref(), Some("9:21"));
      }
    }
  }

  #[test]
  fn maps_resolution_and_quality_without_changing_cost_claims() {
    let request = build(GenerateImageRequestBuilder { model: RouterImageModel::GptImage2p5Sunburst, resolution: Some(RouterResolution::FourK), quality: Some(RouterQuality::Max), ..base_builder() });
    assert_eq!(request.request.maybe_resolution.as_deref(), Some("4k"));
    assert_eq!(request.request.maybe_quality.as_deref(), Some("max"));
    assert_eq!(request.estimate_cost().cost_in_usd_cents, None);
    let banana = build(GenerateImageRequestBuilder { model: RouterImageModel::NanoBanana2, resolution: Some(RouterResolution::HalfK), ..base_builder() });
    assert_eq!(banana.request.maybe_resolution.as_deref(), Some("0.5k"));
  }

  #[test]
  fn preserves_auto_aspect_ratio_on_edit_endpoints() {
    for model in [RouterImageModel::NanoBananaPro, RouterImageModel::GptImage2, RouterImageModel::GptImage1p5] {
      let request = build(GenerateImageRequestBuilder { model, aspect_ratio: Some(RouterAspectRatio::Auto), image_inputs: Some(ImageListRef::Urls(vec!["https://example.com/ref.png".into()])), ..base_builder() });
      assert!(request.request.maybe_aspect_ratio.is_none());
      if model == RouterImageModel::GptImage1p5 {
        assert_eq!(request.request.maybe_size.as_deref(), Some("auto"));
      }
    }
  }

  #[test]
  fn single_output_models_reject_batches_instead_of_submitting_multiple_paid_jobs() {
    for &(model, _, _) in &MODELS[2..] {
      assert!(matches!(GenerateImageRequestBuilder { model, image_batch_count: Some(2), ..base_builder() }.build2(), Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption { field: "image_batch_count", value })) if value == "This WaveSpeed endpoint supports at most 1 image(s)"));
    }
  }

  #[test]
  fn seedream_dimensions_preserve_aspect_and_pixel_budgets() {
    for (ratio, expected) in [(RouterAspectRatio::Square, (1.0, 1.0)), (RouterAspectRatio::WideSixteenByNine, (16.0, 9.0)), (RouterAspectRatio::TallNineByTwentyOne, (9.0, 21.0))] {
      for resolution in [RouterResolution::TwoK, RouterResolution::FourK] {
        let request = build(GenerateImageRequestBuilder { model: RouterImageModel::Seedream4p5, aspect_ratio: Some(ratio), resolution: Some(resolution), ..base_builder() });
        let size = request.request.maybe_size.unwrap();
        let (width, height) = size.split_once('*').unwrap();
        let (width, height) = (width.parse::<u32>().unwrap(), height.parse::<u32>().unwrap());
        assert!(width * height >= 3_686_400);
        assert!(width * height <= 16_777_216);
        assert!((f64::from(width) / f64::from(height) - expected.0 / expected.1).abs() < 0.1);
      }
    }
  }

  #[test]
  fn flux_batch_cost_remains_rounded_up() {
    for (model, expected_cost) in [(RouterImageModel::Flux1Dev, 5), (RouterImageModel::Flux1Schnell, 2)] {
      let request = build(GenerateImageRequestBuilder { model, image_batch_count: Some(4), ..base_builder() });
      assert_eq!(request.request.maybe_num_images, Some(4));
      assert_eq!(request.estimate_cost().cost_in_usd_cents, Some(expected_cost));
    }
  }

  #[test]
  fn rejects_invalid_options_before_submission() {
    for builder in [GenerateImageRequestBuilder { image_batch_count: Some(0), ..base_builder() }, GenerateImageRequestBuilder { image_batch_count: Some(5), ..base_builder() }, GenerateImageRequestBuilder { prompt: None, ..base_builder() }, GenerateImageRequestBuilder { model: RouterImageModel::GptImage1, ..base_builder() }, GenerateImageRequestBuilder { resolution: Some(RouterResolution::FourK), ..base_builder() }, GenerateImageRequestBuilder { model: RouterImageModel::GptImage2, quality: Some(RouterQuality::Max), ..base_builder() }, GenerateImageRequestBuilder { model: RouterImageModel::NanoBananaPro, resolution: Some(RouterResolution::HalfK), ..base_builder() }, GenerateImageRequestBuilder { model: RouterImageModel::FluxPro11, aspect_ratio: Some(RouterAspectRatio::WideThreeByTwo), ..base_builder() }] {
      assert!(builder.build2().is_err());
    }
  }

  #[test]
  fn maps_billing_errors_to_the_wavespeed_provider() {
    let error = ArtcraftRouterError::from(ProviderError::WaveSpeed(wavespeed_client::WaveSpeedError::Billing));
    assert!(matches!(error, ArtcraftRouterError::ProviderBillingError(ProviderError::WaveSpeed(_))));
  }

  fn build(builder: GenerateImageRequestBuilder) -> WaveSpeedImageRequest {
    let ImageGenerationDraftOrRequest::Request(ImageGenerationRequest::WaveSpeed(request)) = builder.build2().unwrap() else {
      panic!("expected WaveSpeed request")
    };
    request
  }

  fn base_builder() -> GenerateImageRequestBuilder {
    GenerateImageRequestBuilder { model: RouterImageModel::Flux1Dev, provider: RouterProvider::WaveSpeed, prompt: Some("a wave".into()), image_inputs: None, resolution: None, aspect_ratio: None, quality: None, image_batch_count: None, horizontal_angle: None, vertical_angle: None, zoom: None, request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut, generation_mode_mismatch_strategy: None, idempotency_token: None }
  }
}
