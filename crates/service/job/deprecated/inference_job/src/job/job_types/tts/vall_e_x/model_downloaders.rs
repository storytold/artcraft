use crate::util::downloaders::model_downloader::ModelDownloader;

pub struct VallEXDownloaders {
    pub vall_e_x: VallEXModelMapping,
    pub whisper_lg: WhisperLargeModelMapping,
    pub whisper_md: WhisperMediumModelMapping,
    pub vocos_encodec_24khz: VocosEncodecModelMapping,
    pub vocos_config: VocosEncodecConfigMapping
}

crate::impl_model_downloader!(
    VallEXModelMapping,
    "Vall-e-x Model Mapping",
    "VALL_E_X_MAPPING_BUCKET_PATH",
    "/dependencies/zero_shot_tts/vall-e-x_1.0/vallex-checkpoint.pt",
    "VALL_E_X_MAPPING_FILESYSTEM_PATH",
    "/tmp/downloads/zero_shot_tts/vall-e-x_1.0/vallex-checkpoint.pt"
);

crate::impl_model_downloader!(
    WhisperLargeModelMapping,
    "whisper Large Model Mapping",
    "WHISPER_LARGE_MAPPING_BUCKET_PATH",
    "/dependencies/zero_shot_tts/vall-e-x_1.0/whisper-large/model.safetensors",
    "WHISPER_LARGE_MAPPING_FILESYSTEM_PATH",
    "/tmp/downloads/zero_shot_tts/vall-e-x_1.0/whisper-large/model.safetensors"
);

crate::impl_model_downloader!(
    WhisperMediumModelMapping,
    "whisper Medium Model Mapping",
    "WHISPER_MEDIUM_TENSOR_BUCKET_PATH",
    "/dependencies/zero_shot_tts/vall-e-x_1.0/whisper/medium.pt",
    "WHISPER_MEDIUM_TENSOR_FILESYSTEM_PATH",
    "/tmp/downloads/zero_shot_tts/vall-e-x_1.0/whisper/medium.pt"
);

crate::impl_model_downloader!(
    VocosEncodecModelMapping,
    "Vocos Encodec Model Mapping",
    "VOCOS_ENCODEC_TENSOR_BUCKET_PATH",
    "/dependencies/zero_shot_tts/vall-e-x_1.0/vocos-encodec/encodec_pytorch_model.bin",
    "VOCOS_ENCODEC_TENSOR_FILESYSTEM_PATH",
    "/tmp/downloads/zero_shot_tts/vall-e-x_1.0/vocos-encodec/encodec_pytorch_model.bin"
);

crate::impl_model_downloader!(
    VocosEncodecConfigMapping,
    "Vocos Config Mapping",
    "VOCOS_ENCODEC_CONFIG_BUCKET_PATH",
    "/dependencies/zero_shot_tts/vall-e-x_1.0/vocos-encodec/config.yaml",
    "VOCOS_ENCODEC_CONFIG_FILESYSTEM_PATH",
    "/tmp/downloads/zero_shot_tts/vall-e-x_1.0/vocos-encodec/config.yaml"
);

impl VallEXDownloaders {
    pub fn build_all_from_env() -> Self {
        Self {
            vall_e_x: VallEXModelMapping::from_env(),
            whisper_lg: WhisperLargeModelMapping::from_env(),
            whisper_md: WhisperMediumModelMapping::from_env(),
            vocos_encodec_24khz: VocosEncodecModelMapping::from_env(),
            vocos_config: VocosEncodecConfigMapping::from_env(),
        }
    }

    pub fn all_downloaders(&self) -> Vec<&dyn ModelDownloader> {
        vec![&self.vall_e_x, &self.whisper_lg, &self.whisper_md, &self.vocos_encodec_24khz,&self.vocos_config]
    }
}

mod test {
    // use std::path::Path;

    // use crate::job::job_types::lipsync::sad_talker::model_downloaders::{SadTalkerModelFirstMapping, SadTalkerModelSecondMapping};
    // use crate::util::model_downloader::ModelDownloader;

    // #[test]
    // fn test_downloader_model_first_mapping() {
    //   let model = SadTalkerModelFirstMapping::default();
    //   assert_eq!(model.get_model_name(), "sad talker model first mapping");
    //   assert_eq!(model.get_cloud_bucket_path(), "/animation_sadtalker/model/mapping_00109-model.pth.tar");
    //   assert_eq!(model.get_filesystem_path(), Path::new("/tmp/downloads/sadtalker/mapping_00109-model.pth.tar"));
    // }

    // #[test]
    // fn test_downloader_model_second_mapping() {
    //   let model = SadTalkerModelSecondMapping::default();
    //   assert_eq!(model.get_model_name(), "sad talker model second mapping");
    //   assert_eq!(model.get_cloud_bucket_path(), "/animation_sadtalker/model/mapping_00229-model.pth.tar");
    //   assert_eq!(model.get_filesystem_path(), Path::new("/tmp/downloads/sadtalker/mapping_00229-model.pth.tar"));
    // }

}
