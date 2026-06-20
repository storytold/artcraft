use anyhow::anyhow;
use bucket_paths::legacy::remote_file_manager_paths::file_descriptor::FileDescriptor;
use bucket_paths::legacy::remote_file_manager_paths::file_directory::FileBucketDirectory;
use bucket_paths::legacy::remote_file_manager_paths::remote_cloud_bucket_details::RemoteCloudBucketDetails;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use errors::AnyhowResult;
use filesys::file_read_bytes::file_read_bytes;
use filesys::file_size::file_size;
use hashing::sha256::sha256_hash_file::sha256_hash_file;
use mimetypes::mimetype_for_bytes::get_mimetype_for_bytes;

use crate::remote_file_manager::bucket_orchestration::{BucketOrchestration, BucketOrchestrationCore};

use super::file_meta_data::FileMetaData;

#[deprecated(note="this abstraction is too complicated, use another bucket client")]
pub struct RemoteCloudFileClient {
    bucket_orchestration_client: Box<dyn BucketOrchestrationCore>
}

impl RemoteCloudFileClient {

    #[deprecated(note="DO NOT USE THIS AWFUL CLOUD BUCKET CLIENT. These abstractions are complicated. See `LegacyBucketClient`")]
    pub async fn get_remote_cloud_file_client() -> AnyhowResult<Self> {
        let bucket_orchestration = match BucketOrchestration::new_bucket_client_from_existing_env() {
            Ok(client) => client,
            Err(e) => {
                return Err(anyhow!("Error creating bucket orchestration client: {:?}", e));
            }
        };

        Ok(Self {
            bucket_orchestration_client: Box::new(bucket_orchestration)
        })
    }

    #[deprecated(note="DO NOT USE THIS AWFUL CLOUD BUCKET CLIENT. These abstractions are complicated. See `LegacyBucketClient`")]
    pub fn new(bucket_orchestration_client: Box<dyn BucketOrchestrationCore>) -> Self {
        Self {
            bucket_orchestration_client
        }
    }

    // Where the to_system_file_path is  let sd_checkpoint_path = work_temp_dir.path().join("sd_checkpoint.safetensors"); path and file name and extension
    #[deprecated(note="DO NOT USE THIS AWFUL CLOUD BUCKET CLIENT. These abstractions are complicated. See `LegacyBucketClient`")]
    pub async fn download_file(&self, remote_cloud_bucket_details:RemoteCloudBucketDetails, to_system_file_path:String) -> AnyhowResult<()> {
        let file_descriptor = remote_cloud_bucket_details.file_descriptor_from_bucket_details();
        let file_bucket_directory = FileBucketDirectory::from_existing_bucket_details(remote_cloud_bucket_details);
        let full_remote_cloud_file_path = file_bucket_directory.get_full_remote_cloud_file_path().to_string();
        let is_public = file_descriptor.is_public();

        self.bucket_orchestration_client.download_file_to_disk(full_remote_cloud_file_path, to_system_file_path, is_public).await?;
        Ok(())
    }

    #[deprecated(note="DO NOT USE THIS AWFUL CLOUD BUCKET CLIENT. These abstractions are complicated. See `LegacyBucketClient`")]
    pub async fn download_media_file(&self, media_file_path: &MediaFileBucketPath, to_system_file_path: String) -> AnyhowResult<()> {
        const IS_PUBLIC: bool = true; // NB: Media files are always public
        let full_remote_cloud_file_path = media_file_path.get_full_object_path_str().to_string();

        self.bucket_orchestration_client.download_file_to_disk(full_remote_cloud_file_path, to_system_file_path, IS_PUBLIC).await?;
        Ok(())
    }

    // return error or success with meta data.
    #[deprecated(note="DO NOT USE THIS AWFUL CLOUD BUCKET CLIENT. These abstractions are complicated. See `LegacyBucketClient`")]
    pub async fn upload_file(&self, file_descriptor:Box<dyn FileDescriptor>, from_system_file_path:&str) -> AnyhowResult<FileMetaData> {
     
        // get file meta data
        println!("Reading media file: {:?}", from_system_file_path);
        // get meta data 
        let bytes = file_read_bytes(from_system_file_path)?;
        let mut result = Self::get_file_meta_data(from_system_file_path)?;
        let is_public = file_descriptor.is_public();

        let suffix = file_descriptor.get_suffix().clone();
        let prefix = file_descriptor.get_prefix().clone();
        
        let directory = FileBucketDirectory::generate_new(
            file_descriptor
        );
        
        result.bucket_details = Some(RemoteCloudBucketDetails {
            object_hash: directory.get_file_object_hash().to_string(),
            suffix,
            prefix,
        });

        println!("Uploading media file to bucket path: {:?}",directory.get_full_remote_cloud_file_path());

        self.bucket_orchestration_client.upload_file_with_content_type_process(
            &directory.get_full_remote_cloud_file_path(),
            bytes.as_ref(),
            result.mimetype.as_ref(),
            is_public
        ).await?;

        Ok(result)
    }

