use crate::legacy::old_bespoke_paths::hashed_directory_path_short_string::hashed_directory_path_short_string;
use std::path::PathBuf;

/// This is designed to make it centrally configurable where
/// different types of objects are stored.
#[deprecated(note = "see the 'buckets' crate for a better approach")]
pub struct BucketPathUnifier {
  // TTS
  pub tts_synthesizer_model_root: PathBuf,
  pub tts_inference_output_root: PathBuf,
  pub tts_pretrained_vocoder_model_root: PathBuf, // Pretrained, non-user uploaded vocoders
  pub vocoder_model_root: PathBuf, // User-uploaded vocoders
  // W2L
  pub user_uploaded_w2l_templates_root: PathBuf,
  pub user_uploaded_audio_for_w2l_root: PathBuf,
  pub w2l_inference_output_root: PathBuf,
  pub w2l_model_root: PathBuf,
  pub w2l_end_bump_root: PathBuf,
  // Zero shot
  pub zs_tts_speaker_embedding_root: PathBuf,
  // VC
  pub rvc_v2_model_root: PathBuf,
  pub softvc_model_root: PathBuf,
  pub so_vits_svc_model_root: PathBuf,
  pub vc_inference_output_root: PathBuf,
}

impl BucketPathUnifier {

  #[deprecated(note = "see the 'buckets' crate for a better approach")]
  pub fn default_paths() -> Self {
    Self {
      // TTS
      tts_synthesizer_model_root: PathBuf::from("/user_uploaded_tts_synthesizers"),
      tts_inference_output_root: PathBuf::from("/tts_inference_output"),
      tts_pretrained_vocoder_model_root: PathBuf::from("/tts_pretrained_vocoders"), // Pretrained, non-user uploaded vocoders
      vocoder_model_root: PathBuf::from("/user_uploaded_vocoders"),
      // W2L
      user_uploaded_audio_for_w2l_root: PathBuf::from("/user_uploaded_w2l_audio"),
      user_uploaded_w2l_templates_root: PathBuf::from("/user_uploaded_w2l_templates"),
      w2l_inference_output_root: PathBuf::from("/w2l_inference_output"),
      w2l_model_root: PathBuf::from("/w2l_pretrained_models"),
      w2l_end_bump_root: PathBuf::from("/w2l_end_bumps"),
      // Zero shot
      zs_tts_speaker_embedding_root: PathBuf::from("/user/zero_shot_embeddings/tts"),
      // VC
      rvc_v2_model_root: PathBuf::from("/user_uploaded_rvc_v2_models"),
      softvc_model_root: PathBuf::from("/user_uploaded_softvc_models"),
      so_vits_svc_model_root: PathBuf::from("/user_uploaded_so_vits_svc_models"),
      vc_inference_output_root: PathBuf::from("/vc_inference_output"),
    }
  }

  // ==================== TTS MODELS (SYNTHESIZER + VOCODER) ==================== //

  // NB: Callers use "hash_file_sha2" as the file hash.
  // NB: This is used for TT2 *and* VITS
  #[deprecated(note = "see the 'buckets' crate for a better approach")]
  pub fn tts_synthesizer_path(&self, tts_synthesizer_file_hash: &str) -> PathBuf {
    let hashed_path = Self::hashed_directory_path(tts_synthesizer_file_hash);
    let model_filename = format!("{}.pt", &tts_synthesizer_file_hash);

    self.tts_synthesizer_model_root
      .join(hashed_path)
      .join(model_filename)
  }

  // NB: Callers use "hash_file_sha2" as the file hash.
  // NB: This is used for VITS traced models, the original model is uploaded with `tts_synthesizer_path()`
  #[deprecated(note = "see the 'buckets' crate for a better approach")]
  pub fn tts_traced_synthesizer_path(&self, tts_synthesizer_file_hash: &str) -> PathBuf {
    let hashed_path = Self::hashed_directory_path(tts_synthesizer_file_hash);
    let model_filename = format!("{}_traced.pt", &tts_synthesizer_file_hash);

    self.tts_synthesizer_model_root
        .join(hashed_path)
        .join(model_filename)
  }

  // TODO(bt, 2023-04-03): I don't think we ever wound up using this?
  #[deprecated(note = "see the 'buckets' crate for a better approach")]
  pub fn tts_zipped_synthesizer_path(&self, tts_synthesizer_file_hash: &str) -> PathBuf {
    let hashed_path = Self::hashed_directory_path(tts_synthesizer_file_hash);
    let model_filename = format!("{}.zip", &tts_synthesizer_file_hash);

    self.tts_synthesizer_model_root
        .join(hashed_path)
        .join(model_filename)
  }

