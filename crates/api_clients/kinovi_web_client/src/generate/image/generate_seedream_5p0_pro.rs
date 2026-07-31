use serde_derive::Serialize;

use crate::cost::kinovi_generation_cost::KinoviGenerationCost;
use crate::creds::kinovi_web_session::KinoviWebSession;
use crate::error::kinovi_web_client_error::KinoviWebClientError;
use crate::error::kinovi_web_error::KinoviWebError;
use crate::requests::kinovi_host::KinoviHost;
use crate::requests::workflow_run_task::workflow_run_task::{
  workflow_run_task_custom, WorkflowRunTaskCustomArgs, WorkflowRunTaskResponse,
};

const BUSINESS_TYPE: &str = "seedream-5-pro-image-generation";
const MODEL: &str = "seedream-5.0-pro";

/// Kinovi allows at most this many reference images per request.
pub const MAX_REFERENCE_IMAGES: usize = 14;

/// Credits per generated image at 1k resolution.
const CREDITS_PER_IMAGE_1K: u64 = 14;

/// Credits per generated image at 2k resolution.
const CREDITS_PER_IMAGE_2K: u64 = 24;

// ── Args ──

pub struct GenerateSeedream5p0ProArgs<'a> {
  pub request: GenerateSeedream5p0ProRequest,
  pub session: &'a KinoviWebSession,
  pub host_override: Option<KinoviHost>,
}

// ── Request ──

/// Seedream 5.0 Pro: text-to-image (optionally with reference images).
#[derive(Clone, Debug)]
pub struct GenerateSeedream5p0ProRequest {
  /// Reference images are cited in the prompt as @Image1, @Image2, etc.
  pub prompt: String,

  pub aspect_ratio: KinoviSeedream5p0ProAspectRatio,

  pub resolution: KinoviSeedream5p0ProResolution,

  /// Number of images to generate in a single request.
  pub batch_count: KinoviSeedream5p0ProBatchCount,

  /// Optional reference image URLs, up to [`MAX_REFERENCE_IMAGES`].
  /// Referenced in prompts as @Image1, @Image2, etc.
  pub reference_image_urls: Option<Vec<String>>,
}

// ── Enums ──

/// Aspect ratios supported by Seedream 5.0 Pro.
#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub enum KinoviSeedream5p0ProAspectRatio {
  /// Let the model pick (useful with reference images).
  Auto,
  Square1x1,
  Standard4x3,
  Portrait3x4,
  Landscape16x9,
  Portrait9x16,
  Wide3x2,
  Tall2x3,
  UltraWide21x9,
}

/// Output resolution. Determines the per-image credit price.
#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub enum KinoviSeedream5p0ProResolution {
  /// 1k (14 credits per image)
  OneK,
  /// 2k (24 credits per image)
  TwoK,
}

/// Number of images to generate in a single request.
#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub enum KinoviSeedream5p0ProBatchCount {
  One,
  Two,
  Three,
  Four,
  Five,
  Six,
  Seven,
  Eight,
}

// ── Pricing ──
//
// Seedream 5.0 Pro credit pricing (per image; batch count multiplies):
//
// | Resolution | Credits/image |
// |------------|---------------|
// | 1k         |            14 |
// | 2k         |            24 |
//
// Reference images do not affect cost.
// Credit package: 525,000 credits for $2,159.0909 (~243.16 credits/$1, rounded down to 243).

impl GenerateSeedream5p0ProRequest {
  /// Calculate the cost of this generation request, in Kinovi credits and
  /// USD cents.
  pub fn calculate_costs(&self) -> KinoviGenerationCost {
    let credits_per_image = match self.resolution {
      KinoviSeedream5p0ProResolution::OneK => CREDITS_PER_IMAGE_1K,
      KinoviSeedream5p0ProResolution::TwoK => CREDITS_PER_IMAGE_2K,
    };
    let total_credits = credits_per_image * u64::from(self.batch_count.as_u8());
    KinoviGenerationCost::from_kinovi_credits(total_credits)
  }
}

impl KinoviSeedream5p0ProBatchCount {
  fn as_u8(&self) -> u8 {
    match self {
      Self::One => 1,
      Self::Two => 2,
      Self::Three => 3,
      Self::Four => 4,
      Self::Five => 5,
      Self::Six => 6,
      Self::Seven => 7,
      Self::Eight => 8,
    }
  }
}

