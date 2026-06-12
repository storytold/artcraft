use enums::common::generation::common_resolution::CommonResolution;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::artcraft::seedance_2p0_bp_fast::request::ArtcraftSeedance2p0BytePlusFastRequestState;

/// USD cents per second by resolution:
///   480p:  $0.09/s = 9.0 ¢/s
///   720p:  $0.20/s = 20.0 ¢/s
const CENTS_PER_SECOND_480P: f64 = 9.0;
const CENTS_PER_SECOND_720P: f64 = 20.0;

pub struct ArtcraftSeedance2p0BytePlusFastCostState {
  pub resolution: CommonResolution,
  pub duration_seconds: u16,
  pub batch_count: u16,
}

impl ArtcraftSeedance2p0BytePlusFastCostState {
  pub fn from_request(request: &ArtcraftSeedance2p0BytePlusFastRequestState) -> Self {
    let resolution = request.request.resolution
      .unwrap_or(CommonResolution::SevenTwentyP);
    let duration_seconds = request.request.duration_seconds.unwrap_or(5);
    let batch_count = request.request.video_batch_count.unwrap_or(1);
    Self { resolution, duration_seconds, batch_count }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    let cents_per_second = match self.resolution {
      CommonResolution::FourEightyP => CENTS_PER_SECOND_480P,
      _ => CENTS_PER_SECOND_720P,
    };

    let usd_cents = (self.duration_seconds as f64 * cents_per_second * self.batch_count as f64).round() as u64;

    VideoGenerationCostEstimate {
      cost_in_credits: Some(usd_cents),
      cost_in_usd_cents: Some(usd_cents),
      is_free: false,
      is_unlimited: false,
      is_rate_limited: false,
      has_watermark: false,
      failures_are_refunded: None,
    }
  }
}

#[cfg(test)]
mod tests {
  use crate::api::router_resolution::RouterResolution;
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;

  mod pricing_720p {
    use super::*;

