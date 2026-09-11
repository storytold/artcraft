use fal_client::requests::api::audio::omni::seed_audio_1p0::api::{
  SeedAudio1p0OutputFormat, SeedAudio1p0Request, SeedAudio1p0SampleRate,
};

use crate::api::audio_list_ref::AudioListRef;
use crate::api::image_list_ref::ImageListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_audio::audio_generation_draft_or_request::AudioGenerationDraftOrRequest;
use crate::generate::generate_audio::audio_generation_request::AudioGenerationRequest;
use crate::generate::generate_audio::generate_audio_request_builder::GenerateAudioRequestBuilder;
use crate::generate::generate_audio::providers::fal::seed_audio_1p0::request::FalSeedAudio1p0RequestState;
use crate::generate::generate_audio::providers::reject_unsupported::reject_unsupported_option;

const MAX_AUDIO_REFERENCES: usize = 3;
const MIN_SPEED: f64 = 0.5;
const MAX_SPEED: f64 = 2.0;
const MIN_VOLUME: f64 = 0.5;
const MAX_VOLUME: f64 = 2.0;
const MIN_PITCH: i8 = -12;
const MAX_PITCH: i8 = 12;

pub fn build_fal_seed_audio_1p0(builder: GenerateAudioRequestBuilder) -> Result<AudioGenerationDraftOrRequest, ArtcraftRouterError> {
  let state = build_fal_seed_audio_1p0_state(builder)?;
  Ok(AudioGenerationDraftOrRequest::Request(AudioGenerationRequest::FalSeedAudio1p0(state)))
}

pub(crate) fn build_fal_seed_audio_1p0_state(
  mut builder: GenerateAudioRequestBuilder,
) -> Result<FalSeedAudio1p0RequestState, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  // Options Seed Audio has no equivalent for.
  reject_unsupported_option("style_prompt", builder.style_prompt.as_ref(), strategy)?;
  reject_unsupported_option("keep_lyrics", builder.keep_lyrics.as_ref(), strategy)?;
  reject_unsupported_option("is_instrumental", builder.is_instrumental.as_ref(), strategy)?;
  reject_unsupported_option("is_loopable", builder.is_loopable.as_ref(), strategy)?;
  reject_unsupported_option("bpm", builder.bpm.as_ref(), strategy)?;
  reject_unsupported_option("musical_key", builder.musical_key.as_ref(), strategy)?;

  let prompt = builder.prompt.take().ok_or_else(|| {
    ArtcraftRouterError::InvalidInput("A prompt is required for Seed Audio 1.0".to_string())
  })?;

  let audio_urls = plan_audio_urls(builder.audio_references.take(), strategy)?;
  let image_url = plan_image_url(builder.image_references.take(), strategy)?;

  // fal rejects requests that combine an image reference with audio
  // references, so the router always rejects the combination too.
  if audio_urls.is_some() && image_url.is_some() {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "image_references",
      value: "Seed Audio 1.0 cannot combine an image reference with audio references".to_string(),
    }));
  }

  let request = SeedAudio1p0Request {
    prompt,
    // The omni audio API doesn't expose voice selection yet, so the model
    // always picks the voice.
    voice: None,
    audio_urls,
    image_url,
    output_format: Some(SeedAudio1p0OutputFormat::Mp3),
    sample_rate: plan_sample_rate(builder.sample_rate_hz, strategy)?,
    speed: plan_multiplier("speed", builder.speed, MIN_SPEED, MAX_SPEED, strategy)?,
    volume: plan_multiplier("volume", builder.volume, MIN_VOLUME, MAX_VOLUME, strategy)?,
    pitch: plan_pitch(builder.pitch, strategy)?,
  };

  Ok(FalSeedAudio1p0RequestState { request })
}

// ── Plan helpers ──

