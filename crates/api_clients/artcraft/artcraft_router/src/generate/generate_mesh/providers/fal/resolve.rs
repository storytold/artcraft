//! Shared plan helpers for the Fal mesh provider.
//!
//! Fal only accepts media URLs — media file tokens are rejected. Callers
//! must resolve tokens to URLs before building for the Fal provider.

use enums::common::generation::common_mesh_output_type::CommonMeshOutputType;

use crate::api::image_list_ref::ImageListRef;
use crate::api::image_ref::ImageRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;

/// Resolve the primary (front) image from `reference_images` and/or
/// `front_image`. More than one candidate rejects under `ErrorOut`; the other
/// strategies keep the first (reference images take precedence over
/// `front_image`).
pub(crate) fn plan_primary_image_url(
  reference_images: Option<ImageListRef>,
  front_image: Option<ImageRef>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<String>, ArtcraftRouterError> {
  let mut candidates: Vec<String> = Vec::new();

  match reference_images {
    None => {}
    Some(ImageListRef::Urls(urls)) => candidates.extend(urls),
    Some(ImageListRef::MediaFileTokens(tokens)) if tokens.is_empty() => {}
    Some(ImageListRef::MediaFileTokens(_)) => {
      return Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls));
    }
  }

  if let Some(front) = front_image {
    candidates.push(image_ref_to_url(front)?);
  }

  if candidates.len() > 1 {
    if let RequestMismatchMitigationStrategy::ErrorOut = strategy {
      return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
        field: "reference_images",
        value: format!("Expected at most 1 primary image, got {}", candidates.len()),
      }));
    }
  }
  Ok(candidates.into_iter().next())
}

/// Resolve an optional side-view image (back/left/right) to a URL.
pub(crate) fn plan_side_image_url(
  image_ref: Option<ImageRef>,
) -> Result<Option<String>, ArtcraftRouterError> {
  image_ref.map(image_ref_to_url).transpose()
}

/// Narrow a `u64` face count to the `u32` the fal bindings take.
/// Out-of-range values reject under `ErrorOut` and clamp otherwise.
pub(crate) fn plan_face_count(
  face_count: Option<u64>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<u32>, ArtcraftRouterError> {
  let Some(face_count) = face_count else {
    return Ok(None);
  };
  match u32::try_from(face_count) {
    Ok(value) => Ok(Some(value)),
    Err(_) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "face_count",
          value: format!("{}", face_count),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade
      | RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(u32::MAX)),
    },
  }
}

/// Map a mesh output type onto the Hunyuan 2.x endpoints' `textured_mesh`
/// flag. Those endpoints only produce textured or white (geometry-only)
/// meshes: `Normal` (or unset) maps to textured, `Geometry` to white, and
/// `LowPoly` rejects under `ErrorOut` or upgrades to textured otherwise.
pub(crate) fn plan_textured_mesh(
  mesh_output_type: Option<CommonMeshOutputType>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<bool>, ArtcraftRouterError> {
  match mesh_output_type {
    None | Some(CommonMeshOutputType::Normal) => Ok(Some(true)),
    Some(CommonMeshOutputType::Geometry) => Ok(Some(false)),
    Some(CommonMeshOutputType::LowPoly) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "mesh_output_type",
          value: format!("{:?}", CommonMeshOutputType::LowPoly),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade
      | RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(true)),
    },
  }
}

fn image_ref_to_url(image_ref: ImageRef) -> Result<String, ArtcraftRouterError> {
  match image_ref {
    ImageRef::Url(url) => Ok(url),
    ImageRef::MediaFileToken(_) => {
      Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
    }
  }
}

#[cfg(test)]
mod tests {
  use tokens::tokens::media_files::MediaFileToken;

  use super::*;

  mod primary_image_tests {
    use super::*;

    #[test]
    fn none_resolves_to_none() {
      let result = plan_primary_image_url(None, None, RequestMismatchMitigationStrategy::ErrorOut)
        .expect("plan");
      assert!(result.is_none());
    }

    #[test]
    fn single_reference_url_is_used() {
      let refs = Some(ImageListRef::Urls(vec!["https://example.com/a.png".to_string()]));
      let result = plan_primary_image_url(refs, None, RequestMismatchMitigationStrategy::ErrorOut)
        .expect("plan");
      assert_eq!(result.as_deref(), Some("https://example.com/a.png"));
    }

    #[test]
    fn front_image_is_used_when_no_references() {
      let front = Some(ImageRef::Url("https://example.com/front.png".to_string()));
      let result = plan_primary_image_url(None, front, RequestMismatchMitigationStrategy::ErrorOut)
        .expect("plan");
      assert_eq!(result.as_deref(), Some("https://example.com/front.png"));
    }

    #[test]
    fn multiple_candidates_error_out() {
      let refs = Some(ImageListRef::Urls(vec!["https://example.com/a.png".to_string()]));
      let front = Some(ImageRef::Url("https://example.com/front.png".to_string()));
      let result = plan_primary_image_url(refs, front, RequestMismatchMitigationStrategy::ErrorOut);
      assert!(result.is_err());
    }

    #[test]
    fn multiple_candidates_keep_the_first_under_lenient_strategies() {
      let refs = Some(ImageListRef::Urls(vec![
        "https://example.com/a.png".to_string(),
        "https://example.com/b.png".to_string(),
      ]));
      let result = plan_primary_image_url(refs, None, RequestMismatchMitigationStrategy::PayMoreUpgrade)
        .expect("plan");
      assert_eq!(result.as_deref(), Some("https://example.com/a.png"));
    }

    #[test]
    fn media_tokens_are_rejected() {
      let refs = Some(ImageListRef::MediaFileTokens(vec![
        MediaFileToken::new("mf_test123".to_string()),
      ]));
      let result = plan_primary_image_url(refs, None, RequestMismatchMitigationStrategy::PayMoreUpgrade);
      assert!(matches!(
        result,
        Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
      ));
    }

    #[test]
    fn empty_token_list_resolves_to_none() {
      let refs = Some(ImageListRef::MediaFileTokens(vec![]));
      let result = plan_primary_image_url(refs, None, RequestMismatchMitigationStrategy::ErrorOut)
        .expect("plan");
      assert!(result.is_none());
    }
  }

  mod face_count_tests {
    use super::*;

    #[test]
    fn in_range_passes_through() {
      let result = plan_face_count(Some(500_000), RequestMismatchMitigationStrategy::ErrorOut)
        .expect("plan");
      assert_eq!(result, Some(500_000));
    }

    #[test]
    fn overflow_errors_out() {
      let result = plan_face_count(Some(u64::MAX), RequestMismatchMitigationStrategy::ErrorOut);
      assert!(result.is_err());
    }

    #[test]
    fn overflow_clamps_under_lenient_strategies() {
      let result = plan_face_count(Some(u64::MAX), RequestMismatchMitigationStrategy::PayLessDowngrade)
        .expect("plan");
      assert_eq!(result, Some(u32::MAX));
    }
  }
}
