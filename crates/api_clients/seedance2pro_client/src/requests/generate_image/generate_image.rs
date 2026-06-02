use crate::creds::seedance2pro_session::Seedance2ProSession;
use crate::error::seedance2pro_client_error::Seedance2ProClientError;
use crate::error::seedance2pro_error::Seedance2ProError;
use crate::error::seedance2pro_generic_api_error::Seedance2ProGenericApiError;
use crate::error::seedance2pro_specific_api_error::Seedance2ProSpecificApiError;
use crate::requests::generate_image::request_types::*;
use crate::requests::kinovi_host::{KinoviHost, resolve_host};
use crate::utils::categorize_seedance2pro_error::categorize_seedance2pro_error;
use crate::utils::common_headers::FIREFOX_USER_AGENT;
use log::info;
use wreq::Client;
use wreq_util::Emulation;

// ── Constants ──

/// All Midjourney generations on Kinovi cost 12 credits per image-task,
/// regardless of model (v7, v7-niji, v8) or aspect ratio. Batches are billed
/// at this rate × `batch_count`.
const CREDITS_PER_MIDJOURNEY_TASK: u32 = 12;

/// Newer Kinovi credit-package rate. Used to convert credits to USD for the
/// Midjourney image generation flow.
///
/// 22,000 credits / $114 = 192.98 ≈ 193 credits per dollar.
const CREDITS_PER_DOLLAR: f64 = 193.0;

/// Kinovi only currently exposes a single Midjourney resolution preset.
const MIDJOURNEY_RESOLUTION: &str = "1k";

const BUSINESS_TYPE: &str = "midjourney-image-generation";

// ── Request args ──

/// Wrapper that bundles a [`KinoviGenerateImageRequest`] with session and host info.
pub struct GenerateImageArgs<'a> {
  pub request: KinoviGenerateImageRequest,
  pub session: &'a Seedance2ProSession,
  pub host_override: Option<KinoviHost>,
}

/// Image generation parameters (no session/host info).
#[derive(Clone)]
pub struct KinoviGenerateImageRequest {
  /// Which Midjourney variant to run.
  pub model: KinoviMidjourneyModel,

  /// User prompt.
  pub prompt: String,

  /// Output aspect ratio.
  pub aspect_ratio: KinoviMidjourneyAspectRatio,

  /// Optional negative prompt. Sent as the `"no"` field on the wire.
  pub negative_prompt: Option<String>,

  /// Midjourney "stylize" parameter. Valid range 0–1000. `None` omits the
  /// field and lets Kinovi pick its default.
  pub stylize: Option<u16>,

  /// Midjourney "weird" parameter. Valid range 0–3000.
  pub weird: Option<u16>,

  /// Midjourney "chaos" parameter. Valid range 0–100.
  pub chaos: Option<u8>,

  /// Quality preset. `None` omits the field.
  pub quality: Option<KinoviMidjourneyQuality>,

  /// Enables Midjourney "raw" style mode when true. Sent as `"style":"raw"`.
  pub raw_mode: bool,

  /// Number of distinct generations to enqueue in a single request.
  pub batch_count: KinoviMidjourneyBatchCount,
}

impl std::fmt::Debug for KinoviGenerateImageRequest {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    f.debug_struct("GenerateImageRequest")
      .field("model", &self.model)
      .field("prompt", &self.prompt)
      .field("aspect_ratio", &self.aspect_ratio)
      .field("negative_prompt", &self.negative_prompt)
      .field("stylize", &self.stylize)
      .field("weird", &self.weird)
      .field("chaos", &self.chaos)
      .field("quality", &self.quality)
      .field("raw_mode", &self.raw_mode)
      .field("batch_count", &self.batch_count)
      .finish()
  }
}

impl std::fmt::Debug for GenerateImageArgs<'_> {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    f.debug_struct("GenerateImageArgs")
      .field("request", &self.request)
      .field("host_override", &self.host_override)
      .finish()
  }
}

impl KinoviGenerateImageRequest {
  /// Estimates the Kinovi credit cost for this request.
  ///
  /// Pricing for Midjourney is flat: 12 credits per task, regardless of
  /// model or aspect ratio. Batches multiply the cost by `batch_count`.
  pub fn estimate_credits(&self) -> u32 {
    CREDITS_PER_MIDJOURNEY_TASK * u32::from(self.batch_count.as_u8())
  }

