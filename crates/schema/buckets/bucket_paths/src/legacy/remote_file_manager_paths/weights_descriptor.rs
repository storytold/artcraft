use super::file_descriptor::FileDescriptor;

pub struct WeightsLoRADescriptor;

const REMOTE_FILE_DIRECTORY: &str = "/weights";
impl FileDescriptor for WeightsLoRADescriptor {
    fn remote_directory_path(&self) -> &str {
        REMOTE_FILE_DIRECTORY
    }
    // this will be the type of file peroid is handled by the file formatter
    // e.g safetensors bin jpg
    fn get_suffix(&self)->String {
       ".safetensors".to_string()
    }
    // This will be the prefix of the media type or the weights type.
    // name of the weights or the name of the media type
    // vall-e_prompt, loRA, sd15, sdxl when implmenting add to the end 
    fn get_prefix(&self)->String {
        "loRA_".to_string()
    }

    // This will be ensure that the right bucket is picked
    fn is_public(&self) -> bool {
      true
    }
}


pub struct WeightsSD15Descriptor;

impl FileDescriptor for WeightsSD15Descriptor {
    fn remote_directory_path(&self) -> &str {
        REMOTE_FILE_DIRECTORY
    }
    // this will be the type of file peroid is handled by the file formatter
    // e.g safetensors bin jpg
    fn get_suffix(&self)->String {
       ".safetensors".to_string()
    }
    // This will be the prefix of the media type or the weights type.
    // name of the weights or the name of the media type
    // vall-e_prompt, SD15, sd15, sdxl when implmenting add to the end 
    fn get_prefix(&self)->String {
        "sd15_".to_string()
    }

    // This will be ensure that the right bucket is picked
    fn is_public(&self) -> bool {
      true
    }
}

pub struct WeightsSD15CkptDescriptor;

impl FileDescriptor for WeightsSD15CkptDescriptor {
    fn remote_directory_path(&self) -> &str {
        REMOTE_FILE_DIRECTORY
    }
    // this will be the type of file peroid is handled by the file formatter
    // e.g safetensors bin jpg
    fn get_suffix(&self)->String {
       ".ckpt".to_string()
    }
    // This will be the prefix of the media type or the weights type.
    // name of the weights or the name of the media type
    // vall-e_prompt, SD15, sd15, sdxl when implmenting add to the end
    fn get_prefix(&self)->String {
        "sd15_".to_string()
    }

    // This will be ensure that the right bucket is picked
    fn is_public(&self) -> bool {
      true
    }
}


pub struct WeightsSDXLDescriptor;

impl FileDescriptor for WeightsSDXLDescriptor {
    fn remote_directory_path(&self) -> &str {
        REMOTE_FILE_DIRECTORY
    }
    // this will be the type of file peroid is handled by the file formatter
    // e.g safetensors bin jpg
    fn get_suffix(&self)->String {
       ".safetensors".to_string()
    }
    // This will be the prefix of the media type or the weights type.
    // name of the weights or the name of the media type
    // vall-e_prompt, SD15, sd15, sdxl when implmenting add to the end 
    fn get_prefix(&self)->String {
        "sdxl_".to_string()
    }

    // This will be ensure that the right bucket is picked
    fn is_public(&self) -> bool {
      true
    }
}

pub struct WeightsSVCDescriptor;

impl FileDescriptor for WeightsSVCDescriptor {
    fn remote_directory_path(&self) -> &str {
        REMOTE_FILE_DIRECTORY
    }
    // this will be the type of file peroid is handled by the file formatter
    // e.g safetensors bin jpg
    fn get_suffix(&self)->String {
        ".safetensors".to_string()
    }
    // This will be the prefix of the media type or the weights type.
    // name of the weights or the name of the media type
    // vall-e_prompt, SD15, sd15, sdxl when implmenting add to the end
    fn get_prefix(&self)->String {
        "svc_".to_string()
    }

    // This will be ensure that the right bucket is picked
    fn is_public(&self) -> bool {
        true
    }
}

pub struct WeightsRVCDescriptor;

impl FileDescriptor for WeightsRVCDescriptor {
    fn remote_directory_path(&self) -> &str {
        REMOTE_FILE_DIRECTORY
    }
    // this will be the type of file peroid is handled by the file formatter
    // e.g safetensors bin jpg
    fn get_suffix(&self)->String {
        ".pth".to_string()
    }
    // This will be the prefix of the media type or the weights type.
    // name of the weights or the name of the media type
    // vall-e_prompt, SD15, sd15, sdxl when implmenting add to the end
    fn get_prefix(&self)->String {
        "rvc_".to_string()
    }

    // This will be ensure that the right bucket is picked
    fn is_public(&self) -> bool {
        true
    }
}

pub struct WeightsRVCIndexDescriptor;

impl FileDescriptor for WeightsRVCIndexDescriptor {
    fn remote_directory_path(&self) -> &str {
        REMOTE_FILE_DIRECTORY
    }
    // this will be the type of file peroid is handled by the file formatter
    // e.g safetensors bin jpg
    fn get_suffix(&self)->String {
        ".index".to_string()
    }
    // This will be the prefix of the media type or the weights type.
    // name of the weights or the name of the media type
    // vall-e_prompt, SD15, sd15, sdxl when implmenting add to the end
    fn get_prefix(&self)->String {
        "rvc_".to_string()
    }

    // This will be ensure that the right bucket is picked
    fn is_public(&self) -> bool {
        true
    }
}

pub struct WeightsVallePromptDescriptor;

impl FileDescriptor for WeightsVallePromptDescriptor {
    fn remote_directory_path(&self) -> &str {
        REMOTE_FILE_DIRECTORY
    }
    // this will be the type of file peroid is handled by the file formatter
    // e.g safetensors bin jpg
    fn get_suffix(&self)->String {
        ".safetensors".to_string()
    }
    // This will be the prefix of the media type or the weights type.
    // name of the weights or the name of the media type
    // vall-e_prompt, SD15, sd15, sdxl when implmenting add to the end
    fn get_prefix(&self)->String {
        "valle_prompt_".to_string()
    }

    // This will be ensure that the right bucket is picked
    fn is_public(&self) -> bool {
        true
    }
}

pub struct WeightsWorkflowDescriptor;

impl FileDescriptor for WeightsWorkflowDescriptor {
    fn remote_directory_path(&self) -> &str {
        REMOTE_FILE_DIRECTORY
    }

    fn get_suffix(&self) -> String {
        ".json".to_string()
    }

    fn get_prefix(&self) -> String {
        "workflow_".to_string()
    }

    fn is_public(&self) -> bool {
        true
    }
}
