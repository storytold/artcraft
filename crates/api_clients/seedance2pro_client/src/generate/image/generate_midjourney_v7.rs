use crate::creds::seedance2pro_session::Seedance2ProSession;
use crate::error::seedance2pro_error::Seedance2ProError;
use crate::requests::generate_image::generate_image::{
  generate_image, GenerateImageArgs, KinoviGenerateImageRequest, KinoviMidjourneyModel,
};
use crate::requests::kinovi_host::KinoviHost;

// Re-export shared enums so callers can use this module without dipping into
// the lower-level `requests::generate_image` module path.
pub use crate::requests::generate_image::generate_image::{
  KinoviMidjourneyAspectRatio, KinoviMidjourneyBatchCount, KinoviMidjourneyQuality,
};

// ── Args ──

pub struct GenerateMidjourneyV7Args<'a> {
  pub request: GenerateMidjourneyV7Request,
  pub session: &'a Seedance2ProSession,
  pub host_override: Option<KinoviHost>,
}

// ── Request ──

#[derive(Clone, Debug)]
pub struct GenerateMidjourneyV7Request {
  pub prompt: String,
  pub aspect_ratio: KinoviMidjourneyAspectRatio,
  pub negative_prompt: Option<String>,
  pub stylize: Option<u16>,
  pub weird: Option<u16>,
  pub chaos: Option<u8>,
  pub quality: Option<KinoviMidjourneyQuality>,
  pub raw_mode: bool,
  pub batch_count: KinoviMidjourneyBatchCount,
  pub reference_image_urls: Option<Vec<String>>,
}

impl GenerateMidjourneyV7Request {
  pub fn estimate_credits(&self) -> u32 {
    self.to_inner_request().estimate_credits()
  }

  pub fn estimate_cost_in_usd_cents(&self) -> u64 {
    self.to_inner_request().estimate_cost_in_usd_cents()
  }

  pub(crate) fn to_inner_request(&self) -> KinoviGenerateImageRequest {
    KinoviGenerateImageRequest {
      model: KinoviMidjourneyModel::V7,
      prompt: self.prompt.clone(),
      aspect_ratio: self.aspect_ratio,
      negative_prompt: self.negative_prompt.clone(),
      stylize: self.stylize,
      weird: self.weird,
      chaos: self.chaos,
      quality: self.quality,
      raw_mode: self.raw_mode,
      batch_count: self.batch_count,
      reference_image_urls: self.reference_image_urls.clone(),
    }
  }
}

// ── Response ──

pub struct GenerateMidjourneyV7Response {
  pub task_id: String,
  pub order_id: String,
  pub task_ids: Option<Vec<String>>,
  pub order_ids: Option<Vec<String>>,
}

// ── Entry point ──

pub async fn generate_midjourney_v7(
  args: GenerateMidjourneyV7Args<'_>,
) -> Result<GenerateMidjourneyV7Response, Seedance2ProError> {
  let inner_request = args.request.to_inner_request();
  let result = generate_image(GenerateImageArgs {
    request: inner_request,
    session: args.session,
    host_override: args.host_override,
  }).await?;
  Ok(GenerateMidjourneyV7Response {
    task_id: result.task_id,
    order_id: result.order_id,
    task_ids: result.task_ids,
    order_ids: result.order_ids,
  })
}

// ── Tests ──

#[cfg(test)]
mod tests {
  use super::*;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use errors::AnyhowResult;
  use log::LevelFilter;

  fn test_session() -> AnyhowResult<Seedance2ProSession> {
    let cookies = get_test_cookies()?;
    Ok(Seedance2ProSession::from_cookies_string(cookies))
  }

  fn make_request(batch_count: KinoviMidjourneyBatchCount) -> GenerateMidjourneyV7Request {
    GenerateMidjourneyV7Request {
      prompt: "test".to_string(),
      aspect_ratio: KinoviMidjourneyAspectRatio::Square1x1,
      negative_prompt: None,
      stylize: None,
      weird: None,
      chaos: None,
      quality: None,
      raw_mode: false,
      batch_count,
      reference_image_urls: None,
    }
  }

  // ── Inner-request mapping ──

  mod inner_request_tests {
    use super::*;

    #[test]
    fn inner_request_pins_model_to_v7() {
      let inner = make_request(KinoviMidjourneyBatchCount::One).to_inner_request();
      assert_eq!(inner.model, KinoviMidjourneyModel::V7);
    }

