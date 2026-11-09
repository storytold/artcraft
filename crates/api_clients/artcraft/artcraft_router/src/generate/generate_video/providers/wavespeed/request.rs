use wavespeed_client::{GenerateVideoRequest as GenerateVideoRequestWaveSpeed, VideoModel};

use crate::client::router_wavespeed_client::RouterWaveSpeedClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{GenerateVideoResponse, WaveSpeedVideoResponsePayload};

#[derive(Clone, Debug)]
pub struct WaveSpeedVideoRequest {
  pub model: VideoModel,
  pub request: GenerateVideoRequestWaveSpeed,
}

impl WaveSpeedVideoRequest {
  pub async fn send(&self, client: &RouterWaveSpeedClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    let prediction = client.generate_video(self.model, &self.request).await.map_err(ProviderError::WaveSpeed)?;
    Ok(GenerateVideoResponse::WaveSpeed(WaveSpeedVideoResponsePayload { prediction_id: prediction.id }))
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  #[ignore = "Creates a paid WaveSpeed video prediction; requires WAVESPEED_API_KEY"]
  async fn live_minimax_h3_submission() {
    let api_key = std::env::var("WAVESPEED_API_KEY").expect("WAVESPEED_API_KEY must be set explicitly");
    let client = RouterWaveSpeedClient::new(&api_key).unwrap();
    let request = WaveSpeedVideoRequest { model: VideoModel::MinimaxH3, request: GenerateVideoRequestWaveSpeed { prompt: "A calm ocean wave at sunrise".into(), duration: 4, maybe_resolution: Some("2k".into()), ..Default::default() } };
    assert!(matches!(request.send(&client).await.unwrap(), GenerateVideoResponse::WaveSpeed(_)));
  }
}
