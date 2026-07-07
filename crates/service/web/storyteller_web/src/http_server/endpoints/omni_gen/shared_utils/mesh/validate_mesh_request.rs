use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_mesh_cost_and_generate_request::OmniGenMeshCostAndGenerateRequest;
use enums::common::generation::common_mesh_model::CommonMeshModel;

use crate::http_server::common_responses::common_web_error::CommonWebError;

const MIN_FACE_COUNT: u64 = 40_000;
const MAX_FACE_COUNT: u64 = 1_500_000;

/// Validate requests before they incur user costs or send API requests.
pub fn validate_mesh_request(
  request: &OmniGenMeshCostAndGenerateRequest,
) -> Result<(), CommonWebError> {
  // Model presence is enforced later during hydration; nothing to validate without it.
  let model = match request.model {
    Some(model) => model,
    None => return Ok(()),
  };

  let reference_image_count = request.reference_image_media_tokens.as_ref().map_or(0, |t| t.len());

  // `reference_image_media_tokens` is the primary/front (or sketch) image;
  // additional views go through the dedicated side-image fields.
  if reference_image_count > 1 {
    return Err(bad_input(
      "at most one reference image is supported; use the front/back/left/right \
       fields for multi-view input".to_string(),
    ));
  }

  if reference_image_count > 0 && request.front_image_media_token.is_some() {
    return Err(bad_input(
      "provide either reference_image_media_tokens or front_image_media_token, not both".to_string(),
    ));
  }

  let has_primary_image = reference_image_count > 0 || request.front_image_media_token.is_some();
  let has_side_images = request.back_image_media_token.is_some()
    || request.left_image_media_token.is_some()
    || request.right_image_media_token.is_some();
  let has_prompt = request.prompt.as_deref().is_some_and(|p| !p.trim().is_empty());

  match model {
    CommonMeshModel::Hunyuan3d2p0 | CommonMeshModel::Hunyuan3d2p1 => {
      if !has_primary_image {
        return Err(bad_input(format!(
          "model {:?} requires exactly one input image", model,
        )));
      }
      if has_side_images {
        return Err(bad_input(format!(
          "model {:?} does not support multi-view input", model,
        )));
      }
    }
    CommonMeshModel::Hunyuan3d3 => {
      if !has_primary_image && !has_prompt {
        return Err(bad_input(
          "model hunyuan_3d_3 requires an input image or a prompt".to_string(),
        ));
      }
      if has_side_images && !has_primary_image {
        return Err(bad_input(
          "multi-view side images require a front/reference image".to_string(),
        ));
      }
    }
    CommonMeshModel::Hunyuan3d3Sketch => {
      if !has_primary_image || !has_prompt {
        return Err(bad_input(
          "model hunyuan_3d_3_sketch requires both a sketch image and a prompt".to_string(),
        ));
      }
      if has_side_images {
        return Err(bad_input(
          "model hunyuan_3d_3_sketch does not support multi-view input".to_string(),
        ));
      }
    }
  }

  if let Some(face_count) = request.face_count {
    if !(MIN_FACE_COUNT..=MAX_FACE_COUNT).contains(&face_count) {
      return Err(bad_input(format!(
        "face_count must be between {} and {}", MIN_FACE_COUNT, MAX_FACE_COUNT,
      )));
    }
  }

  Ok(())
}

fn bad_input(message: String) -> CommonWebError {
  CommonWebError::BadInputWithSimpleMessage(message)
}

#[cfg(test)]
mod tests {
  use tokens::tokens::media_files::MediaFileToken;

  use super::*;

  mod image_requirement_tests {
    use super::*;

    #[test]
    fn hunyuan_2p0_rejects_prompt_only() {
      let request = base_request(CommonMeshModel::Hunyuan3d2p0);
      assert!(validate_mesh_request(&request).is_err());
    }

    #[test]
    fn hunyuan_2p1_rejects_prompt_only() {
      let request = base_request(CommonMeshModel::Hunyuan3d2p1);
      assert!(validate_mesh_request(&request).is_err());
    }

    #[test]
    fn hunyuan_2p0_accepts_exactly_one_image() {
      let request = OmniGenMeshCostAndGenerateRequest {
        reference_image_media_tokens: Some(vec![media_token()]),
        ..base_request(CommonMeshModel::Hunyuan3d2p0)
      };
      assert!(validate_mesh_request(&request).is_ok());
    }

    #[test]
    fn hunyuan_2p1_rejects_multiple_reference_images() {
      let request = OmniGenMeshCostAndGenerateRequest {
        reference_image_media_tokens: Some(vec![media_token(), media_token()]),
        ..base_request(CommonMeshModel::Hunyuan3d2p1)
      };
      assert!(validate_mesh_request(&request).is_err());
    }

    #[test]
    fn hunyuan_3d3_accepts_prompt_only() {
      let request = base_request(CommonMeshModel::Hunyuan3d3);
      assert!(validate_mesh_request(&request).is_ok());
    }

