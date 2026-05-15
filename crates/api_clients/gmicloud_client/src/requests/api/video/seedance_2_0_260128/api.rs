use crate::creds::gmicloud_api_key::GmiCloudApiKey;
use crate::error::gmicloud_error::GmiCloudError;
use crate::requests::api::video::seedance_2_0_260128::raw_request::Seedance20Payload;
use crate::requests::common::create_request::{
  create_gmicloud_request, GmiCloudCreateRequest, GmiCloudCreateResponse,
};

const MODEL_ID: &str = "seedance-2-0-260128";

/// User-facing request for the Seedance 2.0 model via GmiCloud.
#[derive(Clone, Debug)]
pub struct Seedance20Request {
  /// Text prompt describing the video to generate.
  pub prompt: String,

  /// Video duration.
  pub duration: Option<Seedance20Duration>,

  /// Aspect ratio of the output video.
  pub aspect_ratio: Option<Seedance20AspectRatio>,

  /// Negative prompt (terms to avoid in generation).
  pub negative_prompt: Option<String>,

  /// An image URL for image-to-video generation.
  pub start_frame_url: Option<String>,

  /// Seed for deterministic generation.
  pub seed: Option<u64>,
}

#[derive(Copy, Clone, Debug)]
pub enum Seedance20Duration {
  FiveSeconds,
  TenSeconds,
}

#[derive(Copy, Clone, Debug)]
pub enum Seedance20AspectRatio {
  /// 16:9 (landscape)
  Landscape16x9,
  /// 9:16 (portrait)
  Portrait9x16,
  /// 1:1 (square)
  Square,
  /// 4:3
  Standard4x3,
  /// 3:4
  Portrait3x4,
  /// 21:9 (ultra-wide)
  UltraWide21x9,
}