  /// Estimates the dollar cost (in USD cents, rounded to the nearest cent).
  pub fn estimate_cost_in_usd_cents(&self) -> u64 {
    let credits = self.estimate_credits() as f64;
    let cost = credits / CREDITS_PER_DOLLAR * 100.0;
    cost.round() as u64
  }
}

// ── Public enums ──

/// Midjourney model variant.
#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub enum KinoviMidjourneyModel {
  /// Midjourney v7 — the current general-purpose model.
  V7,
  /// Midjourney v7 Niji — v7 trained for anime/illustration.
  V7Niji,
  /// Midjourney v8 — the newest model.
  V8,
}

impl KinoviMidjourneyModel {
  fn as_api_str(&self) -> &'static str {
    match self {
      Self::V7 => "midjourney-v7",
      Self::V7Niji => "midjourney-v7-niji",
      Self::V8 => "midjourney-v8",
    }
  }
}

/// Output aspect ratio. Kinovi/Midjourney accepts a wide range; the values
/// here cover every ratio seen in the captured request samples plus the
/// common Midjourney-supported variants.
#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub enum KinoviMidjourneyAspectRatio {
  Square1x1,
  Landscape16x9,
  Portrait9x16,
  UltraWide21x9,
  UltraTall9x21,
  Standard4x3,
  Portrait3x4,
  Wide5x4,
  Tall4x5,
  Wide3x2,
  Tall2x3,
}

impl KinoviMidjourneyAspectRatio {
  fn as_api_str(&self) -> &'static str {
    match self {
      Self::Square1x1 => "1:1",
      Self::Landscape16x9 => "16:9",
      Self::Portrait9x16 => "9:16",
      Self::UltraWide21x9 => "21:9",
      Self::UltraTall9x21 => "9:21",
      Self::Standard4x3 => "4:3",
      Self::Portrait3x4 => "3:4",
      Self::Wide5x4 => "5:4",
      Self::Tall4x5 => "4:5",
      Self::Wide3x2 => "3:2",
      Self::Tall2x3 => "2:3",
    }
  }
}

/// Midjourney quality presets. Higher = more compute and slower; pricing is
/// flat regardless.
#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub enum KinoviMidjourneyQuality {
  /// 0.25
  Quarter,
  /// 0.5
  Half,
  /// 1 (default)
  Full,
}

impl KinoviMidjourneyQuality {
  fn as_api_value(&self) -> f32 {
    match self {
      Self::Quarter => 0.25,
      Self::Half => 0.5,
      Self::Full => 1.0,
    }
  }
}

/// Number of distinct Midjourney generations to enqueue.
/// Each task itself returns a 4-image grid; this knob just enqueues N tasks.
#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub enum KinoviMidjourneyBatchCount {
  One,
  Two,
  Four,
}

impl KinoviMidjourneyBatchCount {
  fn as_u8(&self) -> u8 {
    match self {
      Self::One => 1,
      Self::Two => 2,
      Self::Four => 4,
    }
  }
}

// ── Response ──

pub struct GenerateImageResponse {
  pub task_id: String,
  pub order_id: String,

  /// Present when batch_count > 1.
  pub task_ids: Option<Vec<String>>,

  /// Present when batch_count > 1.
  pub order_ids: Option<Vec<String>>,
}

// ── Implementation ──

