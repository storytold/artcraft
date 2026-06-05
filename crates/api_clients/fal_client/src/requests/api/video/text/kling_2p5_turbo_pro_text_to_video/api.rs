use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::video::text::kling_2p5_turbo_pro_text_to_video::raw_request::{
  Kling2p5TurboProTextToVideoInput, Kling2p5TurboProTextToVideoOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct Kling2p5TurboProTextToVideoRequest {
  /// Text prompt describing the video to generate.
  pub prompt: String,

  /// Optional negative prompt. fal's default is
  /// `"blur, distort, and low quality"` when this is `None`.
  pub negative_prompt: Option<String>,

  /// Video duration. Kling 2.5 Turbo Pro supports 5 or 10 seconds only.
  pub duration: Option<Kling2p5TurboProTextToVideoDuration>,

  /// Aspect ratio. fal's default is `16:9` when this is `None`.
  pub aspect_ratio: Option<Kling2p5TurboProTextToVideoAspectRatio>,

  /// CFG scale. Defaults to fal's `0.5` when `None`.
  pub cfg_scale: Option<f32>,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Kling2p5TurboProTextToVideoDuration {
  FiveSeconds,
  TenSeconds,
}

impl Kling2p5TurboProTextToVideoDuration {
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
pub enum Kling2p5TurboProTextToVideoAspectRatio {
  Square,
  SixteenByNine,
  NineBySixteen,
}

impl FalEndpoint for Kling2p5TurboProTextToVideoRequest {
  const ENDPOINT: &str = "fal-ai/kling-video/v2.5-turbo/pro/text-to-video";

  type RawRequest = Kling2p5TurboProTextToVideoInput;
  type RawResponse = Kling2p5TurboProTextToVideoOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    let duration = self.duration.map(|d| d.to_str().to_string());

    let aspect_ratio = self.aspect_ratio.map(|ar| match ar {
      Kling2p5TurboProTextToVideoAspectRatio::Square => "1:1",
      Kling2p5TurboProTextToVideoAspectRatio::SixteenByNine => "16:9",
      Kling2p5TurboProTextToVideoAspectRatio::NineBySixteen => "9:16",
    }.to_string());

    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      aspect_ratio,
      negative_prompt: self.negative_prompt.clone(),
      duration,
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

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_text_to_video_webhook() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = Kling2p5TurboProTextToVideoRequest {
      prompt: "an owl flies past an abandoned castle at dusk, fireflies dance in the trees".to_string(),
      negative_prompt: None,
      duration: Some(Kling2p5TurboProTextToVideoDuration::FiveSeconds),
      aspect_ratio: Some(Kling2p5TurboProTextToVideoAspectRatio::SixteenByNine),
      cfg_scale: None,
    };

    let result = request.send_webhook_request(&api_key, "https://example.com/webhook").await?;
    println!("Webhook result: {:?}", result);
    assert!(result.request_id.is_some() || result.gateway_request_id.is_some());
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_text_to_video_queue() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = Kling2p5TurboProTextToVideoRequest {
      prompt: "a candle flickers in a dark stone hall".to_string(),
      negative_prompt: None,
      duration: Some(Kling2p5TurboProTextToVideoDuration::FiveSeconds),
      aspect_ratio: Some(Kling2p5TurboProTextToVideoAspectRatio::SixteenByNine),
      cfg_scale: None,
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
      Kling2p5TurboProTextToVideoAspectRatio::Square,
      Kling2p5TurboProTextToVideoAspectRatio::SixteenByNine,
      Kling2p5TurboProTextToVideoAspectRatio::NineBySixteen,
    ];

    for ar in aspect_ratios {
      println!("--- aspect ratio: {:?} ---", ar);
      let request = Kling2p5TurboProTextToVideoRequest {
        prompt: "a wave crashes against a rocky shoreline at sunset".to_string(),
        negative_prompt: None,
        duration: Some(Kling2p5TurboProTextToVideoDuration::FiveSeconds),
        aspect_ratio: Some(ar),
        cfg_scale: None,
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
      Kling2p5TurboProTextToVideoDuration::FiveSeconds,
      Kling2p5TurboProTextToVideoDuration::TenSeconds,
    ];

    for dur in durations {
      println!("--- duration: {:?} ---", dur);
      let request = Kling2p5TurboProTextToVideoRequest {
        prompt: "a candle flame flickers in a dark room".to_string(),
        negative_prompt: None,
        duration: Some(dur),
        aspect_ratio: Some(Kling2p5TurboProTextToVideoAspectRatio::SixteenByNine),
        cfg_scale: None,
      };
      let result = request.send_webhook_request(&api_key, "https://example.com/webhook").await?;
      println!("result: {:?}", result);
    }

    Ok(())
  }

  // ── Wire-shape sanity ──

  #[test]
  fn raw_request_aspect_ratio_uses_colon_format() {
    let request = Kling2p5TurboProTextToVideoRequest {
      prompt: "p".to_string(),
      negative_prompt: None,
      duration: Some(Kling2p5TurboProTextToVideoDuration::TenSeconds),
      aspect_ratio: Some(Kling2p5TurboProTextToVideoAspectRatio::NineBySixteen),
      cfg_scale: None,
    };
    let raw = request.to_raw_request().unwrap();
    assert_eq!(raw.aspect_ratio.as_deref(), Some("9:16"));
    assert_eq!(raw.duration.as_deref(), Some("10"));
  }

  #[test]
  fn raw_request_omits_unset_optionals() {
    let request = Kling2p5TurboProTextToVideoRequest {
      prompt: "p".to_string(),
      negative_prompt: None,
      duration: None,
      aspect_ratio: None,
      cfg_scale: None,
    };
    let raw = request.to_raw_request().unwrap();
    assert_eq!(raw.prompt, "p");
    assert!(raw.aspect_ratio.is_none());
    assert!(raw.duration.is_none());
    assert!(raw.negative_prompt.is_none());
    assert!(raw.cfg_scale.is_none());
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(
      Kling2p5TurboProTextToVideoRequest::ENDPOINT,
      "fal-ai/kling-video/v2.5-turbo/pro/text-to-video",
    );
  }

  /// Wire-shape, endpoint, and cost parity vs the legacy modules:
  ///   `requests_old/http/video/text/http_kling_v2p5_turbo_pro_text_to_video.rs`
  ///   `requests_old/webhook/video/text/enqueue_kling_v2p5_turbo_pro_text_to_video_webhook.rs`
  mod legacy_parity {
    use super::*;
    use crate::requests_old::http::video::text::http_kling_v2p5_turbo_pro_text_to_video::{
      kling_v2p5_turbo_pro_text_to_video, KlingV2p5TurboProTextToVideoInput,
    };

    /// Same `fal-ai/kling-video/v2.5-turbo/pro/text-to-video` path.
    #[test]
    fn endpoint_path_matches_legacy() {
      let legacy = kling_v2p5_turbo_pro_text_to_video(KlingV2p5TurboProTextToVideoInput::default());
      assert_eq!(
        Kling2p5TurboProTextToVideoRequest::ENDPOINT,
        legacy.endpoint,
      );
    }

    /// At a representative fully-populated case, the new module's serialized
    /// `RawRequest` must equal the legacy `Input`'s JSON.
    #[test]
    fn wire_json_matches_legacy_fully_populated() {
      let new = Kling2p5TurboProTextToVideoRequest {
        prompt: "a wave at dawn".to_string(),
        negative_prompt: Some("blurry".to_string()),
        duration: Some(Kling2p5TurboProTextToVideoDuration::TenSeconds),
        aspect_ratio: Some(Kling2p5TurboProTextToVideoAspectRatio::NineBySixteen),
        cfg_scale: Some(0.5),
      };
      let new_json = serde_json::to_value(new.to_raw_request().unwrap()).unwrap();

      let legacy = KlingV2p5TurboProTextToVideoInput {
        prompt: "a wave at dawn".to_string(),
        aspect_ratio: Some("9:16".to_string()),
        negative_prompt: Some("blurry".to_string()),
        duration: Some("10".to_string()),
        cfg_scale: Some(0.5),
      };
      let legacy_json = serde_json::to_value(&legacy).unwrap();

      assert_eq!(new_json, legacy_json);
    }

    /// Minimal case (prompt only): unset optionals must be omitted on the
    /// wire just like the legacy struct.
    #[test]
    fn wire_json_matches_legacy_minimal() {
      let new = Kling2p5TurboProTextToVideoRequest {
        prompt: "minimal".to_string(),
        negative_prompt: None,
        duration: None,
        aspect_ratio: None,
        cfg_scale: None,
      };
      let new_json = serde_json::to_value(new.to_raw_request().unwrap()).unwrap();

      let legacy = KlingV2p5TurboProTextToVideoInput {
        prompt: "minimal".to_string(),
        ..Default::default()
      };
      let legacy_json = serde_json::to_value(&legacy).unwrap();

      assert_eq!(new_json, legacy_json);
      assert_eq!(new_json, serde_json::json!({ "prompt": "minimal" }));
    }

    /// Cross product over duration × aspect_ratio: every cell's wire JSON
    /// must match the equivalent legacy `Input`.
    #[test]
    fn wire_json_matches_legacy_at_every_combo() {
      let durations = [
        (None,                                                  None),
        (Some(Kling2p5TurboProTextToVideoDuration::FiveSeconds), Some("5")),
        (Some(Kling2p5TurboProTextToVideoDuration::TenSeconds),  Some("10")),
      ];
      let aspect_ratios = [
        (None,                                                       None),
        (Some(Kling2p5TurboProTextToVideoAspectRatio::Square),         Some("1:1")),
        (Some(Kling2p5TurboProTextToVideoAspectRatio::SixteenByNine),  Some("16:9")),
        (Some(Kling2p5TurboProTextToVideoAspectRatio::NineBySixteen),  Some("9:16")),
      ];

      for (d_new, d_legacy) in durations {
        for (ar_new, ar_legacy) in aspect_ratios {
          let new = Kling2p5TurboProTextToVideoRequest {
            prompt: "p".to_string(),
            negative_prompt: None,
            duration: d_new,
            aspect_ratio: ar_new,
            cfg_scale: None,
          };
          let legacy = KlingV2p5TurboProTextToVideoInput {
            prompt: "p".to_string(),
            aspect_ratio: ar_legacy.map(String::from),
            negative_prompt: None,
            duration: d_legacy.map(String::from),
            cfg_scale: None,
          };
          let new_json = serde_json::to_value(new.to_raw_request().unwrap()).unwrap();
          let legacy_json = serde_json::to_value(&legacy).unwrap();
          assert_eq!(
            new_json, legacy_json,
            "duration={d_new:?} aspect_ratio={ar_new:?}",
          );
        }
      }
    }
  }

  // NB: Pricing tests are in cost.rs
}