  // ==================== VOCODER MODELS ==================== //

  /// TTS pretrained vocoder models.
  /// For now this will be limited, but once they're user-uploadable, we'll add more.
  /// NB: These are vocoders that we uploaded without the FakeYou upload system!!
  #[deprecated(note = "see the 'buckets' crate for a better approach")]
  pub fn tts_pretrained_vocoders_path(&self, tts_vocoder_model_name: &str) -> PathBuf {
    self.tts_pretrained_vocoder_model_root.join(tts_vocoder_model_name)
  }

  // NB: Callers use "hash_file_sha2" as the file hash.
  /// User-uploaded vocoders.
  /// These can be HifiGan and HifiGanSoftVc
  #[deprecated(note = "see the 'buckets' crate for a better approach")]
  pub fn vocoder_path(&self, vocoder_file_hash: &str) -> PathBuf {
    let hashed_path = Self::hashed_directory_path(vocoder_file_hash);
    let model_filename = format!("{}.pt", &vocoder_file_hash);

    self.vocoder_model_root
        .join(hashed_path)
        .join(model_filename)
  }

  // ==================== TTS INFERENCE OUTPUT ==================== //

  // NB: Callers use job uuid_idempotency_token, which seems *bad*
  /// This should include the string "vocodes" for downloaders.
  #[deprecated(note = "see the 'buckets' crate for a better approach")]
  pub fn tts_inference_wav_audio_output_path(&self, tts_inference_output_uuid: &str) -> PathBuf {
    let hashed_path = Self::hashed_directory_path(tts_inference_output_uuid);
    let audio_filename = format!("vocodes_{}.wav", &tts_inference_output_uuid);

    self.tts_inference_output_root
        .join(hashed_path)
        .join(audio_filename)
  }

  #[deprecated(note = "see the 'buckets' crate for a better approach")]
  pub fn tts_inference_spectrogram_output_path(&self, tts_inference_output_uuid: &str) -> PathBuf {
    let hashed_path = Self::hashed_directory_path(tts_inference_output_uuid);
    let json_filename = format!("{}.json", &tts_inference_output_uuid);

    self.tts_inference_output_root
        .join(hashed_path)
        .join(json_filename)
  }

  // ==================== W2L STATIC RESOURCES ==================== //

  // W2L pretrained models. There are only two.
  #[deprecated(note = "see the 'buckets' crate for a better approach")]
  pub fn w2l_pretrained_models_path(&self, w2l_model_name: &str) -> PathBuf {
    self.w2l_model_root.join(w2l_model_name)
  }

  // W2L "end bumps" are videos added at the end.
  #[deprecated(note = "see the 'buckets' crate for a better approach")]
  pub fn end_bump_video_for_w2l_path(&self, end_bump_filename: &str) -> PathBuf {
    self.w2l_end_bump_root.join(end_bump_filename)
  }

  // ==================== W2L USER-UPLOADED RESOURCES ==================== //

  // The video or images uploaded as templates
  // eg. /user_uploaded_w2l_templates/1/5/1/151a[...60]...
  #[deprecated(note = "see the 'buckets' crate for a better approach")]
  pub fn media_templates_for_w2l_path(&self, template_file_hash: &str) -> PathBuf {
    let hashed_path = Self::hashed_directory_path(template_file_hash);
    self.user_uploaded_w2l_templates_root
      .join(hashed_path)
      .join(template_file_hash)
  }

  // These share the same directory as the uploaded w2l template media.
  // eg. /user_uploaded_w2l_templates/1/5/1/151a[...60]_detected_faces.pickle
  #[deprecated(note = "see the 'buckets' crate for a better approach")]
  pub fn precomputed_faces_for_w2l_path(&self, template_file_hash: &str) -> PathBuf {
    let faces_filename = format!("{}_detected_faces.pickle", &template_file_hash);
    let hashed_path = Self::hashed_directory_path(template_file_hash);

    self.user_uploaded_w2l_templates_root
      .join(hashed_path)
      .join(faces_filename)
  }

  // User-uploaded audio.
  // eg. /user_uploaded_w2l_audio/0/0/b/00bcc7a4-bdf5-43a5-9603-a15ca780d866
  #[deprecated(note = "see the 'buckets' crate for a better approach")]
  pub fn user_audio_for_w2l_inference_path(&self, audio_uuid: &str) -> PathBuf {
    let hashed_path = Self::hashed_directory_path(audio_uuid);
    self.user_uploaded_audio_for_w2l_root
      .join(hashed_path)
      .join(audio_uuid)
  }