impl Seedance20Request {
  pub fn to_raw_payload(&self) -> Seedance20Payload {
    Seedance20Payload {
      prompt: self.prompt.clone(),
      duration: self.duration.map(|d| match d {
        Seedance20Duration::FiveSeconds => "5",
        Seedance20Duration::TenSeconds => "10",
      }.to_string()),
      aspect_ratio: self.aspect_ratio.map(|ar| match ar {
        Seedance20AspectRatio::Landscape16x9 => "16:9",
        Seedance20AspectRatio::Portrait9x16 => "9:16",
        Seedance20AspectRatio::Square => "1:1",
        Seedance20AspectRatio::Standard4x3 => "4:3",
        Seedance20AspectRatio::Portrait3x4 => "3:4",
        Seedance20AspectRatio::UltraWide21x9 => "21:9",
      }.to_string()),
      negative_prompt: self.negative_prompt.clone(),
      start_frame_url: self.start_frame_url.clone(),
      seed: self.seed,
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
}

impl Seedance20Duration {
  pub fn to_seconds(&self) -> u8 {
    match self {
      Seedance20Duration::FiveSeconds => 5,
      Seedance20Duration::TenSeconds => 10,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  mod raw_payload_tests {
    use super::*;

    #[test]
    fn minimal_request_serializes() {
      let request = Seedance20Request {
        prompt: "a dog running through a field".to_string(),
        duration: None,
        aspect_ratio: None,
        negative_prompt: None,
        start_frame_url: None,
        seed: None,
      };
      let payload = request.to_raw_payload();
      let json = serde_json::to_value(&payload).unwrap();
      assert_eq!(json["prompt"], "a dog running through a field");
      assert!(json.get("duration").is_none());
      assert!(json.get("aspectRatio").is_none());
      assert!(json.get("negativePrompt").is_none());
      assert!(json.get("startFrameUrl").is_none());
      assert!(json.get("seed").is_none());
    }

    #[test]
    fn full_request_serializes() {
      let request = Seedance20Request {
        prompt: "a cat sitting on a windowsill".to_string(),
        duration: Some(Seedance20Duration::TenSeconds),
        aspect_ratio: Some(Seedance20AspectRatio::Landscape16x9),
        negative_prompt: Some("blurry, low quality".to_string()),
        start_frame_url: Some("https://example.com/image.png".to_string()),
        seed: Some(42),
      };
      let payload = request.to_raw_payload();
      let json = serde_json::to_value(&payload).unwrap();
      assert_eq!(json["prompt"], "a cat sitting on a windowsill");
      assert_eq!(json["duration"], "10");
      assert_eq!(json["aspectRatio"], "16:9");
      assert_eq!(json["negativePrompt"], "blurry, low quality");
      assert_eq!(json["startFrameUrl"], "https://example.com/image.png");
      assert_eq!(json["seed"], 42);
    }

    #[test]
    fn all_aspect_ratios_serialize() {
      let cases = [
        (Seedance20AspectRatio::Landscape16x9, "16:9"),
        (Seedance20AspectRatio::Portrait9x16, "9:16"),
        (Seedance20AspectRatio::Square, "1:1"),
        (Seedance20AspectRatio::Standard4x3, "4:3"),
        (Seedance20AspectRatio::Portrait3x4, "3:4"),
        (Seedance20AspectRatio::UltraWide21x9, "21:9"),
      ];
      for (ar, expected) in cases {
        let request = Seedance20Request {
          prompt: "test".to_string(),
          duration: None,
          aspect_ratio: Some(ar),
          negative_prompt: None,
          start_frame_url: None,
          seed: None,
        };
        let json = serde_json::to_value(&request.to_raw_payload()).unwrap();
        assert_eq!(json["aspectRatio"], expected, "{ar:?}");
      }
    }

    #[test]
    fn all_durations_serialize() {
      let cases = [
        (Seedance20Duration::FiveSeconds, "5"),
        (Seedance20Duration::TenSeconds, "10"),
      ];
      for (dur, expected) in cases {
        let request = Seedance20Request {
          prompt: "test".to_string(),
          duration: Some(dur),
          aspect_ratio: None,
          negative_prompt: None,
          start_frame_url: None,
          seed: None,
        };
        let json = serde_json::to_value(&request.to_raw_payload()).unwrap();
        assert_eq!(json["duration"], expected, "{dur:?}");
      }
    }

    #[test]
    fn create_request_body_shape() {
      let request = Seedance20Request {
        prompt: "test".to_string(),
        duration: Some(Seedance20Duration::FiveSeconds),
        aspect_ratio: Some(Seedance20AspectRatio::Square),
        negative_prompt: None,
        start_frame_url: None,
        seed: None,
      };
      let body = GmiCloudCreateRequest {
        model: Seedance20Request::model_id().to_string(),
        payload: request.to_raw_payload(),
      };
      let json = serde_json::to_value(&body).unwrap();
      assert_eq!(json["model"], "seedance-2-0-260128");
      assert_eq!(json["payload"]["prompt"], "test");
      assert_eq!(json["payload"]["duration"], "5");
      assert_eq!(json["payload"]["aspectRatio"], "1:1");
    }
  }

  mod duration_tests {
    use super::*;

    #[test]
    fn to_seconds() {
      assert_eq!(Seedance20Duration::FiveSeconds.to_seconds(), 5);
      assert_eq!(Seedance20Duration::TenSeconds.to_seconds(), 10);
    }
  }

  mod live_api_tests {
    use super::*;

    #[tokio::test]
    #[ignore] // requires real API key, incurs costs
    async fn test_text_to_video() {
      let api_key = crate::test_utils::load_api_key();
      let request = Seedance20Request {
        prompt: "a golden retriever puppy playing in autumn leaves".to_string(),
        duration: Some(Seedance20Duration::FiveSeconds),
        aspect_ratio: Some(Seedance20AspectRatio::Landscape16x9),
        negative_prompt: None,
        start_frame_url: None,
        seed: None,
      };
      let result = request.send_request(&api_key).await.unwrap();
      println!("Request ID: {}", result.request_id);
      assert!(!result.request_id.is_empty());
      assert_eq!(result.model, MODEL_ID);
    }
  }

  // NB: Pricing tests are in cost.rs
}
