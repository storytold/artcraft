#[cfg(any(
  feature = "endpoints",
  feature = "endpoints_fal-ai",
  feature = "endpoints_fal-ai_kling-video"
))]
#[cfg_attr(
  docsrs,
  doc(cfg(any(
    feature = "endpoints",
    feature = "endpoints_fal-ai",
    feature = "endpoints_fal-ai_kling-video"
  )))
)]
pub mod master;
#[cfg(any(
  feature = "endpoints",
  feature = "endpoints_fal-ai",
  feature = "endpoints_fal-ai_kling-video"
))]
#[cfg_attr(
  docsrs,
  doc(cfg(any(
    feature = "endpoints",
    feature = "endpoints_fal-ai",
    feature = "endpoints_fal-ai_kling-video"
  )))
)]
pub mod pro;