use crate::util::downloaders::model_downloader::ModelDownloader;

crate::impl_model_downloader!(
  RvcV2Rmvpe,
  "RVC (v2) RMVPE",
  "RVC_V2_RMVPE_CLOUD_PATH",
  "/dependencies/vc/rvc_v2/rmvpe.pt",
  "RVC_V2_RMVPE_FS_PATH",
  "/tmp/downloads/rvc_v2/rmvpe.pt"
);

pub struct RvcV2Downloaders {
  pub rmvpe: RvcV2Rmvpe,
}

impl RvcV2Downloaders {
  pub fn build_all_from_env() -> Self {
    Self {
      rmvpe: RvcV2Rmvpe::from_env(),
    }
  }

  pub fn all_downloaders(&self) -> Vec<&dyn ModelDownloader> {
    vec![
      &self.rmvpe,
    ]
  }
}
