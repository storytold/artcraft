use enums::common::generation_provider::GenerationProvider;
use log::warn;

/// Try to parse a generation provider from a string value.
/// Fails open: returns None if parsing fails, but logs a warning.
pub fn try_parse_generation_provider(value: &str) -> Option<GenerationProvider> {
  let trimmed = value.trim();
  if trimmed.is_empty() {
    return None;
  }

  match GenerationProvider::from_str(trimmed) {
    Ok(provider) => Some(provider),
    Err(_) => {
      warn!("Could not parse generation provider: {:?}", trimmed);
      None
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn parses_known_providers() {
    assert_eq!(try_parse_generation_provider("fal"), Some(GenerationProvider::Fal));
    assert_eq!(try_parse_generation_provider("artcraft"), Some(GenerationProvider::Artcraft));
    assert_eq!(try_parse_generation_provider("grok"), Some(GenerationProvider::Grok));
    assert_eq!(try_parse_generation_provider("midjourney"), Some(GenerationProvider::Midjourney));
    assert_eq!(try_parse_generation_provider("sora"), Some(GenerationProvider::Sora));
    assert_eq!(try_parse_generation_provider("world_labs"), Some(GenerationProvider::WorldLabs));
  }

  #[test]
  fn trims_whitespace() {
    assert_eq!(try_parse_generation_provider("  fal  "), Some(GenerationProvider::Fal));
  }

  #[test]
  fn returns_none_for_empty() {
    assert_eq!(try_parse_generation_provider(""), None);
    assert_eq!(try_parse_generation_provider("   "), None);
  }

  #[test]
  fn returns_none_for_unknown() {
    assert_eq!(try_parse_generation_provider("unknown_provider"), None);
    assert_eq!(try_parse_generation_provider("DALL-E"), None);
  }
}