impl KinoviSeedream5p0ProAspectRatio {
  fn as_api_str(&self) -> &'static str {
    match self {
      Self::Auto => "auto",
      Self::Square1x1 => "1:1",
      Self::Standard4x3 => "4:3",
      Self::Portrait3x4 => "3:4",
      Self::Landscape16x9 => "16:9",
      Self::Portrait9x16 => "9:16",
      Self::Wide3x2 => "3:2",
      Self::Tall2x3 => "2:3",
      Self::UltraWide21x9 => "21:9",
    }
  }
}

impl KinoviSeedream5p0ProResolution {
  fn as_api_str(&self) -> &'static str {
    match self {
      Self::OneK => "1k",
      Self::TwoK => "2k",
    }
  }
}

// ── Response ──

pub struct GenerateSeedream5p0ProResponse {
  pub task_id: String,
  pub order_id: String,

  /// Present when batch_count > 1.
  pub task_ids: Option<Vec<String>>,

  /// Present when batch_count > 1.
  pub order_ids: Option<Vec<String>>,
}

// ── Entry point ──

pub async fn generate_seedream_5p0_pro(
  args: GenerateSeedream5p0ProArgs<'_>,
) -> Result<GenerateSeedream5p0ProResponse, KinoviWebError> {
  let api_params = build_api_params(&args.request)?;

  let raw_response: WorkflowRunTaskResponse = workflow_run_task_custom(WorkflowRunTaskCustomArgs {
    business_type: BUSINESS_TYPE,
    api_params,
    session: args.session,
    host_override: args.host_override,
  }).await?;

  Ok(GenerateSeedream5p0ProResponse {
    task_id: raw_response.task_id,
    order_id: raw_response.order_id,
    task_ids: raw_response.task_ids,
    order_ids: raw_response.order_ids,
  })
}

// ── Wire payload ──

/// The `apiParams` shape for `seedream-5-pro-image-generation`. Field order
/// matches the captured browser traffic.
#[derive(Serialize, Debug)]
struct Seedream5p0ProApiParams {
  prompt: String,
  #[serde(rename = "aspectRatio")]
  aspect_ratio: &'static str,
  resolution: &'static str,
  model: &'static str,
  /// Omitted when generating a single image.
  #[serde(rename = "batchCount", skip_serializing_if = "Option::is_none")]
  batch_count: Option<u8>,
  /// Omitted when no reference images are attached.
  #[serde(rename = "uploadedUrls", skip_serializing_if = "Option::is_none")]
  uploaded_urls: Option<Vec<String>>,
}

fn build_api_params(
  request: &GenerateSeedream5p0ProRequest,
) -> Result<Seedream5p0ProApiParams, KinoviWebClientError> {
  let uploaded_urls = match &request.reference_image_urls {
    Some(urls) if urls.len() > MAX_REFERENCE_IMAGES => {
      return Err(KinoviWebClientError::InvalidRequestField {
        field: "reference_image_urls",
        raw_value: format!("{} urls", urls.len()),
        reason: format!("At most {} reference images are allowed", MAX_REFERENCE_IMAGES),
      });
    }
    Some(urls) if !urls.is_empty() => Some(urls.clone()),
    _ => None,
  };

  let batch_count_value = request.batch_count.as_u8();
  let batch_count = if batch_count_value > 1 { Some(batch_count_value) } else { None };

  Ok(Seedream5p0ProApiParams {
    prompt: request.prompt.clone(),
    aspect_ratio: request.aspect_ratio.as_api_str(),
    resolution: request.resolution.as_api_str(),
    model: MODEL,
    batch_count,
    uploaded_urls,
  })
}

// ── Tests ──

#[cfg(test)]
mod tests {
  use super::*;

  fn base_request() -> GenerateSeedream5p0ProRequest {
    GenerateSeedream5p0ProRequest {
      prompt: "An anime girl riding a dinosaur".to_string(),
      aspect_ratio: KinoviSeedream5p0ProAspectRatio::Auto,
      resolution: KinoviSeedream5p0ProResolution::TwoK,
      batch_count: KinoviSeedream5p0ProBatchCount::One,
      reference_image_urls: None,
    }
  }

  mod request_shape_tests {
    use super::*;

    /// Mirrors capture 1_seedream_5.txt (auto aspect ratio, 2k, single image,
    /// no references).
    #[test]
    fn auto_2k_single_image() {
      let params = build_api_params(&base_request()).unwrap();
      assert_eq!(
        serde_json::to_string(&params).unwrap(),
        r#"{"prompt":"An anime girl riding a dinosaur","aspectRatio":"auto","resolution":"2k","model":"seedream-5.0-pro"}"#,
      );
    }

