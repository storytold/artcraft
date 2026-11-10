use futures::future::join_all;
use log::warn;
use openrouter_client::api::generate_image::{GenerateImageArgs, OpenRouterImageRequest, generate_image};

use crate::client::router_openrouter_client::RouterOpenRouterClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_image::generate_image_response::{GenerateImageResponse, OpenRouterImageResponsePayload};
use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;

/// One or more OpenRouter requests (single-image models get one per image), sent together.
#[derive(Clone, Debug)]
pub struct OpenRouterImageRequestState {
  pub requests: Vec<OpenRouterImageRequest>,
}

impl OpenRouterImageRequestState {
  /// Sends every request at once and waits for the images. Some images beat none: the requests
  /// that failed aren't billed, so a partial batch is still returned.
  pub async fn send(&self, client: &RouterOpenRouterClient) -> Result<GenerateImageResponse, ArtcraftRouterError> {
    let results = join_all(self.requests.iter().map(|request| generate_image(GenerateImageArgs {
      api_key: &client.api_key,
      request,
      maybe_api_base: client.maybe_api_base.as_deref(),
    }))).await;
    let mut payload = OpenRouterImageResponsePayload { images: Vec::new(), maybe_cost_usd: None };
    let mut errors = Vec::new();
    for result in results {
      match result {
        Ok(response) => {
          payload.images.extend(response.images);
          if let Some(cost) = response.maybe_cost_usd {
            payload.maybe_cost_usd = Some(payload.maybe_cost_usd.unwrap_or(0.0) + cost);
          }
        },
        Err(err) => errors.push(err),
      }
    }
    if payload.images.is_empty() {
      // Billing problems matter most: the user has to act on them.
      let index = errors.iter().position(|e| e.is_billing_error()).unwrap_or(0);
      return Err(errors.into_iter().nth(index).map(ArtcraftRouterError::from).unwrap_or_else(|| ArtcraftRouterError::InvalidInput("No OpenRouter requests to send".to_owned())));
    }
    for err in errors {
      warn!("Part of an OpenRouter batch failed: {err}");
    }
    Ok(GenerateImageResponse::OpenRouter(payload))
  }

  /// OpenRouter bills the user's own account, not ArtCraft credits, and failures aren't billed.
  pub fn estimate_cost(&self) -> ImageGenerationCostEstimate {
    ImageGenerationCostEstimate {
      cost_in_credits: None,
      cost_in_usd_cents: None,
      is_free: false,
      is_unlimited: false,
      is_rate_limited: false,
      has_watermark: false,
      failures_are_refunded: Some(true),
    }
  }
}

#[cfg(test)]
mod tests {
  use base64::Engine;
  use base64::engine::general_purpose::STANDARD;
  use tokio::io::{AsyncReadExt, AsyncWriteExt};
  use tokio::net::TcpListener;

  use super::*;
  use crate::errors::provider_error::ProviderError;

  const PAYMENT_REQUIRED: (&str, &str) = ("402 Payment Required", r#"{"error":{"code":402,"message":"Insufficient credits"}}"#);
  const BAD_GATEWAY: (&str, &str) = ("502 Bad Gateway", r#"{"error":{"code":502,"message":"Provider failed"}}"#);

  #[tokio::test]
  async fn a_partial_batch_returns_the_images_that_finished() {
    let ok = image_body(b"img");
    let base = serve(vec![("200 OK", ok.clone()), bad_gateway(), ("200 OK", ok)]).await;
    let response = state(3).send(&RouterOpenRouterClient::new_from_raw_key("sk-or-test").with_api_base(base)).await.unwrap();
    let payload = response.get_openrouter_payload().unwrap();
    assert_eq!(payload.images.len(), 2);
    assert_eq!(payload.maybe_cost_usd, Some(0.08));
  }

  #[tokio::test]
  async fn billing_errors_win_when_nothing_finished() {
    let base = serve(vec![bad_gateway(), (PAYMENT_REQUIRED.0, PAYMENT_REQUIRED.1.to_owned())]).await;
    let err = state(2).send(&RouterOpenRouterClient::new_from_raw_key("sk-or-test").with_api_base(base)).await.unwrap_err();
    assert!(matches!(err, ArtcraftRouterError::ProviderBillingError(ProviderError::OpenRouter(_))), "{err:?}");
  }

  fn bad_gateway() -> (&'static str, String) {
    (BAD_GATEWAY.0, BAD_GATEWAY.1.to_owned())
  }

  fn state(requests: usize) -> OpenRouterImageRequestState {
    let request = OpenRouterImageRequest { model: "google/gemini-3-pro-image".into(), prompt: "a fox".into(), n: Some(1), resolution: None, aspect_ratio: None, quality: None, input_references: Vec::new() };
    OpenRouterImageRequestState { requests: vec![request; requests] }
  }

  fn image_body(bytes: &[u8]) -> String {
    format!(r#"{{"data":[{{"b64_json":"{}","media_type":"image/png"}}],"usage":{{"cost":0.04}}}}"#, STANDARD.encode(bytes))
  }

  /// Answers one connection per reply, in arrival order.
  async fn serve(replies: Vec<(&'static str, String)>) -> String {
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let base = format!("http://{}", listener.local_addr().unwrap());
    tokio::spawn(async move {
      for (status, body) in replies {
        let (mut socket, _) = listener.accept().await.unwrap();
        tokio::spawn(async move {
          let mut raw = Vec::new();
          let mut buf = [0u8; 4096];
          loop {
            let n = socket.read(&mut buf).await.unwrap();
            raw.extend_from_slice(&buf[..n]);
            let text = String::from_utf8_lossy(&raw).to_string();
            let Some(end) = text.find("\r\n\r\n") else { continue };
            let length = text.lines().find_map(|l| l.to_ascii_lowercase().strip_prefix("content-length:").map(|v| v.trim().parse::<usize>().unwrap())).unwrap_or(0);
            if raw.len() >= end + 4 + length || n == 0 {
              break;
            }
          }
          let reply = format!("HTTP/1.1 {status}\r\ncontent-type: application/json\r\ncontent-length: {}\r\nconnection: close\r\n\r\n{body}", body.len());
          socket.write_all(reply.as_bytes()).await.unwrap();
        });
      }
    });
    base
  }
}
