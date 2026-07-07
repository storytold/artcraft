use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_splat_cost_and_generate_request::OmniGenSplatCostAndGenerateRequest;

use crate::http_server::common_responses::common_web_error::CommonWebError;

/// World Labs MultiImage input accepts up to this many reference images.
const MAX_IMAGE_REFERENCES: usize = 4;

/// Validate requests before they incur user costs or send API requests.
///
/// Model presence is enforced later during hydration; the input-shape rules
/// below apply uniformly to all Marble models.
pub fn validate_splat_request(
  request: &OmniGenSplatCostAndGenerateRequest,
) -> Result<(), CommonWebError> {
  let image_reference_count = request.reference_image_media_tokens.as_ref().map_or(0, |t| t.len());
  let has_video = request.reference_video_media_token.is_some();
  let has_prompt = request.prompt.as_deref().is_some_and(|p| !p.trim().is_empty());

  if !has_prompt && image_reference_count == 0 && !has_video {
    return Err(bad_input(
      "at least one of prompt, reference images, or a reference video must be provided".to_string(),
    ));
  }

  if has_video && image_reference_count > 0 {
    return Err(bad_input(
      "a reference video cannot be combined with reference images".to_string(),
    ));
  }

  if image_reference_count > MAX_IMAGE_REFERENCES {
    return Err(bad_input(format!(
      "at most {} reference images are supported", MAX_IMAGE_REFERENCES,
    )));
  }

  if request.is_panoramic == Some(true) && image_reference_count != 1 {
    return Err(bad_input(
      "is_panoramic requires exactly one reference image".to_string(),
    ));
  }

  Ok(())
}

fn bad_input(message: String) -> CommonWebError {
  CommonWebError::BadInputWithSimpleMessage(message)
}

#[cfg(test)]
mod tests {
  use enums::common::generation::common_splat_model::CommonSplatModel;
  use tokens::tokens::media_files::MediaFileToken;

  use super::*;

  mod input_presence_tests {
    use super::*;

    #[test]
    fn accepts_prompt_only() {
      let request = base_request();
      assert!(validate_splat_request(&request).is_ok());
    }

    #[test]
    fn accepts_images_only() {
      let request = OmniGenSplatCostAndGenerateRequest {
        prompt: None,
        reference_image_media_tokens: Some(vec![media_token()]),
        ..base_request()
      };
      assert!(validate_splat_request(&request).is_ok());
    }

    #[test]
    fn accepts_video_only() {
      let request = OmniGenSplatCostAndGenerateRequest {
        prompt: None,
        reference_video_media_token: Some(media_token()),
        ..base_request()
      };
      assert!(validate_splat_request(&request).is_ok());
    }

    #[test]
    fn rejects_empty_request() {
      let request = OmniGenSplatCostAndGenerateRequest {
        prompt: None,
        ..base_request()
      };
      assert!(validate_splat_request(&request).is_err());
    }

    #[test]
    fn rejects_whitespace_only_prompt() {
      let request = OmniGenSplatCostAndGenerateRequest {
        prompt: Some("   ".to_string()),
        ..base_request()
      };
      assert!(validate_splat_request(&request).is_err());
    }
  }

  mod reference_combination_tests {
    use super::*;

    #[test]
    fn rejects_video_combined_with_images() {
      let request = OmniGenSplatCostAndGenerateRequest {
        reference_image_media_tokens: Some(vec![media_token()]),
        reference_video_media_token: Some(media_token()),
        ..base_request()
      };
      assert!(validate_splat_request(&request).is_err());
    }

    #[test]
    fn rejects_too_many_reference_images() {
      let request = OmniGenSplatCostAndGenerateRequest {
        reference_image_media_tokens: Some(vec![
          media_token(), media_token(), media_token(), media_token(), media_token(),
        ]),
        ..base_request()
      };
      assert!(validate_splat_request(&request).is_err());
    }

    #[test]
    fn accepts_max_reference_images() {
      let request = OmniGenSplatCostAndGenerateRequest {
        reference_image_media_tokens: Some(vec![
          media_token(), media_token(), media_token(), media_token(),
        ]),
        ..base_request()
      };
      assert!(validate_splat_request(&request).is_ok());
    }
  }

  mod panorama_tests {
    use super::*;

    #[test]
    fn panorama_accepts_exactly_one_image() {
      let request = OmniGenSplatCostAndGenerateRequest {
        reference_image_media_tokens: Some(vec![media_token()]),
        is_panoramic: Some(true),
        ..base_request()
      };
      assert!(validate_splat_request(&request).is_ok());
    }

    #[test]
    fn panorama_rejects_zero_images() {
      let request = OmniGenSplatCostAndGenerateRequest {
        is_panoramic: Some(true),
        ..base_request()
      };
      assert!(validate_splat_request(&request).is_err());
    }

    #[test]
    fn panorama_rejects_multiple_images() {
      let request = OmniGenSplatCostAndGenerateRequest {
        reference_image_media_tokens: Some(vec![media_token(), media_token()]),
        is_panoramic: Some(true),
        ..base_request()
      };
      assert!(validate_splat_request(&request).is_err());
    }
  }

  fn base_request() -> OmniGenSplatCostAndGenerateRequest {
    OmniGenSplatCostAndGenerateRequest {
      idempotency_token: None,
      model: Some(CommonSplatModel::Marble1p1),
      prompt: Some("a cozy cabin in a snowy forest".to_string()),
      reference_image_media_tokens: None,
      reference_video_media_token: None,
      is_panoramic: None,
      disable_recaption: None,
    }
  }

  fn media_token() -> MediaFileToken {
    MediaFileToken::new("mf_test123".to_string())
  }
}
