use crate::requests::api::video::seedance_2_0_fast_260128::api::{
  Seedance20FastRequest, Seedance20FastResolution,
};
use crate::traits::gmicloud_request_cost_calculator_trait::{
  GmiCloudRequestCostCalculator, UsdCents,
};

impl GmiCloudRequestCostCalculator for Seedance20FastRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    let duration_seconds = self.effective_duration_seconds() as u64;

    // Cost per second in tenths of a US cent, by resolution.
    // Observed from GmiCloud billing:
    //   480p: $0.01/s  = 1.0 tenths/s
    //   720p: $0.031/s = 3.1 tenths/s (default)
    let tenths_per_second: f64 = match self.resolution {
      Some(Seedance20FastResolution::FourEightyP) => 1.0,
      Some(Seedance20FastResolution::SevenTwentyP) | None => 3.1,
    };

    let tenths = (tenths_per_second * duration_seconds as f64).ceil() as u64;
    tenths.div_ceil(10)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::video::seedance_2_0_fast_260128::api::Seedance20FastRatio;

  fn make_request(duration: Option<u8>, resolution: Option<Seedance20FastResolution>) -> Seedance20FastRequest {
    Seedance20FastRequest {
      prompt: "test".to_string(),
      duration,
      resolution,
      ratio: None,
      seed: None,
      watermark: None,
      generate_audio: None,
      web_search: None,
      first_frame: None,
      last_frame: None,
      reference_images: None,
      reference_videos: None,
      reference_audios: None,
      reference_asset_ids: None,
    }
  }

  mod default_resolution_tests {
    use super::*;

    #[test]
    fn cost_default_5s() {
      // 720p default: 3.1 * 5 = 15.5 → ceil = 16 tenths → 2 cents
      assert_eq!(make_request(None, None).calculate_cost_in_cents(), 2);
    }

    #[test]
    fn cost_default_10s() {
      // 3.1 * 10 = 31 tenths → 4 cents
      assert_eq!(make_request(Some(10), None).calculate_cost_in_cents(), 4);
    }

    #[test]
    fn cost_default_15s() {
      // 3.1 * 15 = 46.5 → ceil = 47 tenths → 5 cents
      assert_eq!(make_request(Some(15), None).calculate_cost_in_cents(), 5);
    }
  }

  mod resolution_480p_tests {
    use super::*;

    #[test]
    fn cost_480p_5s() {
      // 1.0 * 5 = 5 tenths → 1 cent
      assert_eq!(make_request(Some(5), Some(Seedance20FastResolution::FourEightyP)).calculate_cost_in_cents(), 1);
    }

    #[test]
    fn cost_480p_10s() {
      // 1.0 * 10 = 10 tenths → 1 cent
      assert_eq!(make_request(Some(10), Some(Seedance20FastResolution::FourEightyP)).calculate_cost_in_cents(), 1);
    }

    #[test]
    fn cost_480p_15s() {
      // 1.0 * 15 = 15 tenths → 2 cents
      assert_eq!(make_request(Some(15), Some(Seedance20FastResolution::FourEightyP)).calculate_cost_in_cents(), 2);
    }
  }

  mod resolution_720p_tests {
    use super::*;

    #[test]
    fn cost_720p_5s() {
      // 3.1 * 5 = 15.5 → ceil = 16 tenths → 2 cents
      assert_eq!(make_request(Some(5), Some(Seedance20FastResolution::SevenTwentyP)).calculate_cost_in_cents(), 2);
    }

    #[test]
    fn cost_720p_10s() {
      // 3.1 * 10 = 31 tenths → 4 cents
      assert_eq!(make_request(Some(10), Some(Seedance20FastResolution::SevenTwentyP)).calculate_cost_in_cents(), 4);
    }

    #[test]
    fn cost_720p_15s() {
      // 3.1 * 15 = 46.5 → ceil = 47 tenths → 5 cents
      assert_eq!(make_request(Some(15), Some(Seedance20FastResolution::SevenTwentyP)).calculate_cost_in_cents(), 5);
    }
  }

  mod ratio_independence_tests {
    use super::*;

    #[test]
    fn cost_is_independent_of_ratio() {
      let ratios = [
        Seedance20FastRatio::Landscape16x9,
        Seedance20FastRatio::Portrait9x16,
        Seedance20FastRatio::Square,
        Seedance20FastRatio::Standard4x3,
        Seedance20FastRatio::Portrait3x4,
        Seedance20FastRatio::UltraWide21x9,
        Seedance20FastRatio::Adaptive,
      ];
      let base = make_request(Some(10), Some(Seedance20FastResolution::SevenTwentyP))
        .calculate_cost_in_cents();
      for ratio in ratios {
        let mut request = make_request(Some(10), Some(Seedance20FastResolution::SevenTwentyP));
        request.ratio = Some(ratio);
        assert_eq!(request.calculate_cost_in_cents(), base, "{ratio:?}");
      }
    }
  }

  mod comparison_tests {
    use super::*;

    #[test]
    fn fast_is_cheaper_than_standard_at_720p() {
      use crate::requests::api::video::seedance_2_0_260128::api::{
        Seedance20Request, Seedance20Resolution,
      };
      use crate::traits::gmicloud_request_cost_calculator_trait::GmiCloudRequestCostCalculator;

      let standard = Seedance20Request {
        prompt: "test".to_string(),
        duration: Some(10),
        resolution: Some(Seedance20Resolution::SevenTwentyP),
        ratio: None,
        seed: None,
        watermark: None,
        generate_audio: None,
        web_search: None,
        first_frame: None,
        last_frame: None,
        reference_images: None,
        reference_videos: None,
        reference_audios: None,
        reference_asset_ids: None,
      };

      let fast = make_request(Some(10), Some(Seedance20FastResolution::SevenTwentyP));

      assert!(
        fast.calculate_cost_in_cents() < standard.calculate_cost_in_cents(),
        "Fast 720p ({}¢) should be cheaper than Standard 720p ({}¢)",
        fast.calculate_cost_in_cents(),
        standard.calculate_cost_in_cents(),
      );
    }

    #[test]
    fn higher_resolution_costs_more() {
      let cost_480 = make_request(Some(10), Some(Seedance20FastResolution::FourEightyP))
        .calculate_cost_in_cents();
      let cost_720 = make_request(Some(10), Some(Seedance20FastResolution::SevenTwentyP))
        .calculate_cost_in_cents();
      assert!(cost_480 < cost_720, "480p ({}¢) should be cheaper than 720p ({}¢)", cost_480, cost_720);
    }
  }
}