/// Seed Audio takes up to 3 reference audio URLs. Fal only accepts URLs (not
/// media tokens). More than 3 references reject under `ErrorOut`; the other
/// strategies keep the first 3.
fn plan_audio_urls(
  audio_references: Option<AudioListRef>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<Vec<String>>, ArtcraftRouterError> {
  let mut urls = match audio_references {
    None => return Ok(None),
    Some(AudioListRef::Urls(urls)) => urls,
    Some(AudioListRef::MediaFileTokens(tokens)) if tokens.is_empty() => return Ok(None),
    Some(AudioListRef::MediaFileTokens(_)) => {
      return Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls));
    }
  };
  if urls.is_empty() {
    return Ok(None);
  }
  if urls.len() > MAX_AUDIO_REFERENCES {
    match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "audio_references",
          value: format!(
            "Seed Audio 1.0 supports at most {} audio references, got {}",
            MAX_AUDIO_REFERENCES,
            urls.len(),
          ),
        }));
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade
      | RequestMismatchMitigationStrategy::PayLessDowngrade => {
        urls.truncate(MAX_AUDIO_REFERENCES);
      }
    }
  }
  Ok(Some(urls))
}

/// Seed Audio takes a single reference image URL. Fal only accepts URLs (not
/// media tokens). More than 1 reference rejects under `ErrorOut`; the other
/// strategies keep the first.
fn plan_image_url(
  image_references: Option<ImageListRef>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<String>, ArtcraftRouterError> {
  let urls = match image_references {
    None => return Ok(None),
    Some(ImageListRef::Urls(urls)) => urls,
    Some(ImageListRef::MediaFileTokens(tokens)) if tokens.is_empty() => return Ok(None),
    Some(ImageListRef::MediaFileTokens(_)) => {
      return Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls));
    }
  };
  if urls.is_empty() {
    return Ok(None);
  }
  if urls.len() > 1 {
    if let RequestMismatchMitigationStrategy::ErrorOut = strategy {
      return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
        field: "image_references",
        value: format!("Seed Audio 1.0 supports at most 1 image reference, got {}", urls.len()),
      }));
    }
  }
  Ok(urls.into_iter().next())
}

/// Map a requested sample rate to Seed Audio's supported rates. An exact
/// match is required under `ErrorOut`; the other strategies pick the nearest
/// supported rate (ties resolve to the lower rate).
fn plan_sample_rate(
  sample_rate_hz: Option<u32>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<SeedAudio1p0SampleRate>, ArtcraftRouterError> {
  const SUPPORTED: [(u32, SeedAudio1p0SampleRate); 6] = [
    (8_000, SeedAudio1p0SampleRate::Hz8000),
    (16_000, SeedAudio1p0SampleRate::Hz16000),
    (24_000, SeedAudio1p0SampleRate::Hz24000),
    (32_000, SeedAudio1p0SampleRate::Hz32000),
    (44_100, SeedAudio1p0SampleRate::Hz44100),
    (48_000, SeedAudio1p0SampleRate::Hz48000),
  ];

  let Some(requested) = sample_rate_hz else {
    return Ok(None);
  };

  if let Some((_, rate)) = SUPPORTED.iter().find(|(hz, _)| *hz == requested) {
    return Ok(Some(*rate));
  }

  match strategy {
    RequestMismatchMitigationStrategy::ErrorOut => {
      Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
        field: "sample_rate_hz",
        value: format!("{}", requested),
      }))
    }
    RequestMismatchMitigationStrategy::PayMoreUpgrade
    | RequestMismatchMitigationStrategy::PayLessDowngrade => {
      let (_, nearest) = SUPPORTED.iter()
        .min_by_key(|(hz, _)| requested.abs_diff(*hz))
        .expect("SUPPORTED is non-empty");
      Ok(Some(*nearest))
    }
  }
}

/// Clamp a 0.5–2.0 multiplier (speed / volume) per strategy: out-of-range
/// values reject under `ErrorOut` and clamp otherwise.
fn plan_multiplier(
  field: &'static str,
  value: Option<f64>,
  min: f64,
  max: f64,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<f64>, ArtcraftRouterError> {
  let Some(value) = value else {
    return Ok(None);
  };
  if value >= min && value <= max {
    return Ok(Some(value));
  }
  match strategy {
    RequestMismatchMitigationStrategy::ErrorOut => {
      Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
        field,
        value: format!("{}", value),
      }))
    }
    RequestMismatchMitigationStrategy::PayMoreUpgrade
    | RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(value.clamp(min, max))),
  }
}

