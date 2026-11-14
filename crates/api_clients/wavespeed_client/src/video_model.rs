#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum VideoModel {
  Kling16Pro,
  Kling21Pro,
  Kling21Master,
  Kling2p5TurboPro,
  Kling2p6Pro,
  Kling3p0Standard,
  Kling3p0Pro,
  Seedance10Lite,
  Seedance1p5Pro,
  Seedance2p0,
  Seedance2p0Fast,
  Seedance2p5,
  MinimaxH3,
  Sora2,
  Sora2Pro,
  Veo3,
  Veo3Fast,
  Veo3p1,
  Veo3p1Fast,
}

impl VideoModel {
  /// Select a text-to-video or image-to-video endpoint, returning none for unsupported modes.
  pub fn endpoint(self, image_to_video: bool) -> Option<&'static str> {
    Some(match (self, image_to_video) {
      (Self::Kling16Pro, true) => "kwaivgi/kling-v1.6-i2v-pro",
      (Self::Kling21Pro, true) => "kwaivgi/kling-v2.1-i2v-pro",
      (Self::Kling21Master, false) => "kwaivgi/kling-v2.1-t2v-master",
      (Self::Kling21Master, true) => "kwaivgi/kling-v2.1-i2v-master",
      (Self::Kling2p5TurboPro, false) => "kwaivgi/kling-v2.5-turbo-pro/text-to-video",
      (Self::Kling2p5TurboPro, true) => "kwaivgi/kling-v2.5-turbo-pro/image-to-video",
      (Self::Kling2p6Pro, false) => "kwaivgi/kling-v2.6-pro/text-to-video",
      (Self::Kling2p6Pro, true) => "kwaivgi/kling-v2.6-pro/image-to-video",
      (Self::Kling3p0Standard, true) => "kwaivgi/kling-v3.0-std/image-to-video",
      (Self::Kling3p0Pro, true) => "kwaivgi/kling-v3.0-pro/image-to-video",
      (Self::Seedance10Lite, false) => "bytedance/seedance-v1-lite-t2v-720p",
      (Self::Seedance10Lite, true) => "bytedance/seedance-v1-lite-i2v-720p",
      (Self::Seedance1p5Pro, false) => "bytedance/seedance-v1.5-pro/text-to-video",
      (Self::Seedance1p5Pro, true) => "bytedance/seedance-v1.5-pro/image-to-video",
      (Self::Seedance2p0, false) => "bytedance/seedance-2.0/text-to-video",
      (Self::Seedance2p0, true) => "bytedance/seedance-2.0/image-to-video",
      (Self::Seedance2p0Fast, false) => "bytedance/seedance-2.0-fast/text-to-video",
      (Self::Seedance2p0Fast, true) => "bytedance/seedance-2.0-fast/image-to-video",
      (Self::Seedance2p5, false) => "bytedance/seedance-2.5/text-to-video",
      (Self::Seedance2p5, true) => "bytedance/seedance-2.5/image-to-video",
      (Self::MinimaxH3, false) => "minimax/h3/text-to-video",
      (Self::MinimaxH3, true) => "minimax/h3/image-to-video",
      (Self::Sora2, false) => "openai/sora-2/text-to-video",
      (Self::Sora2, true) => "openai/sora-2/image-to-video",
      (Self::Sora2Pro, false) => "openai/sora-2-pro/text-to-video",
      (Self::Sora2Pro, true) => "openai/sora-2-pro/image-to-video",
      (Self::Veo3, false) => "google/veo3",
      (Self::Veo3, true) => "google/veo3/image-to-video",
      (Self::Veo3Fast, false) => "google/veo3-fast",
      (Self::Veo3Fast, true) => "google/veo3-fast/image-to-video",
      (Self::Veo3p1, false) => "google/veo3.1/text-to-video",
      (Self::Veo3p1, true) => "google/veo3.1/image-to-video",
      (Self::Veo3p1Fast, false) => "google/veo3.1-fast/text-to-video",
      (Self::Veo3p1Fast, true) => "google/veo3.1-fast/image-to-video",
      _ => return None,
    })
  }

  /// List the exact supported durations used to validate video creation requests.
  pub fn durations(self) -> Vec<u16> {
    match self {
      Self::Kling3p0Standard | Self::Kling3p0Pro => (3..=15).collect(),
      Self::Seedance10Lite => (2..=12).collect(),
      Self::Seedance1p5Pro => (4..=12).collect(),
      Self::Seedance2p0 | Self::Seedance2p0Fast => (4..=15).collect(),
      Self::Seedance2p5 => (4..=30).collect(),
      Self::MinimaxH3 => (4..=15).collect(),
      Self::Sora2 | Self::Sora2Pro => vec![4, 8, 12, 16, 20],
      Self::Veo3 | Self::Veo3Fast | Self::Veo3p1 | Self::Veo3p1Fast => vec![4, 6, 8],
      _ => vec![5, 10],
    }
  }

  /// Choose the default duration associated with this model endpoint.
  pub fn default_duration(self) -> u16 {
    match self {
      Self::Sora2 | Self::Sora2Pro => 4,
      Self::Veo3 | Self::Veo3Fast | Self::Veo3p1 | Self::Veo3p1Fast => 8,
      _ => 5,
    }
  }

  /// Identify models whose image-to-video endpoint accepts an ending frame.
  pub fn supports_end_frame(self) -> bool {
    !matches!(self, Self::Kling21Pro | Self::Kling21Master | Self::Sora2 | Self::Sora2Pro | Self::Veo3 | Self::Veo3Fast)
  }

  /// Identify models exposing a configurable audio-generation setting.
  pub fn supports_audio_toggle(self) -> bool {
    matches!(self, Self::Kling2p6Pro | Self::Kling3p0Standard | Self::Kling3p0Pro | Self::Seedance1p5Pro | Self::Seedance2p0 | Self::Seedance2p0Fast | Self::Seedance2p5 | Self::Veo3 | Self::Veo3Fast | Self::Veo3p1 | Self::Veo3p1Fast)
  }
}
