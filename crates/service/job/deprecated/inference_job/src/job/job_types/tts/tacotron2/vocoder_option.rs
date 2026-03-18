use std::path::Path;

#[derive(Clone)]
pub enum VocoderForInferenceOption<P: AsRef<Path>> {
  Waveglow {
    waveglow_vocoder_checkpoint_path: P,
  },
  HifiganSuperres {
    hifigan_vocoder_checkpoint_path: P,
    hifigan_superres_vocoder_checkpoint_path: P,
  }
}

