use artcraft_router::api::router_aspect_ratio::RouterAspectRatio;
use artcraft_router::api::router_resolution::RouterResolution;

use crate::core::commands::generate::generate_video::request::TauriVideoModel;

/// Seedance `ratio` that follows the input frame (or picks one) instead of a fixed shape.
pub const ADAPTIVE_RATIO: &str = "adaptive";

/// ModelArk (ap-southeast) model ids for the Seedance entries in the video catalog, as listed on
/// 2026-09-15. Seedance 1.0 Lite and 1.5 Pro are retired on ModelArk and not offered.
pub fn byteplus_video_model_id(model: TauriVideoModel) -> Option<&'static str> {
  match model {
    TauriVideoModel::Seedance2p0 => Some("dreamina-seedance-2-0-260128"),
    TauriVideoModel::Seedance2p0Fast => Some("dreamina-seedance-2-0-fast-260128"),
    TauriVideoModel::Seedance2p0Mini => Some("dreamina-seedance-2-0-mini-260615"),
    TauriVideoModel::Seedance2p5 => Some("dreamina-seedance-2-5-260628"),
    _ => None,
  }
}

/// Reference images one request may carry.
pub fn max_reference_images(model: TauriVideoModel) -> usize {
  match model {
    TauriVideoModel::Seedance2p5 => 30,
    _ => 9,
  }
}

/// Reference videos one request may carry. The same limit applies to reference audio clips.
pub fn max_reference_videos(model: TauriVideoModel) -> usize {
  match model {
    TauriVideoModel::Seedance2p5 => 10,
    _ => 3,
  }
}

/// The highest resolution each model renders: 4k (10-bit H.265) is base Seedance 2.0 only;
/// 2.5 stops at 1080p, and Fast and Mini at 720p.
pub fn max_resolution(model: TauriVideoModel) -> &'static str {
  match model {
    TauriVideoModel::Seedance2p0 => "4k",
    TauriVideoModel::Seedance2p5 => "1080p",
    _ => "720p",
  }
}

/// Seedance 2.5 keeps a first frame's shape and refuses any `ratio` but `adaptive` with one;
/// the others crop the frame to the chosen ratio.
pub fn first_frame_sets_ratio(model: TauriVideoModel) -> bool {
  matches!(model, TauriVideoModel::Seedance2p5)
}

/// Seedance `ratio`. Anything without a direct equivalent (including "auto") becomes `adaptive`.
pub fn seedance_ratio(maybe_aspect_ratio: Option<RouterAspectRatio>) -> &'static str {
  match maybe_aspect_ratio {
    Some(RouterAspectRatio::WideSixteenByNine) | Some(RouterAspectRatio::Wide) => "16:9",
    Some(RouterAspectRatio::TallNineBySixteen) | Some(RouterAspectRatio::Tall) => "9:16",
    Some(RouterAspectRatio::Square) => "1:1",
    Some(RouterAspectRatio::WideFourByThree) => "4:3",
    Some(RouterAspectRatio::TallThreeByFour) => "3:4",
    Some(RouterAspectRatio::WideTwentyOneByNine) => "21:9",
    _ => ADAPTIVE_RATIO,
  }
}

/// Seedance `resolution`, capped at what the model renders; `None` uses the model default.
pub fn seedance_resolution(model: TauriVideoModel, maybe_resolution: Option<RouterResolution>) -> Option<&'static str> {
  let requested = match maybe_resolution? {
    RouterResolution::FourEightyP => "480p",
    RouterResolution::SevenTwentyP => "720p",
    RouterResolution::TenEightyP => "1080p",
    RouterResolution::FourK => "4k",
    _ => return None,
  };
  let max = max_resolution(model);
  Some(if resolution_rank(requested) <= resolution_rank(max) { requested } else { max })
}

fn resolution_rank(resolution: &str) -> u8 {
  match resolution {
    "480p" => 0,
    "720p" => 1,
    "1080p" => 2,
    _ => 3,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn seedance_2_models_have_modelark_ids() {
    assert_eq!(byteplus_video_model_id(TauriVideoModel::Seedance2p0Mini), Some("dreamina-seedance-2-0-mini-260615"));
    assert_eq!(byteplus_video_model_id(TauriVideoModel::Seedance2p5), Some("dreamina-seedance-2-5-260628"));
    assert_eq!(byteplus_video_model_id(TauriVideoModel::Seedance1p5Pro), None);
    assert_eq!(byteplus_video_model_id(TauriVideoModel::Veo3p1), None);
  }

  #[test]
  fn maps_ratios_and_falls_back_to_adaptive() {
    assert_eq!(seedance_ratio(Some(RouterAspectRatio::WideSixteenByNine)), "16:9");
    assert_eq!(seedance_ratio(Some(RouterAspectRatio::TallNineBySixteen)), "9:16");
    assert_eq!(seedance_ratio(Some(RouterAspectRatio::WideThreeByTwo)), ADAPTIVE_RATIO);
    assert_eq!(seedance_ratio(None), ADAPTIVE_RATIO);
  }

  #[test]
  fn caps_resolutions_per_model() {
    assert_eq!(seedance_resolution(TauriVideoModel::Seedance2p0, Some(RouterResolution::FourK)), Some("4k"));
    assert_eq!(seedance_resolution(TauriVideoModel::Seedance2p5, Some(RouterResolution::FourK)), Some("1080p"));
    assert_eq!(seedance_resolution(TauriVideoModel::Seedance2p0Mini, Some(RouterResolution::TenEightyP)), Some("720p"));
    assert_eq!(seedance_resolution(TauriVideoModel::Seedance2p0Fast, Some(RouterResolution::FourEightyP)), Some("480p"));
    assert_eq!(seedance_resolution(TauriVideoModel::Seedance2p0, Some(RouterResolution::TwoK)), None);
    assert_eq!(seedance_resolution(TauriVideoModel::Seedance2p0, None), None);
  }
}
