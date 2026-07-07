//! Input planning for the World Labs splat provider.
//!
//! The derivation is shared by request assembly and pricing so the two
//! always agree on the input type.

use worldlabs_api_client::pricing::check_pricing::InputType;

use crate::api::image_list_ref::ImageListRef;
use crate::api::image_ref::ImageRef;
use crate::api::video_ref::VideoRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;

/// The planned splat input, derived from the builder's media references.
#[derive(Clone, Debug)]
pub(crate) enum SplatInput {
  Text,
  Image { image: ImageRef, is_panoramic: bool },
  MultiImage { images: Vec<ImageRef> },
  Video { video: VideoRef },
}

impl SplatInput {
  pub(crate) fn to_input_type(&self) -> InputType {
    match self {
      SplatInput::Text => InputType::Text,
      SplatInput::Image { is_panoramic: true, .. } => InputType::ImagePanorama,
      SplatInput::Image { is_panoramic: false, .. } => InputType::ImageNonPanorama,
      SplatInput::MultiImage { .. } => InputType::MultiImage,
      SplatInput::Video { .. } => InputType::Video,
    }
  }
}

/// Derive the splat input from the builder's references:
/// - a reference video wins (images alongside it reject under `ErrorOut` and
///   are dropped otherwise),
/// - two or more reference images are multi-image input,
/// - one reference image is a single panorama or non-panorama image,
/// - otherwise a prompt is required for text input.
pub(crate) fn plan_splat_input(
  reference_images: Option<ImageListRef>,
  reference_video: Option<VideoRef>,
  is_panoramic: Option<bool>,
  has_prompt: bool,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<SplatInput, ArtcraftRouterError> {
  let mut images = image_list_to_refs(reference_images);

  if let Some(video) = reference_video {
    if !images.is_empty() {
      if let RequestMismatchMitigationStrategy::ErrorOut = strategy {
        return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "reference_images",
          value: "Reference images cannot be combined with a reference video".to_string(),
        }));
      }
    }
    return Ok(SplatInput::Video { video });
  }

  match images.len() {
    0 => {
      if has_prompt {
        Ok(SplatInput::Text)
      } else {
        Err(ArtcraftRouterError::InvalidInput(
          "A prompt, reference image, or reference video is required for splat generation".to_string(),
        ))
      }
    }
    1 => Ok(SplatInput::Image {
      image: images.remove(0),
      is_panoramic: is_panoramic.unwrap_or(false),
    }),
    _ => Ok(SplatInput::MultiImage { images }),
  }
}

fn image_list_to_refs(reference_images: Option<ImageListRef>) -> Vec<ImageRef> {
  match reference_images {
    None => Vec::new(),
    Some(ImageListRef::Urls(urls)) => urls.into_iter().map(ImageRef::Url).collect(),
    Some(ImageListRef::MediaFileTokens(tokens)) => {
      tokens.into_iter().map(ImageRef::MediaFileToken).collect()
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  const IMAGE_URL: &str = "https://example.com/room.png";
  const VIDEO_URL: &str = "https://example.com/room.mp4";

  #[test]
  fn video_wins() {
    let input = plan_splat_input(
      None,
      Some(VideoRef::Url(VIDEO_URL.to_string())),
      None,
      true,
      RequestMismatchMitigationStrategy::ErrorOut,
    ).expect("plan");
    assert!(matches!(input, SplatInput::Video { .. }));
    assert_eq!(input.to_input_type(), InputType::Video);
  }

  #[test]
  fn video_with_images_errors_out_under_error_out() {
    let result = plan_splat_input(
      Some(ImageListRef::Urls(vec![IMAGE_URL.to_string()])),
      Some(VideoRef::Url(VIDEO_URL.to_string())),
      None,
      false,
      RequestMismatchMitigationStrategy::ErrorOut,
    );
    assert!(result.is_err());
  }

  #[test]
  fn video_with_images_drops_the_images_under_lenient_strategies() {
    let input = plan_splat_input(
      Some(ImageListRef::Urls(vec![IMAGE_URL.to_string()])),
      Some(VideoRef::Url(VIDEO_URL.to_string())),
      None,
      false,
      RequestMismatchMitigationStrategy::PayMoreUpgrade,
    ).expect("plan");
    assert!(matches!(input, SplatInput::Video { .. }));
  }

  #[test]
  fn two_images_are_multi_image() {
    let input = plan_splat_input(
      Some(ImageListRef::Urls(vec![
        IMAGE_URL.to_string(),
        "https://example.com/other.png".to_string(),
      ])),
      None,
      None,
      false,
      RequestMismatchMitigationStrategy::ErrorOut,
    ).expect("plan");
    assert_eq!(input.to_input_type(), InputType::MultiImage);
  }

  #[test]
  fn one_panoramic_image_is_image_panorama() {
    let input = plan_splat_input(
      Some(ImageListRef::Urls(vec![IMAGE_URL.to_string()])),
      None,
      Some(true),
      false,
      RequestMismatchMitigationStrategy::ErrorOut,
    ).expect("plan");
    assert_eq!(input.to_input_type(), InputType::ImagePanorama);
  }

  #[test]
  fn one_image_is_image_non_panorama() {
    for is_panoramic in [None, Some(false)] {
      let input = plan_splat_input(
        Some(ImageListRef::Urls(vec![IMAGE_URL.to_string()])),
        None,
        is_panoramic,
        false,
        RequestMismatchMitigationStrategy::ErrorOut,
      ).expect("plan");
      assert_eq!(input.to_input_type(), InputType::ImageNonPanorama);
    }
  }

  #[test]
  fn prompt_only_is_text() {
    let input = plan_splat_input(
      None,
      None,
      None,
      true,
      RequestMismatchMitigationStrategy::ErrorOut,
    ).expect("plan");
    assert_eq!(input.to_input_type(), InputType::Text);
  }

  #[test]
  fn empty_input_is_rejected() {
    let result = plan_splat_input(
      None,
      None,
      None,
      false,
      RequestMismatchMitigationStrategy::PayMoreUpgrade,
    );
    assert!(matches!(result, Err(ArtcraftRouterError::InvalidInput(_))));
  }

  #[test]
  fn empty_image_list_counts_as_no_images() {
    let input = plan_splat_input(
      Some(ImageListRef::Urls(vec![])),
      None,
      None,
      true,
      RequestMismatchMitigationStrategy::ErrorOut,
    ).expect("plan");
    assert_eq!(input.to_input_type(), InputType::Text);
  }
}