    #[test]
    fn inner_request_preserves_all_fields() {
      let req = GenerateMidjourneyV7Request {
        prompt: "a corgi in space".to_string(),
        aspect_ratio: KinoviMidjourneyAspectRatio::Landscape16x9,
        negative_prompt: Some("dark".to_string()),
        stylize: Some(500),
        weird: Some(1500),
        chaos: Some(50),
        quality: Some(KinoviMidjourneyQuality::Half),
        raw_mode: true,
        batch_count: KinoviMidjourneyBatchCount::Four,
        reference_image_urls: Some(vec!["https://example.com/x.png".to_string()]),
      };
      let inner = req.to_inner_request();
      assert_eq!(inner.model, KinoviMidjourneyModel::V7);
      assert_eq!(inner.prompt, "a corgi in space");
      assert_eq!(inner.aspect_ratio, KinoviMidjourneyAspectRatio::Landscape16x9);
      assert_eq!(inner.negative_prompt.as_deref(), Some("dark"));
      assert_eq!(inner.stylize, Some(500));
      assert_eq!(inner.weird, Some(1500));
      assert_eq!(inner.chaos, Some(50));
      assert_eq!(inner.quality, Some(KinoviMidjourneyQuality::Half));
      assert!(inner.raw_mode);
      assert_eq!(inner.batch_count, KinoviMidjourneyBatchCount::Four);
      assert_eq!(
        inner.reference_image_urls.as_deref(),
        Some(&["https://example.com/x.png".to_string()][..]),
      );
    }
  }

  // ── Pricing (delegates to the inner module, but pinned via explicit values) ──

  mod pricing_tests {
    use super::*;

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

    #[test]
    fn usd_cents_batch_one_is_six() {
      assert_eq!(make_request(KinoviMidjourneyBatchCount::One).estimate_cost_in_usd_cents(), 6);
    }

    #[test]
    fn usd_cents_batch_four_is_twentyfive() {
      assert_eq!(make_request(KinoviMidjourneyBatchCount::Four).estimate_cost_in_usd_cents(), 25);
    }

    /// Pricing must match the inner module byte-for-byte (sanity that no
    /// wrapper drift introduces an extra rounding step).
    #[test]
    fn matches_inner_pricing_exactly() {
      for batch in [
        KinoviMidjourneyBatchCount::One,
        KinoviMidjourneyBatchCount::Two,
        KinoviMidjourneyBatchCount::Four,
      ] {
        let outer = make_request(batch);
        let inner = outer.to_inner_request();
        assert_eq!(outer.estimate_credits(), inner.estimate_credits(), "batch={:?}", batch);
        assert_eq!(outer.estimate_cost_in_usd_cents(), inner.estimate_cost_in_usd_cents(), "batch={:?}", batch);
      }
    }
  }

  // ── Real requests ──

  mod real_requests {
    use super::*;

    #[tokio::test]
    #[ignore] // manually test — requires real cookies, costs credits
    async fn test_generate_v7_minimal() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let result = generate_midjourney_v7(GenerateMidjourneyV7Args {
        session: &session,
        host_override: None,
        request: GenerateMidjourneyV7Request {
          prompt: "A corgi astronaut floating among stars".to_string(),
          aspect_ratio: KinoviMidjourneyAspectRatio::Square1x1,
          negative_prompt: None,
          stylize: None,
          weird: None,
          chaos: None,
          quality: None,
          raw_mode: false,
          batch_count: KinoviMidjourneyBatchCount::One,
          reference_image_urls: None,
        },
      }).await?;
      println!("v7 minimal — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert!(!result.order_id.is_empty());
      Ok(())
    }

    #[tokio::test]
    #[ignore] // manually test — requires real cookies, costs credits
    async fn test_generate_v7_all_knobs() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let result = generate_midjourney_v7(GenerateMidjourneyV7Args {
        session: &session,
        host_override: None,
        request: GenerateMidjourneyV7Request {
          prompt: "abandoned skyscrapers".to_string(),
          aspect_ratio: KinoviMidjourneyAspectRatio::Square1x1,
          negative_prompt: Some("dark, gloomy, night".to_string()),
          stylize: Some(1000),
          weird: Some(3000),
          chaos: Some(100),
          quality: Some(KinoviMidjourneyQuality::Half),
          raw_mode: true,
          batch_count: KinoviMidjourneyBatchCount::One,
          reference_image_urls: None,
        },
      }).await?;
      println!("v7 all knobs — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      Ok(())
    }
  }
}