pub async fn generate_image(args: GenerateImageArgs<'_>) -> Result<GenerateImageResponse, Seedance2ProError> {
  let host = resolve_host(args.host_override.as_ref());
  let base_url = host.api_base_url();
  let run_task_url = format!("{}/api/trpc/workflow.runTask?batch=1", base_url);

  let req = args.request;

  info!("Requesting Midjourney image from Kinovi: {:?}", req);

  let batch_count_value = req.batch_count.as_u8();
  let batch_count = if batch_count_value > 1 { Some(batch_count_value) } else { None };

  let style = if req.raw_mode { Some("raw") } else { None };

  let request_body = BatchRequest {
    zero: BatchRequestInner {
      json: BatchRequestJson {
        business_type: BUSINESS_TYPE,
        api_params: ApiParams {
          prompt: req.prompt,
          aspect_ratio: req.aspect_ratio.as_api_str(),
          resolution: MIDJOURNEY_RESOLUTION,
          model: req.model.as_api_str(),
          stylize: req.stylize,
          chaos: req.chaos,
          weird: req.weird,
          quality: req.quality.map(|q| q.as_api_value()),
          style,
          negative_prompt: req.negative_prompt,
          batch_count,
        },
      },
    },
  };

  info!("Kinovi Midjourney request: {:?}", request_body);

  let cookie = args.session.cookies.as_str();

  let client = Client::builder()
    .emulation(Emulation::Firefox143)
    .build()
    .map_err(|err| Seedance2ProClientError::WreqClientError(err))?;

  let referer = format!("{}/", base_url);

  let response = client.post(&run_task_url)
    .header("User-Agent", FIREFOX_USER_AGENT)
    .header("Accept", "*/*")
    .header("Accept-Language", "en-US,en;q=0.9")
    .header("Accept-Encoding", "gzip, deflate, br, zstd")
    .header("Referer", &referer)
    .header("Content-Type", "application/json")
    .header("x-trpc-source", "client")
    .header("Origin", base_url)
    .header("Connection", "keep-alive")
    .header("Cookie", cookie)
    .header("Sec-Fetch-Dest", "empty")
    .header("Sec-Fetch-Mode", "cors")
    .header("Sec-Fetch-Site", "same-origin")
    .header("Priority", "u=4")
    .header("TE", "trailers")
    .json(&request_body)
    .send()
    .await
    .map_err(|err| Seedance2ProGenericApiError::WreqError(err))?;

  let status = response.status();
  let response_body = response.text()
    .await
    .map_err(|err| Seedance2ProGenericApiError::WreqError(err))?;

  info!("Response status: {}, body: {}", status, response_body);

  if !status.is_success() {
    return Err(categorize_seedance2pro_error(status, response_body));
  }

  let batch_response: Vec<BatchResponseItem> = serde_json::from_str(&response_body)
    .map_err(|err| Seedance2ProGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.clone()))?;

  let task_data = batch_response
    .into_iter()
    .next()
    .ok_or_else(|| Seedance2ProGenericApiError::UncategorizedBadResponse(
      "Empty batch response array".to_string()
    ))?
    .result
    .data
    .json;

  if task_data.violation_warning {
    return Err(Seedance2ProSpecificApiError::VideoGenerationViolation(response_body).into());
  }

  Ok(GenerateImageResponse {
    task_id: task_data.task_id,
    order_id: task_data.order_id,
    task_ids: task_data.task_ids,
    order_ids: task_data.order_ids,
  })
}

#[cfg(test)]
mod tests {
  use super::*;

  // ── Pricing ──

  mod pricing_tests {
    use super::*;

    fn make_request(batch_count: KinoviMidjourneyBatchCount) -> KinoviGenerateImageRequest {
      KinoviGenerateImageRequest {
        model: KinoviMidjourneyModel::V7,
        prompt: String::new(),
        aspect_ratio: KinoviMidjourneyAspectRatio::Square1x1,
        negative_prompt: None,
        stylize: None,
        weird: None,
        chaos: None,
        quality: None,
        raw_mode: false,
        batch_count,
      }
    }

    // ── Headline cost rule: 12 credits × batch_count ──

    #[test]
    fn batch_one_is_twelve_credits() {
      assert_eq!(make_request(KinoviMidjourneyBatchCount::One).estimate_credits(), 12);
    }

    #[test]
    fn batch_two_is_twentyfour_credits() {
      assert_eq!(make_request(KinoviMidjourneyBatchCount::Two).estimate_credits(), 24);
    }

    #[test]
    fn batch_four_is_fortyeight_credits() {
      assert_eq!(make_request(KinoviMidjourneyBatchCount::Four).estimate_credits(), 48);
    }

