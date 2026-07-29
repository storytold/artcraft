use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_audio_cost_and_generate_request::OmniGenAudioCostAndGenerateRequest;
use enums::common::generation::common_audio_model::CommonAudioModel;

use crate::http_server::common_responses::common_web_error::CommonWebError;

const SEED_AUDIO_SAMPLE_RATES_HZ: [u32; 6] = [8000, 16000, 24000, 32000, 44100, 48000];
const SEED_AUDIO_MAX_AUDIO_REFERENCES: usize = 3;
const SEED_AUDIO_MAX_IMAGE_REFERENCES: usize = 1;

/// Validate generation requests before they incur user costs or send API
/// requests.
///
/// NB: The cost endpoint deliberately does NOT call this — the UI polls for
/// a price while the user is still composing the request.
pub fn validate_audio_request(
  request: &OmniGenAudioCostAndGenerateRequest,
) -> Result<(), CommonWebError> {
  // Model presence is enforced later during hydration; nothing to validate without it.
  let model = match request.model {
    Some(model) => model,
    None => return Ok(()),
  };

  let audio_reference_count = request.audio_media_tokens.as_ref().map_or(0, |t| t.len());
  let image_reference_count = request.image_media_tokens.as_ref().map_or(0, |t| t.len());

  match model {
    CommonAudioModel::SunoMusic | CommonAudioModel::SunoSounds => {
      if audio_reference_count > 0 {
        return Err(bad_input(format!(
          "model {:?} does not accept audio references", model,
        )));
      }
      if image_reference_count > 0 {
        return Err(bad_input(format!(
          "model {:?} does not accept image references", model,
        )));
      }
    }
    CommonAudioModel::SunoRemix | CommonAudioModel::SunoSample => {
      if audio_reference_count != 1 {
        return Err(bad_input(format!(
          "model {:?} requires exactly one audio reference", model,
        )));
      }
      if image_reference_count > 0 {
        return Err(bad_input(format!(
          "model {:?} does not accept image references", model,
        )));
      }
    }
    CommonAudioModel::SeedAudio1p0 => {
      if audio_reference_count > SEED_AUDIO_MAX_AUDIO_REFERENCES {
        return Err(bad_input(format!(
          "model seed_audio_1p0 accepts at most {} audio references", SEED_AUDIO_MAX_AUDIO_REFERENCES,
        )));
      }
      if image_reference_count > SEED_AUDIO_MAX_IMAGE_REFERENCES {
        return Err(bad_input(format!(
          "model seed_audio_1p0 accepts at most {} image reference", SEED_AUDIO_MAX_IMAGE_REFERENCES,
        )));
      }
      if audio_reference_count > 0 && image_reference_count > 0 {
        return Err(bad_input(
          "model seed_audio_1p0 cannot combine audio and image references".to_string(),
        ));
      }
      validate_seed_audio_output_controls(request)?;
    }
  }

  Ok(())
}

fn validate_seed_audio_output_controls(
  request: &OmniGenAudioCostAndGenerateRequest,
) -> Result<(), CommonWebError> {
  if let Some(sample_rate_hz) = request.sample_rate_hz {
    if !SEED_AUDIO_SAMPLE_RATES_HZ.contains(&sample_rate_hz) {
      return Err(bad_input(format!(
        "sample_rate_hz must be one of {:?}", SEED_AUDIO_SAMPLE_RATES_HZ,
      )));
    }
  }

  if let Some(speed) = request.speed {
    if !(0.5..=2.0).contains(&speed) {
      return Err(bad_input("speed must be between 0.5 and 2.0".to_string()));
    }
  }

  if let Some(volume) = request.volume {
    if !(0.5..=2.0).contains(&volume) {
      return Err(bad_input("volume must be between 0.5 and 2.0".to_string()));
    }
  }

  if let Some(pitch) = request.pitch {
    if !(-12.0..=12.0).contains(&pitch) {
      return Err(bad_input("pitch must be between -12 and 12 semitones".to_string()));
    }
  }

  Ok(())
}

