use log::{error, info};

use artcraft_api_defs::generate::image::inpaint::flux_pro_1_inpaint_image::{FluxPro1InpaintImageNumImages, FluxPro1InpaintImageRequest};
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::endpoints::generate::image::inpaint::flux_pro_1_inpaint_image::flux_pro_1_inpaint_image;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use uuid_utils::uuid::generate_random_uuid;

use tokens::tokens::media_files::MediaFileToken;

use crate::core::commands::enqueue::generate_error::{BadInputReason, GenerateError};
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::generate::generate_image::tauri_generate_image_request::TauriGenerateImageRequest;
use crate::core::commands::generate::generate_image::utils::parse_semantic_media_files::SemanticMediaFiles;
use crate::core::events::generation_events::common::GenerationModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;

/// Handle FluxPro1 inpainting via the legacy dedicated endpoint.
///
/// Requires a source image (from scene, canvas, or image_media_tokens) and an inpainting mask.
pub async fn handle_flux_pro_1_inpaint(request: &TauriGenerateImageRequest, semantic_media_files: &SemanticMediaFiles, creds: &StorytellerCredentialSet, app_env_configs: &AppEnvConfigs) -> Result<TaskEnqueueSuccess, GenerateError> {
  let inpaint_request = build_inpaint_request(request, semantic_media_files)?;

  info!("Calling FluxPro1 inpaint...");

  let response = flux_pro_1_inpaint_image(&app_env_configs.storyteller_host, Some(creds), inpaint_request).await.map_err(|err| {
    error!("FluxPro1 inpaint failed: {:?}", err);
    GenerateError::from(err)
  })?;

  info!("FluxPro1 inpaint succeeded: job_token={}", response.inference_job_token);

  Ok(TaskEnqueueSuccess { task_type: TaskType::ImageInpaintEdit, model: Some(GenerationModel::FluxPro1), provider: GenerationProvider::Artcraft, provider_job_id: Some(response.inference_job_token.to_string()), maybe_queue_status_url: None, maybe_prompt_token: None, maybe_queue_response_url: None })
}

fn build_inpaint_request(request: &TauriGenerateImageRequest, semantic_media_files: &SemanticMediaFiles) -> Result<FluxPro1InpaintImageRequest, GenerateError> {
  let image_media_token = get_first_image_token(request, semantic_media_files).ok_or(GenerateError::required_source_image_not_provided())?;

  let mask_media_token = semantic_media_files.inpainting_mask_image_media_token.clone().ok_or(GenerateError::required_source_image_mask_not_provided())?;

  let num_images = match request.batch_size {
    None => None,
    Some(1) => Some(FluxPro1InpaintImageNumImages::One),
    Some(2) => Some(FluxPro1InpaintImageNumImages::Two),
    Some(3) => Some(FluxPro1InpaintImageNumImages::Three),
    Some(4) => Some(FluxPro1InpaintImageNumImages::Four),
    Some(other) => {
      return Err(GenerateError::BadInput(BadInputReason::InvalidNumberOfRequestedImages { min: 1, max: 4, requested: other }));
    },
  };

  let uuid_idempotency_token = generate_random_uuid();

  Ok(FluxPro1InpaintImageRequest { uuid_idempotency_token, prompt: request.prompt.clone(), image_media_token, mask_media_token, num_images })
}

fn get_first_image_token(request: &TauriGenerateImageRequest, semantic_media_files: &SemanticMediaFiles) -> Option<MediaFileToken> {
  if let Some(scene_token) = &semantic_media_files.scene_image_media_token {
    return Some(scene_token.clone());
  }
  if let Some(canvas_token) = &semantic_media_files.canvas_image_media_token {
    return Some(canvas_token.clone());
  }
  if let Some(media_tokens) = &request.image_media_tokens {
    if let Some(token) = media_tokens.first() {
      return Some(token.clone());
    }
  }
  None
}

#[cfg(test)]
mod tests {
  use super::*;
  use serde_json::json;

  #[test]
  fn builds_dedicated_inpaint_payload_with_source_mask_prompt_and_count() {
    let request = request(json!({"image_media_tokens": ["mf_source"], "prompt": "a vase", "batch_size": 3}));
    let built = build_inpaint_request(&request, &media(None, None, Some("mf_mask"))).unwrap();
    assert_eq!(built.image_media_token.as_str(), "mf_source");
    assert_eq!(built.mask_media_token.as_str(), "mf_mask");
    assert_eq!(built.prompt.as_deref(), Some("a vase"));
    assert!(matches!(built.num_images, Some(FluxPro1InpaintImageNumImages::Three)));
    assert!(!built.uuid_idempotency_token.is_empty());
  }

  #[test]
  fn semantic_sources_take_precedence_over_references() {
    let request = request(json!({"image_media_tokens": ["mf_reference"]}));
    for (scene, canvas, expected) in [(Some("mf_scene"), Some("mf_canvas"), "mf_scene"), (None, Some("mf_canvas"), "mf_canvas")] {
      let built = build_inpaint_request(&request, &media(scene, canvas, Some("mf_mask"))).unwrap();
      assert_eq!(built.image_media_token.as_str(), expected);
    }
  }

  #[test]
  fn rejects_missing_source_and_mask_before_submitting() {
    assert!(build_inpaint_request(&request(json!({})), &media(None, None, Some("mf_mask"))).is_err());
    assert!(build_inpaint_request(&request(json!({"image_media_tokens": []})), &media(None, None, Some("mf_mask"))).is_err());
    assert!(build_inpaint_request(&request(json!({"image_media_tokens": ["mf_source"]})), &media(None, None, None)).is_err());
  }

  #[test]
  fn validates_batch_bounds_and_keeps_server_default() {
    let files = media(None, Some("mf_source"), Some("mf_mask"));
    for count in [0, 5, u32::MAX] {
      assert!(build_inpaint_request(&request(json!({"batch_size": count})), &files).is_err());
    }
    for count in 1..=4 {
      assert!(build_inpaint_request(&request(json!({"batch_size": count})), &files).is_ok());
    }
    assert!(build_inpaint_request(&request(json!({})), &files).unwrap().num_images.is_none());
  }

  fn request(value: serde_json::Value) -> TauriGenerateImageRequest {
    serde_json::from_value(value).unwrap()
  }

  fn media(scene: Option<&str>, canvas: Option<&str>, mask: Option<&str>) -> SemanticMediaFiles {
    SemanticMediaFiles { scene_image_media_token: scene.map(MediaFileToken::new_from_str), canvas_image_media_token: canvas.map(MediaFileToken::new_from_str), inpainting_mask_image_media_token: mask.map(MediaFileToken::new_from_str) }
  }
}
