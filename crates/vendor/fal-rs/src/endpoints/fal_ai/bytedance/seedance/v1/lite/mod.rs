#[cfg(any(
  feature = "endpoints",
  feature = "endpoints_fal-ai",
  feature = "endpoints_fal-ai_bytedance"
))]
#[cfg_attr(
  docsrs,
  doc(cfg(any(
    feature = "endpoints",
    feature = "endpoints_fal-ai",
    feature = "endpoints_fal-ai_bytedance"
  )))
)]
pub mod image_to_video;