    /// Mirrors capture 2_seedream_5_21x9.txt (21:9, 2k, single image).
    #[test]
    fn ultra_wide_21x9_2k() {
      let params = build_api_params(&GenerateSeedream5p0ProRequest {
        prompt: "a pirate sailing a pirate ship".to_string(),
        aspect_ratio: KinoviSeedream5p0ProAspectRatio::UltraWide21x9,
        resolution: KinoviSeedream5p0ProResolution::TwoK,
        batch_count: KinoviSeedream5p0ProBatchCount::One,
        reference_image_urls: None,
      }).unwrap();
      assert_eq!(
        serde_json::to_string(&params).unwrap(),
        r#"{"prompt":"a pirate sailing a pirate ship","aspectRatio":"21:9","resolution":"2k","model":"seedream-5.0-pro"}"#,
      );
    }

    /// Mirrors capture 3_seedream_5_9x16_image_refs.txt (9:16, 1k, single
    /// image, two reference images).
    #[test]
    fn portrait_9x16_1k_with_image_references() {
      let params = build_api_params(&GenerateSeedream5p0ProRequest {
        prompt: "The man in @Image1 is staring out the door in @Image2 ".to_string(),
        aspect_ratio: KinoviSeedream5p0ProAspectRatio::Portrait9x16,
        resolution: KinoviSeedream5p0ProResolution::OneK,
        batch_count: KinoviSeedream5p0ProBatchCount::One,
        reference_image_urls: Some(vec![
          "https://static.seedance2-pro.com/materials/20260713/1783904468032-0a803390.jpg".to_string(),
          "https://static.seedance2-pro.com/materials/20260713/1783904481112-4a3fa0d2.png".to_string(),
        ]),
      }).unwrap();
      assert_eq!(
        serde_json::to_string(&params).unwrap(),
        r#"{"prompt":"The man in @Image1 is staring out the door in @Image2 ","aspectRatio":"9:16","resolution":"1k","model":"seedream-5.0-pro","uploadedUrls":["https://static.seedance2-pro.com/materials/20260713/1783904468032-0a803390.jpg","https://static.seedance2-pro.com/materials/20260713/1783904481112-4a3fa0d2.png"]}"#,
      );
    }

    /// Mirrors capture 4_seedream_5_misc.txt (2:3, 2k, batch of 4, two
    /// reference images).
    #[test]
    fn tall_2x3_2k_batch_four_with_image_references() {
      let params = build_api_params(&GenerateSeedream5p0ProRequest {
        prompt: "An anime girl is standing in the door @Image1 Outside the door, there's the galaxy and windmill @Image2 ".to_string(),
        aspect_ratio: KinoviSeedream5p0ProAspectRatio::Tall2x3,
        resolution: KinoviSeedream5p0ProResolution::TwoK,
        batch_count: KinoviSeedream5p0ProBatchCount::Four,
        reference_image_urls: Some(vec![
          "https://static.seedance2-pro.com/materials/20260713/1783904481112-4a3fa0d2.png".to_string(),
          "https://static.seedance2-pro.com/materials/20260713/1783904588294-5c713908.jpg".to_string(),
        ]),
      }).unwrap();
      assert_eq!(
        serde_json::to_string(&params).unwrap(),
        r#"{"prompt":"An anime girl is standing in the door @Image1 Outside the door, there's the galaxy and windmill @Image2 ","aspectRatio":"2:3","resolution":"2k","model":"seedream-5.0-pro","batchCount":4,"uploadedUrls":["https://static.seedance2-pro.com/materials/20260713/1783904481112-4a3fa0d2.png","https://static.seedance2-pro.com/materials/20260713/1783904588294-5c713908.jpg"]}"#,
      );
    }