    #[test]
    fn batch_1() {
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 4, 1), 80);
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 5, 1), 100);
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 10, 1), 200);
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 15, 1), 300);
    }

    #[test]
    fn batch_2() {
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 5, 2), 200);
    }

    #[test]
    fn batch_4() {
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 5, 4), 400);
    }

    #[test]
    fn none_defaults_to_720p() {
      assert_eq!(cost_cents(None, 5, 1), cost_cents(Some(RouterResolution::SevenTwentyP), 5, 1));
    }
  }

  mod pricing_480p {
    use super::*;

    #[test]
    fn batch_1() {
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 4, 1), 36);
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 5, 1), 45);
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 10, 1), 90);
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 15, 1), 135);
    }

    #[test]
    fn batch_2() {
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 5, 2), 90);
    }

    #[test]
    fn batch_4() {
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 5, 4), 180);
    }
  }

  mod relative_pricing_tests {
    use super::*;

    #[test]
    fn cost_480p_cheaper_than_720p() {
      assert!(cost_cents(Some(RouterResolution::FourEightyP), 5, 1) < cost_cents(Some(RouterResolution::SevenTwentyP), 5, 1));
    }
  }

  mod credits_tests {
    use super::*;

    #[test]
    fn credits_equal_usd_cents() {
      for res in [Some(RouterResolution::FourEightyP), Some(RouterResolution::SevenTwentyP), None] {
        for dur in [4, 5, 10, 15] {
          for batch in [1, 2, 4] {
            let cost = build_cost(res, dur, batch);
            assert_eq!(cost.cost_in_credits, cost.cost_in_usd_cents);
          }
        }
      }
    }
  }

  // -- Price comparison with Kinovi, case by case --
  //
  // This model runs on Kinovi Seedance 2.0 Fast (RouterVideoModel::Seedance2p0Fast).
  // Every combination of resolution (480p/720p), duration (4/5/10/15s), and
  // video references (with/without), at batch 1.
  // Every combination is profitable — there is no not-covered group.

  mod price_comparison_tests {
    use speculoos::prelude::*;
    use tokens::tokens::media_files::MediaFileToken;

    use crate::api::video_list_ref::VideoListRef;
    use super::*;

    #[test]
    fn kinovi_cost_covered_by_artcraft_price() {
      // -- 480p, no video references --

      let prices = compare_prices(RouterResolution::FourEightyP, Duration(4), VideoReferences(false));
      asserting("480p 4s no-ref: kinovi cost is below the artcraft price")
        .that(&prices.kinovi_usd_cents).is_less_than(prices.artcraft_usd_cents);
      asserting("480p 4s no-ref: margin is 11 cents")
        .that(&(prices.artcraft_usd_cents - prices.kinovi_usd_cents)).is_equal_to(11);

      let prices = compare_prices(RouterResolution::FourEightyP, Duration(5), VideoReferences(false));
      asserting("480p 5s no-ref: kinovi cost is below the artcraft price")
        .that(&prices.kinovi_usd_cents).is_less_than(prices.artcraft_usd_cents);
      asserting("480p 5s no-ref: margin is 14 cents")
        .that(&(prices.artcraft_usd_cents - prices.kinovi_usd_cents)).is_equal_to(14);

      let prices = compare_prices(RouterResolution::FourEightyP, Duration(10), VideoReferences(false));
      asserting("480p 10s no-ref: kinovi cost is below the artcraft price")
        .that(&prices.kinovi_usd_cents).is_less_than(prices.artcraft_usd_cents);
      asserting("480p 10s no-ref: margin is 29 cents")
        .that(&(prices.artcraft_usd_cents - prices.kinovi_usd_cents)).is_equal_to(29);

      let prices = compare_prices(RouterResolution::FourEightyP, Duration(15), VideoReferences(false));
      asserting("480p 15s no-ref: kinovi cost is below the artcraft price")
        .that(&prices.kinovi_usd_cents).is_less_than(prices.artcraft_usd_cents);
      asserting("480p 15s no-ref: margin is 44 cents")
        .that(&(prices.artcraft_usd_cents - prices.kinovi_usd_cents)).is_equal_to(44);

      // -- 720p, no video references --

      let prices = compare_prices(RouterResolution::SevenTwentyP, Duration(4), VideoReferences(false));
      asserting("720p 4s no-ref: kinovi cost is below the artcraft price")
        .that(&prices.kinovi_usd_cents).is_less_than(prices.artcraft_usd_cents);
      asserting("720p 4s no-ref: margin is 31 cents")
        .that(&(prices.artcraft_usd_cents - prices.kinovi_usd_cents)).is_equal_to(31);

      let prices = compare_prices(RouterResolution::SevenTwentyP, Duration(5), VideoReferences(false));
      asserting("720p 5s no-ref: kinovi cost is below the artcraft price")
        .that(&prices.kinovi_usd_cents).is_less_than(prices.artcraft_usd_cents);
      asserting("720p 5s no-ref: margin is 39 cents")
        .that(&(prices.artcraft_usd_cents - prices.kinovi_usd_cents)).is_equal_to(39);

      let prices = compare_prices(RouterResolution::SevenTwentyP, Duration(10), VideoReferences(false));
      asserting("720p 10s no-ref: kinovi cost is below the artcraft price")
        .that(&prices.kinovi_usd_cents).is_less_than(prices.artcraft_usd_cents);
      asserting("720p 10s no-ref: margin is 78 cents")
        .that(&(prices.artcraft_usd_cents - prices.kinovi_usd_cents)).is_equal_to(78);

      let prices = compare_prices(RouterResolution::SevenTwentyP, Duration(15), VideoReferences(false));
      asserting("720p 15s no-ref: kinovi cost is below the artcraft price")
        .that(&prices.kinovi_usd_cents).is_less_than(prices.artcraft_usd_cents);
      asserting("720p 15s no-ref: margin is 118 cents")
        .that(&(prices.artcraft_usd_cents - prices.kinovi_usd_cents)).is_equal_to(118);

      // -- 480p, with video references --

      let prices = compare_prices(RouterResolution::FourEightyP, Duration(4), VideoReferences(true));
      asserting("480p 4s with-ref: kinovi cost is below the artcraft price")
        .that(&prices.kinovi_usd_cents).is_less_than(prices.artcraft_usd_cents);
      asserting("480p 4s with-ref: margin is 4 cents")
        .that(&(prices.artcraft_usd_cents - prices.kinovi_usd_cents)).is_equal_to(4);

      let prices = compare_prices(RouterResolution::FourEightyP, Duration(5), VideoReferences(true));
      asserting("480p 5s with-ref: kinovi cost is below the artcraft price")
        .that(&prices.kinovi_usd_cents).is_less_than(prices.artcraft_usd_cents);
      asserting("480p 5s with-ref: margin is 6 cents")
        .that(&(prices.artcraft_usd_cents - prices.kinovi_usd_cents)).is_equal_to(6);

      let prices = compare_prices(RouterResolution::FourEightyP, Duration(10), VideoReferences(true));
      asserting("480p 10s with-ref: kinovi cost is below the artcraft price")
        .that(&prices.kinovi_usd_cents).is_less_than(prices.artcraft_usd_cents);
      asserting("480p 10s with-ref: margin is 12 cents")
        .that(&(prices.artcraft_usd_cents - prices.kinovi_usd_cents)).is_equal_to(12);

      let prices = compare_prices(RouterResolution::FourEightyP, Duration(15), VideoReferences(true));
      asserting("480p 15s with-ref: kinovi cost is below the artcraft price")
        .that(&prices.kinovi_usd_cents).is_less_than(prices.artcraft_usd_cents);
      asserting("480p 15s with-ref: margin is 18 cents")
        .that(&(prices.artcraft_usd_cents - prices.kinovi_usd_cents)).is_equal_to(18);

      // -- 720p, with video references --

      let prices = compare_prices(RouterResolution::SevenTwentyP, Duration(4), VideoReferences(true));
      asserting("720p 4s with-ref: kinovi cost is below the artcraft price")
        .that(&prices.kinovi_usd_cents).is_less_than(prices.artcraft_usd_cents);
      asserting("720p 4s with-ref: margin is 21 cents")
        .that(&(prices.artcraft_usd_cents - prices.kinovi_usd_cents)).is_equal_to(21);

      let prices = compare_prices(RouterResolution::SevenTwentyP, Duration(5), VideoReferences(true));
      asserting("720p 5s with-ref: kinovi cost is below the artcraft price")
        .that(&prices.kinovi_usd_cents).is_less_than(prices.artcraft_usd_cents);
      asserting("720p 5s with-ref: margin is 26 cents")
        .that(&(prices.artcraft_usd_cents - prices.kinovi_usd_cents)).is_equal_to(26);

      let prices = compare_prices(RouterResolution::SevenTwentyP, Duration(10), VideoReferences(true));
      asserting("720p 10s with-ref: kinovi cost is below the artcraft price")
        .that(&prices.kinovi_usd_cents).is_less_than(prices.artcraft_usd_cents);
      asserting("720p 10s with-ref: margin is 52 cents")
        .that(&(prices.artcraft_usd_cents - prices.kinovi_usd_cents)).is_equal_to(52);

      let prices = compare_prices(RouterResolution::SevenTwentyP, Duration(15), VideoReferences(true));
      asserting("720p 15s with-ref: kinovi cost is below the artcraft price")
        .that(&prices.kinovi_usd_cents).is_less_than(prices.artcraft_usd_cents);
      asserting("720p 15s with-ref: margin is 79 cents")
        .that(&(prices.artcraft_usd_cents - prices.kinovi_usd_cents)).is_equal_to(79);
    }

    // -- Helpers --

    struct ComparedPrices {
      kinovi_usd_cents: u64,
      artcraft_usd_cents: u64,
    }

    struct Duration(u16);

    struct VideoReferences(bool);

    /// Estimate the same generation (batch 1) through both providers and
    /// return the two USD-cent prices side by side.
    fn compare_prices(
      resolution: RouterResolution,
      duration: Duration,
      video_references: VideoReferences,
    ) -> ComparedPrices {
      let artcraft = GenerateVideoRequestBuilder {
        model: RouterVideoModel::Seedance2p0BytePlusFast,
        provider: RouterProvider::Artcraft,
        resolution: Some(resolution),
        duration_seconds: Some(duration.0),
        video_batch_count: Some(1),
        // The artcraft provider only accepts media file tokens.
        reference_videos: video_references.0.then(|| VideoListRef::MediaFileTokens(vec![
          MediaFileToken::new("mf_ref_video".to_string()),
        ])),
        ..Default::default()
      };
      let artcraft_cost = artcraft.build2()
        .expect("artcraft build2")
        .estimate_cost()
        .expect("artcraft estimate_cost");

      let kinovi = GenerateVideoRequestBuilder {
        model: RouterVideoModel::Seedance2p0Fast,
        provider: RouterProvider::Seedance2Pro,
        resolution: Some(resolution),
        duration_seconds: Some(duration.0),
        video_batch_count: Some(1),
        reference_videos: video_references.0.then(|| VideoListRef::Urls(vec![
          "https://example.com/ref.mp4".to_string(),
        ])),
        ..Default::default()
      };
      let kinovi_cost = kinovi.build2()
        .expect("kinovi build2")
        .estimate_cost()
        .expect("kinovi estimate_cost");

      ComparedPrices {
        kinovi_usd_cents: kinovi_cost.cost_in_usd_cents.expect("kinovi cents"),
        artcraft_usd_cents: artcraft_cost.cost_in_usd_cents.expect("artcraft cents"),
      }
    }
  }

  // -- Helpers --

  fn build_cost(
    resolution: Option<RouterResolution>,
    duration_seconds: u16,
    video_batch_count: u16,
  ) -> crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate {
    GenerateVideoRequestBuilder {
      model: RouterVideoModel::Seedance2p0BytePlusFast,
      provider: RouterProvider::Artcraft,
      resolution,
      duration_seconds: Some(duration_seconds),
      video_batch_count: Some(video_batch_count),
      ..Default::default()
    }.build2().expect("build2").estimate_cost().expect("estimate_cost")
  }

  fn cost_cents(resolution: Option<RouterResolution>, duration_seconds: u16, video_batch_count: u16) -> u64 {
    build_cost(resolution, duration_seconds, video_batch_count).cost_in_usd_cents.unwrap()
  }
}
