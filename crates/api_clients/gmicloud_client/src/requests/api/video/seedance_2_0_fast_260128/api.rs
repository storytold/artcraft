use crate::creds::gmicloud_api_key::GmiCloudApiKey;
use crate::error::gmicloud_error::GmiCloudError;
use crate::requests::api::video::seedance_2_0_fast_260128::raw_request::Seedance20FastPayload;
use crate::requests::common::create_request::{
  create_gmicloud_request, GmiCloudCreateRequest, GmiCloudCreateResponse,
};

const MODEL_ID: &str = "seedance-2-0-fast-260128";

/// User-facing request for the Seedance 2.0 Fast model via GmiCloud.
#[derive(Clone, Debug)]
pub struct Seedance20FastRequest {
  /// Text prompt describing the video to generate. Required.
  pub prompt: String,

  /// Video duration in seconds (4–15). Default: 5.
  pub duration: Option<u8>,

  /// Output resolution.
  pub resolution: Option<Seedance20FastResolution>,

  /// Aspect ratio of the output video.
  pub ratio: Option<Seedance20FastRatio>,

  /// Random seed for reproducibility (0–4294967295).
  pub seed: Option<u32>,

  /// Whether to embed a watermark. Default: false.
  pub watermark: Option<bool>,

  /// Whether to synthesize audio. Default: true.
  pub generate_audio: Option<bool>,

  /// Whether to enable web search grounding. Default: false.
  pub web_search: Option<bool>,

  /// First frame image URL for image-to-video generation.
  pub first_frame: Option<String>,

  /// Last frame image URL for image-to-video generation.
  pub last_frame: Option<String>,

  /// Reference image URLs.
  pub reference_images: Option<Vec<String>>,

  /// Reference video URLs.
  pub reference_videos: Option<Vec<String>>,

  /// Reference audio file URLs.
  pub reference_audios: Option<Vec<String>>,

  /// Pre-uploaded asset IDs.
  pub reference_asset_ids: Option<Vec<String>>,
}

#[derive(Copy, Clone, Debug, PartialEq)]
pub enum Seedance20FastResolution {
  FourEightyP,
  SevenTwentyP,
}

#[derive(Copy, Clone, Debug, PartialEq)]
pub enum Seedance20FastRatio {
  /// 16:9 (landscape)
  Landscape16x9,
  /// 4:3
  Standard4x3,
  /// 1:1 (square)
  Square,
  /// 3:4
  Portrait3x4,
  /// 9:16 (portrait)
  Portrait9x16,
  /// 21:9 (ultra-wide)
  UltraWide21x9,
  /// Adaptive (inferred from input)
  Adaptive,
}

impl Seedance20FastRequest {
  pub fn to_raw_payload(&self) -> Seedance20FastPayload {
    Seedance20FastPayload {
      prompt: self.prompt.clone(),
      duration: self.duration,
      resolution: self.resolution.map(|r| match r {
        Seedance20FastResolution::FourEightyP => "480p",
        Seedance20FastResolution::SevenTwentyP => "720p",
      }.to_string()),
      ratio: self.ratio.map(|r| match r {
        Seedance20FastRatio::Landscape16x9 => "16:9",
        Seedance20FastRatio::Standard4x3 => "4:3",
        Seedance20FastRatio::Square => "1:1",
        Seedance20FastRatio::Portrait3x4 => "3:4",
        Seedance20FastRatio::Portrait9x16 => "9:16",
        Seedance20FastRatio::UltraWide21x9 => "21:9",
        Seedance20FastRatio::Adaptive => "adaptive",
      }.to_string()),
      seed: self.seed,
      watermark: self.watermark,
      generate_audio: self.generate_audio,
      web_search: self.web_search,
      first_frame: self.first_frame.clone(),
      last_frame: self.last_frame.clone(),
      reference_images: self.reference_images.clone(),
      reference_videos: self.reference_videos.clone(),
      reference_audios: self.reference_audios.clone(),
      reference_asset_ids: self.reference_asset_ids.clone(),
    }
  }

  pub async fn send_request(
    &self,
    api_key: &GmiCloudApiKey,
  ) -> Result<GmiCloudCreateResponse, GmiCloudError> {
    let body = GmiCloudCreateRequest {
      model: MODEL_ID.to_string(),
      payload: self.to_raw_payload(),
    };
    create_gmicloud_request(api_key, &body).await
  }

  pub fn model_id() -> &'static str {
    MODEL_ID
  }

  /// The effective duration in seconds for cost calculation.
  pub fn effective_duration_seconds(&self) -> u8 {
    self.duration.unwrap_or(5)
  }
}

