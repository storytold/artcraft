use crate::api::requests::images::image_edit::image_edit::ImageEditRequest;
use crate::api::requests::images::image_generation::cost::output_mills_per_image;
use crate::api::traits::grok_request_cost_calculator_trait::{GrokRequestCostCalculator, UsdMills};
use crate::api::types::image_types::image_model::ImageModel;
use crate::api::types::image_types::image_resolution::ImageResolution;

// `image_edit` bills BOTH input (per source image fed in) AND output (per
// generated image). Per <https://docs.x.ai/developers/pricing>:
//
//   grok-imagine-image          input $0.002/img → 2 mills/img
//   grok-imagine-image-quality  input $0.010/img → 10 mills/img
//
// Output rates match `image_generation` (shared helper `output_mills_per_image`).

impl GrokRequestCostCalculator for ImageEditRequest {
  fn calculate_cost_in_mills(&self) -> UsdMills {
    let model = self.model.clone().unwrap_or(ImageModel::GrokImagineImageQuality);
    let resolution = self.resolution.unwrap_or(ImageResolution::OneK);

    let input_mills_per_img = input_mills_per_image(&model);
    let output_mills_per_img = output_mills_per_image(&model, resolution);

    let n = self.number_images.unwrap_or(1) as u64;
    let source_count = self.source_images.len() as u64;

    (input_mills_per_img * source_count) + (output_mills_per_img * n)
  }
}

