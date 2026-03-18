// Describes the file and how it will be saved to GCBucket
// where the file should be stored based off the descriptor 

// DEFAULT IMPLEMENTATION
const REMOTE_FILE_DIRECTORY: &str = "/implement_google_cloud_storage_bucket_name";
// File Descriptor Steers the Bucket Directory
pub trait FileDescriptor {
    // By default a file belongs in the public bucket will help us figureout which bucket to use.
    fn remote_directory_path(&self) -> &str {
        REMOTE_FILE_DIRECTORY
    }
    // this will be the type of file
    // e.g requires! a period .safetensors .bin .jpg
    fn get_suffix(&self)->String {
       "implement".to_string()
    }
    // This will be the prefix of the media type or the weights type.
    // name of the weights or the name of the media type
    // vall-e_prompt, loRA, sd15, sdxl when implmenting add to the end 
    fn get_prefix(&self)->String {
        "implement".to_string()
    }

    // This will be ensure that the right bucket is picked
    fn is_public(&self) -> bool {
      true
    }
}

#[cfg(test)]
mod tests {

  #[test]
  pub fn test() {}
}