    /// Mirrors capture 5_seedream_5_misc2.txt (1:1, 1k, batch of 8, two
    /// reference images).
    #[test]
    fn square_1x1_1k_batch_eight_with_image_references() {
      let params = build_api_params(&GenerateSeedream5p0ProRequest {
        prompt: "The mirror from @Image2 is in front of the windmill in @Image1 . The sky and galaxy are lit up at night. ".to_string(),
        aspect_ratio: KinoviSeedream5p0ProAspectRatio::Square1x1,
        resolution: KinoviSeedream5p0ProResolution::OneK,
        batch_count: KinoviSeedream5p0ProBatchCount::Eight,
        reference_image_urls: Some(vec![
          "https://static.seedance2-pro.com/materials/20260713/1783904715554-1a7ce415.jpg".to_string(),
          "https://static.seedance2-pro.com/materials/20260713/1783904719453-1d10e81f.png".to_string(),
        ]),
      }).unwrap();
      assert_eq!(
        serde_json::to_string(&params).unwrap(),
        r#"{"prompt":"The mirror from @Image2 is in front of the windmill in @Image1 . The sky and galaxy are lit up at night. ","aspectRatio":"1:1","resolution":"1k","model":"seedream-5.0-pro","batchCount":8,"uploadedUrls":["https://static.seedance2-pro.com/materials/20260713/1783904715554-1a7ce415.jpg","https://static.seedance2-pro.com/materials/20260713/1783904719453-1d10e81f.png"]}"#,
      );
    }

    #[test]
    fn every_aspect_ratio_wire_value() {
      let cases = [
        (KinoviSeedream5p0ProAspectRatio::Auto, "auto"),
        (KinoviSeedream5p0ProAspectRatio::Square1x1, "1:1"),
        (KinoviSeedream5p0ProAspectRatio::Standard4x3, "4:3"),
        (KinoviSeedream5p0ProAspectRatio::Portrait3x4, "3:4"),
        (KinoviSeedream5p0ProAspectRatio::Landscape16x9, "16:9"),
        (KinoviSeedream5p0ProAspectRatio::Portrait9x16, "9:16"),
        (KinoviSeedream5p0ProAspectRatio::Wide3x2, "3:2"),
        (KinoviSeedream5p0ProAspectRatio::Tall2x3, "2:3"),
        (KinoviSeedream5p0ProAspectRatio::UltraWide21x9, "21:9"),
      ];
      for (variant, expected) in cases {
        assert_eq!(variant.as_api_str(), expected, "wire value for {variant:?}");
      }
    }

    #[test]
    fn every_resolution_wire_value() {
      assert_eq!(KinoviSeedream5p0ProResolution::OneK.as_api_str(), "1k");
      assert_eq!(KinoviSeedream5p0ProResolution::TwoK.as_api_str(), "2k");
    }

    #[test]
    fn every_batch_count_value() {
      let cases = [
        (KinoviSeedream5p0ProBatchCount::One, 1),
        (KinoviSeedream5p0ProBatchCount::Two, 2),
        (KinoviSeedream5p0ProBatchCount::Three, 3),
        (KinoviSeedream5p0ProBatchCount::Four, 4),
        (KinoviSeedream5p0ProBatchCount::Five, 5),
        (KinoviSeedream5p0ProBatchCount::Six, 6),
        (KinoviSeedream5p0ProBatchCount::Seven, 7),
        (KinoviSeedream5p0ProBatchCount::Eight, 8),
      ];
      for (variant, expected) in cases {
        assert_eq!(variant.as_u8(), expected, "value for {variant:?}");
      }
    }

    #[test]
    fn batch_count_one_omits_field() {
      let params = build_api_params(&base_request()).unwrap();
      assert_eq!(params.batch_count, None);
    }

    #[test]
    fn empty_reference_list_omits_uploaded_urls() {
      let params = build_api_params(&GenerateSeedream5p0ProRequest {
        reference_image_urls: Some(vec![]),
        ..base_request()
      }).unwrap();
      let json = serde_json::to_string(&params).unwrap();
      assert!(!json.contains("uploadedUrls"), "expected no uploadedUrls in {json}");
    }

    #[test]
    fn business_type() {
      assert_eq!(BUSINESS_TYPE, "seedream-5-pro-image-generation");
    }
  }

  mod reference_image_limit_tests {
    use super::*;

    #[test]
    fn fourteen_references_is_allowed() {
      let params = build_api_params(&request_with_n_references(MAX_REFERENCE_IMAGES)).unwrap();
      assert_eq!(params.uploaded_urls.map(|urls| urls.len()), Some(MAX_REFERENCE_IMAGES));
    }

    #[test]
    fn fifteen_references_is_rejected() {
      let result = build_api_params(&request_with_n_references(MAX_REFERENCE_IMAGES + 1));
      match result {
        Err(KinoviWebClientError::InvalidRequestField { field, .. }) => {
          assert_eq!(field, "reference_image_urls");
        }
        other => panic!("expected InvalidRequestField, got {other:?}"),
      }
    }

