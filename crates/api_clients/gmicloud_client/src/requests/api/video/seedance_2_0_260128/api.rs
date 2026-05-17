use crate::creds::gmicloud_api_key::GmiCloudApiKey;
use crate::error::gmicloud_error::GmiCloudError;
use crate::requests::api::video::seedance_2_0_260128::raw_request::Seedance20Payload;
use crate::requests::common::create_request::{
  create_gmicloud_request, create_gmicloud_request_with_context,
  GmiCloudCreateRequest, GmiCloudCreateResponse,
};
use crate::requests::context::request_context::RequestContext;

const MODEL_ID: &str = "seedance-2-0-260128";

/// User-facing request for the Seedance 2.0 model via GmiCloud.
#[derive(Clone, Debug)]
pub struct Seedance20Request {
  /// Text prompt describing the video to generate. Required.
  pub prompt: String,

  /// Video duration in seconds (4–15). Default: 5.
  pub duration: Option<u8>,

  /// Output resolution.
  pub resolution: Option<Seedance20Resolution>,

  /// Aspect ratio of the output video.
  pub ratio: Option<Seedance20Ratio>,

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
pub enum Seedance20Resolution {
  FourEightyP,
  SevenTwentyP,
  TenEightyP,
}

#[derive(Copy, Clone, Debug, PartialEq)]
pub enum Seedance20Ratio {
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

impl Seedance20Request {
  pub fn to_raw_payload(&self) -> Seedance20Payload {
    Seedance20Payload {
      prompt: self.prompt.clone(),
      duration: self.duration,
      resolution: self.resolution.map(|r| match r {
        Seedance20Resolution::FourEightyP => "480p",
        Seedance20Resolution::SevenTwentyP => "720p",
        Seedance20Resolution::TenEightyP => "1080p",
      }.to_string()),
      ratio: self.ratio.map(|r| match r {
        Seedance20Ratio::Landscape16x9 => "16:9",
        Seedance20Ratio::Standard4x3 => "4:3",
        Seedance20Ratio::Square => "1:1",
        Seedance20Ratio::Portrait3x4 => "3:4",
        Seedance20Ratio::Portrait9x16 => "9:16",
        Seedance20Ratio::UltraWide21x9 => "21:9",
        Seedance20Ratio::Adaptive => "adaptive",
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
    let context = RequestContext {
      api_key,
      maybe_timeout: None,
    };
    self.send_request_with_context(&context).await
  }

  pub async fn send_request_with_context(
    &self,
    context: &RequestContext<'_>,
  ) -> Result<GmiCloudCreateResponse, GmiCloudError> {
    let body = GmiCloudCreateRequest {
      model: MODEL_ID.to_string(),
      payload: self.to_raw_payload(),
    };
    create_gmicloud_request_with_context(context, &body).await
  }

  pub fn model_id() -> &'static str {
    MODEL_ID
  }

  /// The effective duration in seconds for cost calculation.
  pub fn effective_duration_seconds(&self) -> u8 {
    self.duration.unwrap_or(5)
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn minimal_request() -> Seedance20Request {
    Seedance20Request {
      prompt: "a dog running through a field".to_string(),
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

  mod raw_payload_tests {
    use super::*;

    #[test]
    fn minimal_request_serializes_only_prompt() {
      let request = minimal_request();
      let json = serde_json::to_value(&request.to_raw_payload()).unwrap();
      assert_eq!(json["prompt"], "a dog running through a field");
      // All optional fields should be absent
      assert!(json.get("duration").is_none());
      assert!(json.get("resolution").is_none());
      assert!(json.get("ratio").is_none());
      assert!(json.get("seed").is_none());
      assert!(json.get("watermark").is_none());
      assert!(json.get("generate_audio").is_none());
      assert!(json.get("web_search").is_none());
      assert!(json.get("first_frame").is_none());
      assert!(json.get("last_frame").is_none());
      assert!(json.get("reference_images").is_none());
      assert!(json.get("reference_videos").is_none());
      assert!(json.get("reference_audios").is_none());
      assert!(json.get("reference_asset_ids").is_none());
    }

    #[test]
    fn full_request_serializes_all_fields() {
      let request = Seedance20Request {
        prompt: "a cat sitting on a windowsill".to_string(),
        duration: Some(10),
        resolution: Some(Seedance20Resolution::TenEightyP),
        ratio: Some(Seedance20Ratio::Landscape16x9),
        seed: Some(42),
        watermark: Some(false),
        generate_audio: Some(true),
        web_search: Some(true),
        first_frame: Some("https://example.com/first.png".to_string()),
        last_frame: Some("https://example.com/last.png".to_string()),
        reference_images: Some(vec!["https://example.com/ref1.png".to_string()]),
        reference_videos: Some(vec!["https://example.com/ref1.mp4".to_string()]),
        reference_audios: Some(vec!["https://example.com/ref1.wav".to_string()]),
        reference_asset_ids: Some(vec!["asset_123".to_string()]),
      };
      let json = serde_json::to_value(&request.to_raw_payload()).unwrap();
      assert_eq!(json["prompt"], "a cat sitting on a windowsill");
      assert_eq!(json["duration"], 10);
      assert_eq!(json["resolution"], "1080p");
      assert_eq!(json["ratio"], "16:9");
      assert_eq!(json["seed"], 42);
      assert_eq!(json["watermark"], false);
      assert_eq!(json["generate_audio"], true);
      assert_eq!(json["web_search"], true);
      assert_eq!(json["first_frame"], "https://example.com/first.png");
      assert_eq!(json["last_frame"], "https://example.com/last.png");
      assert_eq!(json["reference_images"][0], "https://example.com/ref1.png");
      assert_eq!(json["reference_videos"][0], "https://example.com/ref1.mp4");
      assert_eq!(json["reference_audios"][0], "https://example.com/ref1.wav");
      assert_eq!(json["reference_asset_ids"][0], "asset_123");
    }

    #[test]
    fn all_ratios_serialize() {
      let cases = [
        (Seedance20Ratio::Landscape16x9, "16:9"),
        (Seedance20Ratio::Standard4x3, "4:3"),
        (Seedance20Ratio::Square, "1:1"),
        (Seedance20Ratio::Portrait3x4, "3:4"),
        (Seedance20Ratio::Portrait9x16, "9:16"),
        (Seedance20Ratio::UltraWide21x9, "21:9"),
        (Seedance20Ratio::Adaptive, "adaptive"),
      ];
      for (ratio, expected) in cases {
        let mut request = minimal_request();
        request.ratio = Some(ratio);
        let json = serde_json::to_value(&request.to_raw_payload()).unwrap();
        assert_eq!(json["ratio"], expected, "{ratio:?}");
      }
    }

    #[test]
    fn all_resolutions_serialize() {
      let cases = [
        (Seedance20Resolution::FourEightyP, "480p"),
        (Seedance20Resolution::SevenTwentyP, "720p"),
        (Seedance20Resolution::TenEightyP, "1080p"),
      ];
      for (resolution, expected) in cases {
        let mut request = minimal_request();
        request.resolution = Some(resolution);
        let json = serde_json::to_value(&request.to_raw_payload()).unwrap();
        assert_eq!(json["resolution"], expected, "{resolution:?}");
      }
    }

    #[test]
    fn duration_is_integer() {
      let mut request = minimal_request();
      request.duration = Some(7);
      let json = serde_json::to_value(&request.to_raw_payload()).unwrap();
      assert_eq!(json["duration"], 7);
      assert!(json["duration"].is_number());
    }

    #[test]
    fn create_request_body_shape() {
      let mut request = minimal_request();
      request.prompt = "test".to_string();
      request.duration = Some(5);
      request.ratio = Some(Seedance20Ratio::Square);
      let body = GmiCloudCreateRequest {
        model: Seedance20Request::model_id().to_string(),
        payload: request.to_raw_payload(),
      };
      let json = serde_json::to_value(&body).unwrap();
      assert_eq!(json["model"], "seedance-2-0-260128");
      assert_eq!(json["payload"]["prompt"], "test");
      assert_eq!(json["payload"]["duration"], 5);
      assert_eq!(json["payload"]["ratio"], "1:1");
    }

    #[test]
    fn image_to_video_with_first_frame() {
      let mut request = minimal_request();
      request.first_frame = Some("https://example.com/cat.png".to_string());
      let json = serde_json::to_value(&request.to_raw_payload()).unwrap();
      assert_eq!(json["first_frame"], "https://example.com/cat.png");
      assert!(json.get("last_frame").is_none());
    }

    #[test]
    fn keyframe_with_first_and_last() {
      let mut request = minimal_request();
      request.first_frame = Some("https://example.com/start.png".to_string());
      request.last_frame = Some("https://example.com/end.png".to_string());
      let json = serde_json::to_value(&request.to_raw_payload()).unwrap();
      assert_eq!(json["first_frame"], "https://example.com/start.png");
      assert_eq!(json["last_frame"], "https://example.com/end.png");
    }
  }

  mod effective_duration_tests {
    use super::*;

    #[test]
    fn defaults_to_five() {
      assert_eq!(minimal_request().effective_duration_seconds(), 5);
    }

    #[test]
    fn respects_explicit_value() {
      let mut request = minimal_request();
      request.duration = Some(12);
      assert_eq!(request.effective_duration_seconds(), 12);
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
      request.ratio = Some(Seedance20Ratio::Landscape16x9);
      let result = request.send_request(&api_key).await.unwrap();
      println!("Request ID: {}", result.request_id);
      assert!(!result.request_id.is_empty());
      assert_eq!(result.model, MODEL_ID);
    }

    // Balance was $49.75 before running this.
    // [480p] Request ID: 4a0efe0d-990f-480d-9792-5bb71dd26b85
    // Balance was $49.51 after running this.
    // 24 cents = 2.4 cents per second
    #[tokio::test]
    #[ignore] // requires real API key, incurs costs
    async fn test_image_to_video_480p() {
      let api_key = crate::test_utils::load_api_key();
      let mut request = minimal_request();
      request.prompt = "the dog in this photo starts running and splashing in the lake water".to_string();
      request.duration = Some(10);
      request.resolution = Some(Seedance20Resolution::FourEightyP);
      request.first_frame = Some(JUNO_AT_LAKE_IMAGE_URL.to_string());
      let result = request.send_request(&api_key).await.unwrap();
      println!("[480p] Request ID: {}", result.request_id);
      assert!(!result.request_id.is_empty());
      assert_eq!(result.model, MODEL_ID);
    }

    // Balance was $49.51 before running this.
    // [720p] Request ID: 40f63632-dd9d-4725-ab73-5bb764e773be
    // Balance was $48.99 after running this.
    // 52 cents = 5.2 cents per second
    #[tokio::test]
    #[ignore] // requires real API key, incurs costs
    async fn test_image_to_video_720p() {
      let api_key = crate::test_utils::load_api_key();
      let mut request = minimal_request();
      request.prompt = "the dog in this photo starts running and splashing in the lake water".to_string();
      request.duration = Some(10);
      request.resolution = Some(Seedance20Resolution::SevenTwentyP);
      request.first_frame = Some(JUNO_AT_LAKE_IMAGE_URL.to_string());
      let result = request.send_request(&api_key).await.unwrap();
      println!("[720p] Request ID: {}", result.request_id);
      assert!(!result.request_id.is_empty());
      assert_eq!(result.model, MODEL_ID);
    }

    // Balance was $48.99 before running this.
    // Balance is $47.83 after running this
    // 116 cents = 11.6 cents per second
    #[tokio::test]
    #[ignore] // requires real API key, incurs costs
    async fn test_image_to_video_1080p() {
      let api_key = crate::test_utils::load_api_key();
      let mut request = minimal_request();
      request.prompt = "the dog in this photo starts running and splashing in the lake water".to_string();
      request.duration = Some(10);
      request.resolution = Some(Seedance20Resolution::TenEightyP);
      request.first_frame = Some(JUNO_AT_LAKE_IMAGE_URL.to_string());
      let result = request.send_request(&api_key).await.unwrap();
      println!("[1080p] Request ID: {}", result.request_id);
      assert!(!result.request_id.is_empty());
      assert_eq!(result.model, MODEL_ID);
    }
  }

  // NB: Pricing tests are in cost.rs
}
