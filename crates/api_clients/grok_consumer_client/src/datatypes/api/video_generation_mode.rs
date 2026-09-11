
/// The video generation mode selector.
#[derive(Copy, Clone, Debug)]
pub enum VideoGenerationMode {
  /// Supposedly the "NSFW" mode.
  Spicy,

  Fun,

  Normal,

  /// This might be the only mode that allows for a custom text prompt
  Custom,
}

impl VideoGenerationMode {

  /// This is the value for `--mode` in video generation chats.
  pub fn as_api_mode_arg(&self) -> &'static str {
    match self {
      Self::Spicy => "extremely-spicy-or-crazy",
      Self::Fun => "extremely-crazy",
      Self::Normal => "normal",
      Self::Custom => "custom",
    }
  }
}
