#[cfg(any(
    feature = "endpoints",
    feature = "endpoints_fashn",
    feature = "endpoints_fashn_tryon"
))]
#[cfg_attr(
    docsrs,
    doc(cfg(any(
        feature = "endpoints",
        feature = "endpoints_fashn",
        feature = "endpoints_fashn_tryon"
    )))
)]
pub mod tryon;
