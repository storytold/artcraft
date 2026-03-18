use crate::legacy::remote_file_manager_paths::file_descriptor::FileDescriptor;
use crate::legacy::remote_file_manager_paths::media_descriptor;
use crate::legacy::remote_file_manager_paths::weights_descriptor;

#[derive(Debug, Clone)]
pub struct RemoteCloudBucketDetails {
    pub object_hash: String,
    pub prefix: String,
    pub suffix: String,
}

impl RemoteCloudBucketDetails {
    pub fn new(object_hash: String, prefix: String, suffix: String) -> Self {
        Self {
            object_hash,
            prefix,
            suffix
        }
    }
    pub fn get_object_hash(&self) -> &str {
        &self.object_hash
    }
    pub fn get_prefix(&self) -> &str {
        &self.prefix
    }
    pub fn get_suffix(&self) -> &str {
        &self.suffix
    }

    // this is not really useful for downloads remove...
    pub fn file_descriptor_from_bucket_details(&self) -> Box<dyn FileDescriptor> {
        match self.prefix.as_str() {
            // Weights
            "loRA_" => Box::new(weights_descriptor::WeightsLoRADescriptor {}),
            "sd15_" =>
                match self.suffix.as_str() {
                    ".safetensors" => Box::new(weights_descriptor::WeightsSD15Descriptor {}),
                    ".ckpt" => Box::new(weights_descriptor::WeightsSD15CkptDescriptor {}),
                    _ => panic!("Unknown suffix: {}",self.suffix)
                },
            "sdxl_" => Box::new(weights_descriptor::WeightsSDXLDescriptor {}),
            "valle_prompt_" => Box::new(weights_descriptor::WeightsVallePromptDescriptor {}),
            "rvc_" => {
                match self.suffix.as_str() {
                    ".safetensors" => Box::new(weights_descriptor::WeightsRVCDescriptor {}),
                    ".index" => Box::new(weights_descriptor::WeightsRVCIndexDescriptor {}),
                    _ => panic!("Unknown suffix: {}",self.suffix)
                }
            },
            "svc_" => Box::new(weights_descriptor::WeightsSVCDescriptor {}),
            "workflow_" => Box::new(weights_descriptor::WeightsWorkflowDescriptor {}),
            // Media
            "image_" => {
                match self.suffix.as_str() {
                    ".png" => Box::new(media_descriptor::MediaImagePngDescriptor {}),
                    _ => panic!("Unknown suffix: {}",self.suffix)
                }
            },
            "video_" => {
                match self.suffix.as_str() {
                    ".mp4" => Box::new(media_descriptor::MediaVideoMp4Descriptor {}),
                    _ => panic!("Unknown suffix: {}",self.suffix)
                }
            },
            "upload_" => {
                match self.suffix.as_str() {
                    ".mp4" => Box::new(media_descriptor::UploadVideoMp4Descriptor {}),
                    _ => panic!("Unknown suffix: {}",self.suffix)
                }
            },
            _ => panic!("Unknown prefix: {}", self.prefix)
        }
    }
}