fn bad_input(message: String) -> CommonWebError {
  CommonWebError::BadInputWithSimpleMessage(message)
}

#[cfg(test)]
mod tests {
  use tokens::tokens::media_files::MediaFileToken;

  use super::*;

  mod reference_count_tests {
    use super::*;

    #[test]
    fn suno_music_rejects_audio_references() {
      let request = OmniGenAudioCostAndGenerateRequest {
        audio_media_tokens: Some(vec![media_token()]),
        ..base_request(CommonAudioModel::SunoMusic)
      };
      assert!(validate_audio_request(&request).is_err());
    }

    #[test]
    fn suno_remix_requires_an_audio_reference() {
      let request = base_request(CommonAudioModel::SunoRemix);
      assert!(validate_audio_request(&request).is_err());
    }

    #[test]
    fn suno_remix_accepts_exactly_one_audio_reference() {
      let request = OmniGenAudioCostAndGenerateRequest {
        audio_media_tokens: Some(vec![media_token()]),
        ..base_request(CommonAudioModel::SunoRemix)
      };
      assert!(validate_audio_request(&request).is_ok());
    }

    #[test]
    fn seed_audio_rejects_too_many_audio_references() {
      let request = OmniGenAudioCostAndGenerateRequest {
        audio_media_tokens: Some(vec![media_token(), media_token(), media_token(), media_token()]),
        ..base_request(CommonAudioModel::SeedAudio1p0)
      };
      assert!(validate_audio_request(&request).is_err());
    }

    #[test]
    fn seed_audio_rejects_combined_audio_and_image_references() {
      let request = OmniGenAudioCostAndGenerateRequest {
        audio_media_tokens: Some(vec![media_token()]),
        image_media_tokens: Some(vec![media_token()]),
        ..base_request(CommonAudioModel::SeedAudio1p0)
      };
      assert!(validate_audio_request(&request).is_err());
    }
  }

  mod output_control_tests {
    use super::*;

    #[test]
    fn seed_audio_rejects_unsupported_sample_rate() {
      let request = OmniGenAudioCostAndGenerateRequest {
        sample_rate_hz: Some(11025),
        ..base_request(CommonAudioModel::SeedAudio1p0)
      };
      assert!(validate_audio_request(&request).is_err());
    }

    #[test]
    fn seed_audio_accepts_supported_controls() {
      let request = OmniGenAudioCostAndGenerateRequest {
        sample_rate_hz: Some(24000),
        speed: Some(1.5),
        volume: Some(0.75),
        pitch: Some(-3.0),
        ..base_request(CommonAudioModel::SeedAudio1p0)
      };
      assert!(validate_audio_request(&request).is_ok());
    }

    #[test]
    fn seed_audio_rejects_out_of_range_speed() {
      let request = OmniGenAudioCostAndGenerateRequest {
        speed: Some(3.0),
        ..base_request(CommonAudioModel::SeedAudio1p0)
      };
      assert!(validate_audio_request(&request).is_err());
    }

    #[test]
    fn seed_audio_rejects_out_of_range_pitch() {
      let request = OmniGenAudioCostAndGenerateRequest {
        pitch: Some(13.0),
        ..base_request(CommonAudioModel::SeedAudio1p0)
      };
      assert!(validate_audio_request(&request).is_err());
    }
  }

  fn base_request(model: CommonAudioModel) -> OmniGenAudioCostAndGenerateRequest {
    OmniGenAudioCostAndGenerateRequest {
      idempotency_token: None,
      model: Some(model),
      prompt: Some("a corgi barking in the rain".to_string()),
      style_prompt: None,
      audio_media_tokens: None,
      image_media_tokens: None,
      keep_lyrics: None,
      is_instrumental: None,
      is_loopable: None,
      bpm: None,
      musical_key: None,
      sample_rate_hz: None,
      speed: None,
      volume: None,
      pitch: None,
    }
  }

  fn media_token() -> MediaFileToken {
    MediaFileToken::new("mf_test123".to_string())
  }
}
