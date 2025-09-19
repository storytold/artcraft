#[cfg(any(
    feature = "endpoints",
    feature = "endpoints_rundiffusion-fal",
    feature = "endpoints_rundiffusion-fal_juggernaut-flux"
))]
#[cfg_attr(
    docsrs,
    doc(cfg(any(
        feature = "endpoints",
        feature = "endpoints_rundiffusion-fal",
        feature = "endpoints_rundiffusion-fal_juggernaut-flux"
    )))
)]
pub mod juggernaut_flux;
#[cfg(any(
    feature = "endpoints",
    feature = "endpoints_rundiffusion-fal",
    feature = "endpoints_rundiffusion-fal_juggernaut-flux-lora"
))]
#[cfg_attr(
    docsrs,
    doc(cfg(any(
        feature = "endpoints",
        feature = "endpoints_rundiffusion-fal",
        feature = "endpoints_rundiffusion-fal_juggernaut-flux-lora"
    )))
)]
pub mod juggernaut_flux_lora;
#[cfg(any(
    feature = "endpoints",
    feature = "endpoints_rundiffusion-fal",
    feature = "endpoints_rundiffusion-fal_rundiffusion-photo-flux"
))]
#[cfg_attr(
    docsrs,
    doc(cfg(any(
        feature = "endpoints",
        feature = "endpoints_rundiffusion-fal",
        feature = "endpoints_rundiffusion-fal_rundiffusion-photo-flux"
    )))
)]
pub mod rundiffusion_photo_flux;