    /// Pricing is identical across all three Midjourney models.
    #[test]
    fn pricing_is_model_agnostic() {
      let baseline = make_request(KinoviMidjourneyBatchCount::One).estimate_credits();
      for model in [
        KinoviMidjourneyModel::V7,
        KinoviMidjourneyModel::V7Niji,
        KinoviMidjourneyModel::V8,
      ] {
        let req = KinoviGenerateImageRequest { model, ..make_request(KinoviMidjourneyBatchCount::One) };
        assert_eq!(req.estimate_credits(), baseline, "model={:?}", model);
      }
    }

    /// Pricing does not vary by aspect ratio.
    #[test]
    fn pricing_is_aspect_ratio_agnostic() {
      let baseline = make_request(KinoviMidjourneyBatchCount::One).estimate_credits();
      for ar in [
        KinoviMidjourneyAspectRatio::Square1x1,
        KinoviMidjourneyAspectRatio::Landscape16x9,
        KinoviMidjourneyAspectRatio::Portrait9x16,
        KinoviMidjourneyAspectRatio::UltraWide21x9,
        KinoviMidjourneyAspectRatio::UltraTall9x21,
        KinoviMidjourneyAspectRatio::Standard4x3,
        KinoviMidjourneyAspectRatio::Portrait3x4,
        KinoviMidjourneyAspectRatio::Wide5x4,
        KinoviMidjourneyAspectRatio::Tall4x5,
        KinoviMidjourneyAspectRatio::Wide3x2,
        KinoviMidjourneyAspectRatio::Tall2x3,
      ] {
        let req = KinoviGenerateImageRequest { aspect_ratio: ar, ..make_request(KinoviMidjourneyBatchCount::One) };
        assert_eq!(req.estimate_credits(), baseline, "aspect_ratio={:?}", ar);
      }
    }

    /// Pricing does not vary with the Midjourney style knobs.
    #[test]
    fn pricing_is_independent_of_style_knobs() {
      let baseline = make_request(KinoviMidjourneyBatchCount::One).estimate_credits();
      let req = KinoviGenerateImageRequest {
        stylize: Some(1000),
        weird: Some(3000),
        chaos: Some(100),
        quality: Some(KinoviMidjourneyQuality::Full),
        raw_mode: true,
        negative_prompt: Some("ugly, blurry".to_string()),
        ..make_request(KinoviMidjourneyBatchCount::One)
      };
      assert_eq!(req.estimate_credits(), baseline);
    }

    // ── USD cents conversion ──

    #[test]
    fn usd_cents_batch_one() {
      // 12 / 193 × 100 = 6.21¢ → 6¢
      assert_eq!(make_request(KinoviMidjourneyBatchCount::One).estimate_cost_in_usd_cents(), 6);
    }

    #[test]
    fn usd_cents_batch_two() {
      // 24 / 193 × 100 = 12.43¢ → 12¢
      assert_eq!(make_request(KinoviMidjourneyBatchCount::Two).estimate_cost_in_usd_cents(), 12);
    }

    #[test]
    fn usd_cents_batch_four() {
      // 48 / 193 × 100 = 24.87¢ → 25¢
      assert_eq!(make_request(KinoviMidjourneyBatchCount::Four).estimate_cost_in_usd_cents(), 25);
    }

    /// Batch 4 should be exactly 4× the credit cost of batch 1, and the USD
    /// cents conversion should track within rounding (1¢ slack).
    #[test]
    fn batch_4_costs_4x_credits_and_approximately_4x_dollars() {
      let one = make_request(KinoviMidjourneyBatchCount::One);
      let four = make_request(KinoviMidjourneyBatchCount::Four);

      assert_eq!(four.estimate_credits(), one.estimate_credits() * 4);

      let one_cents = one.estimate_cost_in_usd_cents();
      let four_cents = four.estimate_cost_in_usd_cents();
      let expected = one_cents * 4;
      let delta = (four_cents as i64 - expected as i64).abs();
      assert!(delta <= 1, "expected ~{}¢, got {}¢", expected, four_cents);
    }
  }

  // ── Wire-shape ──

  mod wire_shape_tests {
    use super::*;
    use serde_json::Value;

