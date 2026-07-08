use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
use enums::common::generation::common_video_model::CommonVideoModel;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::util::text_contains_cjk::text_contains_cjk;

const MAX_PROMPT_CHARS: usize = 10_000;
const MAX_IMAGE_REFERENCES: usize = 9;

/// Seedance 2.0 fails upstream when the prompt exceeds 10,000 characters
/// (unless it contains Chinese, Japanese, or Korean text, which the provider
/// handles differently) or when more than 9 reference images are supplied.
/// Reject these doomed requests at the handler layer so callers see a clean
/// 400 with an actionable message and we don't charge their wallet for an
/// inference job we know will fail.
pub (super) fn validate_seedance_2p0_limits(
  request: &OmniGenVideoCostAndGenerateRequest,
) -> Result<(), CommonWebError> {
  match request.model {
    Some(model) if is_seedance_2p0_model(model) => {}, // Fall-through
    _ => return Ok(()),
  }

  if let Some(prompt) = request.prompt.as_deref() {
    let char_count = prompt.chars().count();
    if char_count > MAX_PROMPT_CHARS && !text_contains_cjk(prompt) {
      return Err(CommonWebError::BadInputWithSimpleMessage(format!(
        "Prompt is too long: Seedance 2.0 models accept at most {MAX_PROMPT_CHARS} characters (got {char_count}).",
      )));
    }
  }

  let image_reference_count = request
    .reference_image_media_tokens
    .as_ref()
    .map_or(0, |tokens| tokens.len());

  if image_reference_count > MAX_IMAGE_REFERENCES {
    return Err(CommonWebError::BadInputWithSimpleMessage(format!(
      "Too many image references: Seedance 2.0 models accept at most {MAX_IMAGE_REFERENCES} reference images (got {image_reference_count}).",
    )));
  }

  Ok(())
}

/// Seedance 2.0 base / Fast / Mini, across the Volcengine and BytePlus
/// accounts. The Ultra and preview_model variants are deliberately excluded.
fn is_seedance_2p0_model(model: CommonVideoModel) -> bool {
  matches!(model,
    CommonVideoModel::Seedance2p0
      | CommonVideoModel::Seedance2p0Fast
      | CommonVideoModel::Seedance2p0Mini
      | CommonVideoModel::Seedance2p0BytePlus
      | CommonVideoModel::Seedance2p0BytePlusFast
      | CommonVideoModel::Seedance2p0BytePlusMini
  )
}

#[cfg(test)]
mod tests {
  use super::*;
  use tokens::tokens::media_files::MediaFileToken;

  fn base_request() -> OmniGenVideoCostAndGenerateRequest {
    OmniGenVideoCostAndGenerateRequest {
      idempotency_token: Some("a1b2c3d4-e5f6-7890-abcd-ef1234567890".to_string()),
      model: Some(CommonVideoModel::Seedance2p0),
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
      bitrate: None,
      quality: None,
      duration_seconds: Some(5),
      video_batch_count: Some(1),
      generate_audio: None,
    }
  }

  fn tokens(count: usize) -> Vec<MediaFileToken> {
    (0..count).map(|i| MediaFileToken::new(format!("mf_{i}"))).collect()
  }

  mod prompt_length_tests {
    use super::*;

    #[test]
    fn accepts_prompt_at_limit() {
      let req = OmniGenVideoCostAndGenerateRequest {
        prompt: Some("a".repeat(MAX_PROMPT_CHARS)),
        ..base_request()
      };
      assert!(validate_seedance_2p0_limits(&req).is_ok());
    }

    #[test]
    fn rejects_prompt_over_limit() {
      let req = OmniGenVideoCostAndGenerateRequest {
        prompt: Some("a".repeat(MAX_PROMPT_CHARS + 1)),
        ..base_request()
      };
      assert!(matches!(
        validate_seedance_2p0_limits(&req),
        Err(CommonWebError::BadInputWithSimpleMessage(_))
      ));
    }

