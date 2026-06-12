use enums::common::generation::common_resolution::CommonResolution;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::artcraft::seedance_2p0_fast::request::ArtcraftSeedance2p0FastRequestState;

// -- Pricing constants --
//
// ArtCraft credits: 100 credits = $1.00. Credits always equal USD cents.
//
// The per-second USD cost varies by resolution. We derive cents from the
// upstream credit rates and their credit-package prices, then set
// ArtCraft credits = cents.

/// USD cents per second by resolution, derived from upstream Fast rates:
///   480p:  10 upstream-credits/sec / 193 upstream-credits/$1 * 100 ~= 5.181 c/s
///   (historical 193 credits/$1 derivation; the upstream package is now
///   ~243 credits/$1 but user pricing is intentionally unchanged)
///   720p:  28 upstream-credits/sec / 220 upstream-credits/$1 * 100 ~= 12.727 c/s
///
/// We keep these as f64 because per-second rates are fractional; rounding
/// happens once at the end after multiplying by duration * batch.
const CENTS_PER_SECOND_480P: f64 = 5.181;
const CENTS_PER_SECOND_720P: f64 = 12.727;

pub struct ArtcraftSeedance2p0FastCostState {
  pub resolution: CommonResolution,
  pub duration_seconds: u16,
  pub batch_count: u16,
  pub has_video_reference: bool,
}