  // ==================== W2L INFERENCE OUTPUT ==================== //

  // NB: caller uses inference job token, which seems ideal
  // W2L inference output videos
  #[deprecated(note = "see the 'buckets' crate for a better approach")]
  pub fn w2l_inference_video_output_path(&self, w2l_inference_job_token: &str) -> PathBuf {
    // NB: We don't want colons from the token in the filename.
    if w2l_inference_job_token.contains(":") {
      if let Some((_token_type, token)) = w2l_inference_job_token.split_once(":") {
        let video_filename = w2l_inference_job_token.replace(":", "");
        let video_filename = format!("vocodes_video_{}.mp4", video_filename);

        let hashed_path = Self::hashed_directory_path(token);
        let hashed_path = hashed_path.to_lowercase();

        return self.w2l_inference_output_root
          .join(hashed_path)
          .join(video_filename);
      }
    }

    let video_filename = w2l_inference_job_token.replace(":", "");
    let video_filename = format!("vocodes_video_{}.mp4", video_filename);

    let hashed_path = Self::hashed_directory_path(w2l_inference_job_token);

    self.w2l_inference_output_root
      .join(hashed_path)
      .join(video_filename)
  }

  // ==================== ZERO SHOT SPEAKER EMBEDDINGS ==================== //

  // NB: Entropic hash is not based on file hash and will be reused for future encodings.
  #[deprecated(note = "see the 'buckets' crate for a better approach")]
  pub fn zero_shot_tts_speaker_encoding(&self, entropic_hash: &str, version: u32) -> PathBuf {
    let hashed_path = Self::hashed_directory_path(entropic_hash);
    let speaker_encoding_filename = format!("{}_{}.zs", &entropic_hash, version);

    self.zs_tts_speaker_embedding_root
        .join(hashed_path)
        .join(speaker_encoding_filename)
  }

  // ==================== VOICE CONVERSION MODELS ==================== //

  // NB: Entropic hash is not based on file hash and is shared between .pth and .index files.
  #[deprecated(note = "see the 'buckets' crate for a better approach")]
  pub fn rvc_v2_model_index_path(&self, entropic_hash: &str) -> PathBuf {
    let hashed_path = Self::hashed_directory_path(entropic_hash);
    let model_index_filename = format!("{}.index", &entropic_hash);

    self.rvc_v2_model_root
        .join(hashed_path)
        .join(model_index_filename)
  }

  // NB: Entropic hash is not based on file hash and is shared between .pth and .index files.
  #[deprecated(note = "see the 'buckets' crate for a better approach")]
  pub fn rvc_v2_model_path(&self, entropic_hash: &str) -> PathBuf {
    let hashed_path = Self::hashed_directory_path(entropic_hash);
    let model_filename = format!("{}.pt", &entropic_hash);

    self.rvc_v2_model_root
        .join(hashed_path)
        .join(model_filename)
  }

  // NB: Callers use "hash_file_sha2" as the file hash.
  #[deprecated(note = "see the 'buckets' crate for a better approach")]
  pub fn softvc_model_path(&self, softvc_model_file_hash: &str) -> PathBuf {
    let hashed_path = Self::hashed_directory_path(softvc_model_file_hash);
    let model_filename = format!("{}.pt", &softvc_model_file_hash);

    self.softvc_model_root
        .join(hashed_path)
        .join(model_filename)
  }

  // NB: Callers use "hash_file_sha2" as the file hash.
  #[deprecated(note = "see the 'buckets' crate for a better approach")]
  pub fn so_vits_svc_model_path(&self, so_vits_svc_model_file_hash: &str) -> PathBuf {
    let hashed_path = Self::hashed_directory_path(so_vits_svc_model_file_hash);
    let model_filename = format!("{}.pt", &so_vits_svc_model_file_hash);

    self.so_vits_svc_model_root
        .join(hashed_path)
        .join(model_filename)
  }

  // ==================== VOICE CONVERSION INFERENCE OUTPUT ==================== //

  // NB: Callers use job uuid_idempotency_token, which seems *bad*
  #[deprecated(note = "see the 'buckets' crate for a better approach")]
  pub fn voice_conversion_inference_wav_audio_output_path(&self, vc_inference_output_uuid: &str) -> PathBuf {
    let hashed_path = Self::hashed_directory_path(vc_inference_output_uuid);
    let audio_filename = format!("fakeyou_{}.wav", &vc_inference_output_uuid);

    self.vc_inference_output_root
        .join(hashed_path)
        .join(audio_filename)
  }


  // ==================== UTILITY ==================== //

