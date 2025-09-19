#[cfg(any(
    feature = "endpoints",
    feature = "endpoints_easel-ai",
    feature = "endpoints_easel-ai_advanced-face-swap"
))]
#[cfg_attr(
    docsrs,
    doc(cfg(any(
        feature = "endpoints",
        feature = "endpoints_easel-ai",
        feature = "endpoints_easel-ai_advanced-face-swap"
    )))
)]
pub mod advanced_face_swap;
