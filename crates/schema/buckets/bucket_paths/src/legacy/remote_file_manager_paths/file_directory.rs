use crate::legacy::remote_file_manager_paths::file_descriptor::FileDescriptor;
use crate::legacy::remote_file_manager_paths::remote_cloud_bucket_details::RemoteCloudBucketDetails;
use crate::util::hashed_directory_path_long_string::hashed_directory_path_long_string;
use crockford::crockford_entropy_lower;
use std::path::PathBuf;

pub struct FileBucketDirectory {
    file_object_hash: String, 
    remote_cloud_base_directory: String,
    full_remote_cloud_file_path: String,
    file_name: String,
    file_descriptor: Box<dyn FileDescriptor>
  }
  
  impl FileBucketDirectory {
    pub fn generate_new(file_descriptor: Box<dyn FileDescriptor>) -> Self {
      Self::new_from_file_descriptor(file_descriptor)
    }

    // TODO refactor this out of here
    pub fn from_existing_bucket_details(bucket_details:RemoteCloudBucketDetails) -> Self {
      let file_descriptor = bucket_details.file_descriptor_from_bucket_details();
      let entropy = bucket_details.get_object_hash();
      let middle = hashed_directory_path_long_string(entropy.as_ref());
      // gets you cloud bucket path e.g weights/a/b/c/d/clould_path_entropy
      let remote_cloud_base_directory = format!("{}/{}{}", file_descriptor.remote_directory_path(), middle, entropy);
      // gets you name of the file with suffix and prefix and entropy in the centre
      let file_name = format!("{}{}{}", bucket_details.get_prefix(), entropy, bucket_details.get_suffix());
      // note: no longer optional because it's easy to know what it would be in the db explicit is better than implcit.
      // This is the full path you download from
      let full_remote_cloud_file_path = format!("{}/{}", remote_cloud_base_directory , file_name);
      Self {
        file_object_hash: entropy.to_string(),
        remote_cloud_base_directory,
        full_remote_cloud_file_path,
        file_name,
        file_descriptor
      }
    }
    
    pub fn new_from_file_descriptor(file_descriptor: Box<dyn FileDescriptor>) -> Self {
      let entropy = crockford_entropy_lower(32);
      // gets you wiki /a/b/c/d folder structure
      let middle = hashed_directory_path_long_string(entropy.as_ref());
      // gets you cloud bucket path e.g weights/a/b/c/d/clould_path_entropy
      let remote_cloud_base_directory = format!("{}/{}{}", file_descriptor.remote_directory_path(), middle, entropy);
      // gets you name of the file with suffix and prefix and entropy in the centre
      let file_name = format!("{}{}{}", file_descriptor.get_prefix(), entropy, file_descriptor.get_suffix());
      // note: no longer optional because it's easy to know what it would be in the db explicit is better than implcit.

      // This is the full path you upload to.
      let full_remote_cloud_file_path = format!("{}/{}", remote_cloud_base_directory , file_name);
      Self {
        file_object_hash: entropy,
        remote_cloud_base_directory,
        full_remote_cloud_file_path,
        file_name,
        file_descriptor
      }
    }
    
    pub fn get_file_object_hash(&self) -> &str {
        &self.file_object_hash
    }

    pub fn get_remote_cloud_base_directory(&self) -> &str {
        &self.remote_cloud_base_directory
    }
  
    pub fn get_full_remote_cloud_file_path(&self) -> &str {
        &self.full_remote_cloud_file_path
    }
  
    pub fn to_full_remote_cloud_file_path_pathbuf(&self) -> PathBuf {
      PathBuf::from(&self.full_remote_cloud_file_path)
    }

    pub fn get_file_name(&self) -> &str {
        &self.file_name
    }
  }
  