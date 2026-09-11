use crate::api::requests::images::image_generation::image_generation::ImageGenerationRequest;
use crate::api::traits::grok_request_cost_calculator_trait::{GrokRequestCostCalculator, UsdMills};
use crate::api::types::image_types::image_model::ImageModel;
use crate::api::types::image_types::image_resolution::ImageResolution;

// xAI published rates as of these docs: <https://docs.x.ai/developers/pricing>
//
//   grok-imagine-image          1K $0.02/img, 2K $0.02/img  (input $0.002/img)
//   grok-imagine-image-quality  1K $0.05/img, 2K $0.07/img  (input $0.010/img)
//
// In mills (1¢ = 10 mills):
//
//   grok-imagine-image:         1K  20 mills/img, 2K  20 mills/img
//   grok-imagine-image-quality: 1K  50 mills/img, 2K  70 mills/img
//
// `image_generation` has no INPUT cost (it's pure text → image) — only output.

impl GrokRequestCostCalculator for ImageGenerationRequest {
  fn calculate_cost_in_mills(&self) -> UsdMills {
    let model = self.model.clone().unwrap_or(ImageModel::GrokImagineImageQuality);
    let resolution = self.resolution.unwrap_or(ImageResolution::OneK);

    let mills_per_image = output_mills_per_image(&model, resolution);

    // Server default for `n` is 1.
    let n = self.number_images.unwrap_or(1) as u64;

    mills_per_image * n
  }
}