    fn request_with_n_references(count: usize) -> GenerateSeedream5p0ProRequest {
      GenerateSeedream5p0ProRequest {
        reference_image_urls: Some(
          (0..count).map(|i| format!("https://example.com/ref{i}.jpg")).collect(),
        ),
        ..base_request()
      }
    }
  }

  // ── Pricing ──
  //
  // 1k = 14 credits/image, 2k = 24 credits/image; batch count multiplies.
  // Verified against captured traffic: 2k x 4 images = 96 credits
  // (4_seedream_5_misc.txt), 1k x 8 images = 112 credits
  // (5_seedream_5_misc2.txt).

  mod pricing_tests {
    use super::*;

    #[test]
    fn one_1k_image_is_fourteen_credits() {
      let costs = request(KinoviSeedream5p0ProResolution::OneK, KinoviSeedream5p0ProBatchCount::One).calculate_costs();
      assert_eq!(costs.kinovi_credits, 14);
    }

    #[test]
    fn one_2k_image_is_twentyfour_credits() {
      let costs = request(KinoviSeedream5p0ProResolution::TwoK, KinoviSeedream5p0ProBatchCount::One).calculate_costs();
      assert_eq!(costs.kinovi_credits, 24);
    }

    /// Mirrors capture 4_seedream_5_misc.txt: 2k, batch of 4 → 96 credits.
    #[test]
    fn four_2k_images_is_ninetysix_credits() {
      let costs = request(KinoviSeedream5p0ProResolution::TwoK, KinoviSeedream5p0ProBatchCount::Four).calculate_costs();
      assert_eq!(costs.kinovi_credits, 96);
    }

    /// Mirrors capture 5_seedream_5_misc2.txt: 1k, batch of 8 → 112 credits.
    #[test]
    fn eight_1k_images_is_one_hundred_twelve_credits() {
      let costs = request(KinoviSeedream5p0ProResolution::OneK, KinoviSeedream5p0ProBatchCount::Eight).calculate_costs();
      assert_eq!(costs.kinovi_credits, 112);
    }

    #[test]
    fn usd_cents_one_1k_image() {
      // 14 credits; 1400/243 = 5.7613… → up 6¢, down 5¢.
      let costs = request(KinoviSeedream5p0ProResolution::OneK, KinoviSeedream5p0ProBatchCount::One).calculate_costs();
      assert_eq!(costs.usd_cents_rounded_up, 6);
      assert_eq!(costs.usd_cents_rounded_down, 5);
      assert!((costs.usd_cents_fractional - (1400.0 / 243.0)).abs() < 1e-9);
    }

    #[test]
    fn usd_cents_one_2k_image() {
      // 24 credits; 2400/243 = 9.8765… → up 10¢, down 9¢.
      let costs = request(KinoviSeedream5p0ProResolution::TwoK, KinoviSeedream5p0ProBatchCount::One).calculate_costs();
      assert_eq!(costs.usd_cents_rounded_up, 10);
      assert_eq!(costs.usd_cents_rounded_down, 9);
      assert!((costs.usd_cents_fractional - (2400.0 / 243.0)).abs() < 1e-9);
    }

    #[test]
    fn usd_cents_eight_1k_images() {
      // 112 credits; 11200/243 = 46.0905… → up 47¢, down 46¢.
      let costs = request(KinoviSeedream5p0ProResolution::OneK, KinoviSeedream5p0ProBatchCount::Eight).calculate_costs();
      assert_eq!(costs.usd_cents_rounded_up, 47);
      assert_eq!(costs.usd_cents_rounded_down, 46);
      assert!((costs.usd_cents_fractional - (11200.0 / 243.0)).abs() < 1e-9);
    }

    #[test]
    fn reference_images_do_not_affect_cost() {
      let without_refs = request(KinoviSeedream5p0ProResolution::TwoK, KinoviSeedream5p0ProBatchCount::Four).calculate_costs();
      let with_refs = GenerateSeedream5p0ProRequest {
        reference_image_urls: Some(vec![
          "https://example.com/ref1.jpg".to_string(),
          "https://example.com/ref2.jpg".to_string(),
        ]),
        ..request(KinoviSeedream5p0ProResolution::TwoK, KinoviSeedream5p0ProBatchCount::Four)
      }.calculate_costs();
      assert_eq!(without_refs, with_refs);
    }

