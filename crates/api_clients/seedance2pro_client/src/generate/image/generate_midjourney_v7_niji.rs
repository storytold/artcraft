use crate::cost::kinovi_generation_cost::KinoviGenerationCost;
use crate::creds::seedance2pro_session::Seedance2ProSession;
use crate::error::seedance2pro_error::Seedance2ProError;
use crate::requests::generate_image::generate_image::{
  generate_image, GenerateImageArgs, KinoviGenerateImageRequest, KinoviMidjourneyModel,
};
use crate::requests::kinovi_host::KinoviHost;

// `KinoviMidjourneyBatchCount` is shared across all Midjourney models, so we
// re-export it from the base. Aspect ratio and quality, however, are pinned
// to model-specific enums on this wrapper to keep their valid values typed
// at the call site.
pub use crate::requests::generate_image::generate_image::KinoviMidjourneyBatchCount;

// ── Args ──

pub struct GenerateMidjourneyV7NijiArgs<'a> {
  pub request: GenerateMidjourneyV7NijiRequest,
  pub session: &'a Seedance2ProSession,
  pub host_override: Option<KinoviHost>,
}

// ── Request ──

#[derive(Clone, Debug)]
pub struct GenerateMidjourneyV7NijiRequest {
  pub prompt: String,
  pub aspect_ratio: GenerateMidjourneyV7NijiAspectRatio,
  pub negative_prompt: Option<String>,
  pub stylize: Option<u16>,
  pub weird: Option<u16>,
  pub chaos: Option<u8>,
  pub quality: Option<GenerateMidjourneyV7NijiQuality>,
  pub raw_mode: bool,
  pub batch_count: KinoviMidjourneyBatchCount,
  pub reference_image_urls: Option<Vec<String>>,
}

impl GenerateMidjourneyV7NijiRequest {
  /// Calculate the cost of this request, in Kinovi credits and USD cents
  /// (rounded up).
  pub fn calculate_costs(&self) -> KinoviGenerationCost {
    self.to_inner_request().calculate_costs()
  }

  #[deprecated(note = "Use calculate_costs() instead")]
  pub fn estimate_credits(&self) -> u32 {
    self.calculate_costs().kinovi_credits as u32
  }

  /// NB: Rounds UP fractional cents (the historical behavior rounded to nearest).
  #[deprecated(note = "Use calculate_costs() instead")]
  pub fn estimate_cost_in_usd_cents(&self) -> u64 {
    self.calculate_costs().usd_cents_rounded_up
  }

  pub(crate) fn to_inner_request(&self) -> KinoviGenerateImageRequest {
    KinoviGenerateImageRequest {
      model: KinoviMidjourneyModel::V7Niji,
      prompt: self.prompt.clone(),
      aspect_ratio: self.aspect_ratio.as_api_str().to_string(),
      negative_prompt: self.negative_prompt.clone(),
      stylize: self.stylize,
      weird: self.weird,
      chaos: self.chaos,
      quality: self.quality.map(|q| q.as_api_str().to_string()),
      raw_mode: self.raw_mode,
      batch_count: self.batch_count,
      reference_image_urls: self.reference_image_urls.clone(),
    }
  }
}

// ── Model-specific enums ──

/// Aspect ratios supported by Midjourney v7 Niji.
#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub enum GenerateMidjourneyV7NijiAspectRatio {
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

impl GenerateMidjourneyV7NijiAspectRatio {
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

/// Quality presets supported by Midjourney v7 Niji. Higher = more compute
/// and slower; Kinovi credit pricing is flat regardless.
#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub enum GenerateMidjourneyV7NijiQuality {
  /// 0.25
  Quarter,
  /// 0.5
  Half,
  /// 1 (default)
  Full,
}

impl GenerateMidjourneyV7NijiQuality {
  fn as_api_str(&self) -> &'static str {
    match self {
      Self::Quarter => "0.25",
      Self::Half => "0.5",
      Self::Full => "1",
    }
  }
}

// ── Response ──

