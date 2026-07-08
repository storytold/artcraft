use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_mesh_cost_and_generate_request::OmniGenMeshCostAndGenerateRequest;
use enums::common::generation::common_mesh_model::CommonMeshModel;

use crate::http_server::common_responses::common_web_error::CommonWebError;

/// Face count range for the Hunyuan family (v3 / v3.1 pro).
const HUNYUAN_MIN_FACE_COUNT: u64 = 40_000;
const HUNYUAN_MAX_FACE_COUNT: u64 = 1_500_000;

/// Face count (face limit) range for Tripo3D H3.1.
const TRIPO_MIN_FACE_COUNT: u64 = 1_000;
const TRIPO_MAX_FACE_COUNT: u64 = 2_000_000;

/// Target polycount range for Meshy 6.
const MESHY_MIN_FACE_COUNT: u64 = 100;
const MESHY_MAX_FACE_COUNT: u64 = 300_000;

/// Rodin v2.5 Fast accepts up to five input images.
const RODIN_MAX_REFERENCE_IMAGES: usize = 5;

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
  // additional views go through the dedicated side-image fields. Rodin is the
  // exception: it accepts a batch of up to five images of the same object.
  let max_reference_images = match model {
    CommonMeshModel::Rodin2p5Fast => RODIN_MAX_REFERENCE_IMAGES,
    _ => 1,
  };
  if reference_image_count > max_reference_images {
    return Err(bad_input(format!(
      "at most {} reference image(s) supported for model {:?}; use the \
       front/back/left/right fields for multi-view input",
      max_reference_images, model,
    )));
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
  let has_input_mesh = request.input_mesh_media_token.is_some();

  let is_mesh_input_model = matches!(
    model,
    CommonMeshModel::Hunyuan3d3p1Part | CommonMeshModel::Hunyuan3d3p1SmartTopology,
  );
  if has_input_mesh && !is_mesh_input_model {
    return Err(bad_input(format!(
      "model {:?} does not take an input mesh", model,
    )));
  }

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
    CommonMeshModel::Hunyuan3d3 | CommonMeshModel::Hunyuan3d3p1Pro | CommonMeshModel::Tripo3dH3p1 => {
      // Text or image input; multi-view side images ride along with a
      // front/reference image.
      if !has_primary_image && !has_prompt {
        return Err(bad_input(format!(
          "model {:?} requires an input image or a prompt", model,
        )));
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
    CommonMeshModel::Hunyuan3d3p1Rapid
    | CommonMeshModel::MeshyV6
    | CommonMeshModel::Rodin2p5Fast => {
      // Text or (single/batch) image input; no multi-view side images.
      if !has_primary_image && !has_prompt {
        return Err(bad_input(format!(
          "model {:?} requires an input image or a prompt", model,
        )));
      }
      if has_side_images {
        return Err(bad_input(format!(
          "model {:?} does not support multi-view input", model,
        )));
      }
    }
    CommonMeshModel::Hunyuan3d3p1Part | CommonMeshModel::Hunyuan3d3p1SmartTopology => {
      if !has_input_mesh {
        return Err(bad_input(format!(
          "model {:?} requires an input mesh (input_mesh_media_token)", model,
        )));
      }
      if has_primary_image || has_side_images {
        return Err(bad_input(format!(
          "model {:?} takes an input mesh, not images", model,
        )));
      }
      if has_prompt {
        return Err(bad_input(format!(
          "model {:?} does not take a prompt", model,
        )));
      }
    }
  }

  if let Some(face_count) = request.face_count {
    let range = match model {
      CommonMeshModel::Tripo3dH3p1 => Some((TRIPO_MIN_FACE_COUNT, TRIPO_MAX_FACE_COUNT)),
      CommonMeshModel::MeshyV6 => Some((MESHY_MIN_FACE_COUNT, MESHY_MAX_FACE_COUNT)),
      CommonMeshModel::Hunyuan3d2p0
      | CommonMeshModel::Hunyuan3d2p1
      | CommonMeshModel::Hunyuan3d3
      | CommonMeshModel::Hunyuan3d3Sketch
      | CommonMeshModel::Hunyuan3d3p1Pro => Some((HUNYUAN_MIN_FACE_COUNT, HUNYUAN_MAX_FACE_COUNT)),
      // Models without a face count parameter; the option is dropped
      // downstream by the router's mismatch mitigation.
      CommonMeshModel::Hunyuan3d3p1Rapid
      | CommonMeshModel::Hunyuan3d3p1Part
      | CommonMeshModel::Hunyuan3d3p1SmartTopology
      | CommonMeshModel::Rodin2p5Fast => None,
    };
    if let Some((min, max)) = range {
      if !(min..=max).contains(&face_count) {
        return Err(bad_input(format!(
          "face_count must be between {} and {} for model {:?}", min, max, model,
        )));
      }
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

    #[test]
    fn text_or_image_models_accept_prompt_only() {
      for model in [
        CommonMeshModel::Hunyuan3d3p1Pro,
        CommonMeshModel::Hunyuan3d3p1Rapid,
        CommonMeshModel::Tripo3dH3p1,
        CommonMeshModel::MeshyV6,
        CommonMeshModel::Rodin2p5Fast,
      ] {
        let request = base_request(model);
        assert!(validate_mesh_request(&request).is_ok(), "for {model:?}");
      }
    }

    #[test]
    fn text_or_image_models_reject_empty_request() {
      for model in [
        CommonMeshModel::Hunyuan3d3p1Pro,
        CommonMeshModel::Hunyuan3d3p1Rapid,
        CommonMeshModel::Tripo3dH3p1,
        CommonMeshModel::MeshyV6,
        CommonMeshModel::Rodin2p5Fast,
      ] {
        let request = OmniGenMeshCostAndGenerateRequest {
          prompt: None,
          ..base_request(model)
        };
        assert!(validate_mesh_request(&request).is_err(), "for {model:?}");
      }
    }

    #[test]
    fn rodin_accepts_up_to_five_reference_images() {
      let request = OmniGenMeshCostAndGenerateRequest {
        reference_image_media_tokens: Some(vec![media_token(); 5]),
        ..base_request(CommonMeshModel::Rodin2p5Fast)
      };
      assert!(validate_mesh_request(&request).is_ok());
    }

    #[test]
    fn rodin_rejects_six_reference_images() {
      let request = OmniGenMeshCostAndGenerateRequest {
        reference_image_media_tokens: Some(vec![media_token(); 6]),
        ..base_request(CommonMeshModel::Rodin2p5Fast)
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
    fn multi_view_models_accept_side_images_with_front_image() {
      for model in [
        CommonMeshModel::Hunyuan3d3,
        CommonMeshModel::Hunyuan3d3p1Pro,
        CommonMeshModel::Tripo3dH3p1,
      ] {
        let request = OmniGenMeshCostAndGenerateRequest {
          front_image_media_token: Some(media_token()),
          back_image_media_token: Some(media_token()),
          left_image_media_token: Some(media_token()),
          right_image_media_token: Some(media_token()),
          ..base_request(model)
        };
        assert!(validate_mesh_request(&request).is_ok(), "for {model:?}");
      }
    }

    #[test]
    fn multi_view_models_reject_side_images_without_front_image() {
      for model in [
        CommonMeshModel::Hunyuan3d3,
        CommonMeshModel::Hunyuan3d3p1Pro,
        CommonMeshModel::Tripo3dH3p1,
      ] {
        let request = OmniGenMeshCostAndGenerateRequest {
          back_image_media_token: Some(media_token()),
          ..base_request(model)
        };
        assert!(validate_mesh_request(&request).is_err(), "for {model:?}");
      }
    }

    #[test]
    fn single_image_models_reject_side_images() {
      for model in [
        CommonMeshModel::Hunyuan3d2p0,
        CommonMeshModel::Hunyuan3d3p1Rapid,
        CommonMeshModel::MeshyV6,
        CommonMeshModel::Rodin2p5Fast,
      ] {
        let request = OmniGenMeshCostAndGenerateRequest {
          reference_image_media_tokens: Some(vec![media_token()]),
          back_image_media_token: Some(media_token()),
          ..base_request(model)
        };
        assert!(validate_mesh_request(&request).is_err(), "for {model:?}");
      }
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

  mod mesh_input_tests {
    use super::*;

    #[test]
    fn part_and_topology_require_input_mesh() {
      for model in [
        CommonMeshModel::Hunyuan3d3p1Part,
        CommonMeshModel::Hunyuan3d3p1SmartTopology,
      ] {
        let request = OmniGenMeshCostAndGenerateRequest {
          prompt: None,
          ..base_request(model)
        };
        assert!(validate_mesh_request(&request).is_err(), "for {model:?}");
      }
    }

    #[test]
    fn part_and_topology_accept_input_mesh_only() {
      for model in [
        CommonMeshModel::Hunyuan3d3p1Part,
        CommonMeshModel::Hunyuan3d3p1SmartTopology,
      ] {
        let request = OmniGenMeshCostAndGenerateRequest {
          prompt: None,
          input_mesh_media_token: Some(media_token()),
          ..base_request(model)
        };
        assert!(validate_mesh_request(&request).is_ok(), "for {model:?}");
      }
    }

    #[test]
    fn part_rejects_prompt() {
      let request = OmniGenMeshCostAndGenerateRequest {
        input_mesh_media_token: Some(media_token()),
        ..base_request(CommonMeshModel::Hunyuan3d3p1Part)
      };
      assert!(validate_mesh_request(&request).is_err());
    }

    #[test]
    fn topology_rejects_images() {
      let request = OmniGenMeshCostAndGenerateRequest {
        prompt: None,
        input_mesh_media_token: Some(media_token()),
        reference_image_media_tokens: Some(vec![media_token()]),
        ..base_request(CommonMeshModel::Hunyuan3d3p1SmartTopology)
      };
      assert!(validate_mesh_request(&request).is_err());
    }

    #[test]
    fn generation_models_reject_input_mesh() {
      for model in [
        CommonMeshModel::Hunyuan3d3,
        CommonMeshModel::Tripo3dH3p1,
        CommonMeshModel::MeshyV6,
      ] {
        let request = OmniGenMeshCostAndGenerateRequest {
          input_mesh_media_token: Some(media_token()),
          ..base_request(model)
        };
        assert!(validate_mesh_request(&request).is_err(), "for {model:?}");
      }
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
        face_count: Some(HUNYUAN_MIN_FACE_COUNT - 1),
        ..base_request(CommonMeshModel::Hunyuan3d3)
      };
      assert!(validate_mesh_request(&request).is_err());
    }

    #[test]
    fn rejects_face_count_too_high() {
      let request = OmniGenMeshCostAndGenerateRequest {
        face_count: Some(HUNYUAN_MAX_FACE_COUNT + 1),
        ..base_request(CommonMeshModel::Hunyuan3d3)
      };
      assert!(validate_mesh_request(&request).is_err());
    }

    #[test]
    fn tripo_accepts_low_face_counts_hunyuan_rejects() {
      let tripo = OmniGenMeshCostAndGenerateRequest {
        face_count: Some(2_000),
        ..base_request(CommonMeshModel::Tripo3dH3p1)
      };
      assert!(validate_mesh_request(&tripo).is_ok());

      let hunyuan = OmniGenMeshCostAndGenerateRequest {
        face_count: Some(2_000),
        ..base_request(CommonMeshModel::Hunyuan3d3p1Pro)
      };
      assert!(validate_mesh_request(&hunyuan).is_err());
    }

    #[test]
    fn meshy_rejects_face_count_above_polycount_range() {
      let request = OmniGenMeshCostAndGenerateRequest {
        face_count: Some(MESHY_MAX_FACE_COUNT + 1),
        ..base_request(CommonMeshModel::MeshyV6)
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
      input_mesh_media_token: None,
      mesh_output_type: None,
      polygon_type: None,
      face_count: None,
      enable_pbr: None,
      enable_texture: None,
      texture_quality: None,
      geometry_quality: None,
    }
  }

  fn media_token() -> MediaFileToken {
    MediaFileToken::new("mf_test123".to_string())
  }
}
