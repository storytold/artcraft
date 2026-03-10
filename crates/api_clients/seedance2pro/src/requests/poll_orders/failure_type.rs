/// Categorized failure type for a Seedance2 Pro order.
#[derive(Debug, Clone, PartialEq)]
pub enum FailureType {
  /// User's uploaded image was rejected by platform content rules.
  RuleBansUserImage,
  /// User's uploaded image was rejected because it contains faces.
  RuleBansUserImageWithFaces,
  /// User's text prompt was rejected by platform content rules.
  RuleBansUserTextPrompt,
  /// User's content (image or text) was rejected by platform content rules (generic).
  RuleBansUserContent,
  /// The generated video was rejected by platform content review.
  RuleBansGeneratedVideo,
  /// The generated audio was rejected by platform content rules.
  RuleBansGeneratedAudio,
  /// The generated content (video/audio/other) was rejected by platform content rules (generic).
  RuleBansGeneratedContent,
  /// Video generation failed (timeout, server error, processing error, etc.)
  GenerationFailed,
  /// An unrecognized or absent failure reason.
  OtherUnknownReason,
}