pub struct GenerateMidjourneyV7NijiResponse {
  pub task_id: String,
  pub order_id: String,
  pub task_ids: Option<Vec<String>>,
  pub order_ids: Option<Vec<String>>,
}

// ── Entry point ──

pub async fn generate_midjourney_v7_niji(
  args: GenerateMidjourneyV7NijiArgs<'_>,
) -> Result<GenerateMidjourneyV7NijiResponse, Seedance2ProError> {
  let inner_request = args.request.to_inner_request();
  let result = generate_image(GenerateImageArgs {
    request: inner_request,
    session: args.session,
    host_override: args.host_override,
  }).await?;
  Ok(GenerateMidjourneyV7NijiResponse {
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

  fn make_request(batch_count: KinoviMidjourneyBatchCount) -> GenerateMidjourneyV7NijiRequest {
    GenerateMidjourneyV7NijiRequest {
      prompt: "test".to_string(),
      aspect_ratio: GenerateMidjourneyV7NijiAspectRatio::Square1x1,
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
    fn inner_request_pins_model_to_v7_niji() {
      let inner = make_request(KinoviMidjourneyBatchCount::One).to_inner_request();
      assert_eq!(inner.model, KinoviMidjourneyModel::V7Niji);
    }

    #[test]
    fn inner_request_preserves_all_fields() {
      let req = GenerateMidjourneyV7NijiRequest {
        prompt: "anime mecha duel".to_string(),
        aspect_ratio: GenerateMidjourneyV7NijiAspectRatio::UltraWide21x9,
        negative_prompt: Some("blurry".to_string()),
        stylize: Some(750),
        weird: Some(0),
        chaos: Some(25),
        quality: Some(GenerateMidjourneyV7NijiQuality::Full),
        raw_mode: false,
        batch_count: KinoviMidjourneyBatchCount::Two,
        reference_image_urls: Some(vec![
          "https://example.com/a.png".to_string(),
          "https://example.com/b.png".to_string(),
        ]),
      };
      let inner = req.to_inner_request();
      assert_eq!(inner.model, KinoviMidjourneyModel::V7Niji);
      assert_eq!(inner.prompt, "anime mecha duel");
      assert_eq!(inner.aspect_ratio, "21:9");
      assert_eq!(inner.negative_prompt.as_deref(), Some("blurry"));
      assert_eq!(inner.stylize, Some(750));
      assert_eq!(inner.weird, Some(0));
      assert_eq!(inner.chaos, Some(25));
      assert_eq!(inner.quality.as_deref(), Some("1"));
      assert!(!inner.raw_mode);
      assert_eq!(inner.batch_count, KinoviMidjourneyBatchCount::Two);
      assert_eq!(inner.reference_image_urls.as_ref().map(|v| v.len()), Some(2));
    }

    /// Every wrapper-side aspect ratio must serialize to the canonical wire string.
    #[test]
    fn every_aspect_ratio_maps_to_canonical_wire_string() {
      let cases = [
        (GenerateMidjourneyV7NijiAspectRatio::Square1x1, "1:1"),
        (GenerateMidjourneyV7NijiAspectRatio::Landscape16x9, "16:9"),
        (GenerateMidjourneyV7NijiAspectRatio::Portrait9x16, "9:16"),
        (GenerateMidjourneyV7NijiAspectRatio::UltraWide21x9, "21:9"),
        (GenerateMidjourneyV7NijiAspectRatio::UltraTall9x21, "9:21"),
        (GenerateMidjourneyV7NijiAspectRatio::Standard4x3, "4:3"),
        (GenerateMidjourneyV7NijiAspectRatio::Portrait3x4, "3:4"),
        (GenerateMidjourneyV7NijiAspectRatio::Wide5x4, "5:4"),
        (GenerateMidjourneyV7NijiAspectRatio::Tall4x5, "4:5"),
        (GenerateMidjourneyV7NijiAspectRatio::Wide3x2, "3:2"),
        (GenerateMidjourneyV7NijiAspectRatio::Tall2x3, "2:3"),
      ];
      for (variant, expected) in cases {
        let req = GenerateMidjourneyV7NijiRequest { aspect_ratio: variant, ..make_request(KinoviMidjourneyBatchCount::One) };
        assert_eq!(req.to_inner_request().aspect_ratio, expected, "variant={:?}", variant);
      }
    }

    #[test]
    fn every_quality_maps_to_canonical_wire_string() {
      let cases = [
        (GenerateMidjourneyV7NijiQuality::Quarter, "0.25"),
        (GenerateMidjourneyV7NijiQuality::Half, "0.5"),
        (GenerateMidjourneyV7NijiQuality::Full, "1"),
      ];
      for (variant, expected) in cases {
        let req = GenerateMidjourneyV7NijiRequest { quality: Some(variant), ..make_request(KinoviMidjourneyBatchCount::One) };
        assert_eq!(req.to_inner_request().quality.as_deref(), Some(expected), "variant={:?}", variant);
      }
    }
  }

  // ── Pricing ──

  mod pricing_tests {
    use super::*;

    #[test]
    fn batch_one_is_twelve_credits() {
      assert_eq!(make_request(KinoviMidjourneyBatchCount::One).calculate_costs().kinovi_credits, 12);
    }

    #[test]
    fn batch_two_is_twentyfour_credits() {
      assert_eq!(make_request(KinoviMidjourneyBatchCount::Two).calculate_costs().kinovi_credits, 24);
    }

    #[test]
    fn batch_four_is_fortyeight_credits() {
      assert_eq!(make_request(KinoviMidjourneyBatchCount::Four).calculate_costs().kinovi_credits, 48);
    }

    #[test]
    fn usd_cents_batch_one_is_five() {
      assert_eq!(make_request(KinoviMidjourneyBatchCount::One).calculate_costs().usd_cents_rounded_up, 5); // 1200/243 = 4.94 -> rounds UP
      assert_eq!(make_request(KinoviMidjourneyBatchCount::One).calculate_costs().usd_cents_rounded_down, 4);
      assert!((make_request(KinoviMidjourneyBatchCount::One).calculate_costs().usd_cents_fractional - (1200.0 / 243.0)).abs() < 1e-9);
    }

    #[test]
    fn usd_cents_batch_four_is_twenty() {
      assert_eq!(make_request(KinoviMidjourneyBatchCount::Four).calculate_costs().usd_cents_rounded_up, 20); // 4800/243 = 19.75 -> rounds UP
      assert_eq!(make_request(KinoviMidjourneyBatchCount::Four).calculate_costs().usd_cents_rounded_down, 19);
      assert!((make_request(KinoviMidjourneyBatchCount::Four).calculate_costs().usd_cents_fractional - (4800.0 / 243.0)).abs() < 1e-9);
    }

    /// Pricing must match the inner module exactly.
    #[test]
    fn matches_inner_pricing_exactly() {
      for batch in [
        KinoviMidjourneyBatchCount::One,
        KinoviMidjourneyBatchCount::Two,
        KinoviMidjourneyBatchCount::Four,
      ] {
        let outer = make_request(batch);
        let inner = outer.to_inner_request();
        assert_eq!(outer.calculate_costs().kinovi_credits, inner.calculate_costs().kinovi_credits, "batch={:?}", batch);
        assert_eq!(outer.calculate_costs().usd_cents_rounded_up, inner.calculate_costs().usd_cents_rounded_up, "batch={:?}", batch);
      }
    }
  }

  // ── Real requests ──

  mod real_requests {
    use super::*;

    #[tokio::test]
    #[ignore] // manually test — requires real cookies, costs credits
    async fn test_generate_v7_niji_anime() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let result = generate_midjourney_v7_niji(GenerateMidjourneyV7NijiArgs {
        session: &session,
        host_override: None,
        request: GenerateMidjourneyV7NijiRequest {
          prompt: "A magical shiba inu sorcerer casting spells in a crystal cave".to_string(),
          aspect_ratio: GenerateMidjourneyV7NijiAspectRatio::UltraWide21x9,
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
      println!("v7-niji — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      Ok(())
    }
  }
}