/// Output rate in mills per generated image. Used by both
/// `image_generation` and `image_edit` (same output side).
pub(crate) fn output_mills_per_image(model: &ImageModel, resolution: ImageResolution) -> UsdMills {
  match (model, resolution) {
    (ImageModel::GrokImagineImage,        ImageResolution::OneK) => 20,
    (ImageModel::GrokImagineImage,        ImageResolution::TwoK) => 20,
    (ImageModel::GrokImagineImageQuality, ImageResolution::OneK) => 50,
    (ImageModel::GrokImagineImageQuality, ImageResolution::TwoK) => 70,
    // Custom: conservatively assume the more expensive `-quality` tier.
    (ImageModel::Custom(_),               ImageResolution::OneK) => 50,
    (ImageModel::Custom(_),               ImageResolution::TwoK) => 70,
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::api::types::image_types::image_aspect_ratio::ImageAspectRatio;
  use crate::api::types::image_types::image_response_format::ImageResponseFormat;

  fn make_request(
    model: Option<ImageModel>,
    resolution: Option<ImageResolution>,
    number_images: Option<u32>,
  ) -> ImageGenerationRequest {
    ImageGenerationRequest {
      prompt: "test".to_string(),
      model,
      number_images,
      aspect_ratio: None,
      resolution,
      response_format: None,
      user: None,
    }
  }

  // ── Per-image rate at each (model, resolution) combo ──

  mod per_image_rates {
    use super::*;

    #[test]
    fn standard_1k_is_20_mills() {
      let req = make_request(Some(ImageModel::GrokImagineImage), Some(ImageResolution::OneK), Some(1));
      assert_eq!(req.calculate_cost_in_mills(), 20);
      // 20 mills = 2¢ (ceiling)
      assert_eq!(req.calculate_cost_in_cents(), 2);
    }

    #[test]
    fn standard_2k_is_20_mills() {
      let req = make_request(Some(ImageModel::GrokImagineImage), Some(ImageResolution::TwoK), Some(1));
      assert_eq!(req.calculate_cost_in_mills(), 20);
      assert_eq!(req.calculate_cost_in_cents(), 2);
    }

    #[test]
    fn quality_1k_is_50_mills() {
      let req = make_request(Some(ImageModel::GrokImagineImageQuality), Some(ImageResolution::OneK), Some(1));
      assert_eq!(req.calculate_cost_in_mills(), 50);
      assert_eq!(req.calculate_cost_in_cents(), 5);
    }

    #[test]
    fn quality_2k_is_70_mills() {
      let req = make_request(Some(ImageModel::GrokImagineImageQuality), Some(ImageResolution::TwoK), Some(1));
      assert_eq!(req.calculate_cost_in_mills(), 70);
      assert_eq!(req.calculate_cost_in_cents(), 7);
    }
  }

  // ── Defaults ──

  mod defaults {
    use super::*;

    #[test]
    fn default_model_is_quality() {
      let r1 = make_request(None, Some(ImageResolution::OneK), Some(1));
      let r2 = make_request(Some(ImageModel::GrokImagineImageQuality), Some(ImageResolution::OneK), Some(1));
      assert_eq!(r1.calculate_cost_in_mills(), r2.calculate_cost_in_mills());
    }

    #[test]
    fn default_resolution_is_one_k() {
      let r1 = make_request(Some(ImageModel::GrokImagineImageQuality), None, Some(1));
      let r2 = make_request(Some(ImageModel::GrokImagineImageQuality), Some(ImageResolution::OneK), Some(1));
      assert_eq!(r1.calculate_cost_in_mills(), r2.calculate_cost_in_mills());
    }

    #[test]
    fn default_n_is_one() {
      let r1 = make_request(Some(ImageModel::GrokImagineImageQuality), Some(ImageResolution::OneK), None);
      let r2 = make_request(Some(ImageModel::GrokImagineImageQuality), Some(ImageResolution::OneK), Some(1));
      assert_eq!(r1.calculate_cost_in_mills(), r2.calculate_cost_in_mills());
    }

    #[test]
    fn fully_default_request_costs_50_mills() {
      // All defaults = grok-imagine-image-quality, 1k, n=1 → 50 mills
      let req = make_request(None, None, None);
      assert_eq!(req.calculate_cost_in_mills(), 50);
      assert_eq!(req.calculate_cost_in_cents(), 5);
    }
  }

  // ── Batch scaling ──

  mod batch_scaling {
    use super::*;

    #[test]
    fn n_scales_linearly_standard_1k() {
      for n in 1u32..=10 {
        let req = make_request(Some(ImageModel::GrokImagineImage), Some(ImageResolution::OneK), Some(n));
        assert_eq!(req.calculate_cost_in_mills(), 20 * n as u64, "n={n}");
      }
    }

    #[test]
    fn n_scales_linearly_quality_2k() {
      for n in 1u32..=10 {
        let req = make_request(Some(ImageModel::GrokImagineImageQuality), Some(ImageResolution::TwoK), Some(n));
        assert_eq!(req.calculate_cost_in_mills(), 70 * n as u64, "n={n}");
      }
    }

    #[test]
    fn batch_of_four_quality_2k() {
      let req = make_request(Some(ImageModel::GrokImagineImageQuality), Some(ImageResolution::TwoK), Some(4));
      // 70 mills × 4 = 280 mills = 28¢
      assert_eq!(req.calculate_cost_in_mills(), 280);
      assert_eq!(req.calculate_cost_in_cents(), 28);
    }
  }

  // ── Custom model (forward-compat) ──

  mod custom_model {
    use super::*;

    #[test]
    fn custom_model_uses_quality_rate() {
      let custom = ImageModel::Custom("grok-imagine-image-future".to_string());
      let r_custom_1k = make_request(Some(custom.clone()), Some(ImageResolution::OneK), Some(1));
      let r_quality_1k = make_request(Some(ImageModel::GrokImagineImageQuality), Some(ImageResolution::OneK), Some(1));
      assert_eq!(r_custom_1k.calculate_cost_in_mills(), r_quality_1k.calculate_cost_in_mills());

      let r_custom_2k = make_request(Some(custom), Some(ImageResolution::TwoK), Some(1));
      let r_quality_2k = make_request(Some(ImageModel::GrokImagineImageQuality), Some(ImageResolution::TwoK), Some(1));
      assert_eq!(r_custom_2k.calculate_cost_in_mills(), r_quality_2k.calculate_cost_in_mills());
    }
  }

  // ── Cost doesn't depend on irrelevant fields ──

  mod independence {
    use super::*;

    #[test]
    fn cost_is_independent_of_aspect_ratio() {
      let mut base = make_request(Some(ImageModel::GrokImagineImageQuality), Some(ImageResolution::OneK), Some(1));
      let base_cost = base.calculate_cost_in_mills();
      for ar in [
        ImageAspectRatio::Square,
        ImageAspectRatio::Landscape16x9,
        ImageAspectRatio::Portrait9x16,
        ImageAspectRatio::Landscape20x9,
        ImageAspectRatio::Auto,
      ] {
        base.aspect_ratio = Some(ar);
        assert_eq!(base.calculate_cost_in_mills(), base_cost, "{ar:?}");
      }
    }

    #[test]
    fn cost_is_independent_of_response_format() {
      let mut base = make_request(Some(ImageModel::GrokImagineImageQuality), Some(ImageResolution::OneK), Some(1));
      let base_cost = base.calculate_cost_in_mills();
      base.response_format = Some(ImageResponseFormat::Url);
      assert_eq!(base.calculate_cost_in_mills(), base_cost);
      base.response_format = Some(ImageResponseFormat::B64Json);
      assert_eq!(base.calculate_cost_in_mills(), base_cost);
    }

    #[test]
    fn cost_is_independent_of_user_field() {
      let mut base = make_request(Some(ImageModel::GrokImagineImageQuality), Some(ImageResolution::OneK), Some(1));
      let base_cost = base.calculate_cost_in_mills();
      base.user = Some("any-user-id".to_string());
      assert_eq!(base.calculate_cost_in_mills(), base_cost);
    }
  }

  // ── Monotonicity sanity checks ──

  mod monotonicity {
    use super::*;

    #[test]
    fn quality_is_at_least_as_expensive_as_standard() {
      for res in [ImageResolution::OneK, ImageResolution::TwoK] {
        let std = make_request(Some(ImageModel::GrokImagineImage), Some(res), Some(1)).calculate_cost_in_mills();
        let q   = make_request(Some(ImageModel::GrokImagineImageQuality), Some(res), Some(1)).calculate_cost_in_mills();
        assert!(std <= q, "standard ({std}) should be <= quality ({q}) at {res:?}");
      }
    }

    #[test]
    fn two_k_is_at_least_as_expensive_as_one_k() {
      for model in [ImageModel::GrokImagineImage, ImageModel::GrokImagineImageQuality] {
        let lo = make_request(Some(model.clone()), Some(ImageResolution::OneK), Some(1)).calculate_cost_in_mills();
        let hi = make_request(Some(model.clone()), Some(ImageResolution::TwoK), Some(1)).calculate_cost_in_mills();
        assert!(lo <= hi, "1k ({lo}) should be <= 2k ({hi}) for {:?}", model.as_str());
      }
    }
  }
}