/// Pitch is a semitone shift: round to the nearest whole semitone, then
/// reject (under `ErrorOut`) or clamp values outside ±12.
fn plan_pitch(
  pitch: Option<f64>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<i8>, ArtcraftRouterError> {
  let Some(pitch) = pitch else {
    return Ok(None);
  };
  let rounded = pitch.round();
  if rounded >= MIN_PITCH as f64 && rounded <= MAX_PITCH as f64 {
    return Ok(Some(rounded as i8));
  }
  match strategy {
    RequestMismatchMitigationStrategy::ErrorOut => {
      Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
        field: "pitch",
        value: format!("{}", pitch),
      }))
    }
    RequestMismatchMitigationStrategy::PayMoreUpgrade
    | RequestMismatchMitigationStrategy::PayLessDowngrade => {
      Ok(Some(rounded.clamp(MIN_PITCH as f64, MAX_PITCH as f64) as i8))
    }
  }
}

#[cfg(test)]
mod tests {
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::router_audio_model::RouterAudioModel;
  use crate::api::router_provider::RouterProvider;

  use super::*;

  const AUDIO_URL: &str = "https://example.com/a.mp3";
  const IMAGE_URL: &str = "https://example.com/scene.png";

  mod basics {
    use super::*;

    #[test]
    fn prompt_is_passed_through() {
      let state = build_fal_seed_audio_1p0_state(base_builder()).expect("build");
      assert_eq!(state.request.prompt, "a suspense radio drama");
    }

    #[test]
    fn missing_prompt_is_rejected() {
      let builder = GenerateAudioRequestBuilder { prompt: None, ..base_builder() };
      assert!(build_fal_seed_audio_1p0_state(builder).is_err());
    }

    #[test]
    fn voice_is_always_none() {
      // The omni audio API doesn't expose voice selection.
      let state = build_fal_seed_audio_1p0_state(base_builder()).expect("build");
      assert!(state.request.voice.is_none());
    }

    #[test]
    fn output_format_is_mp3() {
      let state = build_fal_seed_audio_1p0_state(base_builder()).expect("build");
      assert_eq!(state.request.output_format, Some(SeedAudio1p0OutputFormat::Mp3));
    }
  }

  mod reference_tests {
    use super::*;

    #[test]
    fn audio_urls_pass_through() {
      let builder = GenerateAudioRequestBuilder {
        audio_references: Some(AudioListRef::Urls(vec![AUDIO_URL.to_string()])),
        ..base_builder()
      };
      let state = build_fal_seed_audio_1p0_state(builder).expect("build");
      assert_eq!(state.request.audio_urls, Some(vec![AUDIO_URL.to_string()]));
    }

    #[test]
    fn three_audio_urls_are_accepted() {
      let builder = builder_with_audio_urls(3);
      let state = build_fal_seed_audio_1p0_state(builder).expect("build");
      assert_eq!(state.request.audio_urls.as_ref().map(|u| u.len()), Some(3));
    }

    #[test]
    fn four_audio_urls_error_out() {
      let mut builder = builder_with_audio_urls(4);
      builder.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::ErrorOut;
      assert!(build_fal_seed_audio_1p0_state(builder).is_err());
    }

    #[test]
    fn four_audio_urls_truncate_under_lenient_strategies() {
      let mut builder = builder_with_audio_urls(4);
      builder.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::PayMoreUpgrade;
      let state = build_fal_seed_audio_1p0_state(builder).expect("build");
      assert_eq!(state.request.audio_urls.as_ref().map(|u| u.len()), Some(3));
    }

    #[test]
    fn audio_media_tokens_are_rejected() {
      let builder = GenerateAudioRequestBuilder {
        audio_references: Some(AudioListRef::MediaFileTokens(vec![
          MediaFileToken::new("mf_test123".to_string()),
        ])),
        ..base_builder()
      };
      assert!(matches!(
        build_fal_seed_audio_1p0_state(builder),
        Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
      ));
    }

    #[test]
    fn image_url_passes_through() {
      let builder = GenerateAudioRequestBuilder {
        image_references: Some(ImageListRef::Urls(vec![IMAGE_URL.to_string()])),
        ..base_builder()
      };
      let state = build_fal_seed_audio_1p0_state(builder).expect("build");
      assert_eq!(state.request.image_url.as_deref(), Some(IMAGE_URL));
    }

