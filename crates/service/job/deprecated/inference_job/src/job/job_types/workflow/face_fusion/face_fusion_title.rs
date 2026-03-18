use primitives::trim_or_empty::trim_or_empty;

pub fn face_fusion_title(
  maybe_existing_audio_model_weights_title: Option<&str>,
  maybe_existing_audio_title: Option<&str>,
  maybe_existing_video_title: Option<&str>
) -> String {
  const FIELD_LENGTH : usize = 255;
  const TITLE_SUFFIX: &str = " Lip Sync Video";

  let maybe_title_basis = maybe_existing_audio_model_weights_title
      .map(|title| trim_or_empty(title)).flatten()
      .or(maybe_existing_audio_title)
      .map(|title| trim_or_empty(title)).flatten()
      .or(maybe_existing_video_title)
      .map(|title| trim_or_empty(title)).flatten();

  match maybe_title_basis {
    None => "Lip Sync Video".to_string(),
    Some(title) => {
      let mut trimmed_title = title.to_string();
      trimmed_title.truncate(FIELD_LENGTH - TITLE_SUFFIX.len());

      let mut full_title = trimmed_title.to_string();
      full_title.push_str(TITLE_SUFFIX);
      full_title
    },
  }
}

#[cfg(test)]
mod tests {
  use crate::job::job_types::workflow::face_fusion::face_fusion_title::face_fusion_title;

  #[test]
  fn test_title() {
    assert_eq!(face_fusion_title(Some("Model"), Some("Audio"), Some("Video")), "Model Lip Sync Video");
    assert_eq!(face_fusion_title(Some("Model"), Some("Audio"), None), "Model Lip Sync Video");
    assert_eq!(face_fusion_title(Some("Model"), None, Some("Video")), "Model Lip Sync Video");
    assert_eq!(face_fusion_title(Some("Model"), None, None), "Model Lip Sync Video");

    assert_eq!(face_fusion_title(None, Some("Audio"), Some("Video")), "Audio Lip Sync Video");
    assert_eq!(face_fusion_title(None, Some("Audio"), None), "Audio Lip Sync Video");
    assert_eq!(face_fusion_title(None, None, Some("Video")), "Video Lip Sync Video");
    assert_eq!(face_fusion_title(None, None, None), "Lip Sync Video");
  }
}
