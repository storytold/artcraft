use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;

use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_response::GenerateVideoResponse;
use crate::generate::generate_video::providers::artcraft::request_common::send_artcraft_omni_video_request;

#[derive(Clone, Debug)]
pub struct ArtcraftGrokImagineVideo1p5RequestState {
  pub request: OmniGenVideoCostAndGenerateRequest,
}

impl ArtcraftGrokImagineVideo1p5RequestState {
  pub async fn send(&self, client: &RouterArtcraftClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    // xAI's v1.5 model rejects text-to-video at the server. This is the
    // GENERATION-time guard — `build()` and `estimate_cost()` deliberately
    // allow image-less states so the cost path can quote a request the user
    // is still composing. Bouncing here costs nothing and avoids an upstream
    // call we know will fail.
    if self.request.start_frame_image_media_token.is_none()
      && self.request.reference_image_media_tokens.as_ref().map_or(true, |v| v.is_empty())
    {
      return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
        field: "image_inputs",
        value: "text-to-video isn't supported by grok-imagine-video-1.5; supply a start_frame or at least one reference image".to_string(),
      }));
    }

    send_artcraft_omni_video_request(&self.request, client).await
  }
}

#[cfg(test)]
mod tests {
  use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
  use artcraft_client::utils::api_host::ApiHost;
  use enums::common::generation::common_video_model::CommonVideoModel as CommonVideoModelEnum;

  use super::*;

  /// Generation must never reach xAI with an image-less v1.5 request. The
  /// build/cost layers allow that state (the cost path quotes it), so the
  /// send-time guard is the router's last line of defense.
  #[tokio::test]
  async fn send_rejects_image_less_request_before_any_network_call() {
    let state = ArtcraftGrokImagineVideo1p5RequestState {
      request: OmniGenVideoCostAndGenerateRequest {
        idempotency_token: Some("a1b2c3d4-e5f6-7890-abcd-ef1234567890".to_string()),
        model: Some(CommonVideoModelEnum::GrokImagineVideo1p5),
        prompt: Some("a corgi running through a field".to_string()),
        negative_prompt: None,
        start_frame_image_media_token: None,
        end_frame_image_media_token: None,
        reference_image_media_tokens: None,
        reference_video_media_tokens: None,
        reference_audio_media_tokens: None,
        reference_character_tokens: None,
        resolution: None,
        aspect_ratio: None,
        bitrate: None,
        quality: None,
        duration_seconds: Some(5),
        video_batch_count: Some(1),
        generate_audio: None,
      },
    };

    // The guard fires before the client is used, so an unroutable localhost
    // client with empty credentials proves no network call happens.
    let client = RouterArtcraftClient::new(
      ApiHost::Localhost { port: 1 },
      StorytellerCredentialSet::empty(),
    );

    let err = state.send(&client).await.expect_err("image-less send should be rejected");
    match err {
      ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption { field, .. }) => {
        assert_eq!(field, "image_inputs");
      }
      other => panic!("expected Client(ModelDoesNotSupportOption), got {:?}", other),
    }
  }
}
