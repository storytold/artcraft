use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::video::image::kling_2p5_turbo_pro_image_to_video::raw_request::{
  Kling2p5TurboProImageToVideoInput, Kling2p5TurboProImageToVideoOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct Kling2p5TurboProImageToVideoRequest {
  /// Text prompt describing the desired video content.
  pub prompt: String,

  /// URL of the image used as the first frame.
  pub image_url: String,

  /// Optional URL of the image used as the last frame.
  pub tail_image_url: Option<String>,

  /// Video duration. Kling 2.5 Turbo Pro supports 5 or 10 seconds only.
  pub duration: Option<Kling2p5TurboProImageToVideoDuration>,

  /// Optional negative prompt. fal's default is
  /// `"blur, distort, and low quality"` when this is `None`.
  pub negative_prompt: Option<String>,

  /// CFG scale. Defaults to fal's `0.5` when `None`.
  pub cfg_scale: Option<f32>,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Kling2p5TurboProImageToVideoDuration {
  FiveSeconds,
  TenSeconds,
}

impl Kling2p5TurboProImageToVideoDuration {
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

impl FalEndpoint for Kling2p5TurboProImageToVideoRequest {
  const ENDPOINT: &str = "fal-ai/kling-video/v2.5-turbo/pro/image-to-video";

  type RawRequest = Kling2p5TurboProImageToVideoInput;
  type RawResponse = Kling2p5TurboProImageToVideoOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    let duration = self.duration.map(|d| d.to_str().to_string());

    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      image_url: self.image_url.clone(),
      duration,
      tail_image_url: self.tail_image_url.clone(),
      negative_prompt: self.negative_prompt.clone(),
      cfg_scale: self.cfg_scale,
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
  use test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL;

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_image_to_video_webhook() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = Kling2p5TurboProImageToVideoRequest {
      prompt: "the lake comes alive with gentle ripples and dappled sunlight".to_string(),
      image_url: JUNO_AT_LAKE_IMAGE_URL.to_string(),
      tail_image_url: None,
      duration: Some(Kling2p5TurboProImageToVideoDuration::FiveSeconds),
      negative_prompt: None,
      cfg_scale: None,
    };

    let result = request.send_webhook_request(&api_key, "https://example.com/webhook").await?;
    println!("Webhook result: {:?}", result);
    assert!(result.request_id.is_some() || result.gateway_request_id.is_some());
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_image_to_video_queue() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = Kling2p5TurboProImageToVideoRequest {
      prompt: "wind moves through the trees".to_string(),
      image_url: JUNO_AT_LAKE_IMAGE_URL.to_string(),
      tail_image_url: None,
      duration: Some(Kling2p5TurboProImageToVideoDuration::FiveSeconds),
      negative_prompt: None,
      cfg_scale: None,
    };

    let result = request.send_queue_request(&api_key).await?;
    println!("Queue result — request_id: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request per variant (expensive)
  async fn test_all_durations() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let durations = [
      Kling2p5TurboProImageToVideoDuration::FiveSeconds,
      Kling2p5TurboProImageToVideoDuration::TenSeconds,
    ];

    for dur in durations {
      println!("--- duration: {:?} ---", dur);
      let request = Kling2p5TurboProImageToVideoRequest {
        prompt: "the dog wags its tail".to_string(),
        image_url: JUNO_AT_LAKE_IMAGE_URL.to_string(),
        tail_image_url: None,
        duration: Some(dur),
        negative_prompt: None,
        cfg_scale: None,
      };
      let result = request.send_webhook_request(&api_key, "https://example.com/webhook").await?;
      println!("result: {:?}", result);
    }

    Ok(())
  }

  // ── Wire-shape sanity ──

  #[test]
  fn raw_request_uses_canonical_field_names() {
    let request = Kling2p5TurboProImageToVideoRequest {
      prompt: "p".to_string(),
      image_url: "https://example.com/start.png".to_string(),
      tail_image_url: Some("https://example.com/end.png".to_string()),
      duration: Some(Kling2p5TurboProImageToVideoDuration::TenSeconds),
      negative_prompt: Some("nope".to_string()),
      cfg_scale: Some(0.5),
    };
    let raw = request.to_raw_request().unwrap();
    assert_eq!(raw.prompt, "p");
    assert_eq!(raw.image_url, "https://example.com/start.png");
    assert_eq!(raw.tail_image_url.as_deref(), Some("https://example.com/end.png"));
    assert_eq!(raw.duration.as_deref(), Some("10"));
    assert_eq!(raw.negative_prompt.as_deref(), Some("nope"));
    assert_eq!(raw.cfg_scale, Some(0.5));
  }

  #[test]
  fn raw_request_omits_unset_optionals() {
    let request = Kling2p5TurboProImageToVideoRequest {
      prompt: "p".to_string(),
      image_url: "https://example.com/start.png".to_string(),
      tail_image_url: None,
      duration: None,
      negative_prompt: None,
      cfg_scale: None,
    };
    let raw = request.to_raw_request().unwrap();
    assert_eq!(raw.image_url, "https://example.com/start.png");
    assert!(raw.tail_image_url.is_none());
    assert!(raw.duration.is_none());
    assert!(raw.negative_prompt.is_none());
    assert!(raw.cfg_scale.is_none());
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(
      Kling2p5TurboProImageToVideoRequest::ENDPOINT,
      "fal-ai/kling-video/v2.5-turbo/pro/image-to-video",
    );
  }

  /// Wire-shape and endpoint parity vs the legacy
  /// `requests_old/http/video/image/http_kling_v2p5_turbo_pro_image_to_video.rs`.
  ///
  /// No legacy *pro* webhook exists for image-to-video (only the legacy
  /// `enqueue_kling_v2p5_turbo_standard_image_to_video_webhook` ships, and
  /// that targets the `standard` model with a different pricing tier — cost
  /// parity for the pro model is asserted in `cost.rs` against the
  /// documented pricing instead.
  mod legacy_parity {
    use super::*;
    use crate::requests_old::http::video::image::http_kling_v2p5_turbo_pro_image_to_video::{
      kling_v2p5_turbo_pro_image_to_video, KlingV2p5TurboProImageToVideoInput,
    };

    /// Same `fal-ai/kling-video/v2.5-turbo/pro/image-to-video` path.
    #[test]
    fn endpoint_path_matches_legacy() {
      let legacy = kling_v2p5_turbo_pro_image_to_video(KlingV2p5TurboProImageToVideoInput {
        prompt: "p".to_string(),
        image_url: "https://example.com/x.png".to_string(),
        ..Default::default()
      });
      assert_eq!(
        Kling2p5TurboProImageToVideoRequest::ENDPOINT,
        legacy.endpoint,
      );
    }

    /// At a representative fully-populated case, the new module's serialized
    /// `RawRequest` must equal the legacy `Input`'s JSON.
    #[test]
    fn wire_json_matches_legacy_fully_populated() {
      let new = Kling2p5TurboProImageToVideoRequest {
        prompt: "shared prompt".to_string(),
        image_url: "https://example.com/start.png".to_string(),
        tail_image_url: Some("https://example.com/end.png".to_string()),
        duration: Some(Kling2p5TurboProImageToVideoDuration::TenSeconds),
        negative_prompt: Some("blurry".to_string()),
        cfg_scale: Some(0.5),
      };
      let new_json = serde_json::to_value(new.to_raw_request().unwrap()).unwrap();

      let legacy = KlingV2p5TurboProImageToVideoInput {
        prompt: "shared prompt".to_string(),
        image_url: "https://example.com/start.png".to_string(),
        duration: Some("10".to_string()),
        tail_image_url: Some("https://example.com/end.png".to_string()),
        negative_prompt: Some("blurry".to_string()),
        cfg_scale: Some(0.5),
      };
      let legacy_json = serde_json::to_value(&legacy).unwrap();

      assert_eq!(new_json, legacy_json);
    }

    /// Minimal case (prompt + image_url only): unset optionals must be
    /// omitted on the wire just like the legacy struct.
    #[test]
    fn wire_json_matches_legacy_minimal() {
      let new = Kling2p5TurboProImageToVideoRequest {
        prompt: "minimal".to_string(),
        image_url: "https://example.com/x.png".to_string(),
        tail_image_url: None,
        duration: None,
        negative_prompt: None,
        cfg_scale: None,
      };
      let new_json = serde_json::to_value(new.to_raw_request().unwrap()).unwrap();

      let legacy = KlingV2p5TurboProImageToVideoInput {
        prompt: "minimal".to_string(),
        image_url: "https://example.com/x.png".to_string(),
        ..Default::default()
      };
      let legacy_json = serde_json::to_value(&legacy).unwrap();

      assert_eq!(new_json, legacy_json);
      assert_eq!(
        new_json,
        serde_json::json!({
          "prompt": "minimal",
          "image_url": "https://example.com/x.png",
        }),
      );
    }

    /// Cross product over duration × tail_image_url presence: every cell's
    /// wire JSON must match the legacy `Input`.
    #[test]
    fn wire_json_matches_legacy_at_every_combo() {
      let durations = [
        (None,                                                       None),
        (Some(Kling2p5TurboProImageToVideoDuration::FiveSeconds),    Some("5")),
        (Some(Kling2p5TurboProImageToVideoDuration::TenSeconds),     Some("10")),
      ];
      let tail_urls: [Option<&str>; 2] = [None, Some("https://example.com/tail.png")];

      for (d_new, d_legacy) in durations {
        for tail in tail_urls {
          let new = Kling2p5TurboProImageToVideoRequest {
            prompt: "p".to_string(),
            image_url: "https://example.com/x.png".to_string(),
            tail_image_url: tail.map(String::from),
            duration: d_new,
            negative_prompt: None,
            cfg_scale: None,
          };
          let legacy = KlingV2p5TurboProImageToVideoInput {
            prompt: "p".to_string(),
            image_url: "https://example.com/x.png".to_string(),
            duration: d_legacy.map(String::from),
            tail_image_url: tail.map(String::from),
            negative_prompt: None,
            cfg_scale: None,
          };
          let new_json = serde_json::to_value(new.to_raw_request().unwrap()).unwrap();
          let legacy_json = serde_json::to_value(&legacy).unwrap();
          assert_eq!(
            new_json, legacy_json,
            "duration={d_new:?} tail_image_url={tail:?}",
          );
        }
      }
    }
  }

  // NB: Pricing tests are in cost.rs
}
