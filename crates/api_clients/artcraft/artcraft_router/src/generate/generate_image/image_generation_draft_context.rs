use std::fmt::Debug;

/// Context passed when finalizing a draft into a concrete request.
///
/// Currently empty — FAL doesn't need a draft phase so no context is required.
/// Future providers that need media uploads during finalization will add fields here
/// (e.g. a router client reference, media-file-to-URL maps, etc.).
#[derive(Clone, Default)]
pub struct ImageGenerationDraftContext<'a> {
  /// Prevent construction without Default; reserving the lifetime for future use.
  _phantom: std::marker::PhantomData<&'a ()>,
}

impl Debug for ImageGenerationDraftContext<'_> {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    f.debug_struct("ImageGenerationDraftContext").finish()
  }
}