  #[deprecated(note = "see the 'buckets' crate for a better approach")]
  pub fn hashed_directory_path(file_hash: &str) -> String {
    hashed_directory_path_short_string(file_hash)
  }
}

#[cfg(test)]
mod tests {
  use crate::legacy::old_bespoke_paths::bucket_path_unifier::BucketPathUnifier;
  use std::path::PathBuf;

  fn get_instance() -> BucketPathUnifier {
    BucketPathUnifier {
      // TTS
      tts_synthesizer_model_root: PathBuf::from("/test_path_synthesizers"),
      tts_inference_output_root: PathBuf::from("/test_path_tts_output"),
      tts_pretrained_vocoder_model_root: PathBuf::from("/test_path_tts_vocoders"), // Pretrained, non-user uploaded vocoders
      vocoder_model_root: PathBuf::from("/test_path_user_vocoders"), // User-uploaded vocoders
      // W2L
      user_uploaded_w2l_templates_root: PathBuf::from("/test_path_w2l_templates"),
      user_uploaded_audio_for_w2l_root: PathBuf::from("/test_path_w2l_audio"),
      w2l_inference_output_root: PathBuf::from("/test_path_w2l_output"),
      w2l_model_root: PathBuf::from("/test_path_w2l_pretrained_models"),
      w2l_end_bump_root: PathBuf::from("/test_path_w2l_end_bumps"),
      // VOICE CONVERSION
      zs_tts_speaker_embedding_root: PathBuf::from("/test/zs_tts_speaker_embedding_root"),
      rvc_v2_model_root: PathBuf::from("/test_path_rvc_v2_models"),
      softvc_model_root: PathBuf::from("/test_path_softvc_models"),
      so_vits_svc_model_root: PathBuf::from("/test_path_so_vits_svc_models"),
      vc_inference_output_root: PathBuf::from("/test_path_vc_output"),
    }
  }

  // NB: Pretrained, non-user uploaded vocoders
  #[test]
  fn test_tts_pretrained_vocoders_path() {
    let paths = get_instance();
    assert_eq!(paths.tts_pretrained_vocoders_path("melgan.pth").to_str().unwrap(),
      "/test_path_tts_vocoders/melgan.pth");
  }

  // NB: User-uploaded vocoders
  #[test]
  fn test_vocoders_path() {
    let paths = get_instance();
    assert_eq!(paths.vocoder_path("foobar").to_str().unwrap(),
      "/test_path_user_vocoders/f/o/o/foobar.pt");
  }

  #[test]
  fn test_tts_synthesizer_path() {
    let paths = get_instance();
    assert_eq!(paths.tts_synthesizer_path("foobar").to_str().unwrap(),
      "/test_path_synthesizers/f/o/o/foobar.pt");
  }

  #[test]
  fn test_tts_zipped_synthesizer_path() {
    let paths = get_instance();
    assert_eq!(paths.tts_zipped_synthesizer_path("foobar").to_str().unwrap(),
      "/test_path_synthesizers/f/o/o/foobar.zip");
  }

  #[test]
  fn test_tts_inference_wav_audio_output_path() {
    let paths = get_instance();
    assert_eq!(paths.tts_inference_wav_audio_output_path("foobar").to_str().unwrap(),
      "/test_path_tts_output/f/o/o/vocodes_foobar.wav");
  }

  #[test]
  fn test_tts_inference_spectrogram_output_path() {
    let paths = get_instance();
    assert_eq!(paths.tts_inference_spectrogram_output_path("foobar").to_str().unwrap(),
      "/test_path_tts_output/f/o/o/foobar.json");
  }

  #[test]
  fn test_w2l_pretrained_models_path() {
    let paths = get_instance();
    assert_eq!(paths.w2l_pretrained_models_path("model.pth").to_str().unwrap(),
               "/test_path_w2l_pretrained_models/model.pth");
  }

  #[test]
  fn test_end_bump_video_for_w2l_path() {
    let paths = get_instance();
    assert_eq!(paths.end_bump_video_for_w2l_path("logo.mp4").to_str().unwrap(),
               "/test_path_w2l_end_bumps/logo.mp4");
  }

  #[test]
  fn test_user_audio_for_w2l_inference_path() {
    let paths = get_instance();
    assert_eq!(paths.user_audio_for_w2l_inference_path("foobar").to_str().unwrap(),
               "/test_path_w2l_audio/f/o/o/foobar");
  }

  #[test]
  fn test_media_templates_for_w2l_path() {
    let paths = get_instance();
    assert_eq!(paths.media_templates_for_w2l_path("foobar").to_str().unwrap(),
               "/test_path_w2l_templates/f/o/o/foobar");
  }