    fn build_wire_json(req: KinoviGenerateImageRequest) -> Value {
      // Mirrors the body assembly in `generate_image()` minus the actual
      // network call, so we can introspect the JSON the server would see.
      let batch_count_value = req.batch_count.as_u8();
      let batch_count = if batch_count_value > 1 { Some(batch_count_value) } else { None };
      let style = if req.raw_mode { Some("raw") } else { None };

      let request_body = BatchRequest {
        zero: BatchRequestInner {
          json: BatchRequestJson {
            business_type: BUSINESS_TYPE,
            api_params: ApiParams {
              prompt: req.prompt,
              aspect_ratio: req.aspect_ratio.as_api_str(),
              resolution: MIDJOURNEY_RESOLUTION,
              model: req.model.as_api_str(),
              stylize: req.stylize,
              chaos: req.chaos,
              weird: req.weird,
              quality: req.quality.map(|q| q.as_api_value()),
              style,
              negative_prompt: req.negative_prompt,
              batch_count,
            },
          },
        },
      };
      serde_json::to_value(&request_body).unwrap()
    }

    fn api_params(req: KinoviGenerateImageRequest) -> Value {
      build_wire_json(req)["0"]["json"]["apiParams"].clone()
    }

    fn minimal_request(model: KinoviMidjourneyModel, prompt: &str) -> KinoviGenerateImageRequest {
      KinoviGenerateImageRequest {
        model,
        prompt: prompt.to_string(),
        aspect_ratio: KinoviMidjourneyAspectRatio::Square1x1,
        negative_prompt: None,
        stylize: None,
        weird: None,
        chaos: None,
        quality: None,
        raw_mode: false,
        batch_count: KinoviMidjourneyBatchCount::One,
      }
    }

    // ── Minimal: matches captured sample #1 ──

    #[test]
    fn minimal_v7_matches_captured_sample() {
      // Sample #1: `{"prompt":"Anime dinosaur","aspectRatio":"1:1","resolution":"1k","model":"midjourney-v7"}`
      let params = api_params(minimal_request(KinoviMidjourneyModel::V7, "Anime dinosaur"));
      assert_eq!(params["prompt"], "Anime dinosaur");
      assert_eq!(params["aspectRatio"], "1:1");
      assert_eq!(params["resolution"], "1k");
      assert_eq!(params["model"], "midjourney-v7");

      let obj = params.as_object().unwrap();
      let unexpected: Vec<&str> = obj.keys()
        .filter(|k| !["prompt", "aspectRatio", "resolution", "model"].contains(&k.as_str()))
        .map(|s| s.as_str())
        .collect();
      assert!(unexpected.is_empty(), "minimal request should omit optional fields, found: {:?}", unexpected);
    }

    // ── Model strings ──

    #[test]
    fn model_v7_maps_to_midjourney_v7() {
      let p = api_params(minimal_request(KinoviMidjourneyModel::V7, "p"));
      assert_eq!(p["model"], "midjourney-v7");
    }

    #[test]
    fn model_v7_niji_maps_to_midjourney_v7_niji() {
      let p = api_params(minimal_request(KinoviMidjourneyModel::V7Niji, "p"));
      assert_eq!(p["model"], "midjourney-v7-niji");
    }

    #[test]
    fn model_v8_maps_to_midjourney_v8() {
      let p = api_params(minimal_request(KinoviMidjourneyModel::V8, "p"));
      assert_eq!(p["model"], "midjourney-v8");
    }

    // ── Aspect ratio strings ──

    #[test]
    fn all_aspect_ratios_serialize_correctly() {
      let cases = [
        (KinoviMidjourneyAspectRatio::Square1x1, "1:1"),
        (KinoviMidjourneyAspectRatio::Landscape16x9, "16:9"),
        (KinoviMidjourneyAspectRatio::Portrait9x16, "9:16"),
        (KinoviMidjourneyAspectRatio::UltraWide21x9, "21:9"),
        (KinoviMidjourneyAspectRatio::UltraTall9x21, "9:21"),
        (KinoviMidjourneyAspectRatio::Standard4x3, "4:3"),
        (KinoviMidjourneyAspectRatio::Portrait3x4, "3:4"),
        (KinoviMidjourneyAspectRatio::Wide5x4, "5:4"),
        (KinoviMidjourneyAspectRatio::Tall4x5, "4:5"),
        (KinoviMidjourneyAspectRatio::Wide3x2, "3:2"),
        (KinoviMidjourneyAspectRatio::Tall2x3, "2:3"),
      ];
      for (ar, expected) in cases {
        let req = KinoviGenerateImageRequest { aspect_ratio: ar, ..minimal_request(KinoviMidjourneyModel::V7, "p") };
        let p = api_params(req);
        assert_eq!(p["aspectRatio"], expected, "aspect_ratio={:?}", ar);
      }
    }