    #[test]
    fn hunyuan_3d3_accepts_image_only() {
      let request = OmniGenMeshCostAndGenerateRequest {
        prompt: None,
        reference_image_media_tokens: Some(vec![media_token()]),
        ..base_request(CommonMeshModel::Hunyuan3d3)
      };
      assert!(validate_mesh_request(&request).is_ok());
    }

    #[test]
    fn hunyuan_3d3_rejects_empty_request() {
      let request = OmniGenMeshCostAndGenerateRequest {
        prompt: None,
        ..base_request(CommonMeshModel::Hunyuan3d3)
      };
      assert!(validate_mesh_request(&request).is_err());
    }

    #[test]
    fn rejects_both_reference_and_front_image() {
      let request = OmniGenMeshCostAndGenerateRequest {
        reference_image_media_tokens: Some(vec![media_token()]),
        front_image_media_token: Some(media_token()),
        ..base_request(CommonMeshModel::Hunyuan3d3)
      };
      assert!(validate_mesh_request(&request).is_err());
    }
  }

  mod sketch_tests {
    use super::*;

    #[test]
    fn sketch_requires_image_and_prompt() {
      let request = OmniGenMeshCostAndGenerateRequest {
        reference_image_media_tokens: Some(vec![media_token()]),
        ..base_request(CommonMeshModel::Hunyuan3d3Sketch)
      };
      assert!(validate_mesh_request(&request).is_ok());
    }

    #[test]
    fn sketch_rejects_missing_image() {
      let request = base_request(CommonMeshModel::Hunyuan3d3Sketch);
      assert!(validate_mesh_request(&request).is_err());
    }

    #[test]
    fn sketch_rejects_missing_prompt() {
      let request = OmniGenMeshCostAndGenerateRequest {
        prompt: None,
        reference_image_media_tokens: Some(vec![media_token()]),
        ..base_request(CommonMeshModel::Hunyuan3d3Sketch)
      };
      assert!(validate_mesh_request(&request).is_err());
    }
  }

  mod multi_view_tests {
    use super::*;

    #[test]
    fn hunyuan_3d3_accepts_side_images_with_front_image() {
      let request = OmniGenMeshCostAndGenerateRequest {
        front_image_media_token: Some(media_token()),
        back_image_media_token: Some(media_token()),
        left_image_media_token: Some(media_token()),
        right_image_media_token: Some(media_token()),
        ..base_request(CommonMeshModel::Hunyuan3d3)
      };
      assert!(validate_mesh_request(&request).is_ok());
    }

    #[test]
    fn hunyuan_3d3_rejects_side_images_without_front_image() {
      let request = OmniGenMeshCostAndGenerateRequest {
        back_image_media_token: Some(media_token()),
        ..base_request(CommonMeshModel::Hunyuan3d3)
      };
      assert!(validate_mesh_request(&request).is_err());
    }

    #[test]
    fn hunyuan_2p0_rejects_side_images() {
      let request = OmniGenMeshCostAndGenerateRequest {
        reference_image_media_tokens: Some(vec![media_token()]),
        back_image_media_token: Some(media_token()),
        ..base_request(CommonMeshModel::Hunyuan3d2p0)
      };
      assert!(validate_mesh_request(&request).is_err());
    }

    #[test]
    fn sketch_rejects_side_images() {
      let request = OmniGenMeshCostAndGenerateRequest {
        reference_image_media_tokens: Some(vec![media_token()]),
        left_image_media_token: Some(media_token()),
        ..base_request(CommonMeshModel::Hunyuan3d3Sketch)
      };
      assert!(validate_mesh_request(&request).is_err());
    }
  }

  mod face_count_tests {
    use super::*;

    #[test]
    fn accepts_face_count_in_range() {
      let request = OmniGenMeshCostAndGenerateRequest {
        face_count: Some(500_000),
        ..base_request(CommonMeshModel::Hunyuan3d3)
      };
      assert!(validate_mesh_request(&request).is_ok());
    }

    #[test]
    fn rejects_face_count_too_low() {
      let request = OmniGenMeshCostAndGenerateRequest {
        face_count: Some(MIN_FACE_COUNT - 1),
        ..base_request(CommonMeshModel::Hunyuan3d3)
      };
      assert!(validate_mesh_request(&request).is_err());
    }

    #[test]
    fn rejects_face_count_too_high() {
      let request = OmniGenMeshCostAndGenerateRequest {
        face_count: Some(MAX_FACE_COUNT + 1),
        ..base_request(CommonMeshModel::Hunyuan3d3)
      };
      assert!(validate_mesh_request(&request).is_err());
    }
  }

  fn base_request(model: CommonMeshModel) -> OmniGenMeshCostAndGenerateRequest {
    OmniGenMeshCostAndGenerateRequest {
      idempotency_token: None,
      model: Some(model),
      prompt: Some("a small ceramic corgi figurine".to_string()),
      reference_image_media_tokens: None,
      front_image_media_token: None,
      back_image_media_token: None,
      left_image_media_token: None,
      right_image_media_token: None,
      mesh_output_type: None,
      polygon_type: None,
      face_count: None,
      enable_pbr: None,
    }
  }

  fn media_token() -> MediaFileToken {
    MediaFileToken::new("mf_test123".to_string())
  }
}
