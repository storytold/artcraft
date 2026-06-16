use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
use enums::common::generation::common_video_model::CommonVideoModel;

use crate::http_server::common_responses::common_web_error::CommonWebError;

/// xAI's `grok-imagine-video-1.5-preview` model rejects text-to-video at
/// the upstream API. Reject the request at the handler layer so callers see
/// a clean 400 with an actionable message and we don't charge their wallet
/// for an inference job we know will fail.
pub (super) fn validate_when_image_required(
  request: &OmniGenVideoCostAndGenerateRequest,
) -> Result<(), CommonWebError> {
  match request.model {
    Some(CommonVideoModel::GrokImagineVideo1p5) => {}, // Fall-through
    _ => return Ok(()),
  }

  let requires_image = matches!(request.model, Some(CommonVideoModel::GrokImagineVideo1p5));

  if !requires_image {
    return Ok(());
  }

  let has_start_frame = request.start_frame_image_media_token.is_some();
  
  let has_reference_images = request
    .reference_image_media_tokens
    .as_ref()
    .is_some_and(|v| !v.is_empty());

  if has_start_frame || has_reference_images {
    return Ok(());
  }

  Err(CommonWebError::BadInputWithSimpleMessage(
    "Image is required".to_string(),
  ))
}

#[cfg(test)]
mod tests {
  use super::*;
  use tokens::tokens::media_files::MediaFileToken;

  fn base_request() -> OmniGenVideoCostAndGenerateRequest {
    OmniGenVideoCostAndGenerateRequest {
      idempotency_token: Some("a1b2c3d4-e5f6-7890-abcd-ef1234567890".to_string()),
      model: None,
      prompt: Some("test".to_string()),
      negative_prompt: None,
      start_frame_image_media_token: None,
      end_frame_image_media_token: None,
      reference_image_media_tokens: None,
      reference_video_media_tokens: None,
      reference_audio_media_tokens: None,
      reference_character_tokens: None,
      resolution: None,
      aspect_ratio: None,
      quality: None,
      duration_seconds: Some(5),
      video_batch_count: Some(1),
      generate_audio: None,
    }
  }

  fn token(id: &str) -> MediaFileToken {
    MediaFileToken::new(id.to_string())
  }

  #[test]
  fn passes_when_model_is_none() {
    let req = base_request();
    assert!(validate_when_image_required(&req).is_ok());
  }

  #[test]
  fn passes_for_other_models_without_image() {
    // Only v1.5 needs the gate; other models can do text-to-video.
    let req = OmniGenVideoCostAndGenerateRequest {
      model: Some(CommonVideoModel::Seedance2p0),
      ..base_request()
    };
    assert!(validate_when_image_required(&req).is_ok());
  }

  #[test]
  fn rejects_v1p5_with_no_image_inputs() {
    let req = OmniGenVideoCostAndGenerateRequest {
      model: Some(CommonVideoModel::GrokImagineVideo1p5),
      ..base_request()
    };
    let err = validate_when_image_required(&req).expect_err("should reject");
    match err {
      CommonWebError::BadInputWithSimpleMessage(msg) => {
        assert_eq!(msg, "Image is required");
      }
      other => panic!("expected BadInputWithSimpleMessage, got {:?}", other),
    }
  }

  #[test]
  fn rejects_v1p5_with_empty_reference_list_and_no_start_frame() {
    let req = OmniGenVideoCostAndGenerateRequest {
      model: Some(CommonVideoModel::GrokImagineVideo1p5),
      reference_image_media_tokens: Some(vec![]),
      ..base_request()
    };
    assert!(matches!(
      validate_when_image_required(&req),
      Err(CommonWebError::BadInputWithSimpleMessage(_))
    ));
  }

  #[test]
  fn accepts_v1p5_with_start_frame_only() {
    let req = OmniGenVideoCostAndGenerateRequest {
      model: Some(CommonVideoModel::GrokImagineVideo1p5),
      start_frame_image_media_token: Some(token("mf_start")),
      ..base_request()
    };
    assert!(validate_when_image_required(&req).is_ok());
  }

  #[test]
  fn accepts_v1p5_with_reference_images_only() {
    let req = OmniGenVideoCostAndGenerateRequest {
      model: Some(CommonVideoModel::GrokImagineVideo1p5),
      reference_image_media_tokens: Some(vec![token("mf_a"), token("mf_b")]),
      ..base_request()
    };
    assert!(validate_when_image_required(&req).is_ok());
  }

  #[test]
  fn accepts_v1p5_with_both_start_frame_and_reference_images() {
    let req = OmniGenVideoCostAndGenerateRequest {
      model: Some(CommonVideoModel::GrokImagineVideo1p5),
      start_frame_image_media_token: Some(token("mf_start")),
      reference_image_media_tokens: Some(vec![token("mf_a")]),
      ..base_request()
    };
    assert!(validate_when_image_required(&req).is_ok());
  }

  #[test]
  fn end_frame_alone_does_not_count_as_image_input() {
    // end_frame_image_media_token is technically an image, but xAI's v1.5
    // wire shape only uses start_frame / reference_images. end_frame
    // shouldn't satisfy the gate.
    let req = OmniGenVideoCostAndGenerateRequest {
      model: Some(CommonVideoModel::GrokImagineVideo1p5),
      end_frame_image_media_token: Some(token("mf_end")),
      ..base_request()
    };
    assert!(validate_when_image_required(&req).is_err());
  }
}
