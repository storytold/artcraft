use crate::util::downloaders::model_downloader::ModelDownloader;

crate::impl_model_downloader!(
  SadTalkerModelFirstMapping,
  "sad talker model first mapping",
  "SAD_FIRST_MAPPING_BUCKET_PATH",
  "/animation_sadtalker/model/mapping_00109-model.pth.tar",
  "SAD_FIRST_MAPPING_FILESYSTEM_PATH",
  "/tmp/downloads/sadtalker/mapping_00109-model.pth.tar"
);

crate::impl_model_downloader!(
  SadTalkerModelSecondMapping,
  "sad talker model second mapping",
  "SAD_SECOND_MAPPING_BUCKET_PATH",
  "/animation_sadtalker/model/mapping_00229-model.pth.tar",
  "SAD_SECOND_MAPPING_FILESYSTEM_PATH",
  "/tmp/downloads/sadtalker/mapping_00229-model.pth.tar"
);

crate::impl_model_downloader!(
  SadTalkerModelFirstTensor,
  "sad talker model first tensor",
  "SAD_FIRST_TENSOR_BUCKET_PATH",
  "/animation_sadtalker/model/SadTalker_V0.0.2_256.safetensors",
  "SAD_FIRST_TENSOR_FILESYSTEM_PATH",
  "/tmp/downloads/sadtalker/SadTalker_V0.0.2_256.safetensors"
);

crate::impl_model_downloader!(
  SadTalkerModelSecondTensor,
  "sad talker model second tensor",
  "SAD_SECOND_TENSOR_BUCKET_PATH",
  "/animation_sadtalker/model/SadTalker_V0.0.2_512.safetensors",
  "SAD_SECOND_TENSOR_FILESYSTEM_PATH",
  "/tmp/downloads/sadtalker/SadTalker_V0.0.2_512.safetensors"
);


crate::impl_model_downloader!(
  SadTalkerEnhancerAlignment,
  "sad talker enhancer alignment",
  "SAD_ENHANCER_ALIGNMENT_BUCKET_PATH",
  "/animation_sadtalker/enhancer/alignment_WFLW_4HG.pth",
  "SAD_ENHANCER_ALIGNMENT_FILESYSTEM_PATH",
  "/tmp/downloads/sadtalker/alignment_WFLW_4HG.pth"
);

crate::impl_model_downloader!(
  SadTalkerEnhancerResnet,
  "sad talker enhancer resnet",
  "SAD_ENHANCER_RESNET_BUCKET_PATH",
  "/animation_sadtalker/enhancer/detection_Resnet50_Final.pth",
  "SAD_ENHANCER_RESNET_FILESYSTEM_PATH",
  "/tmp/downloads/sadtalker/detection_Resnet50_Final.pth"
);

crate::impl_model_downloader!(
  SadTalkerEnhancerGfpgan,
  "sad talker enhancer GFPGAN",
  "SAD_ENHANCER_GFPGAN_BUCKET_PATH",
  "/animation_sadtalker/enhancer/GFPGANv1.4.pth",
  "SAD_ENHANCER_GFPGAN_FILESYSTEM_PATH",
  "/tmp/downloads/sadtalker/GFPGANv1.4.pth"
);

crate::impl_model_downloader!(
  SadTalkerEnhancerParsenet,
  "sad talker enhancer parsenet",
  "SAD_ENHANCER_PARSENET_BUCKET_PATH",
  "/animation_sadtalker/enhancer/parsing_parsenet.pth",
  "SAD_ENHANCER_PARSENET_FILESYSTEM_PATH",
  "/tmp/downloads/sadtalker/parsing_parsenet.pth"
);

pub struct SadTalkerDownloaders {
  pub model_first_mapping: SadTalkerModelFirstMapping,
  pub model_second_mapping: SadTalkerModelSecondMapping,
  pub model_first_tensor: SadTalkerModelFirstTensor,
  pub model_second_tensor: SadTalkerModelSecondTensor,
  pub enhancer_alignment: SadTalkerEnhancerAlignment,
  pub enhancer_resnet: SadTalkerEnhancerResnet,
  pub enhancer_gfpgan: SadTalkerEnhancerGfpgan,
  pub enhancer_parsenet: SadTalkerEnhancerParsenet,
}

impl SadTalkerDownloaders {
  pub fn build_all_from_env() -> Self {
    Self {
      model_first_mapping: SadTalkerModelFirstMapping::from_env(),
      model_second_mapping: SadTalkerModelSecondMapping::from_env(),
      model_first_tensor: SadTalkerModelFirstTensor::from_env(),
      model_second_tensor: SadTalkerModelSecondTensor::from_env(),
      enhancer_alignment: SadTalkerEnhancerAlignment::from_env(),
      enhancer_resnet: SadTalkerEnhancerResnet::from_env(),
      enhancer_gfpgan: SadTalkerEnhancerGfpgan::from_env(),
      enhancer_parsenet: SadTalkerEnhancerParsenet::from_env(),
    }
  }

  pub fn all_downloaders(&self) -> Vec<&dyn ModelDownloader> {
    vec![
      &self.model_first_mapping,
      &self.model_second_mapping,
      &self.model_first_tensor,
      &self.model_second_tensor,
      &self.enhancer_alignment,
      &self.enhancer_resnet,
      &self.enhancer_gfpgan,
      &self.enhancer_parsenet,
    ]
  }
}

#[cfg(test)]
mod test {
  use std::path::Path;

  use crate::job::job_types::lipsync::sad_talker::model_downloaders::{SadTalkerModelFirstMapping, SadTalkerModelSecondMapping};
  use crate::util::downloaders::model_downloader::ModelDownloader;

  #[test]
  fn test_downloader_model_first_mapping() {
    let model = SadTalkerModelFirstMapping::default();
    assert_eq!(model.get_model_name(), "sad talker model first mapping");
    assert_eq!(model.get_cloud_bucket_path(), "/animation_sadtalker/model/mapping_00109-model.pth.tar");
    assert_eq!(model.get_filesystem_path(), Path::new("/tmp/downloads/sadtalker/mapping_00109-model.pth.tar"));
  }

  #[test]
  fn test_downloader_model_second_mapping() {
    let model = SadTalkerModelSecondMapping::default();
    assert_eq!(model.get_model_name(), "sad talker model second mapping");
    assert_eq!(model.get_cloud_bucket_path(), "/animation_sadtalker/model/mapping_00229-model.pth.tar");
    assert_eq!(model.get_filesystem_path(), Path::new("/tmp/downloads/sadtalker/mapping_00229-model.pth.tar"));
  }

  // It's probably fine not to test the rest as we're fairly confident the macro works.
}