    #[test]
    fn two_image_urls_error_out() {
      let builder = GenerateAudioRequestBuilder {
        image_references: Some(ImageListRef::Urls(vec![
          IMAGE_URL.to_string(),
          "https://example.com/other.png".to_string(),
        ])),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..base_builder()
      };
      assert!(build_fal_seed_audio_1p0_state(builder).is_err());
    }

    #[test]
    fn combining_image_and_audio_references_is_always_rejected() {
      // fal rejects the combination, so the router rejects it under every
      // mitigation strategy.
      for strategy in [
        RequestMismatchMitigationStrategy::ErrorOut,
        RequestMismatchMitigationStrategy::PayMoreUpgrade,
        RequestMismatchMitigationStrategy::PayLessDowngrade,
      ] {
        let builder = GenerateAudioRequestBuilder {
          audio_references: Some(AudioListRef::Urls(vec![AUDIO_URL.to_string()])),
          image_references: Some(ImageListRef::Urls(vec![IMAGE_URL.to_string()])),
          request_mismatch_mitigation_strategy: strategy,
          ..base_builder()
        };
        assert!(
          build_fal_seed_audio_1p0_state(builder).is_err(),
          "expected rejection under {strategy:?}",
        );
      }
    }
  }

  mod sample_rate_tests {
    use super::*;

    #[test]
    fn exact_rates_map_directly() {
      let cases = [
        (8_000, SeedAudio1p0SampleRate::Hz8000),
        (16_000, SeedAudio1p0SampleRate::Hz16000),
        (24_000, SeedAudio1p0SampleRate::Hz24000),
        (32_000, SeedAudio1p0SampleRate::Hz32000),
        (44_100, SeedAudio1p0SampleRate::Hz44100),
        (48_000, SeedAudio1p0SampleRate::Hz48000),
      ];
      for (hz, expected) in cases {
        let builder = GenerateAudioRequestBuilder {
          sample_rate_hz: Some(hz),
          request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
          ..base_builder()
        };
        let state = build_fal_seed_audio_1p0_state(builder).expect("build");
        assert_eq!(state.request.sample_rate, Some(expected), "for {hz} Hz");
      }
    }

    #[test]
    fn inexact_rate_errors_out_under_error_out() {
      let builder = GenerateAudioRequestBuilder {
        sample_rate_hz: Some(22_050),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..base_builder()
      };
      assert!(build_fal_seed_audio_1p0_state(builder).is_err());
    }

    #[test]
    fn inexact_rate_maps_to_nearest_under_lenient_strategies() {
      let cases = [
        (7_000, SeedAudio1p0SampleRate::Hz8000),
        (22_050, SeedAudio1p0SampleRate::Hz24000),
        (40_000, SeedAudio1p0SampleRate::Hz44100),
        (96_000, SeedAudio1p0SampleRate::Hz48000),
      ];
      for (hz, expected) in cases {
        let builder = GenerateAudioRequestBuilder {
          sample_rate_hz: Some(hz),
          request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
          ..base_builder()
        };
        let state = build_fal_seed_audio_1p0_state(builder).expect("build");
        assert_eq!(state.request.sample_rate, Some(expected), "for {hz} Hz");
      }
    }

    #[test]
    fn no_rate_stays_none() {
      let state = build_fal_seed_audio_1p0_state(base_builder()).expect("build");
      assert!(state.request.sample_rate.is_none());
    }
  }

  mod speed_and_volume_tests {
    use super::*;

    #[test]
    fn in_range_values_pass_through() {
      let builder = GenerateAudioRequestBuilder {
        speed: Some(1.5),
        volume: Some(0.5),
        ..base_builder()
      };
      let state = build_fal_seed_audio_1p0_state(builder).expect("build");
      assert_eq!(state.request.speed, Some(1.5));
      assert_eq!(state.request.volume, Some(0.5));
    }

    #[test]
    fn out_of_range_speed_errors_out() {
      let builder = GenerateAudioRequestBuilder {
        speed: Some(3.0),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..base_builder()
      };
      assert!(build_fal_seed_audio_1p0_state(builder).is_err());
    }

