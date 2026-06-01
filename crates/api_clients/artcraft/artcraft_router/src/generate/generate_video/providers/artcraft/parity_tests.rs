//! Cost-parity tests: the BPU (BytePlus Ultra) variants must price identically to
//! the BP (BytePlus) variants across every (resolution × duration × batch) combo.
//!
//! When BPU and BP pricing must diverge in the future, these tests should be
//! intentionally adjusted and split rather than relaxed.

use crate::api::router_provider::RouterProvider;
use crate::api::router_resolution::RouterResolution;
use crate::api::router_video_model::RouterVideoModel;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

const RESOLUTIONS: [Option<RouterResolution>; 4] = [
  None,
  Some(RouterResolution::FourEightyP),
  Some(RouterResolution::SevenTwentyP),
  Some(RouterResolution::TenEightyP),
];

/// Durations spanning the supported window (1..=15 seconds) plus over-the-cap
/// inputs that exercise duration clamping in the builder.
const DURATIONS: [u16; 17] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 30, 99];

const BATCHES: [u16; 4] = [1, 2, 3, 4];

mod seedance_2p0_bpu_matches_seedance_2p0_bp {
  use super::*;

  #[test]
  fn cost_parity_across_all_combos() {
    for &res in &RESOLUTIONS {
      for &dur in &DURATIONS {
        for &batch in &BATCHES {
          let bp = cost_cents(RouterVideoModel::Seedance2p0BytePlus, res, dur, batch);
          let bpu = cost_cents(RouterVideoModel::Seedance2p0BytePlusUltra, res, dur, batch);
          assert_eq!(
            bpu, bp,
            "cost mismatch at res={:?} dur={} batch={}: bp={} bpu={}",
            res, dur, batch, bp, bpu,
          );
        }
      }
    }
  }

  #[test]
  fn credits_parity_across_all_combos() {
    for &res in &RESOLUTIONS {
      for &dur in &DURATIONS {
        for &batch in &BATCHES {
          let bp = build_cost(RouterVideoModel::Seedance2p0BytePlus, res, dur, batch);
          let bpu = build_cost(RouterVideoModel::Seedance2p0BytePlusUltra, res, dur, batch);
          assert_eq!(
            bpu.cost_in_credits, bp.cost_in_credits,
            "credit mismatch at res={:?} dur={} batch={}",
            res, dur, batch,
          );
        }
      }
    }
  }
}

mod seedance_2p0_bpu_fast_matches_seedance_2p0_bp_fast {
  use super::*;

  #[test]
  fn cost_parity_across_all_combos() {
    for &res in &RESOLUTIONS {
      for &dur in &DURATIONS {
        for &batch in &BATCHES {
          let bp = cost_cents(RouterVideoModel::Seedance2p0BytePlusFast, res, dur, batch);
          let bpu = cost_cents(RouterVideoModel::Seedance2p0BytePlusUltraFast, res, dur, batch);
          assert_eq!(
            bpu, bp,
            "cost mismatch at res={:?} dur={} batch={}: bp_fast={} bpu_fast={}",
            res, dur, batch, bp, bpu,
          );
        }
      }
    }
  }

  #[test]
  fn credits_parity_across_all_combos() {
    for &res in &RESOLUTIONS {
      for &dur in &DURATIONS {
        for &batch in &BATCHES {
          let bp = build_cost(RouterVideoModel::Seedance2p0BytePlusFast, res, dur, batch);
          let bpu = build_cost(RouterVideoModel::Seedance2p0BytePlusUltraFast, res, dur, batch);
          assert_eq!(
            bpu.cost_in_credits, bp.cost_in_credits,
            "credit mismatch at res={:?} dur={} batch={}",
            res, dur, batch,
          );
        }
      }
    }
  }
}

fn build_cost(
  model: RouterVideoModel,
  resolution: Option<RouterResolution>,
  duration_seconds: u16,
  video_batch_count: u16,
) -> VideoGenerationCostEstimate {
  GenerateVideoRequestBuilder {
    model,
    provider: RouterProvider::Artcraft,
    resolution,
    duration_seconds: Some(duration_seconds),
    video_batch_count: Some(video_batch_count),
    ..Default::default()
  }
  .build2()
  .expect("build2 should succeed")
  .estimate_cost()
  .expect("estimate_cost should succeed")
}

fn cost_cents(
  model: RouterVideoModel,
  resolution: Option<RouterResolution>,
  duration_seconds: u16,
  video_batch_count: u16,
) -> u64 {
  build_cost(model, resolution, duration_seconds, video_batch_count)
    .cost_in_usd_cents
    .expect("cost_in_usd_cents should be Some")
}