    // ── Optional fields omit when None ──

    #[test]
    fn optionals_omitted_when_none() {
      let p = api_params(minimal_request(KinoviMidjourneyModel::V7, "p"));
      let obj = p.as_object().unwrap();
      for key in ["stylize", "chaos", "weird", "quality", "style", "no", "batchCount"] {
        assert!(!obj.contains_key(key), "expected `{}` to be omitted in minimal request", key);
      }
    }

    // ── Style knobs ──

    #[test]
    fn stylize_serializes_when_set() {
      let req = KinoviGenerateImageRequest { stylize: Some(730), ..minimal_request(KinoviMidjourneyModel::V8, "p") };
      assert_eq!(api_params(req)["stylize"], 730);
    }

    #[test]
    fn chaos_serializes_when_set() {
      let req = KinoviGenerateImageRequest { chaos: Some(70), ..minimal_request(KinoviMidjourneyModel::V8, "p") };
      assert_eq!(api_params(req)["chaos"], 70);
    }

    #[test]
    fn weird_serializes_when_set() {
      let req = KinoviGenerateImageRequest { weird: Some(2050), ..minimal_request(KinoviMidjourneyModel::V8, "p") };
      assert_eq!(api_params(req)["weird"], 2050);
    }

    #[test]
    fn stylize_zero_is_explicitly_sent_not_omitted() {
      // Captured sample #9 sends explicit zeros — `None` ≠ `Some(0)` on the wire.
      let req = KinoviGenerateImageRequest {
        stylize: Some(0),
        chaos: Some(0),
        weird: Some(0),
        ..minimal_request(KinoviMidjourneyModel::V7, "p")
      };
      let p = api_params(req);
      assert_eq!(p["stylize"], 0);
      assert_eq!(p["chaos"], 0);
      assert_eq!(p["weird"], 0);
    }

    #[test]
    fn quality_quarter_serializes_as_0_25() {
      let req = KinoviGenerateImageRequest { quality: Some(KinoviMidjourneyQuality::Quarter), ..minimal_request(KinoviMidjourneyModel::V7, "p") };
      let q = api_params(req)["quality"].as_f64().unwrap();
      assert!((q - 0.25).abs() < 1e-6, "got {}", q);
    }

    #[test]
    fn quality_half_serializes_as_0_5() {
      let req = KinoviGenerateImageRequest { quality: Some(KinoviMidjourneyQuality::Half), ..minimal_request(KinoviMidjourneyModel::V7, "p") };
      let q = api_params(req)["quality"].as_f64().unwrap();
      assert!((q - 0.5).abs() < 1e-6, "got {}", q);
    }

    #[test]
    fn quality_full_serializes_as_1_0() {
      let req = KinoviGenerateImageRequest { quality: Some(KinoviMidjourneyQuality::Full), ..minimal_request(KinoviMidjourneyModel::V7, "p") };
      let q = api_params(req)["quality"].as_f64().unwrap();
      assert!((q - 1.0).abs() < 1e-6, "got {}", q);
    }

    // ── Raw mode ──

    #[test]
    fn raw_mode_true_sends_style_raw() {
      let req = KinoviGenerateImageRequest { raw_mode: true, ..minimal_request(KinoviMidjourneyModel::V7, "p") };
      assert_eq!(api_params(req)["style"], "raw");
    }

    #[test]
    fn raw_mode_false_omits_style() {
      let p = api_params(minimal_request(KinoviMidjourneyModel::V7, "p"));
      assert!(p.as_object().unwrap().get("style").is_none());
    }

    // ── Negative prompt → `"no"` field ──

    #[test]
    fn negative_prompt_serializes_as_no_field() {
      let req = KinoviGenerateImageRequest {
        negative_prompt: Some("dark, gloomy, night".to_string()),
        ..minimal_request(KinoviMidjourneyModel::V7, "p")
      };
      let p = api_params(req);
      assert_eq!(p["no"], "dark, gloomy, night");
      assert!(p.as_object().unwrap().get("negative_prompt").is_none(), "must not leak field name");
      assert!(p.as_object().unwrap().get("negativePrompt").is_none(), "must not leak camelCase variant");
    }

