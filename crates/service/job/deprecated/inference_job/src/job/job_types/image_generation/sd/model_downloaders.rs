
crate::impl_model_downloader!(
    SDVAEEncoder,
    "SD Variation Auto Encoder",
    "SD_VARIATIONAL_AUTO_ENCODER_BUCKET_PATH",
    "/animation_sadtalker/enhancer/parsing_parsenet.pth",
    "SD_VARIATIONAL_AUTO_ENCODER_FILESYSTEM_PATH",
    "/tmp/downloads/sadtalker/parsing_parsenet.pth"
  );

pub struct StableDiffusionDownloaders {
    sd_vae_encoder: SDVAEEncoder
}
impl StableDiffusionDownloaders {
  pub fn build_all_from_env() -> Self {
    Self {
      sd_vae_encoder: SDVAEEncoder::from_env(),
    }
  }
}