/// Input rate in mills per source image, by model.
fn input_mills_per_image(model: &ImageModel) -> UsdMills {
  match model {
    ImageModel::GrokImagineImage        => 2,
    ImageModel::GrokImagineImageQuality => 10,
    // Custom: conservatively assume the more expensive `-quality` tier.
    ImageModel::Custom(_)               => 10,
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::api::requests::images::image_edit::image_edit::ImageSource;
  use crate::api::types::image_types::image_aspect_ratio::ImageAspectRatio;

  fn make_request(
    model: Option<ImageModel>,
    resolution: Option<ImageResolution>,
    number_images: Option<u32>,
    source_count: usize,
  ) -> ImageEditRequest {
    ImageEditRequest {
      prompt: "test".to_string(),
      source_images: (0..source_count)
        .map(|i| ImageSource::Url(format!("https://example.com/{i}.png")))
        .collect(),
      model,
      number_images,
      aspect_ratio: None,
      resolution,
      response_format: None,
      user: None,
    }
  }

  // ── Per-rate components ──

  mod per_rate_components {
    use super::*;

    #[test]
    fn standard_input_is_2_mills_per_source() {
      assert_eq!(input_mills_per_image(&ImageModel::GrokImagineImage), 2);
    }

    #[test]
    fn quality_input_is_10_mills_per_source() {
      assert_eq!(input_mills_per_image(&ImageModel::GrokImagineImageQuality), 10);
    }

    #[test]
    fn custom_input_defaults_to_quality_rate() {
      assert_eq!(input_mills_per_image(&ImageModel::Custom("anything".to_string())), 10);
    }
  }

  // ── Single source + single output, every (model, resolution) pair ──

  mod single_source_single_output {
    use super::*;

    #[test]
    fn standard_1k() {
      // input 2 + output 20 = 22 mills, 3¢ (ceil)
      let req = make_request(Some(ImageModel::GrokImagineImage), Some(ImageResolution::OneK), Some(1), 1);
      assert_eq!(req.calculate_cost_in_mills(), 22);
      assert_eq!(req.calculate_cost_in_cents(), 3);
    }

    #[test]
    fn standard_2k() {
      // input 2 + output 20 = 22 mills, 3¢
      let req = make_request(Some(ImageModel::GrokImagineImage), Some(ImageResolution::TwoK), Some(1), 1);
      assert_eq!(req.calculate_cost_in_mills(), 22);
      assert_eq!(req.calculate_cost_in_cents(), 3);
    }

    #[test]
    fn quality_1k() {
      // input 10 + output 50 = 60 mills, 6¢
      let req = make_request(Some(ImageModel::GrokImagineImageQuality), Some(ImageResolution::OneK), Some(1), 1);
      assert_eq!(req.calculate_cost_in_mills(), 60);
      assert_eq!(req.calculate_cost_in_cents(), 6);
    }

    #[test]
    fn quality_2k() {
      // input 10 + output 70 = 80 mills, 8¢
      let req = make_request(Some(ImageModel::GrokImagineImageQuality), Some(ImageResolution::TwoK), Some(1), 1);
      assert_eq!(req.calculate_cost_in_mills(), 80);
      assert_eq!(req.calculate_cost_in_cents(), 8);
    }
  }

  // ── Multi-source edit (up to 3 per xAI's docs) ──

  mod multi_source {
    use super::*;

    #[test]
    fn quality_1k_three_sources_one_output() {
      // input 10 × 3 = 30, output 50, total 80 mills, 8¢
      let req = make_request(Some(ImageModel::GrokImagineImageQuality), Some(ImageResolution::OneK), Some(1), 3);
      assert_eq!(req.calculate_cost_in_mills(), 80);
      assert_eq!(req.calculate_cost_in_cents(), 8);
    }

    #[test]
    fn standard_1k_three_sources_two_outputs() {
      // input 2 × 3 = 6, output 20 × 2 = 40, total 46 mills, 5¢ (ceil)
      let req = make_request(Some(ImageModel::GrokImagineImage), Some(ImageResolution::OneK), Some(2), 3);
      assert_eq!(req.calculate_cost_in_mills(), 46);
      assert_eq!(req.calculate_cost_in_cents(), 5);
    }
  }

  // ── Batch output scaling (n > 1) ──

  mod batch_scaling {
    use super::*;

    #[test]
    fn batch_scales_only_output_not_input() {
      let single = make_request(Some(ImageModel::GrokImagineImageQuality), Some(ImageResolution::TwoK), Some(1), 1)
        .calculate_cost_in_mills(); // 10 + 70 = 80
      let quad = make_request(Some(ImageModel::GrokImagineImageQuality), Some(ImageResolution::TwoK), Some(4), 1)
        .calculate_cost_in_mills(); // 10 + 70 × 4 = 290
      assert_eq!(single, 80);
      assert_eq!(quad, 290);
      // Input doesn't scale with n.
      assert_ne!(quad, single * 4);
    }

    #[test]
    fn quality_1k_scaling_1_through_8() {
      for n in 1u32..=8 {
        let req = make_request(Some(ImageModel::GrokImagineImageQuality), Some(ImageResolution::OneK), Some(n), 1);
        assert_eq!(req.calculate_cost_in_mills(), 10 + 50 * n as u64, "n={n}");
      }
    }
  }

  // ── Defaults ──

  mod defaults {
    use super::*;

    #[test]
    fn fully_default_with_one_source() {
      // model=quality, res=1k, n=1, sources=1 → 10 + 50 = 60 mills
      let req = make_request(None, None, None, 1);
      assert_eq!(req.calculate_cost_in_mills(), 60);
      assert_eq!(req.calculate_cost_in_cents(), 6);
    }
  }

  // ── Independence from non-pricing fields ──

  mod independence {
    use super::*;

    #[test]
    fn cost_is_independent_of_aspect_ratio() {
      let mut base = make_request(Some(ImageModel::GrokImagineImageQuality), Some(ImageResolution::OneK), Some(1), 1);
      let base_cost = base.calculate_cost_in_mills();
      for ar in [
        ImageAspectRatio::Square,
        ImageAspectRatio::Landscape16x9,
        ImageAspectRatio::Portrait9x16,
        ImageAspectRatio::Auto,
      ] {
        base.aspect_ratio = Some(ar);
        assert_eq!(base.calculate_cost_in_mills(), base_cost, "{ar:?}");
      }
    }

    #[test]
    fn cost_is_independent_of_source_url_content() {
      let mut req = make_request(Some(ImageModel::GrokImagineImageQuality), Some(ImageResolution::OneK), Some(1), 0);
      req.source_images = vec![
        ImageSource::Url("https://example.com/a.png".to_string()),
        ImageSource::FileId("file_abc".to_string()),
      ];
      // 10 × 2 + 50 = 70 mills
      assert_eq!(req.calculate_cost_in_mills(), 70);
    }
  }

  // ── Exhaustive matrix ──

  mod exhaustive_matrix {
    use super::*;

    // (model, resolution, n, sources, expected_mills)
    const CASES: &[(ImageModelKind, ImageResolution, u32, usize, u64)] = &[
      // grok-imagine-image  (standard)  — input 2/img, output 20/img regardless of resolution
      (ImageModelKind::Standard, ImageResolution::OneK, 1, 1, 22),
      (ImageModelKind::Standard, ImageResolution::OneK, 1, 2, 24),
      (ImageModelKind::Standard, ImageResolution::OneK, 1, 3, 26),
      (ImageModelKind::Standard, ImageResolution::OneK, 2, 1, 42),
      (ImageModelKind::Standard, ImageResolution::OneK, 4, 1, 82),
      (ImageModelKind::Standard, ImageResolution::TwoK, 1, 1, 22),
      (ImageModelKind::Standard, ImageResolution::TwoK, 2, 2, 44),
      (ImageModelKind::Standard, ImageResolution::TwoK, 3, 3, 66),
      // grok-imagine-image-quality — input 10/img, output 50/img (1k) or 70/img (2k)
      (ImageModelKind::Quality, ImageResolution::OneK, 1, 1, 60),
      (ImageModelKind::Quality, ImageResolution::OneK, 1, 2, 70),
      (ImageModelKind::Quality, ImageResolution::OneK, 1, 3, 80),
      (ImageModelKind::Quality, ImageResolution::OneK, 2, 1, 110),
      (ImageModelKind::Quality, ImageResolution::OneK, 4, 1, 210),
      (ImageModelKind::Quality, ImageResolution::TwoK, 1, 1, 80),
      (ImageModelKind::Quality, ImageResolution::TwoK, 2, 2, 160),
      (ImageModelKind::Quality, ImageResolution::TwoK, 3, 3, 240),
      (ImageModelKind::Quality, ImageResolution::TwoK, 4, 3, 310),
    ];

    #[derive(Copy, Clone, Debug)]
    enum ImageModelKind { Standard, Quality }

    fn to_model(kind: ImageModelKind) -> ImageModel {
      match kind {
        ImageModelKind::Standard => ImageModel::GrokImagineImage,
        ImageModelKind::Quality  => ImageModel::GrokImagineImageQuality,
      }
    }

    #[test]
    fn all_matrix_cases() {
      for &(kind, res, n, sources, expected) in CASES {
        let req = make_request(Some(to_model(kind)), Some(res), Some(n), sources);
        assert_eq!(req.calculate_cost_in_mills(), expected,
          "model={:?} res={:?} n={} sources={}", kind, res, n, sources);
      }
    }
  }

  // ── Monotonicity ──

  mod monotonicity {
    use super::*;

    #[test]
    fn more_sources_cost_more() {
      let one = make_request(Some(ImageModel::GrokImagineImageQuality), Some(ImageResolution::OneK), Some(1), 1)
        .calculate_cost_in_mills();
      let three = make_request(Some(ImageModel::GrokImagineImageQuality), Some(ImageResolution::OneK), Some(1), 3)
        .calculate_cost_in_mills();
      assert!(one < three);
    }

    #[test]
    fn more_outputs_cost_more() {
      let one = make_request(Some(ImageModel::GrokImagineImageQuality), Some(ImageResolution::OneK), Some(1), 1)
        .calculate_cost_in_mills();
      let four = make_request(Some(ImageModel::GrokImagineImageQuality), Some(ImageResolution::OneK), Some(4), 1)
        .calculate_cost_in_mills();
      assert!(one < four);
    }

    #[test]
    fn quality_costs_more_than_standard() {
      for res in [ImageResolution::OneK, ImageResolution::TwoK] {
        let std = make_request(Some(ImageModel::GrokImagineImage), Some(res), Some(2), 2).calculate_cost_in_mills();
        let qua = make_request(Some(ImageModel::GrokImagineImageQuality), Some(res), Some(2), 2).calculate_cost_in_mills();
        assert!(std < qua, "standard ({std}) should be < quality ({qua}) at {res:?}");
      }
    }
  }
}
