
pub trait FalEndpoint {
  /// Return the endpoint, eg. `fal-ai/flux-2-lora-gallery/multiple-angles`
  fn get_endpoint() -> &'static str;
}
