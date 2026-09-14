use midjourney_client::recipes::channel_id::ChannelId;
use midjourney_client::recipes::text_to_image::{text_to_image, TextToImageArgs, TextToImageRequest, TextToImageResponse};

use crate::client::router_midjourney_client::RouterMidjourneyClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_image::generate_image_response::{GenerateImageResponse, MidjourneyImageResponsePayload};

/// A ready-to-send direct Midjourney request. The `prompt` is already
/// composed with the selected aspect ratio and model version.
#[derive(Debug, Clone)]
pub struct MidjourneyRequestState {
  pub prompt: String,
}

impl MidjourneyRequestState {
  pub async fn send(&self, client: &RouterMidjourneyClient) -> Result<GenerateImageResponse, ArtcraftRouterError> {
    let channel_id = ChannelId::UserId(client.user_id.clone());

    let response = text_to_image(TextToImageArgs { request: TextToImageRequest { prompt: &self.prompt, channel_id: &channel_id }, cookie_header: &client.cookie_header, hostname: None, browser: Some(client.browser.clone()) }).await.map_err(|err| ArtcraftRouterError::Provider(ProviderError::Midjourney(err)))?;

    if let Some(job_id) = response.maybe_job_id.clone() {
      return Ok(GenerateImageResponse::Midjourney(MidjourneyImageResponsePayload { job_id }));
    }

    // No job id — classify the rejection. Surface Midjourney's own
    // human-readable message(s), not a debug dump.
    let detail = midjourney_error_detail(&response);
    if response.is_subscription_required() {
      return Err(ArtcraftRouterError::Provider(ProviderError::MidjourneySubscriptionRequired(detail)));
    }
    Err(ArtcraftRouterError::Provider(ProviderError::MidjourneySubmitRejected(detail)))
  }
}

/// Join Midjourney's failure messages into a single human-readable string.
fn midjourney_error_detail(response: &TextToImageResponse) -> String {
  let detail = response.errors().iter().filter_map(|error| error.message.clone()).collect::<Vec<String>>().join("; ");

  if detail.is_empty() { "Midjourney rejected the request with no detail".to_string() } else { detail }
}
