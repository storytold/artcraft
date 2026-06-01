use crate::api::image_list_ref::ImageListRef;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;

/// Angle models (qwen_edit_2511_angles, flux_2_lora_angles) require at least
/// one input image — both v1 plans error out otherwise. Mirror that strict
/// requirement here so v1↔v2 parity holds for the "no inputs" case.
pub fn require_at_least_one_image_input(
  image_inputs: &Option<ImageListRef>,
) -> Result<(), ArtcraftRouterError> {
  match image_inputs {
    None => Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "image_inputs",
      value: "Angle models require exactly one input image".to_string(),
    })),
    Some(ImageListRef::MediaFileTokens(tokens)) if tokens.is_empty() => {
      Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
        field: "image_inputs",
        value: format!("Angle models require exactly one input image, got {}", tokens.len()),
      }))
    }
    Some(ImageListRef::Urls(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    }
    Some(ImageListRef::MediaFileTokens(_)) => Ok(()),
  }
}