fn minimal_request() -> Seedance20FastRequest {
  Seedance20FastRequest {
    prompt: "test".to_string(),
    duration: None,
    resolution: None,
    ratio: None,
    seed: None,
    watermark: None,
    generate_audio: None,
    web_search: None,
    first_frame: None,
    last_frame: None,
    reference_images: None,
    reference_videos: None,
    reference_audios: None,
    reference_asset_ids: None,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  mod raw_payload_tests {
    use super::*;

    #[test]
    fn minimal_request_serializes_only_prompt() {
      let request = minimal_request();
      let json = serde_json::to_value(&request.to_raw_payload()).unwrap();
      assert_eq!(json["prompt"], "test");
      assert!(json.get("duration").is_none());
      assert!(json.get("resolution").is_none());
      assert!(json.get("ratio").is_none());
    }

    #[test]
    fn full_request_serializes_all_fields() {
      let request = Seedance20FastRequest {
        prompt: "a cat sitting on a windowsill".to_string(),
        duration: Some(10),
        resolution: Some(Seedance20FastResolution::SevenTwentyP),
        ratio: Some(Seedance20FastRatio::Portrait9x16),
        seed: Some(123),
        watermark: Some(true),
        generate_audio: Some(false),
        web_search: Some(true),
        first_frame: Some("https://example.com/first.png".to_string()),
        last_frame: Some("https://example.com/last.png".to_string()),
        reference_images: Some(vec!["https://example.com/ref.png".to_string()]),
        reference_videos: Some(vec!["https://example.com/ref.mp4".to_string()]),
        reference_audios: Some(vec!["https://example.com/ref.wav".to_string()]),
        reference_asset_ids: Some(vec!["asset_456".to_string()]),
      };
      let json = serde_json::to_value(&request.to_raw_payload()).unwrap();
      assert_eq!(json["prompt"], "a cat sitting on a windowsill");
      assert_eq!(json["duration"], 10);
      assert_eq!(json["resolution"], "720p");
      assert_eq!(json["ratio"], "9:16");
      assert_eq!(json["seed"], 123);
      assert_eq!(json["watermark"], true);
      assert_eq!(json["generate_audio"], false);
      assert_eq!(json["web_search"], true);
      assert_eq!(json["first_frame"], "https://example.com/first.png");
      assert_eq!(json["last_frame"], "https://example.com/last.png");
    }

    #[test]
    fn all_ratios_serialize() {
      let cases = [
        (Seedance20FastRatio::Landscape16x9, "16:9"),
        (Seedance20FastRatio::Standard4x3, "4:3"),
        (Seedance20FastRatio::Square, "1:1"),
        (Seedance20FastRatio::Portrait3x4, "3:4"),
        (Seedance20FastRatio::Portrait9x16, "9:16"),
        (Seedance20FastRatio::UltraWide21x9, "21:9"),
        (Seedance20FastRatio::Adaptive, "adaptive"),
      ];
      for (ratio, expected) in cases {
        let mut request = minimal_request();
        request.ratio = Some(ratio);
        let json = serde_json::to_value(&request.to_raw_payload()).unwrap();
        assert_eq!(json["ratio"], expected, "{ratio:?}");
      }
    }

    #[test]
    fn create_request_body_shape() {
      let mut request = minimal_request();
      request.duration = Some(5);
      request.ratio = Some(Seedance20FastRatio::Square);
      let body = GmiCloudCreateRequest {
        model: Seedance20FastRequest::model_id().to_string(),
        payload: request.to_raw_payload(),
      };
      let json = serde_json::to_value(&body).unwrap();
      assert_eq!(json["model"], "seedance-2-0-fast-260128");
      assert_eq!(json["payload"]["prompt"], "test");
      assert_eq!(json["payload"]["duration"], 5);
      assert_eq!(json["payload"]["ratio"], "1:1");
    }
  }

  mod live_api_tests {
    use super::*;
    use test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL;

    #[tokio::test]
    #[ignore] // requires real API key, incurs costs
    async fn test_text_to_video() {
      let api_key = crate::test_utils::load_api_key();
      let mut request = minimal_request();
      request.prompt = "a golden retriever puppy playing in autumn leaves".to_string();
      request.duration = Some(5);
      request.ratio = Some(Seedance20FastRatio::Landscape16x9);
      let result = request.send_request(&api_key).await.unwrap();
      println!("Request ID: {}", result.request_id);
      assert!(!result.request_id.is_empty());
      assert_eq!(result.model, MODEL_ID);
    }

    // $47.83 before run
    // [fast 480p] Request ID: 1b654a85-d99e-4380-b615-c7a8985ed15b
    // $47.73 after run
    // $0.10 = $0.01 per second
    #[tokio::test]
    #[ignore] // requires real API key, incurs costs
    async fn test_image_to_video_480p() {
      let api_key = crate::test_utils::load_api_key();
      let mut request = minimal_request();
      request.prompt = "the dog in this photo starts running and splashing in the lake water".to_string();
      request.duration = Some(10);
      request.resolution = Some(Seedance20FastResolution::FourEightyP);
      request.first_frame = Some(JUNO_AT_LAKE_IMAGE_URL.to_string());
      let result = request.send_request(&api_key).await.unwrap();
      println!("[fast 480p] Request ID: {}", result.request_id);
      assert!(!result.request_id.is_empty());
      assert_eq!(result.model, MODEL_ID);
    }

    // $47.73 before run
    // [fast 720p] Request ID: 2fbbe377-7c92-482e-b1eb-92fd296b0a68
    // $47.52 after run
    // $0.31 = $0.031 per second
    #[tokio::test]
    #[ignore] // requires real API key, incurs costs
    async fn test_image_to_video_720p() {
      let api_key = crate::test_utils::load_api_key();
      let mut request = minimal_request();
      request.prompt = "the dog in this photo starts running and splashing in the lake water".to_string();
      request.duration = Some(10);
      request.resolution = Some(Seedance20FastResolution::SevenTwentyP);
      request.first_frame = Some(JUNO_AT_LAKE_IMAGE_URL.to_string());
      let result = request.send_request(&api_key).await.unwrap();
      println!("[fast 720p] Request ID: {}", result.request_id);
      assert!(!result.request_id.is_empty());
      assert_eq!(result.model, MODEL_ID);
    }
  }

  // NB: Pricing tests are in cost.rs
}