    #[test]
    fn accepts_over_limit_prompt_containing_cjk() {
      let mut prompt = "a".repeat(MAX_PROMPT_CHARS + 1);
      prompt.push('猫');
      let req = OmniGenVideoCostAndGenerateRequest {
        prompt: Some(prompt),
        ..base_request()
      };
      assert!(validate_seedance_2p0_limits(&req).is_ok());
    }

    #[test]
    fn rejects_over_limit_prompt_for_all_seedance_2p0_variants() {
      let seedance_models = [
        CommonVideoModel::Seedance2p0,
        CommonVideoModel::Seedance2p0Fast,
        CommonVideoModel::Seedance2p0Mini,
        CommonVideoModel::Seedance2p0BytePlus,
        CommonVideoModel::Seedance2p0BytePlusFast,
        CommonVideoModel::Seedance2p0BytePlusMini,
      ];
      for model in seedance_models {
        let req = OmniGenVideoCostAndGenerateRequest {
          model: Some(model),
          prompt: Some("a".repeat(MAX_PROMPT_CHARS + 1)),
          ..base_request()
        };
        assert!(
          validate_seedance_2p0_limits(&req).is_err(),
          "expected rejection for {:?}", model,
        );
      }
    }

    #[test]
    fn ignores_over_limit_prompt_for_excluded_seedance_variants() {
      let excluded_models = [
        CommonVideoModel::Seedance2p0Ultra,
        CommonVideoModel::Seedance2p0UltraFast,
        CommonVideoModel::Seedance2p0BytePlusUltra,
        CommonVideoModel::Seedance2p0BytePlusUltraFast,
        CommonVideoModel::Seedance2p0BytePlusUltraMini,
        CommonVideoModel::PreviewModel,
        CommonVideoModel::PreviewModelFast,
      ];
      for model in excluded_models {
        let req = OmniGenVideoCostAndGenerateRequest {
          model: Some(model),
          prompt: Some("a".repeat(MAX_PROMPT_CHARS + 1)),
          ..base_request()
        };
        assert!(
          validate_seedance_2p0_limits(&req).is_ok(),
          "expected no check for {:?}", model,
        );
      }
    }

    #[test]
    fn ignores_over_limit_prompt_for_other_models() {
      let req = OmniGenVideoCostAndGenerateRequest {
        model: Some(CommonVideoModel::Veo3p1),
        prompt: Some("a".repeat(MAX_PROMPT_CHARS + 1)),
        ..base_request()
      };
      assert!(validate_seedance_2p0_limits(&req).is_ok());
    }

    #[test]
    fn ignores_over_limit_prompt_when_model_is_none() {
      let req = OmniGenVideoCostAndGenerateRequest {
        model: None,
        prompt: Some("a".repeat(MAX_PROMPT_CHARS + 1)),
        ..base_request()
      };
      assert!(validate_seedance_2p0_limits(&req).is_ok());
    }
  }

  mod image_reference_tests {
    use super::*;

    #[test]
    fn accepts_nine_image_references() {
      let req = OmniGenVideoCostAndGenerateRequest {
        reference_image_media_tokens: Some(tokens(MAX_IMAGE_REFERENCES)),
        ..base_request()
      };
      assert!(validate_seedance_2p0_limits(&req).is_ok());
    }

    #[test]
    fn rejects_ten_image_references() {
      let req = OmniGenVideoCostAndGenerateRequest {
        reference_image_media_tokens: Some(tokens(MAX_IMAGE_REFERENCES + 1)),
        ..base_request()
      };
      assert!(matches!(
        validate_seedance_2p0_limits(&req),
        Err(CommonWebError::BadInputWithSimpleMessage(_))
      ));
    }

    #[test]
    fn ignores_ten_image_references_for_other_models() {
      let req = OmniGenVideoCostAndGenerateRequest {
        model: Some(CommonVideoModel::Kling3p0Pro),
        reference_image_media_tokens: Some(tokens(MAX_IMAGE_REFERENCES + 1)),
        ..base_request()
      };
      assert!(validate_seedance_2p0_limits(&req).is_ok());
    }
  }
}
