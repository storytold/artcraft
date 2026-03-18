use std::path::Path;

use anyhow::anyhow;
use async_trait::async_trait;
use log::{error, info};

use cloud_storage::bucket_client::BucketClient;
use filesys::create_dir_all_if_missing::create_dir_all_if_missing;
use filesys::file_exists::file_exists;
use filesys::rename_across_devices::{rename_across_devices, RenameError};
use filesys::file_deletion::safe_delete_directory::safe_delete_directory;

use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::util::filesystem::scoped_temp_dir_creator::ScopedTempDirCreator;

/// Helper utility for downloading pretrained models from GCS.
#[async_trait(?Send)] // NB: Marking async_trait as not needing Sync/Send. Hopefully this doesn't blow up on us.
//#[async_trait]
pub trait ModelDownloader {

  /// Model name (for info! status logging).
  fn get_model_name(&self) -> &str;

  /// Path the model is located in GCS.
  fn get_cloud_bucket_path(&self) -> &str;

  /// Where to keep the model file on the worker filesystem.
  fn get_filesystem_path(&self) -> &Path;

  async fn download_if_not_on_filesystem(
    &self,
    bucket_client: &BucketClient,
    scoped_tempdir_creator: &ScopedTempDirCreator,
  ) -> Result<(), ProcessSingleJobError> {
    let filesystem_path = self.get_filesystem_path();

    if file_exists(filesystem_path) {
      return Ok(());
    }

    info!("Model not on filesystem: {}", self.get_model_name());
    info!("Needs to be in: {:?}", self.get_filesystem_path());

    if let Some(parent_directory_path) = filesystem_path.parent() {
      create_dir_all_if_missing(parent_directory_path)?;
    }

    // NB: Download to temp directory to stop concurrent writes and race conditions from other
    // workers writing to a shared volume.
    // NB: TempDir exists until it goes out of scope, at which point it should delete from filesystem.
    let temp_dir = scoped_tempdir_creator.new_tempdir("model_download")
        .map_err(|e| anyhow!("problem creating tempdir: {:?}", e))?;

    let temp_path = temp_dir.path().join("download.part");

    let model_name = self.get_model_name();
    let cloud_bucket_path = self.get_cloud_bucket_path();

    info!("Downloading {} from bucket path: {:?}", model_name, cloud_bucket_path);

    bucket_client.download_file_to_disk(cloud_bucket_path, &temp_path)
        .await
        .map_err(|e| {
          error!("could not download {} to disk: {:?}", model_name, e);
          safe_delete_directory(&temp_dir);
          anyhow!("couldn't download {} cloud object to disk: {:?}", model_name, e)
        })?;

    info!("Downloaded {} from bucket", model_name);

    info!("Renaming {} file from {:?} to {:?}!", model_name, &temp_path, filesystem_path);

    rename_across_devices(&temp_path, filesystem_path)
        .map_err(|err| {
          error!("could not rename on disk: {:?}", err);
          safe_delete_directory(&temp_dir);
          match err {
            RenameError::StorageFull => ProcessSingleJobError::FilesystemFull,
            RenameError::IoError(err) => ProcessSingleJobError::from_io_error(err),
          }
        })?;

    info!("Finished downloading {} file to {:?}", model_name, filesystem_path);

    safe_delete_directory(&temp_dir);

    Ok(())
  }
}


// TODO(bt, 2023-08-31): Find a way to export this macro without it leveraging macro_export and
//  being exported as root-level `crate::impl_model_downloader`
#[macro_export]
macro_rules! impl_model_downloader {
  (
    // Struct name for the downloader
    $struct_name:ident,
    // name of the model (for debugging)
    $model_name:literal,
    // Environment variable to read in cloud bucket path override
    $bucket_path_env_var_name:literal,
    // Default cloud bucket path
    $bucket_path_default:literal,
    // Environment variable to read in filesystem path override
    $filesystem_path_env_var_name:literal,
    // Default filesystem path
    $filesystem_path_default:literal
  ) => {

    #[derive(Debug, Clone)]
    pub struct $struct_name {
      pub model_name: String,
      pub cloud_bucket_path: String,
      pub filesystem_path: std::path::PathBuf,
    }

    #[async_trait::async_trait]
    impl crate::util::downloaders::model_downloader::ModelDownloader for $struct_name {
      fn get_model_name(&self) -> &str {
        &self.model_name
      }
      fn get_cloud_bucket_path(&self) -> &str {
        &self.cloud_bucket_path
      }
      fn get_filesystem_path(&self) -> &std::path::Path {
        &self.filesystem_path
      }
    }

    // NB: Implementing Default mostly for macro testing purposes.
    impl Default for $struct_name {
      fn default() -> $struct_name {
        $struct_name {
          model_name: $model_name.to_string(),
          cloud_bucket_path: $bucket_path_default.to_string(),
          filesystem_path: std::path::PathBuf::from($filesystem_path_default),
        }
      }
    }

    impl $struct_name {
      fn from_env() -> $struct_name {

        let cloud_bucket_path = easyenv::get_env_string_or_default(
          $bucket_path_env_var_name,
          $bucket_path_default);

        let filesystem_path = easyenv::get_env_pathbuf_or_default(
          $filesystem_path_env_var_name,
          $filesystem_path_default);

        $struct_name {
          model_name: $model_name.to_string(),
          cloud_bucket_path,
          filesystem_path,
        }
      }
    }
  }
}
