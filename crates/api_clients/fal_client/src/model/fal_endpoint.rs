use crate::requests::api::queue::Queue;
use serde::de::DeserializeOwned;
// TODO(bt,2025-05-26): A macro to define these + tests.

const FLUX_PRO_ULTRA_TEXT_TO_IMAGE: &str = "fal-ai/flux-pro/v1.1-ultra";

const HUNYUAN_3D_2_BASE: &str = "fal-ai/hunyuan3d/v2";

const KLING16_IMAGE_TO_VIDEO: &str = "fal-ai/kling-video/v1.6/pro/image-to-video";

const MINIMAX_IMAGE_TO_VIDEO: &str = "fal-ai/minimax/image-to-video";

const RECRAFT_V3_TEXT_TO_IMAGE: &str = "fal-ai/recraft-v3";

#[derive(Clone, Debug)]
pub enum FalEndpoint {
  FluxProUltraTextToImage,
  Hunyuan3d2Base,
  Kling16ImageToVideo,
  Minimax01ImageToVideo,
  RecraftV3TextToImage,
  Other(String),
}

impl FalEndpoint {
  pub fn from_queue_response<R: DeserializeOwned>(queue: &Queue<R>) -> Self {
    match queue.endpoint.as_str() {
      FLUX_PRO_ULTRA_TEXT_TO_IMAGE => FalEndpoint::FluxProUltraTextToImage,
      HUNYUAN_3D_2_BASE => FalEndpoint::Hunyuan3d2Base,
      KLING16_IMAGE_TO_VIDEO => FalEndpoint::Kling16ImageToVideo,
      MINIMAX_IMAGE_TO_VIDEO => FalEndpoint::Minimax01ImageToVideo,
      RECRAFT_V3_TEXT_TO_IMAGE => FalEndpoint::RecraftV3TextToImage,
      _ => FalEndpoint::Other(queue.endpoint.clone()),
    }
  }
  pub fn url(&self) -> &str {
    match self {
      Self::FluxProUltraTextToImage => FLUX_PRO_ULTRA_TEXT_TO_IMAGE,
      Self::Hunyuan3d2Base => HUNYUAN_3D_2_BASE,
      Self::Kling16ImageToVideo => KLING16_IMAGE_TO_VIDEO,
      Self::Minimax01ImageToVideo => MINIMAX_IMAGE_TO_VIDEO,
      Self::RecraftV3TextToImage => RECRAFT_V3_TEXT_TO_IMAGE,
      Self::Other(url) => url,
    }
  }
}