impl ArtcraftSeedance2p0FastCostState {
  pub fn from_request(request: &ArtcraftSeedance2p0FastRequestState) -> Self {
    let resolution = request.request.resolution
      .unwrap_or(CommonResolution::SevenTwentyP);
    let duration_seconds = request.request.duration_seconds.unwrap_or(5);
    let batch_count = request.request.video_batch_count.unwrap_or(1);
    let has_video_reference = request.request.reference_video_media_tokens
      .as_ref()
      .is_some_and(|tokens| !tokens.is_empty());

    Self { resolution, duration_seconds, batch_count, has_video_reference }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    let cents_per_second = match self.resolution {
      CommonResolution::FourEightyP => CENTS_PER_SECOND_480P,
      // Everything else (including 720p and unsupported resolutions) prices at 720p.
      _ => CENTS_PER_SECOND_720P,
    };

    let usd_cents = (self.duration_seconds as f64 * cents_per_second * self.batch_count as f64).round() as u64;

    // ArtCraft credits: 100 credits = $1.00, so credits = cents.
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

  // -- 720p pricing --

  mod pricing_720p {
    use super::*;

    #[test]
    fn batch_1() {
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 4, 1), 51);
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 5, 1), 64);
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 10, 1), 127);
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 15, 1), 191);
    }

    #[test]
    fn batch_2() {
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 4, 2), 102);
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 5, 2), 127);
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 15, 2), 382);
    }

    #[test]
    fn batch_4() {
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 4, 4), 204);
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 5, 4), 255);
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 15, 4), 764);
    }

    #[test]
    fn none_defaults_to_720p() {
      assert_eq!(cost_cents(None, 5, 1), cost_cents(Some(RouterResolution::SevenTwentyP), 5, 1));
    }
  }

  // -- 480p pricing --

  mod pricing_480p {
    use super::*;

    #[test]
    fn batch_1() {
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 4, 1), 21);
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 5, 1), 26);
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 10, 1), 52);
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 15, 1), 78);
    }

    #[test]
    fn batch_2() {
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 5, 2), 52);
    }

    #[test]
    fn batch_4() {
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 5, 4), 104);
    }
  }

  // -- Relative pricing --

  mod relative_pricing_tests {
    use super::*;

    #[test]
    fn cost_480p_cheaper_than_720p() {
      let c480 = cost_cents(Some(RouterResolution::FourEightyP), 5, 1);
      let c720 = cost_cents(Some(RouterResolution::SevenTwentyP), 5, 1);
      assert!(c480 < c720, "480p ({}) should be cheaper than 720p ({})", c480, c720);
    }

    #[test]
    fn cost_scales_with_duration() {
      let c4 = cost_cents(Some(RouterResolution::SevenTwentyP), 4, 1);
      let c10 = cost_cents(Some(RouterResolution::SevenTwentyP), 10, 1);
      let c15 = cost_cents(Some(RouterResolution::SevenTwentyP), 15, 1);
      assert!(c4 < c10);
      assert!(c10 < c15);
    }

    #[test]
    fn cost_scales_with_batch() {
      let b1 = cost_cents(Some(RouterResolution::SevenTwentyP), 5, 1);
      let b2 = cost_cents(Some(RouterResolution::SevenTwentyP), 5, 2);
      let b4 = cost_cents(Some(RouterResolution::SevenTwentyP), 5, 4);
      assert!(b1 < b2);
      assert!(b2 < b4);
    }
  }

  // -- Credits equal cents --

  mod credits_tests {
    use super::*;

    #[test]
    fn credits_equal_usd_cents_all_combos() {
      let resolutions = [
        Some(RouterResolution::FourEightyP),
        Some(RouterResolution::SevenTwentyP),
        None,
      ];
      for res in resolutions {
        for dur in [4, 5, 10, 15] {
          for batch in [1, 2, 4] {
            let cost = build_cost(res, dur, batch);
            assert_eq!(
              cost.cost_in_credits, cost.cost_in_usd_cents,
              "credits should equal cents for res={:?} dur={}s batch={}",
              res, dur, batch,
            );
          }
        }
      }
    }
  }

  // -- Cross-check with Kinovi Fast via builder --

  //mod cross_check_with_kinovi {
  //  use super::*;
  //
  //  #[test]
  //  fn artcraft_fast_matches_kinovi_fast_all_combos() {
  //    let resolutions = [
  //      Some(RouterResolution::FourEightyP),
  //      Some(RouterResolution::SevenTwentyP),
  //      None,
  //    ];
  //    let durations: [u16; 4] = [4, 5, 10, 15];
  //    let batches: [u16; 3] = [1, 2, 4];
  //
  //    for res in &resolutions {
  //      for dur in &durations {
  //        for batch in &batches {
  //          let artcraft_cost = build_cost(*res, *dur, *batch);
  //
  //          let kinovi = GenerateVideoRequestBuilder {
  //            model: RouterVideoModel::Seedance2p0Fast,
  //            provider: RouterProvider::Seedance2Pro,
  //            resolution: *res,
  //            duration_seconds: Some(*dur),
  //            video_batch_count: Some(*batch),
  //            ..Default::default()
  //          };
  //          let kinovi_cost = kinovi.build2()
  //            .expect("kinovi build2")
  //            .estimate_cost()
  //            .expect("kinovi estimate_cost");
  //
  //          assert_eq!(
  //            artcraft_cost.cost_in_usd_cents, kinovi_cost.cost_in_usd_cents,
  //            "USD cents mismatch: res={:?} dur={}s batch={}",
  //            res, dur, batch,
  //          );
  //        }
  //      }
  //    }
  //  }
  //}

  // -- Price comparison with Kinovi, case by case --
  //
  // This model runs on Kinovi Seedance 2.0 Fast (RouterVideoModel::Seedance2p0Fast).
  // Every combination of resolution (480p/720p), duration (4/5/10/15s), and
  // video references (with/without), at batch 1.
  // Split into the combos where the artcraft user price covers the cost
  // (with the exact margin) and the combos where it does not (exact shortfall).

  mod price_comparison_tests {
    use speculoos::prelude::*;
    use tokens::tokens::media_files::MediaFileToken;

    use crate::api::router_video_model::RouterVideoModel;
    use crate::api::video_list_ref::VideoListRef;
    use super::*;

    #[test]
    fn kinovi_cost_covered_by_artcraft_price() {
      // -- 720p, no video references --

      let prices = compare_prices(RouterResolution::SevenTwentyP, Duration(4), VideoReferences(false));
      asserting("720p 4s no-ref: kinovi cost is below the artcraft price")
        .that(&prices.kinovi_usd_cents).is_less_than(prices.artcraft_usd_cents);
      asserting("720p 4s no-ref: margin is 4 cents")
        .that(&(prices.artcraft_usd_cents - prices.kinovi_usd_cents)).is_equal_to(4);

      let prices = compare_prices(RouterResolution::SevenTwentyP, Duration(5), VideoReferences(false));
      asserting("720p 5s no-ref: kinovi cost is below the artcraft price")
        .that(&prices.kinovi_usd_cents).is_less_than(prices.artcraft_usd_cents);
      asserting("720p 5s no-ref: margin is 6 cents")
        .that(&(prices.artcraft_usd_cents - prices.kinovi_usd_cents)).is_equal_to(6);

      let prices = compare_prices(RouterResolution::SevenTwentyP, Duration(10), VideoReferences(false));
      asserting("720p 10s no-ref: kinovi cost is below the artcraft price")
        .that(&prices.kinovi_usd_cents).is_less_than(prices.artcraft_usd_cents);
      asserting("720p 10s no-ref: margin is 11 cents")
        .that(&(prices.artcraft_usd_cents - prices.kinovi_usd_cents)).is_equal_to(11);

      let prices = compare_prices(RouterResolution::SevenTwentyP, Duration(15), VideoReferences(false));
      asserting("720p 15s no-ref: kinovi cost is below the artcraft price")
        .that(&prices.kinovi_usd_cents).is_less_than(prices.artcraft_usd_cents);
      asserting("720p 15s no-ref: margin is 18 cents")
        .that(&(prices.artcraft_usd_cents - prices.kinovi_usd_cents)).is_equal_to(18);
    }

    #[test]
    fn kinovi_cost_not_covered_by_artcraft_price() {
      // -- 480p, no video references --

      let prices = compare_prices(RouterResolution::FourEightyP, Duration(4), VideoReferences(false));
      asserting("480p 4s no-ref: kinovi cost exceeds the artcraft price")
        .that(&prices.kinovi_usd_cents).is_greater_than(prices.artcraft_usd_cents);
      asserting("480p 4s no-ref: shortfall is 3 cents")
        .that(&(prices.kinovi_usd_cents - prices.artcraft_usd_cents)).is_equal_to(3);

      let prices = compare_prices(RouterResolution::FourEightyP, Duration(5), VideoReferences(false));
      asserting("480p 5s no-ref: kinovi cost exceeds the artcraft price")
        .that(&prices.kinovi_usd_cents).is_greater_than(prices.artcraft_usd_cents);
      asserting("480p 5s no-ref: shortfall is 3 cents")
        .that(&(prices.kinovi_usd_cents - prices.artcraft_usd_cents)).is_equal_to(3);

      let prices = compare_prices(RouterResolution::FourEightyP, Duration(10), VideoReferences(false));
      asserting("480p 10s no-ref: kinovi cost exceeds the artcraft price")
        .that(&prices.kinovi_usd_cents).is_greater_than(prices.artcraft_usd_cents);
      asserting("480p 10s no-ref: shortfall is 6 cents")
        .that(&(prices.kinovi_usd_cents - prices.artcraft_usd_cents)).is_equal_to(6);

      let prices = compare_prices(RouterResolution::FourEightyP, Duration(15), VideoReferences(false));
      asserting("480p 15s no-ref: kinovi cost exceeds the artcraft price")
        .that(&prices.kinovi_usd_cents).is_greater_than(prices.artcraft_usd_cents);
      asserting("480p 15s no-ref: shortfall is 9 cents")
        .that(&(prices.kinovi_usd_cents - prices.artcraft_usd_cents)).is_equal_to(9);

      // -- 480p, with video references --

      let prices = compare_prices(RouterResolution::FourEightyP, Duration(4), VideoReferences(true));
      asserting("480p 4s with-ref: kinovi cost exceeds the artcraft price")
        .that(&prices.kinovi_usd_cents).is_greater_than(prices.artcraft_usd_cents);
      asserting("480p 4s with-ref: shortfall is 9 cents")
        .that(&(prices.kinovi_usd_cents - prices.artcraft_usd_cents)).is_equal_to(9);

      let prices = compare_prices(RouterResolution::FourEightyP, Duration(5), VideoReferences(true));
      asserting("480p 5s with-ref: kinovi cost exceeds the artcraft price")
        .that(&prices.kinovi_usd_cents).is_greater_than(prices.artcraft_usd_cents);
      asserting("480p 5s with-ref: shortfall is 12 cents")
        .that(&(prices.kinovi_usd_cents - prices.artcraft_usd_cents)).is_equal_to(12);

      let prices = compare_prices(RouterResolution::FourEightyP, Duration(10), VideoReferences(true));
      asserting("480p 10s with-ref: kinovi cost exceeds the artcraft price")
        .that(&prices.kinovi_usd_cents).is_greater_than(prices.artcraft_usd_cents);
      asserting("480p 10s with-ref: shortfall is 23 cents")
        .that(&(prices.kinovi_usd_cents - prices.artcraft_usd_cents)).is_equal_to(23);

      let prices = compare_prices(RouterResolution::FourEightyP, Duration(15), VideoReferences(true));
      asserting("480p 15s with-ref: kinovi cost exceeds the artcraft price")
        .that(&prices.kinovi_usd_cents).is_greater_than(prices.artcraft_usd_cents);
      asserting("480p 15s with-ref: shortfall is 34 cents")
        .that(&(prices.kinovi_usd_cents - prices.artcraft_usd_cents)).is_equal_to(34);

      // -- 720p, with video references --

      let prices = compare_prices(RouterResolution::SevenTwentyP, Duration(4), VideoReferences(true));
      asserting("720p 4s with-ref: kinovi cost exceeds the artcraft price")
        .that(&prices.kinovi_usd_cents).is_greater_than(prices.artcraft_usd_cents);
      asserting("720p 4s with-ref: shortfall is 5 cents")
        .that(&(prices.kinovi_usd_cents - prices.artcraft_usd_cents)).is_equal_to(5);

      let prices = compare_prices(RouterResolution::SevenTwentyP, Duration(5), VideoReferences(true));
      asserting("720p 5s with-ref: kinovi cost exceeds the artcraft price")
        .that(&prices.kinovi_usd_cents).is_greater_than(prices.artcraft_usd_cents);
      asserting("720p 5s with-ref: shortfall is 6 cents")
        .that(&(prices.kinovi_usd_cents - prices.artcraft_usd_cents)).is_equal_to(6);

      let prices = compare_prices(RouterResolution::SevenTwentyP, Duration(10), VideoReferences(true));
      asserting("720p 10s with-ref: kinovi cost exceeds the artcraft price")
        .that(&prices.kinovi_usd_cents).is_greater_than(prices.artcraft_usd_cents);
      asserting("720p 10s with-ref: shortfall is 13 cents")
        .that(&(prices.kinovi_usd_cents - prices.artcraft_usd_cents)).is_equal_to(13);

      let prices = compare_prices(RouterResolution::SevenTwentyP, Duration(15), VideoReferences(true));
      asserting("720p 15s with-ref: kinovi cost exceeds the artcraft price")
        .that(&prices.kinovi_usd_cents).is_greater_than(prices.artcraft_usd_cents);
      asserting("720p 15s with-ref: shortfall is 19 cents")
        .that(&(prices.kinovi_usd_cents - prices.artcraft_usd_cents)).is_equal_to(19);
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
        model: RouterVideoModel::Seedance2p0Fast,
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
    let builder = GenerateVideoRequestBuilder {
      model: RouterVideoModel::Seedance2p0Fast,
      provider: RouterProvider::Artcraft,
      resolution,
      duration_seconds: Some(duration_seconds),
      video_batch_count: Some(video_batch_count),
      ..Default::default()
    };
    builder.build2()
      .expect("build2 should succeed")
      .estimate_cost()
      .expect("estimate_cost should succeed")
  }

  fn cost_cents(
    resolution: Option<RouterResolution>,
    duration_seconds: u16,
    video_batch_count: u16,
  ) -> u64 {
    build_cost(resolution, duration_seconds, video_batch_count)
      .cost_in_usd_cents
      .unwrap()
  }
}