    #[test]
    fn out_of_range_speed_clamps_under_lenient_strategies() {
      let builder = GenerateAudioRequestBuilder {
        speed: Some(3.0),
        volume: Some(0.1),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayLessDowngrade,
        ..base_builder()
      };
      let state = build_fal_seed_audio_1p0_state(builder).expect("build");
      assert_eq!(state.request.speed, Some(2.0));
      assert_eq!(state.request.volume, Some(0.5));
    }
  }

  mod pitch_tests {
    use super::*;

    #[test]
    fn pitch_rounds_to_nearest_semitone() {
      let cases = [
        (2.4, 2i8),
        (2.5, 3i8),
        (-2.4, -2i8),
        (-2.5, -3i8),
        (0.0, 0i8),
      ];
      for (input, expected) in cases {
        let builder = GenerateAudioRequestBuilder {
          pitch: Some(input),
          request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
          ..base_builder()
        };
        let state = build_fal_seed_audio_1p0_state(builder).expect("build");
        assert_eq!(state.request.pitch, Some(expected), "for pitch {input}");
      }
    }

    #[test]
    fn out_of_range_pitch_errors_out() {
      for pitch in [13.0, -13.0] {
        let builder = GenerateAudioRequestBuilder {
          pitch: Some(pitch),
          request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
          ..base_builder()
        };
        assert!(build_fal_seed_audio_1p0_state(builder).is_err(), "for pitch {pitch}");
      }
    }

    #[test]
    fn out_of_range_pitch_clamps_under_lenient_strategies() {
      let cases = [(20.0, 12i8), (-20.0, -12i8)];
      for (input, expected) in cases {
        let builder = GenerateAudioRequestBuilder {
          pitch: Some(input),
          request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
          ..base_builder()
        };
        let state = build_fal_seed_audio_1p0_state(builder).expect("build");
        assert_eq!(state.request.pitch, Some(expected), "for pitch {input}");
      }
    }

    #[test]
    fn boundary_pitch_is_accepted() {
      for (input, expected) in [(12.0, 12i8), (-12.0, -12i8)] {
        let builder = GenerateAudioRequestBuilder {
          pitch: Some(input),
          request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
          ..base_builder()
        };
        let state = build_fal_seed_audio_1p0_state(builder).expect("build");
        assert_eq!(state.request.pitch, Some(expected));
      }
    }
  }

  mod unsupported_options {
    use super::*;

    #[test]
    fn unsupported_options_error_out() {
      use enums::common::generation::common_musical_key::CommonMusicalKey;
      let cases: Vec<GenerateAudioRequestBuilder> = vec![
        GenerateAudioRequestBuilder { style_prompt: Some("EDM".to_string()), ..base_builder() },
        GenerateAudioRequestBuilder { keep_lyrics: Some(true), ..base_builder() },
        GenerateAudioRequestBuilder { is_instrumental: Some(true), ..base_builder() },
        GenerateAudioRequestBuilder { is_loopable: Some(true), ..base_builder() },
        GenerateAudioRequestBuilder { bpm: Some(120), ..base_builder() },
        GenerateAudioRequestBuilder { musical_key: Some(CommonMusicalKey::CMajor), ..base_builder() },
      ];
      for mut builder in cases {
        builder.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::ErrorOut;
        assert!(build_fal_seed_audio_1p0_state(builder).is_err());
      }
    }

    #[test]
    fn unsupported_options_are_dropped_under_lenient_strategies() {
      let builder = GenerateAudioRequestBuilder {
        style_prompt: Some("EDM".to_string()),
        keep_lyrics: Some(true),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
        ..base_builder()
      };
      assert!(build_fal_seed_audio_1p0_state(builder).is_ok());
    }
  }

  // ── Helpers ──

  fn base_builder() -> GenerateAudioRequestBuilder {
    GenerateAudioRequestBuilder {
      model: RouterAudioModel::SeedAudio1p0,
      provider: RouterProvider::Fal,
      prompt: Some("a suspense radio drama".to_string()),
      ..Default::default()
    }
  }

  fn builder_with_audio_urls(count: usize) -> GenerateAudioRequestBuilder {
    let urls = (0..count).map(|i| format!("https://example.com/a{i}.mp3")).collect();
    GenerateAudioRequestBuilder {
      audio_references: Some(AudioListRef::Urls(urls)),
      ..base_builder()
    }
  }
}
