use crate::ml::model_file::StableDiffusionVersion;

pub fn get_vae_scale(sd_version: StableDiffusionVersion) -> f64 {
  match sd_version {
    StableDiffusionVersion::V1_5
    | StableDiffusionVersion::V1_5Inpaint
    | StableDiffusionVersion::V2_1
    | StableDiffusionVersion::V2Inpaint
    | StableDiffusionVersion::XlInpaint
    | StableDiffusionVersion::Xl => 0.18215,
    StableDiffusionVersion::Turbo => 0.13025,
  }
}
