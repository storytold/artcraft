use enums::common::generation::common_video_model::CommonVideoModel;

/// Parse a loose model name into a CommonVideoModel.
///
/// Accepts the canonical serde names (eg. "seedance_2p0") as well as
/// human-friendly aliases (eg. "seedance2", "happyhorse", "veo3fast").
pub fn parse_video_model(value: &str) -> Option<CommonVideoModel> {
  let value = value.trim();

  // Try canonical serde deserialization first (eg. "seedance_2p0", "happy_horse_1p0").
  if let Ok(model) = serde_json::from_str::<CommonVideoModel>(&format!("\"{}\"", value)) {
    return Some(model);
  }

  // Fallback: human-friendly aliases.
  match value.to_lowercase().replace('-', "_").as_str() {
    // Seedance family
    "seedance2" | "seedance2p0" | "seedance_2p0" => Some(CommonVideoModel::Seedance2p0),
    "seedance2fast" | "seedance2p0fast" | "seedance_2p0_fast" => Some(CommonVideoModel::Seedance2p0Fast),
    "seedance1" | "seedance10lite" | "seedance_1p0_lite" => Some(CommonVideoModel::Seedance10Lite),
    "seedance15" | "seedance1p5" | "seedance_1p5_pro" => Some(CommonVideoModel::Seedance1p5Pro),

    // Happy Horse
    "happyhorse" | "happy_horse" | "happyhorse1" | "happy_horse_1p0" => Some(CommonVideoModel::HappyHorse1p0),

    // Kling family
    "kling16" | "kling_1p6_pro" => Some(CommonVideoModel::Kling16Pro),
    "kling21" | "kling_2p1_pro" => Some(CommonVideoModel::Kling21Pro),
    "kling21master" | "kling_2p1_master" => Some(CommonVideoModel::Kling21Master),
    "kling25turbo" | "kling_2p5_turbo_pro" => Some(CommonVideoModel::Kling2p5TurboPro),
    "kling26" | "kling_2p6_pro" => Some(CommonVideoModel::Kling2p6Pro),
    "kling3" | "kling30" | "kling_3p0_standard" => Some(CommonVideoModel::Kling3p0Standard),
    "kling3pro" | "kling30pro" | "kling_3p0_pro" => Some(CommonVideoModel::Kling3p0Pro),

    // Veo family
    "veo2" | "veo_2" => Some(CommonVideoModel::Veo2),
    "veo3" | "veo_3" => Some(CommonVideoModel::Veo3),
    "veo3fast" | "veo_3_fast" => Some(CommonVideoModel::Veo3Fast),
    "veo31" | "veo3p1" | "veo_3p1" => Some(CommonVideoModel::Veo3p1),
    "veo31fast" | "veo3p1fast" | "veo_3p1_fast" => Some(CommonVideoModel::Veo3p1Fast),

    // Sora family
    "sora2" | "sora_2" => Some(CommonVideoModel::Sora2),
    "sora2pro" | "sora_2_pro" => Some(CommonVideoModel::Sora2Pro),

    // Grok
    "grok" | "grok_video" | "grokvideo" => Some(CommonVideoModel::GrokVideo),

    _ => None,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn canonical_names() {
    assert_eq!(parse_video_model("seedance_2p0"), Some(CommonVideoModel::Seedance2p0));
    assert_eq!(parse_video_model("happy_horse_1p0"), Some(CommonVideoModel::HappyHorse1p0));
    assert_eq!(parse_video_model("veo_3"), Some(CommonVideoModel::Veo3));
  }

  #[test]
  fn aliases() {
    assert_eq!(parse_video_model("seedance2"), Some(CommonVideoModel::Seedance2p0));
    assert_eq!(parse_video_model("seedance2fast"), Some(CommonVideoModel::Seedance2p0Fast));
    assert_eq!(parse_video_model("happyhorse"), Some(CommonVideoModel::HappyHorse1p0));
    assert_eq!(parse_video_model("veo3fast"), Some(CommonVideoModel::Veo3Fast));
    assert_eq!(parse_video_model("kling3pro"), Some(CommonVideoModel::Kling3p0Pro));
  }

  #[test]
  fn unknown() {
    assert_eq!(parse_video_model("nonexistent"), None);
    assert_eq!(parse_video_model(""), None);
  }

  #[test]
  fn trims_whitespace() {
    assert_eq!(parse_video_model("  seedance2  "), Some(CommonVideoModel::Seedance2p0));
  }
}
