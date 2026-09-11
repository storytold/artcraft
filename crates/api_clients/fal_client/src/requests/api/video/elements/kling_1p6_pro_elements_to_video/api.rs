use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::video::elements::kling_1p6_pro_elements_to_video::raw_request::{
  Kling1p6ProElementsToVideoInput, Kling1p6ProElementsToVideoOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct Kling1p6ProElementsToVideoRequest {
  /// Text prompt describing the video to generate.
  pub prompt: String,

  /// Image URLs that drive the generation. fal documents support for up
  /// to 4 images; passing more is rejected upstream rather than here.
  pub input_image_urls: Vec<String>,

  /// Optional negative prompt. fal's default is
  /// `"blur, distort, and low quality"` when this is `None`.
  pub negative_prompt: Option<String>,

  /// Video duration. Kling 1.6 Pro Elements supports 5 or 10 seconds only.
  pub duration: Option<Kling1p6ProElementsToVideoDuration>,

  /// Aspect ratio.
  pub aspect_ratio: Option<Kling1p6ProElementsToVideoAspectRatio>,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Kling1p6ProElementsToVideoDuration {
  FiveSeconds,
  TenSeconds,
}

impl Kling1p6ProElementsToVideoDuration {
  pub fn to_seconds(&self) -> u64 {
    match self {
      Self::FiveSeconds => 5,
      Self::TenSeconds => 10,
    }
  }

  fn to_str(&self) -> &'static str {
    match self {
      Self::FiveSeconds => "5",
      Self::TenSeconds => "10",
    }
  }
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Kling1p6ProElementsToVideoAspectRatio {
  Square,
  SixteenByNine,
  NineBySixteen,
}

impl FalEndpoint for Kling1p6ProElementsToVideoRequest {
  const ENDPOINT: &str = "fal-ai/kling-video/v1.6/pro/elements";

  type RawRequest = Kling1p6ProElementsToVideoInput;
  type RawResponse = Kling1p6ProElementsToVideoOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    let duration = self.duration.map(|d| d.to_str().to_string());

    let aspect_ratio = self.aspect_ratio.map(|ar| match ar {
      Kling1p6ProElementsToVideoAspectRatio::Square => "1:1",
      Kling1p6ProElementsToVideoAspectRatio::SixteenByNine => "16:9",
      Kling1p6ProElementsToVideoAspectRatio::NineBySixteen => "9:16",
    }.to_string());

    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      input_image_urls: self.input_image_urls.clone(),
      aspect_ratio,
      duration,
      negative_prompt: self.negative_prompt.clone(),
    })
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::traits::fal_endpoint_trait::FalEndpoint;
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::{JUNO_AT_LAKE_IMAGE_URL, TALL_MOCHI_WITH_GLASSES_IMAGE_URL};

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_elements_to_video_webhook() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = Kling1p6ProElementsToVideoRequest {
      prompt: "the two dogs run side by side across a sunlit meadow".to_string(),
      input_image_urls: vec![
        TALL_MOCHI_WITH_GLASSES_IMAGE_URL.to_string(),
        JUNO_AT_LAKE_IMAGE_URL.to_string(),
      ],
      negative_prompt: None,
      duration: Some(Kling1p6ProElementsToVideoDuration::FiveSeconds),
      aspect_ratio: Some(Kling1p6ProElementsToVideoAspectRatio::SixteenByNine),
    };

    let result = request.send_webhook_request(&api_key, "https://example.com/webhook").await?;
    println!("Webhook result: {:?}", result);
    assert!(result.request_id.is_some() || result.gateway_request_id.is_some());
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_elements_to_video_queue() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = Kling1p6ProElementsToVideoRequest {
      prompt: "the dogs play together in a snowy field".to_string(),
      input_image_urls: vec![
        TALL_MOCHI_WITH_GLASSES_IMAGE_URL.to_string(),
        JUNO_AT_LAKE_IMAGE_URL.to_string(),
      ],
      negative_prompt: None,
      duration: Some(Kling1p6ProElementsToVideoDuration::FiveSeconds),
      aspect_ratio: Some(Kling1p6ProElementsToVideoAspectRatio::SixteenByNine),
    };

    let result = request.send_queue_request(&api_key).await?;
    println!("Queue result — request_id: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request per variant (expensive)
  async fn test_all_aspect_ratios() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let aspect_ratios = [
      Kling1p6ProElementsToVideoAspectRatio::Square,
      Kling1p6ProElementsToVideoAspectRatio::SixteenByNine,
      Kling1p6ProElementsToVideoAspectRatio::NineBySixteen,
    ];

    for ar in aspect_ratios {
      println!("--- aspect ratio: {:?} ---", ar);
      let request = Kling1p6ProElementsToVideoRequest {
        prompt: "the dogs play together in a snowy field".to_string(),
        input_image_urls: vec![
          TALL_MOCHI_WITH_GLASSES_IMAGE_URL.to_string(),
          JUNO_AT_LAKE_IMAGE_URL.to_string(),
        ],
        negative_prompt: None,
        duration: Some(Kling1p6ProElementsToVideoDuration::FiveSeconds),
        aspect_ratio: Some(ar),
      };
      let result = request.send_webhook_request(&api_key, "https://example.com/webhook").await?;
      println!("result: {:?}", result);
    }

    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request per variant (expensive)
  async fn test_all_durations() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let durations = [
      Kling1p6ProElementsToVideoDuration::FiveSeconds,
      Kling1p6ProElementsToVideoDuration::TenSeconds,
    ];

    for dur in durations {
      println!("--- duration: {:?} ---", dur);
      let request = Kling1p6ProElementsToVideoRequest {
        prompt: "the dogs leap through tall grass in golden hour light".to_string(),
        input_image_urls: vec![
          TALL_MOCHI_WITH_GLASSES_IMAGE_URL.to_string(),
          JUNO_AT_LAKE_IMAGE_URL.to_string(),
        ],
        negative_prompt: None,
        duration: Some(dur),
        aspect_ratio: Some(Kling1p6ProElementsToVideoAspectRatio::SixteenByNine),
      };
      let result = request.send_webhook_request(&api_key, "https://example.com/webhook").await?;
      println!("result: {:?}", result);
    }

    Ok(())
  }

  // ── Wire-shape sanity ──

  #[test]
  fn raw_request_aspect_ratio_uses_colon_format() {
    let request = Kling1p6ProElementsToVideoRequest {
      prompt: "p".to_string(),
      input_image_urls: vec!["https://example.com/a.png".to_string()],
      negative_prompt: None,
      duration: Some(Kling1p6ProElementsToVideoDuration::TenSeconds),
      aspect_ratio: Some(Kling1p6ProElementsToVideoAspectRatio::Square),
    };
    let raw = request.to_raw_request().unwrap();
    assert_eq!(raw.aspect_ratio.as_deref(), Some("1:1"));
    assert_eq!(raw.duration.as_deref(), Some("10"));
  }

  #[test]
  fn raw_request_passes_through_input_image_urls() {
    let urls = vec![
      "https://example.com/a.png".to_string(),
      "https://example.com/b.png".to_string(),
      "https://example.com/c.png".to_string(),
      "https://example.com/d.png".to_string(),
    ];
    let request = Kling1p6ProElementsToVideoRequest {
      prompt: "p".to_string(),
      input_image_urls: urls.clone(),
      negative_prompt: None,
      duration: None,
      aspect_ratio: None,
    };
    let raw = request.to_raw_request().unwrap();
    assert_eq!(raw.input_image_urls, urls);
  }

  #[test]
  fn raw_request_omits_unset_optionals() {
    let request = Kling1p6ProElementsToVideoRequest {
      prompt: "p".to_string(),
      input_image_urls: vec!["https://example.com/a.png".to_string()],
      negative_prompt: None,
      duration: None,
      aspect_ratio: None,
    };
    let raw = request.to_raw_request().unwrap();
    assert_eq!(raw.prompt, "p");
    assert!(raw.aspect_ratio.is_none());
    assert!(raw.duration.is_none());
    assert!(raw.negative_prompt.is_none());
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(
      Kling1p6ProElementsToVideoRequest::ENDPOINT,
      "fal-ai/kling-video/v1.6/pro/elements",
    );
  }

  // NB: Pricing tests are in cost.rs
}
