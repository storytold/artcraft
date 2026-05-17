use crate::requests::api::video::seedance_2_0_260128::api::{
  Seedance20Request, Seedance20Resolution,
};
use crate::traits::gmicloud_request_cost_calculator_trait::{
  GmiCloudRequestCostCalculator, UsdCents,
};

impl GmiCloudRequestCostCalculator for Seedance20Request {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    let duration_seconds = self.effective_duration_seconds() as u64;

    // Cost per second in US cents, by resolution.
    // Observed from GmiCloud billing:
    //   480p:  $0.024/s = 2.4 ¢/s
    //   720p:  $0.052/s = 5.2 ¢/s (default)
    //   1080p: $0.116/s = 11.6 ¢/s
    let cents_per_second: f64 = match self.resolution {
      Some(Seedance20Resolution::FourEightyP) => 2.4,
      Some(Seedance20Resolution::SevenTwentyP) | None => 5.2,
      Some(Seedance20Resolution::TenEightyP) => 11.6,
    };

    (cents_per_second * duration_seconds as f64).ceil() as u64
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::video::seedance_2_0_260128::api::Seedance20Ratio;

  fn make_request(duration: Option<u8>, resolution: Option<Seedance20Resolution>) -> Seedance20Request {
    Seedance20Request {
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
      // 720p: 5.2 * 5 = 26 ¢
      assert_eq!(make_request(None, None).calculate_cost_in_cents(), 26);
    }

    #[test]
    fn cost_default_10s() {
      // 5.2 * 10 = 52 ¢
      assert_eq!(make_request(Some(10), None).calculate_cost_in_cents(), 52);
    }

    #[test]
    fn cost_default_15s() {
      // 5.2 * 15 = 78 ¢
      assert_eq!(make_request(Some(15), None).calculate_cost_in_cents(), 78);
    }
  }

  mod resolution_480p_tests {
    use super::*;

    #[test]
    fn cost_480p_5s() {
      // 2.4 * 5 = 12 ¢
      assert_eq!(make_request(Some(5), Some(Seedance20Resolution::FourEightyP)).calculate_cost_in_cents(), 12);
    }

    #[test]
    fn cost_480p_10s() {
      // 2.4 * 10 = 24 ¢
      assert_eq!(make_request(Some(10), Some(Seedance20Resolution::FourEightyP)).calculate_cost_in_cents(), 24);
    }

    #[test]
    fn cost_480p_15s() {
      // 2.4 * 15 = 36 ¢
      assert_eq!(make_request(Some(15), Some(Seedance20Resolution::FourEightyP)).calculate_cost_in_cents(), 36);
    }
  }

  mod resolution_720p_tests {
    use super::*;

    #[test]
    fn cost_720p_5s() {
      // 5.2 * 5 = 26 ¢
      assert_eq!(make_request(Some(5), Some(Seedance20Resolution::SevenTwentyP)).calculate_cost_in_cents(), 26);
    }

    #[test]
    fn cost_720p_10s() {
      // 5.2 * 10 = 52 ¢
      assert_eq!(make_request(Some(10), Some(Seedance20Resolution::SevenTwentyP)).calculate_cost_in_cents(), 52);
    }

    #[test]
    fn cost_720p_15s() {
      // 5.2 * 15 = 78 ¢
      assert_eq!(make_request(Some(15), Some(Seedance20Resolution::SevenTwentyP)).calculate_cost_in_cents(), 78);
    }
  }

  mod resolution_1080p_tests {
    use super::*;

    #[test]
    fn cost_1080p_5s() {
      // 11.6 * 5 = 58 ¢
      assert_eq!(make_request(Some(5), Some(Seedance20Resolution::TenEightyP)).calculate_cost_in_cents(), 58);
    }

    #[test]
    fn cost_1080p_10s() {
      // 11.6 * 10 = 116 ¢
      assert_eq!(make_request(Some(10), Some(Seedance20Resolution::TenEightyP)).calculate_cost_in_cents(), 116);
    }

    #[test]
    fn cost_1080p_15s() {
      // 11.6 * 15 = 174 ¢
      assert_eq!(make_request(Some(15), Some(Seedance20Resolution::TenEightyP)).calculate_cost_in_cents(), 174);
    }
  }

  mod ratio_independence_tests {
    use super::*;

    #[test]
    fn cost_is_independent_of_ratio() {
      let ratios = [
        Seedance20Ratio::Landscape16x9,
        Seedance20Ratio::Portrait9x16,
        Seedance20Ratio::Square,
        Seedance20Ratio::Standard4x3,
        Seedance20Ratio::Portrait3x4,
        Seedance20Ratio::UltraWide21x9,
        Seedance20Ratio::Adaptive,
      ];
      let base = make_request(Some(10), Some(Seedance20Resolution::SevenTwentyP))
        .calculate_cost_in_cents();
      for ratio in ratios {
        let mut request = make_request(Some(10), Some(Seedance20Resolution::SevenTwentyP));
        request.ratio = Some(ratio);
        assert_eq!(request.calculate_cost_in_cents(), base, "{ratio:?}");
      }
    }
  }
}