    // ── Batch count ──

    #[test]
    fn batch_one_omits_batch_count() {
      let p = api_params(minimal_request(KinoviMidjourneyModel::V7, "p"));
      assert!(p.as_object().unwrap().get("batchCount").is_none());
    }

    #[test]
    fn batch_two_sends_batch_count_2() {
      let req = KinoviGenerateImageRequest { batch_count: KinoviMidjourneyBatchCount::Two, ..minimal_request(KinoviMidjourneyModel::V7, "p") };
      assert_eq!(api_params(req)["batchCount"], 2);
    }

    #[test]
    fn batch_four_sends_batch_count_4() {
      let req = KinoviGenerateImageRequest { batch_count: KinoviMidjourneyBatchCount::Four, ..minimal_request(KinoviMidjourneyModel::V7, "p") };
      assert_eq!(api_params(req)["batchCount"], 4);
    }

    // ── businessType and trpc envelope ──

    #[test]
    fn business_type_is_midjourney_image_generation() {
      let body = build_wire_json(minimal_request(KinoviMidjourneyModel::V7, "p"));
      assert_eq!(body["0"]["json"]["businessType"], "midjourney-image-generation");
    }

    #[test]
    fn resolution_is_1k() {
      let p = api_params(minimal_request(KinoviMidjourneyModel::V7, "p"));
      assert_eq!(p["resolution"], "1k");
    }

    // ── Captured-sample replay (#9: kitchen sink) ──

    /// Reconstructs the captured sample #9 (V7 + raw + all knobs + negative
    /// prompt) and asserts the wire matches byte-for-byte.
    #[test]
    fn captured_sample_9_matches_byte_for_byte() {
      let req = KinoviGenerateImageRequest {
        model: KinoviMidjourneyModel::V7,
        prompt: "abandoned skyscrapers".to_string(),
        aspect_ratio: KinoviMidjourneyAspectRatio::Square1x1,
        negative_prompt: Some("dark, gloomy, night".to_string()),
        stylize: Some(1000),
        weird: Some(3000),
        chaos: Some(100),
        quality: Some(KinoviMidjourneyQuality::Half),
        raw_mode: true,
        batch_count: KinoviMidjourneyBatchCount::One,
      };
      let got = api_params(req);
      let expected: Value = serde_json::from_str(
        r#"{"prompt":"abandoned skyscrapers","aspectRatio":"1:1","resolution":"1k","model":"midjourney-v7","stylize":1000,"chaos":100,"weird":3000,"quality":0.5,"style":"raw","no":"dark, gloomy, night"}"#,
      ).unwrap();
      assert_eq!(got, expected);
    }

    /// Captured sample #12 (V8 + batch 4).
    #[test]
    fn captured_sample_12_batch_4() {
      let req = KinoviGenerateImageRequest {
        model: KinoviMidjourneyModel::V8,
        prompt: "desolate cliff overlooking the ocean".to_string(),
        aspect_ratio: KinoviMidjourneyAspectRatio::Portrait9x16,
        negative_prompt: None,
        stylize: None,
        weird: None,
        chaos: None,
        quality: Some(KinoviMidjourneyQuality::Full),
        raw_mode: false,
        batch_count: KinoviMidjourneyBatchCount::Four,
      };
      let got = api_params(req);
      let expected: Value = serde_json::from_str(
        r#"{"prompt":"desolate cliff overlooking the ocean","aspectRatio":"9:16","resolution":"1k","model":"midjourney-v8","batchCount":4,"quality":1.0}"#,
      ).unwrap();
      assert_eq!(got, expected);
    }
  }

  // ── Real requests (manually run; require live cookies and cost credits) ──

  mod real_requests {
    use super::*;
    use crate::creds::seedance2pro_session::Seedance2ProSession;
    use crate::test_utils::get_test_cookies::get_test_cookies;
    use crate::test_utils::setup_test_logging::setup_test_logging;
    use errors::AnyhowResult;
    use log::LevelFilter;

