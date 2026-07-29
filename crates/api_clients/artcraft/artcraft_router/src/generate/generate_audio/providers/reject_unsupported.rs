//! Shared helpers for rejecting builder options that a model does not support.
//!
//! Per the request-mismatch mitigation strategy: `ErrorOut` rejects the
//! request when an unsupported option is set; the other strategies silently
//! drop the option.

use std::fmt::Debug;

use crate::api::audio_list_ref::AudioListRef;
use crate::api::image_list_ref::ImageListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;

/// Reject (under `ErrorOut`) or silently drop a set option the model doesn't
/// support.
pub(crate) fn reject_unsupported_option<T: Debug>(
  field: &'static str,
  value: Option<&T>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<(), ArtcraftRouterError> {
  let Some(value) = value else {
    return Ok(());
  };
  match strategy {
    RequestMismatchMitigationStrategy::ErrorOut => {
      Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
        field,
        value: format!("{:?}", value),
      }))
    }
    RequestMismatchMitigationStrategy::PayMoreUpgrade
    | RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(()),
  }
}

/// Reject (under `ErrorOut`) or silently drop audio references for models
/// that take none. Empty lists are treated as absent.
pub(crate) fn reject_unsupported_audio_references(
  refs: Option<&AudioListRef>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<(), ArtcraftRouterError> {
  let has_refs = match refs {
    None => false,
    Some(AudioListRef::Urls(urls)) => !urls.is_empty(),
    Some(AudioListRef::MediaFileTokens(tokens)) => !tokens.is_empty(),
  };
  if has_refs {
    return reject_unsupported_option("audio_references", refs, strategy);
  }
  Ok(())
}

/// Reject (under `ErrorOut`) or silently drop image references for models
/// that take none. Empty lists are treated as absent.
pub(crate) fn reject_unsupported_image_references(
  refs: Option<&ImageListRef>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<(), ArtcraftRouterError> {
  let has_refs = match refs {
    None => false,
    Some(ImageListRef::Urls(urls)) => !urls.is_empty(),
    Some(ImageListRef::MediaFileTokens(tokens)) => !tokens.is_empty(),
  };
  if has_refs {
    return reject_unsupported_option("image_references", refs, strategy);
  }
  Ok(())
}