  #[test]
  fn test_precomputed_faces_for_w2l_path() {
    let paths = get_instance();
    assert_eq!(paths.precomputed_faces_for_w2l_path("foobar").to_str().unwrap(),
               "/test_path_w2l_templates/f/o/o/foobar_detected_faces.pickle");
  }

  #[test]
  fn test_w2l_inference_video_output_path() {
    let paths = get_instance();

    // Case 1: Tokens without a "token type"
    assert_eq!(paths.w2l_inference_video_output_path("foobar").to_str().unwrap(),
               "/test_path_w2l_output/f/o/o/vocodes_video_foobar.mp4");

    // Case 2: Tokens with a "token type"
    // Note: that it removes the token type from dir path and handles the colon:
    assert_eq!(paths.w2l_inference_video_output_path("type:abcdef").to_str().unwrap(),
               "/test_path_w2l_output/a/b/c/vocodes_video_typeabcdef.mp4");

    // It also handles capitalization
    assert_eq!(paths.w2l_inference_video_output_path("TYPE:ABCDEF").to_str().unwrap(),
               "/test_path_w2l_output/a/b/c/vocodes_video_TYPEABCDEF.mp4");
  }

  #[test]
  fn test_zero_shot_tts_speaker_encoding_paths() {
    let paths = get_instance();
    let entropic_hash = "entropic";
    let version = 0;
    assert_eq!(paths.zero_shot_tts_speaker_encoding(entropic_hash, version).to_str().unwrap(),
               "/test/zs_tts_speaker_embedding_root/e/n/t/entropic_0.zs");

    let version = 23;
    assert_eq!(paths.zero_shot_tts_speaker_encoding(entropic_hash, version).to_str().unwrap(),
               "/test/zs_tts_speaker_embedding_root/e/n/t/entropic_23.zs");
  }

  //#[test]
  //fn test_temp() {
  //  // TODO/TEMP: Generating paths to use in dev
  //  let unifier = BucketPathUnifier::default_paths();
  //  let path = unifier.zero_shot_tts_speaker_encoding("qcy7pv3rph0ntkqnpz5cfg9ksyh7kkz53v1wbr2ckvt8znvhxqn7ca5mz7wzm3q5", 0);
  //  assert_eq!(path.to_str().unwrap(), "");
  //}

  #[test]
  fn test_rvc_model_and_index_paths() {
    let paths = get_instance();
    let entropic_hash = "entropic";
    assert_eq!(paths.rvc_v2_model_path(entropic_hash).to_str().unwrap(),
               "/test_path_rvc_v2_models/e/n/t/entropic.pt");

    assert_eq!(paths.rvc_v2_model_index_path(entropic_hash).to_str().unwrap(),
               "/test_path_rvc_v2_models/e/n/t/entropic.index");
  }

  #[test]
  fn test_softvc_model_path() {
    let paths = get_instance();
    assert_eq!(paths.softvc_model_path("foobar").to_str().unwrap(),
               "/test_path_softvc_models/f/o/o/foobar.pt");
  }

  #[test]
  fn test_so_vits_svc_model_path() {
    let paths = get_instance();
    assert_eq!(paths.so_vits_svc_model_path("foobar").to_str().unwrap(),
               "/test_path_so_vits_svc_models/f/o/o/foobar.pt");
  }

  #[test]
  fn test_vc_inference_wav_audio_output_path() {
    let paths = get_instance();
    assert_eq!(paths.voice_conversion_inference_wav_audio_output_path("foobar").to_str().unwrap(),
               "/test_path_vc_output/f/o/o/fakeyou_foobar.wav");
  }

  #[test]
  fn hashed_directory_path_length_zero() {
    assert_eq!(&BucketPathUnifier::hashed_directory_path(""), "");
  }

  #[test]
  fn hashed_directory_path_length_one() {
    assert_eq!(&BucketPathUnifier::hashed_directory_path("a"), "");
  }

  #[test]
  fn hashed_directory_path_length_two() {
    assert_eq!(&BucketPathUnifier::hashed_directory_path("ab"), "a/");
  }

  #[test]
  fn hashed_directory_path_length_three() {
    assert_eq!(&BucketPathUnifier::hashed_directory_path("abc"), "a/b/");
  }

  #[test]
  fn hashed_directory_path_length_more() {
    assert_eq!(&BucketPathUnifier::hashed_directory_path("abcd"), "a/b/c/");
    assert_eq!(&BucketPathUnifier::hashed_directory_path("abcde"), "a/b/c/");
    assert_eq!(&BucketPathUnifier::hashed_directory_path("abcdef01234"), "a/b/c/");
  }
}