    #[test]
    fn aspect_ratio_does_not_affect_cost() {
      let auto = request(KinoviSeedream5p0ProResolution::OneK, KinoviSeedream5p0ProBatchCount::One).calculate_costs();
      let ultra_wide = GenerateSeedream5p0ProRequest {
        aspect_ratio: KinoviSeedream5p0ProAspectRatio::UltraWide21x9,
        ..request(KinoviSeedream5p0ProResolution::OneK, KinoviSeedream5p0ProBatchCount::One)
      }.calculate_costs();
      assert_eq!(auto, ultra_wide);
    }

    fn request(
      resolution: KinoviSeedream5p0ProResolution,
      batch_count: KinoviSeedream5p0ProBatchCount,
    ) -> GenerateSeedream5p0ProRequest {
      GenerateSeedream5p0ProRequest {
        resolution,
        batch_count,
        ..base_request()
      }
    }
  }

  // ── Live usage tests ──

  mod live_tests {
    use super::*;
    use crate::test_utils::get_test_cookies::get_test_cookies;
    use crate::test_utils::setup_test_logging::setup_test_logging;
    use errors::AnyhowResult;
    use log::LevelFilter;

    #[tokio::test]
    #[ignore] // Sends a real generation to Kinovi; costs 24 credits.
    async fn test_text_to_image_2k() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let result = generate_seedream_5p0_pro(GenerateSeedream5p0ProArgs {
        session: &session,
        host_override: None,
        request: GenerateSeedream5p0ProRequest {
          prompt: "A corgi wearing a wizard hat, studio lighting".to_string(),
          aspect_ratio: KinoviSeedream5p0ProAspectRatio::Auto,
          resolution: KinoviSeedream5p0ProResolution::TwoK,
          batch_count: KinoviSeedream5p0ProBatchCount::One,
          reference_image_urls: None,
        },
      }).await?;
      println!("seedream 5.0 pro 2k — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert!(!result.order_id.is_empty());
      assert_eq!(1, 2, "Inspect output above");
      Ok(())
    }

    #[tokio::test]
    #[ignore] // Sends a real generation to Kinovi; costs 14 credits.
    async fn test_text_to_image_1k_with_references() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let result = generate_seedream_5p0_pro(GenerateSeedream5p0ProArgs {
        session: &session,
        host_override: None,
        request: GenerateSeedream5p0ProRequest {
          prompt: "The man in @Image1 is staring out the door in @Image2".to_string(),
          aspect_ratio: KinoviSeedream5p0ProAspectRatio::Portrait9x16,
          resolution: KinoviSeedream5p0ProResolution::OneK,
          batch_count: KinoviSeedream5p0ProBatchCount::One,
          reference_image_urls: Some(vec![
            "https://static.seedance2-pro.com/materials/20260713/1783904468032-0a803390.jpg".to_string(),
            "https://static.seedance2-pro.com/materials/20260713/1783904481112-4a3fa0d2.png".to_string(),
          ]),
        },
      }).await?;
      println!("seedream 5.0 pro 1k refs — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2, "Inspect output above");
      Ok(())
    }

    #[tokio::test]
    #[ignore] // Sends a real generation to Kinovi; costs 56 credits.
    async fn test_batch_four_1k() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let result = generate_seedream_5p0_pro(GenerateSeedream5p0ProArgs {
        session: &session,
        host_override: None,
        request: GenerateSeedream5p0ProRequest {
          prompt: "A lighthouse on a cliff at golden hour".to_string(),
          aspect_ratio: KinoviSeedream5p0ProAspectRatio::Landscape16x9,
          resolution: KinoviSeedream5p0ProResolution::OneK,
          batch_count: KinoviSeedream5p0ProBatchCount::Four,
          reference_image_urls: None,
        },
      }).await?;
      println!("seedream 5.0 pro batch-4 — task_id={}, order_id={}", result.task_id, result.order_id);
      assert_eq!(result.task_ids.as_ref().map(|ids| ids.len()), Some(4));
      assert_eq!(result.order_ids.as_ref().map(|ids| ids.len()), Some(4));
      assert_eq!(1, 2, "Inspect output above");
      Ok(())
    }

    fn test_session() -> AnyhowResult<KinoviWebSession> {
      let cookies = get_test_cookies()?;
      Ok(KinoviWebSession::from_cookies_string(cookies))
    }
  }
}
