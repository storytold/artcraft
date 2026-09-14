use crate::api::router_image_model::RouterImageModel;
use crate::api::image_list_ref::ImageListRef;
use crate::api::router_aspect_ratio::RouterAspectRatio;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
use crate::generate::generate_image::image_generation_draft_or_request::ImageGenerationDraftOrRequest;
use crate::generate::generate_image::image_generation_request::ImageGenerationRequest;
use crate::generate::generate_image::providers::midjourney::request::MidjourneyRequestState;

/// The Midjourney model version flag appended to every prompt.
const MIDJOURNEY_VERSION_FLAG: &str = "--v 8.2";

pub fn build_midjourney(builder: GenerateImageRequestBuilder) -> Result<ImageGenerationDraftOrRequest, ArtcraftRouterError> {
  // Image references are not yet supported on the first-party cookie path.
  if has_image_inputs(builder.image_inputs.as_ref()) {
    return Err(ArtcraftRouterError::UnsupportedProviderAndModelForNewApi("First-party Midjourney does not yet support image references".to_string()));
  }

  if builder.image_batch_count.is_some_and(|count| count != 4) {
    return Err(ArtcraftRouterError::InvalidInput("Direct Midjourney generates four images per job".to_string()));
  }
  let version = match builder.model {
    RouterImageModel::Midjourney7 => "--v 7",
    RouterImageModel::Midjourney7Niji => "--niji 7",
    RouterImageModel::Midjourney8 => MIDJOURNEY_VERSION_FLAG,
    _ => return Err(ArtcraftRouterError::UnsupportedModel(format!("{:?}", builder.model))),
  };
  let base_prompt = builder.prompt.unwrap_or_default();
  if base_prompt.trim().is_empty() {
    return Err(ArtcraftRouterError::InvalidInput("A Midjourney prompt is required".to_string()));
  }
  let prompt = compose_prompt(&base_prompt, builder.aspect_ratio, version);

  Ok(ImageGenerationDraftOrRequest::Request(ImageGenerationRequest::MidjourneyRequest(MidjourneyRequestState { prompt })))
}

/// Compose the final Midjourney prompt string, appending the aspect-ratio flag
/// (when the ratio maps to one Midjourney supports) and the version flag.
fn compose_prompt(base_prompt: &str, aspect_ratio: Option<RouterAspectRatio>, version: &str) -> String {
  let mut prompt = base_prompt.trim().to_string();

  if let Some(ratio) = aspect_ratio_flag(aspect_ratio) {
    prompt.push_str(" --ar ");
    prompt.push_str(ratio);
  }

  prompt.push(' ');
  prompt.push_str(version);
  prompt
}

/// Maps a router aspect ratio to Midjourney's `--ar W:H` value. Returns `None`
/// for `Auto`/unset (Midjourney defaults to 1:1).
fn aspect_ratio_flag(aspect_ratio: Option<RouterAspectRatio>) -> Option<&'static str> {
  match aspect_ratio {
    None | Some(RouterAspectRatio::Auto) | Some(RouterAspectRatio::Auto2k) | Some(RouterAspectRatio::Auto3k) | Some(RouterAspectRatio::Auto4k) => None,

    Some(RouterAspectRatio::Square) | Some(RouterAspectRatio::SquareHd) => Some("1:1"),
    Some(RouterAspectRatio::WideThreeByTwo) => Some("3:2"),
    Some(RouterAspectRatio::WideFourByThree) => Some("4:3"),
    Some(RouterAspectRatio::WideFiveByFour) => Some("5:4"),
    Some(RouterAspectRatio::WideSixteenByNine) | Some(RouterAspectRatio::Wide) => Some("16:9"),
    Some(RouterAspectRatio::WideTwentyOneByNine) => Some("21:9"),
    Some(RouterAspectRatio::TallTwoByThree) => Some("2:3"),
    Some(RouterAspectRatio::TallThreeByFour) => Some("3:4"),
    Some(RouterAspectRatio::TallFourByFive) => Some("4:5"),
    Some(RouterAspectRatio::TallNineBySixteen) | Some(RouterAspectRatio::Tall) => Some("9:16"),
    Some(RouterAspectRatio::TallNineByTwentyOne) => Some("9:21"),
  }
}

fn has_image_inputs(image_inputs: Option<&ImageListRef>) -> bool {
  image_inputs.is_some_and(|refs| match refs {
    ImageListRef::Urls(urls) => !urls.is_empty(),
    ImageListRef::MediaFileTokens(tokens) => !tokens.is_empty(),
  })
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::api::router_image_model::RouterImageModel;
  use crate::api::router_provider::RouterProvider;
  use crate::client::generation_mode_mismatch_strategy::GenerationModeMismatchStrategy;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;

  #[test]
  fn appends_version_flag_and_no_ar_by_default() {
    let prompt = built_prompt(base_builder());
    assert_eq!(prompt, "pirate ship in the city --v 8.2");
  }

  #[test]
  fn appends_aspect_ratio_flag() {
    let builder = GenerateImageRequestBuilder { aspect_ratio: Some(RouterAspectRatio::WideSixteenByNine), ..base_builder() };
    assert_eq!(built_prompt(builder), "pirate ship in the city --ar 16:9 --v 8.2");
  }

  #[test]
  fn image_inputs_are_rejected_for_now() {
    let builder = GenerateImageRequestBuilder { image_inputs: Some(ImageListRef::Urls(vec!["https://example.com/ref.png".to_string()])), ..base_builder() };
    assert!(build_midjourney(builder).is_err());
  }
  #[test]
  fn chooses_the_requested_midjourney_version() {
    for (model, flag) in [(RouterImageModel::Midjourney7, "--v 7"), (RouterImageModel::Midjourney7Niji, "--niji 7"), (RouterImageModel::Midjourney8, "--v 8.2")] {
      let prompt = built_prompt(GenerateImageRequestBuilder { model, ..base_builder() });
      assert!(prompt.ends_with(flag));
    }
  }

  #[test]
  fn rejects_invalid_batch_counts_and_empty_prompts() {
    for count in [0, 1, 2, 5] {
      assert!(build_midjourney(GenerateImageRequestBuilder { image_batch_count: Some(count), ..base_builder() }).is_err());
    }
    assert!(build_midjourney(GenerateImageRequestBuilder { prompt: Some("  ".into()), ..base_builder() }).is_err());
  }

  fn base_builder() -> GenerateImageRequestBuilder {
    GenerateImageRequestBuilder { model: RouterImageModel::Midjourney8, provider: RouterProvider::Midjourney, prompt: Some("pirate ship in the city".to_string()), image_inputs: None, resolution: None, aspect_ratio: None, quality: None, image_batch_count: None, horizontal_angle: None, vertical_angle: None, zoom: None, request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade, generation_mode_mismatch_strategy: Some(GenerationModeMismatchStrategy::GenerateAnyway), idempotency_token: None }
  }

  fn built_prompt(builder: GenerateImageRequestBuilder) -> String {
    match build_midjourney(builder).expect("build") {
      ImageGenerationDraftOrRequest::Request(ImageGenerationRequest::MidjourneyRequest(r)) => r.prompt,
      _ => panic!("expected a direct Midjourney request"),
    }
  }
}
