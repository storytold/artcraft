use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::video::image::kling_2p6_pro_image_to_video::raw_request::{
  Kling2p6ProImageToVideoInput, Kling2p6ProImageToVideoOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct Kling2p6ProImageToVideoRequest {
  /// Text prompt describing the video to generate.
  pub prompt: String,

  /// URL of the image used as the first frame.
  pub start_image_url: String,

  /// URL of the image used as the last frame (optional).
  pub end_image_url: Option<String>,

  /// Video duration. Kling 2.6 Pro supports 5 or 10 seconds only.
  pub duration: Option<Kling2p6ProImageToVideoDuration>,

  /// Optional negative prompt. fal's default is
  /// `"blur, distort, and low quality"` when this is `None`.
  pub negative_prompt: Option<String>,

  /// Whether to generate native audio. fal's server default is `true` when
  /// this is `None`.
  pub generate_audio: Option<bool>,

  /// Voice IDs to use for the generated audio. Maximum of 2 voices per task;
  /// reference them in the prompt as `<<<voice_1>>>` and `<<<voice_2>>>`.
  ///
  /// Note: supplying voice IDs along with `generate_audio = Some(true)`
  /// activates fal's "audio + voice control" pricing tier ($0.168/sec).
  pub voice_ids: Option<Vec<String>>,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Kling2p6ProImageToVideoDuration {
  FiveSeconds,
  TenSeconds,
}

impl Kling2p6ProImageToVideoDuration {
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

impl FalEndpoint for Kling2p6ProImageToVideoRequest {
  const ENDPOINT: &str = "fal-ai/kling-video/v2.6/pro/image-to-video";

  type RawRequest = Kling2p6ProImageToVideoInput;
  type RawResponse = Kling2p6ProImageToVideoOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    let duration = self.duration.map(|d| d.to_str().to_string());

    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      start_image_url: self.start_image_url.clone(),
      end_image_url: self.end_image_url.clone(),
      duration,
      negative_prompt: self.negative_prompt.clone(),
      generate_audio: self.generate_audio,
      voice_ids: self.voice_ids.clone(),
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

    let request = Kling2p6ProImageToVideoRequest {
      prompt: "the lake comes alive with gentle ripples and dappled sunlight".to_string(),
      start_image_url: JUNO_AT_LAKE_IMAGE_URL.to_string(),
      end_image_url: None,
      duration: Some(Kling2p6ProImageToVideoDuration::FiveSeconds),
      negative_prompt: None,
      generate_audio: Some(false),
      voice_ids: None,
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

    let request = Kling2p6ProImageToVideoRequest {
      prompt: "wind moves through the trees".to_string(),
      start_image_url: JUNO_AT_LAKE_IMAGE_URL.to_string(),
      end_image_url: None,
      duration: Some(Kling2p6ProImageToVideoDuration::FiveSeconds),
      negative_prompt: None,
      generate_audio: Some(false),
      voice_ids: None,
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
      Kling2p6ProImageToVideoDuration::FiveSeconds,
      Kling2p6ProImageToVideoDuration::TenSeconds,
    ];

    for dur in durations {
      println!("--- duration: {:?} ---", dur);
      let request = Kling2p6ProImageToVideoRequest {
        prompt: "the dog wags its tail".to_string(),
        start_image_url: JUNO_AT_LAKE_IMAGE_URL.to_string(),
        end_image_url: None,
        duration: Some(dur),
        negative_prompt: None,
        generate_audio: Some(false),
        voice_ids: None,
      };
      let result = request.send_webhook_request(&api_key, "https://example.com/webhook").await?;
      println!("result: {:?}", result);
    }

    Ok(())
  }

  // ── Wire-shape sanity ──

  #[test]
  fn raw_request_uses_canonical_field_names() {
    let request = Kling2p6ProImageToVideoRequest {
      prompt: "p".to_string(),
      start_image_url: "https://example.com/start.png".to_string(),
      end_image_url: Some("https://example.com/end.png".to_string()),
      duration: Some(Kling2p6ProImageToVideoDuration::TenSeconds),
      negative_prompt: Some("nope".to_string()),
      generate_audio: Some(true),
      voice_ids: Some(vec!["voice_a".to_string(), "voice_b".to_string()]),
    };
    let raw = request.to_raw_request().unwrap();
    assert_eq!(raw.prompt, "p");
    assert_eq!(raw.start_image_url, "https://example.com/start.png");
    assert_eq!(raw.end_image_url.as_deref(), Some("https://example.com/end.png"));
    assert_eq!(raw.duration.as_deref(), Some("10"));
    assert_eq!(raw.negative_prompt.as_deref(), Some("nope"));
    assert_eq!(raw.generate_audio, Some(true));
    assert_eq!(raw.voice_ids.as_deref(), Some(&["voice_a".to_string(), "voice_b".to_string()][..]));
  }

  #[test]
  fn raw_request_omits_unset_optionals() {
    let request = Kling2p6ProImageToVideoRequest {
      prompt: "p".to_string(),
      start_image_url: "https://example.com/start.png".to_string(),
      end_image_url: None,
      duration: None,
      negative_prompt: None,
      generate_audio: None,
      voice_ids: None,
    };
    let raw = request.to_raw_request().unwrap();
    assert_eq!(raw.start_image_url, "https://example.com/start.png");
    assert!(raw.end_image_url.is_none());
    assert!(raw.duration.is_none());
    assert!(raw.negative_prompt.is_none());
    assert!(raw.generate_audio.is_none());
    assert!(raw.voice_ids.is_none());
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(
      Kling2p6ProImageToVideoRequest::ENDPOINT,
      "fal-ai/kling-video/v2.6/pro/image-to-video",
    );
  }

  /// Parity vs the legacy
  /// `requests_old/http/video/image/http_kling_v2p6_pro_image_to_video.rs`.
  ///
  /// The legacy has no cost calculator, so cost parity is N/A. The wire
  /// shape *intentionally diverges*: fal renamed the image field from
  /// `image_url` (legacy) to `start_image_url` (current docs), and the
  /// legacy gained no concept of `voice_ids` or `end_image_url`. These
  /// tests document the differences and pin the endpoint URL, so we'll
  /// notice if fal ever flips back or further changes the schema.
  mod legacy_parity {
    use super::*;
    use crate::requests_old::http::video::image::http_kling_v2p6_pro_image_to_video::{
      kling_v2p6_pro_image_to_video, KlingV2p6ProImageToVideoInput,
    };

    /// Same `fal-ai/kling-video/v2.6/pro/image-to-video` path.
    #[test]
    fn endpoint_path_matches_legacy() {
      let legacy = kling_v2p6_pro_image_to_video(KlingV2p6ProImageToVideoInput {
        prompt: "p".to_string(),
        image_url: "https://example.com/x.png".to_string(),
        ..Default::default()
      });
      assert_eq!(
        Kling2p6ProImageToVideoRequest::ENDPOINT,
        legacy.endpoint,
      );
    }

    /// The image-URL field was renamed by fal: legacy `image_url` →
    /// current `start_image_url`. This test pins the new module to the
    /// current name and confirms the legacy field name is *not* emitted.
    #[test]
    fn new_module_emits_start_image_url_not_image_url() {
      let new = Kling2p6ProImageToVideoRequest {
        prompt: "p".to_string(),
        start_image_url: "https://example.com/x.png".to_string(),
        end_image_url: None,
        duration: None,
        negative_prompt: None,
        generate_audio: None,
        voice_ids: None,
      };
      let json = serde_json::to_value(new.to_raw_request().unwrap()).unwrap();
      assert!(json.get("start_image_url").is_some(), "missing start_image_url: {json}");
      assert!(json.get("image_url").is_none(), "unexpected legacy image_url: {json}");
    }

    /// Legacy struct still emits the *old* `image_url` field name —
    /// asserting this here flags any future schema drift in the legacy
    /// archive (it shouldn't change; if it does we want to know).
    #[test]
    fn legacy_module_still_emits_image_url() {
      let legacy = KlingV2p6ProImageToVideoInput {
        prompt: "p".to_string(),
        image_url: "https://example.com/x.png".to_string(),
        ..Default::default()
      };
      let json = serde_json::to_value(&legacy).unwrap();
      assert!(json.get("image_url").is_some(), "missing image_url: {json}");
      assert!(json.get("start_image_url").is_none(), "unexpected start_image_url: {json}");
    }

    /// On fields that *did* survive the rename (prompt, duration,
    /// negative_prompt, generate_audio), wire JSON must match between
    /// new and legacy when populated with the same values.
    #[test]
    fn surviving_fields_match_legacy_wire_shape() {
      let new = Kling2p6ProImageToVideoRequest {
        prompt: "shared prompt".to_string(),
        start_image_url: "https://example.com/x.png".to_string(),
        end_image_url: None,
        duration: Some(Kling2p6ProImageToVideoDuration::TenSeconds),
        negative_prompt: Some("blurry".to_string()),
        generate_audio: Some(false),
        voice_ids: None,
      };
      let mut new_json = serde_json::to_value(new.to_raw_request().unwrap()).unwrap();

      let legacy = KlingV2p6ProImageToVideoInput {
        prompt: "shared prompt".to_string(),
        image_url: "https://example.com/x.png".to_string(),
        duration: Some("10".to_string()),
        negative_prompt: Some("blurry".to_string()),
        generate_audio: Some(false),
      };
      let mut legacy_json = serde_json::to_value(&legacy).unwrap();

      // Strip the renamed image-URL field from each side, then compare.
      // (`voice_ids` and `end_image_url` are new in 2.6 — neither is set
      // in this test, so they don't appear in JSON.)
      new_json.as_object_mut().unwrap().remove("start_image_url");
      legacy_json.as_object_mut().unwrap().remove("image_url");
      assert_eq!(new_json, legacy_json);
    }
  }

  // NB: Pricing tests are in cost.rs
}