    fn test_session() -> AnyhowResult<Seedance2ProSession> {
      let cookies = get_test_cookies()?;
      Ok(Seedance2ProSession::from_cookies_string(cookies))
    }

    #[tokio::test]
    #[ignore] // manually test — requires real cookies, costs credits
    async fn test_generate_v7_minimal() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let args = GenerateImageArgs {
        session: &session,
        host_override: None,
        request: KinoviGenerateImageRequest {
          model: KinoviMidjourneyModel::V7,
          prompt: "A corgi astronaut floating among stars".to_string(),
          aspect_ratio: KinoviMidjourneyAspectRatio::Square1x1,
          negative_prompt: None,
          stylize: None,
          weird: None,
          chaos: None,
          quality: None,
          raw_mode: false,
          batch_count: KinoviMidjourneyBatchCount::One,
        },
      };
      let result = generate_image(args).await?;
      println!("Task ID: {}", result.task_id);
      println!("Order ID: {}", result.order_id);
      assert!(!result.task_id.is_empty());
      assert!(!result.order_id.is_empty());
      Ok(())
    }

    #[tokio::test]
    #[ignore] // manually test — requires real cookies, costs credits
    async fn test_generate_v7_niji_anime() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let args = GenerateImageArgs {
        session: &session,
        host_override: None,
        request: KinoviGenerateImageRequest {
          model: KinoviMidjourneyModel::V7Niji,
          prompt: "A magical shiba inu sorcerer casting spells in a crystal cave".to_string(),
          aspect_ratio: KinoviMidjourneyAspectRatio::UltraWide21x9,
          negative_prompt: None,
          stylize: None,
          weird: None,
          chaos: None,
          quality: None,
          raw_mode: false,
          batch_count: KinoviMidjourneyBatchCount::One,
        },
      };
      let result = generate_image(args).await?;
      println!("Task ID: {}", result.task_id);
      println!("Order ID: {}", result.order_id);
      assert!(!result.task_id.is_empty());
      Ok(())
    }

    #[tokio::test]
    #[ignore] // manually test — requires real cookies, costs credits
    async fn test_generate_v8_all_knobs() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let args = GenerateImageArgs {
        session: &session,
        host_override: None,
        request: KinoviGenerateImageRequest {
          model: KinoviMidjourneyModel::V8,
          prompt: "abandoned k-mart, overgrown vines, retrofuturist signage".to_string(),
          aspect_ratio: KinoviMidjourneyAspectRatio::Square1x1,
          negative_prompt: Some("dark, gloomy".to_string()),
          stylize: Some(730),
          weird: Some(2050),
          chaos: Some(70),
          quality: Some(KinoviMidjourneyQuality::Half),
          raw_mode: true,
          batch_count: KinoviMidjourneyBatchCount::One,
        },
      };
      let result = generate_image(args).await?;
      println!("Task ID: {}", result.task_id);
      println!("Order ID: {}", result.order_id);
      assert!(!result.task_id.is_empty());
      Ok(())
    }

    #[tokio::test]
    #[ignore] // manually test — requires real cookies, costs 48 credits
    async fn test_generate_v8_batch_4() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let args = GenerateImageArgs {
        session: &session,
        host_override: None,
        request: KinoviGenerateImageRequest {
          model: KinoviMidjourneyModel::V8,
          prompt: "desolate cliff overlooking the ocean".to_string(),
          aspect_ratio: KinoviMidjourneyAspectRatio::Portrait9x16,
          negative_prompt: None,
          stylize: None,
          weird: None,
          chaos: None,
          quality: Some(KinoviMidjourneyQuality::Full),
          raw_mode: false,
          batch_count: KinoviMidjourneyBatchCount::Four,
        },
      };
      let result = generate_image(args).await?;
      println!("Task ID: {}", result.task_id);
      println!("Order ID: {}", result.order_id);
      println!("All task IDs: {:?}", result.task_ids);
      println!("All order IDs: {:?}", result.order_ids);
      assert!(!result.task_id.is_empty());
      assert_eq!(result.task_ids.as_ref().map(|v| v.len()), Some(4), "batch 4 should return 4 task IDs");
      Ok(())
    }
  }
}
