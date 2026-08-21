/// Models accepted by the xAI video endpoints (`/v1/videos/generations`,
/// `/v1/videos/edits`, `/v1/videos/extensions`). All three endpoints accept
/// the same model identifier.
///
/// xAI may add or deprecate models faster than this crate ships releases, so
/// the [`VideoModel::Custom`] escape hatch lets callers pass an arbitrary
/// identifier without waiting for a code change.
///
/// Docs:
/// - Models list: <https://docs.x.ai/docs/models>
/// - <https://docs.x.ai/developers/model-capabilities/video/generation>
/// - <https://docs.x.ai/developers/model-capabilities/video/editing>
/// - <https://docs.x.ai/developers/model-capabilities/video/extension>
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum VideoModel {
  /// `grok-imagine-video` — the original Imagine video model. Used by
  /// generation, editing, and extension endpoints.
  GrokImagineVideo,

  /// `grok-imagine-video-1.5` — the GA 1.5 model (formerly
  /// `grok-imagine-video-1.5-preview`). xAI still accepts the old `-preview`
  /// name and the dated alias `grok-imagine-video-1.5-2026-05-30` as synonyms
  /// server-side; this variant serializes to the new canonical name.
  GrokImagineVideo1p5,

  /// Escape hatch for model identifiers not yet enumerated here.
  Custom(String),
}

impl VideoModel {
  /// Wire representation — the exact string xAI expects in the `"model"` field.
  pub fn as_str(&self) -> &str {
    match self {
      Self::GrokImagineVideo          => "grok-imagine-video",
      Self::GrokImagineVideo1p5 => "grok-imagine-video-1.5",
      Self::Custom(s)                 => s.as_str(),
    }
  }

  /// Pricing tier this model bills under. Includes recognition of the dated
  /// alias `grok-imagine-video-1.5-2026-05-30` passed via [`Self::Custom`],
  /// which xAI treats as a synonym for `grok-imagine-video-1.5-preview` and
  /// therefore charges at the 1.5 rates.
  pub fn pricing_tier(&self) -> VideoModelPricingTier {
    match self {
      Self::GrokImagineVideo => VideoModelPricingTier::V1,
      Self::GrokImagineVideo1p5 => VideoModelPricingTier::V1p5,
      Self::Custom(s) => match s.as_str() {
        "grok-imagine-video-1.5"
        | "grok-imagine-video-1.5-preview"
        | "grok-imagine-video-1.5-2026-05-30" => {
          VideoModelPricingTier::V1p5
        }
        _ => VideoModelPricingTier::V1,
      },
    }
  }
}

/// Pricing tier identifier used by the per-request cost calculators. xAI
/// publishes different per-second and per-image rates for each tier — see
/// `video_generation/cost.rs`.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum VideoModelPricingTier {
  /// `grok-imagine-video` and any unrecognized identifier that defaults
  /// to v1 rates.
  V1,
  /// `grok-imagine-video-1.5` (and its old `-preview` / dated aliases).
  V1p5,
}

// Serialize as the wire string ("grok-imagine-video" or the Custom inner
// string) rather than the default external-tag enum format. Lets the public
// VideoGeneration/Edit/ExtensionRequest types round-trip through any
// log/audit pipeline as readable JSON.
impl serde::Serialize for VideoModel {
  fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
    s.serialize_str(self.as_str())
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn known_model_serializes() {
    assert_eq!(VideoModel::GrokImagineVideo.as_str(), "grok-imagine-video");
  }

  #[test]
  fn one_point_five_preview_serializes_canonical_name() {
    assert_eq!(
      VideoModel::GrokImagineVideo1p5.as_str(),
      "grok-imagine-video-1.5",
    );
    assert_eq!(
      serde_json::to_string(&VideoModel::GrokImagineVideo1p5).unwrap(),
      "\"grok-imagine-video-1.5\"",
    );
  }

  #[test]
  fn custom_model_passes_through() {
    let m = VideoModel::Custom("grok-imagine-video-future".to_string());
    assert_eq!(m.as_str(), "grok-imagine-video-future");
  }

  #[test]
  fn serializes_as_plain_wire_string() {
    assert_eq!(serde_json::to_string(&VideoModel::GrokImagineVideo).unwrap(), "\"grok-imagine-video\"");
    let m = VideoModel::Custom("grok-imagine-video-v2".to_string());
    assert_eq!(serde_json::to_string(&m).unwrap(), "\"grok-imagine-video-v2\"");
  }

  // ── Pricing tier classification ──

  mod pricing_tier {
    use super::*;

    #[test]
    fn grok_imagine_video_is_v1() {
      assert_eq!(VideoModel::GrokImagineVideo.pricing_tier(), VideoModelPricingTier::V1);
    }

    #[test]
    fn one_point_five_preview_enum_is_v1p5() {
      assert_eq!(
        VideoModel::GrokImagineVideo1p5.pricing_tier(),
        VideoModelPricingTier::V1p5,
      );
    }

    #[test]
    fn custom_with_canonical_1p5_name_is_v1p5() {
      let m = VideoModel::Custom("grok-imagine-video-1.5".to_string());
      assert_eq!(m.pricing_tier(), VideoModelPricingTier::V1p5);
    }

    #[test]
    fn custom_with_old_preview_name_is_still_v1p5() {
      let m = VideoModel::Custom("grok-imagine-video-1.5-preview".to_string());
      assert_eq!(m.pricing_tier(), VideoModelPricingTier::V1p5);
    }

    #[test]
    fn custom_with_dated_1p5_alias_is_v1p5() {
      // xAI treats this alias as a synonym for the 1.5 preview model.
      let m = VideoModel::Custom("grok-imagine-video-1.5-2026-05-30".to_string());
      assert_eq!(m.pricing_tier(), VideoModelPricingTier::V1p5);
    }

    #[test]
    fn custom_unknown_defaults_to_v1() {
      let m = VideoModel::Custom("grok-imagine-video-future".to_string());
      assert_eq!(m.pricing_tier(), VideoModelPricingTier::V1);
    }

    #[test]
    fn custom_with_v1_name_is_v1() {
      let m = VideoModel::Custom("grok-imagine-video".to_string());
      assert_eq!(m.pricing_tier(), VideoModelPricingTier::V1);
    }
  }
}
