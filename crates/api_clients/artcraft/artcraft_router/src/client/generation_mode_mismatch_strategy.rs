
/// Strategy for handling requests where the model only supports text-to-image
/// but the request includes image inputs (image editing mode).
#[derive(Copy, Clone, Debug)]
pub enum GenerationModeMismatchStrategy {
  /// Abort the generation: return an error if image inputs are provided
  /// for a text-to-image-only model.
  AbortGeneration,

  /// Proceed anyway, ignoring the image inputs for the generation.
  GenerateAnyway,
}
