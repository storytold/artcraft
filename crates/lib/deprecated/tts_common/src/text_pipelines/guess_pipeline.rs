use chrono::{DateTime, Utc};
use once_cell::sync::Lazy;

use crate::text_pipelines::text_pipeline_type::TextPipelineType;

// TODO: This is not yet popularized
const ENGLISH_V1_EPOCH_STR : &str = "2023-01-01T00:00:00.00Z";

/// Date we consider to switch models to "english_v1" instead of "legacy_fakeyou"
static ENGLISH_V1_EPOCH : Lazy<DateTime<Utc>> = Lazy::new(|| {
  let datetime = DateTime::parse_from_rfc3339(ENGLISH_V1_EPOCH_STR)
      .expect("ENGLISH_V1_EPOCH must parse statically.");

  datetime.with_timezone(&Utc)
});

/// Return a reasonable guess for default text pipeline when one isn't set.
/// New models won't necessarily have a user-selected text pipeline (so we'll guess),
/// and old models will need to be backfilled since we never collected that information.
///
/// There will always be a guess returned.
///
///   maybe_model_created_at - `created_at` timestamp from database
pub fn guess_text_pipeline_heuristic(maybe_model_created_at: Option<DateTime<Utc>>) -> TextPipelineType {

  // TODO: Use language to infer as well.

  if let Some(created_at) = maybe_model_created_at {
    if created_at < *ENGLISH_V1_EPOCH {
      return TextPipelineType::LegacyFakeYou;
    }
  }

  TextPipelineType::EnglishV1
}

#[cfg(test)]
mod tests {
  use chrono::{DateTime, Utc};

  use crate::text_pipelines::guess_pipeline::guess_text_pipeline_heuristic;
  use crate::text_pipelines::text_pipeline_type::TextPipelineType;

  #[test]
  fn new_models_just_created_with_no_date_use_english_v1() {
    assert_eq!(guess_text_pipeline_heuristic(None), TextPipelineType::EnglishV1);
  }

  #[test]
  fn newish_models_use_english_v1() {
    let datetime = DateTime::parse_from_rfc3339("2023-07-01T00:00:00.00Z")
        .expect("should parse")
        .with_timezone(&Utc);
    assert_eq!(guess_text_pipeline_heuristic(Some(datetime)), TextPipelineType::EnglishV1);
  }

  #[test]
  fn older_models_use_legacy_fakeyou() {
    let datetime = DateTime::parse_from_rfc3339("2022-01-01T00:00:00.00Z")
        .expect("should parse")
        .with_timezone(&Utc);
    assert_eq!(guess_text_pipeline_heuristic(Some(datetime)), TextPipelineType::LegacyFakeYou);
  }
}