    // Retrieve the metadata from the file
    #[deprecated(note="DO NOT USE THIS AWFUL CLOUD BUCKET CLIENT. These abstractions are complicated. See `LegacyBucketClient`")]
    pub fn get_file_meta_data(system_file_path:&str) -> AnyhowResult<FileMetaData> {
        let file_size_bytes = file_size(system_file_path.clone())?;
        let sha256_checksum = sha256_hash_file(system_file_path.clone())?;

        let bytes = file_read_bytes(system_file_path)?;
        let mimetype: &str = get_mimetype_for_bytes(&bytes).unwrap_or("application/octet-stream");

        Ok(FileMetaData {
            file_size_bytes,
            sha256_checksum,
            mimetype: mimetype.to_string(),
            bucket_details: None
        })
    }
}

#[cfg(test)]
mod tests {
    use async_trait::async_trait;
    use env_logger;

    use crate::remote_file_manager::bucket_orchestration::BucketOrchestrationCore;
    use bucket_paths::legacy::remote_file_manager_paths::weights_descriptor::WeightsLoRADescriptor;
    use errors::AnyhowResult;

    struct BucketOrchestrationMock {}

    #[async_trait]
    impl BucketOrchestrationCore for BucketOrchestrationMock {
        async fn download_file_to_disk(
            &self,
            object_path: String,
            filesystem_path: String,
            is_public: bool,
        ) -> AnyhowResult<()>{
            println!("Download File to Disk");
            println!("{}",object_path);
            println!("{}",filesystem_path);
            println!("{}",is_public);
            println!("Download Done Downloading");

            assert_eq!(String::from("/weights/1/2/123/loRA_123.safetensors"),object_path);
            assert_eq!(String::from("./file_path_here"),filesystem_path);
            assert_eq!(is_public,true);
            Ok(())
        }

        async fn upload_file_with_content_type_process(&self, object_name: &str,
                                                       bytes: &[u8],
                                                       content_type: &str,
                                                       is_public: bool) -> AnyhowResult<()> {
            println!("Upload File to Disk");
            println!("{}",object_name);
            // this is random you have to just check the outputs
            //assert_eq!(object_name,String::from("/weights/2/y/q/m/2/2yqm2f1bamh88seyd690h9v24apgezhr/loRA_2yqm2f1bamh88seyd690h9v24apgezhr.safetensors"));
            println!("ContentType:{}",content_type);
            println!("{}",is_public);
            assert_eq!(is_public,true);

            println!("Is Done Uploading");
            Ok(())
        }
    }

    #[tokio::test]
    async fn remote_file_manager_descriptor_test() {
        use super::*;
        let remote_cloud_bucket_details = RemoteCloudBucketDetails::new("object_hash".to_string(), "loRA_".to_string(), ".safetensors".to_string());
        let file_descriptor = remote_cloud_bucket_details.file_descriptor_from_bucket_details();
        
        assert_eq!(file_descriptor.get_prefix(), "loRA_");
        assert_eq!(file_descriptor.get_suffix(), ".safetensors");
        assert_eq!(file_descriptor.is_public(), true);

    }

    #[ignore]
    #[tokio::test]
    async fn remote_file_manager_download_existing_file() {
        use super::*;

        env_logger::init();

        let file_path:&str= "./file_path_here";

        let remote_cloud_file_manager = RemoteCloudFileClient {
            bucket_orchestration_client: Box::new(BucketOrchestrationMock {})
        };

        println!("begin upload from file_path: {:?}", file_path);
        let details = RemoteCloudBucketDetails {
            object_hash: String::from("123"),
            prefix: String::from("loRA_"),
            suffix: String::from(".safetensors")
        };
        let result = remote_cloud_file_manager.download_file(details,file_path.to_string()).await;
        
        match result {
            Ok(file_meta_data) => {
                println!("file_meta_data: {:?}", file_meta_data);
            },
            Err(e) => {
                println!("error: {:?}", e);
            }
        }
    }

    #[tokio::test]
    async fn remote_file_manager_upload_existing_file() {
        use super::*;

        env_logger::init();
        // Replace with a test file.
        let weight_path:&str= "/home/tensor/code/storyteller/storyteller-rust/crates/lib/api_clients/cloud_storage/src/remote_file_manager/remote_cloud_file_manager.rs";

        let remote_cloud_file_manager = RemoteCloudFileClient {
            bucket_orchestration_client: Box::new(BucketOrchestrationMock {})
        };

        println!("begin upload from weight_path: {:?}", weight_path);

        let result = remote_cloud_file_manager.upload_file(Box::new(WeightsLoRADescriptor {}),weight_path).await;

        match result {
            Ok(file_meta_data) => {
                println!("file_meta_data: {:?}", file_meta_data);
            },
            Err(e) => {
                println!("error: {:?}", e);
            }
        }
    }
}